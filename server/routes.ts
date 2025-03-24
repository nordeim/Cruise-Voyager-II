import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import session from "express-session";
import MemoryStore from "memorystore";
import Stripe from "stripe";
import { storage } from "./storage";
import { configurePassport, prepareUserForStorage } from "./auth";
import { sendBookingConfirmation } from "./email";
import { insertUserSchema, insertReviewSchema, insertBookingSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Configure Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY environment variable. Payment processing will be mocked.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-08-16" })
  : undefined;

export async function registerRoutes(app: Express): Promise<Server> {
  const MemorySessionStore = MemoryStore(session);
  
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'cruise-voyager-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemorySessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Initialize Passport.js
  configurePassport(passport, storage);
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Hash the password before storing
      const preparedUser = await prepareUserForStorage(userData);
      const user = await storage.createUser(preparedUser);
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(201).json({ id: user.id, username: user.username, email: user.email });
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Error creating user" });
    }
  });
  
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ id: user.id, username: user.username, email: user.email });
      });
    })(req, res, next);
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get('/api/auth/user', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
  });
  
  // Cruise routes
  app.get('/api/cruises', async (req, res) => {
    try {
      const filters = parseSearchFilters(req.query);
      const cruises = await storage.getCruises(filters);
      
      // Enhance cruises with ratings
      const enhancedCruises = await Promise.all(cruises.map(async (cruise) => {
        const rating = await storage.getCruiseAverageRating(cruise.id);
        const reviewCount = await storage.getReviewCount(cruise.id);
        return { ...cruise, rating, reviewCount };
      }));
      
      res.json(enhancedCruises);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cruises" });
    }
  });
  
  app.get('/api/cruises/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cruise = await storage.getCruise(id);
      
      if (!cruise) {
        return res.status(404).json({ message: "Cruise not found" });
      }
      
      const rating = await storage.getCruiseAverageRating(id);
      const reviewCount = await storage.getReviewCount(id);
      
      res.json({ ...cruise, rating, reviewCount });
    } catch (error) {
      res.status(500).json({ message: "Error fetching cruise" });
    }
  });
  
  app.get('/api/cruises/featured/bestsellers', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const cruises = await storage.getBestSellerCruises(limit);
      
      // Enhance cruises with ratings
      const enhancedCruises = await Promise.all(cruises.map(async (cruise) => {
        const rating = await storage.getCruiseAverageRating(cruise.id);
        const reviewCount = await storage.getReviewCount(cruise.id);
        return { ...cruise, rating, reviewCount };
      }));
      
      res.json(enhancedCruises);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bestseller cruises" });
    }
  });
  
  app.get('/api/cruises/featured/special-offers', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const cruises = await storage.getSpecialOfferCruises(limit);
      
      // Enhance cruises with ratings
      const enhancedCruises = await Promise.all(cruises.map(async (cruise) => {
        const rating = await storage.getCruiseAverageRating(cruise.id);
        const reviewCount = await storage.getReviewCount(cruise.id);
        return { ...cruise, rating, reviewCount };
      }));
      
      res.json(enhancedCruises);
    } catch (error) {
      res.status(500).json({ message: "Error fetching special offer cruises" });
    }
  });
  
  app.get('/api/cruises/featured/recommended', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const destination = req.query.destination as string | undefined;
      const cruises = await storage.getRecommendedCruises(destination, limit);
      
      // Enhance cruises with ratings
      const enhancedCruises = await Promise.all(cruises.map(async (cruise) => {
        const rating = await storage.getCruiseAverageRating(cruise.id);
        const reviewCount = await storage.getReviewCount(cruise.id);
        return { ...cruise, rating, reviewCount };
      }));
      
      res.json(enhancedCruises);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recommended cruises" });
    }
  });
  
  // Review routes
  app.get('/api/cruises/:id/reviews', async (req, res) => {
    try {
      const cruiseId = parseInt(req.params.id);
      const cruise = await storage.getCruise(cruiseId);
      
      if (!cruise) {
        return res.status(404).json({ message: "Cruise not found" });
      }
      
      const reviews = await storage.getCruiseReviews(cruiseId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });
  
  app.post('/api/cruises/:id/reviews', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to write a review" });
    }
    
    try {
      const cruiseId = parseInt(req.params.id);
      const cruise = await storage.getCruise(cruiseId);
      
      if (!cruise) {
        return res.status(404).json({ message: "Cruise not found" });
      }
      
      const user = req.user as any;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: user.id,
        cruiseId
      });
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating review" });
    }
  });
  
  // Booking routes
  app.get('/api/bookings', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view bookings" });
    }
    
    try {
      const user = req.user as any;
      const bookings = await storage.getUserBookings(user.id);
      
      // Enhance bookings with cruise details
      const enhancedBookings = await Promise.all(bookings.map(async (booking) => {
        const cruise = await storage.getCruise(booking.cruiseId);
        return { ...booking, cruise };
      }));
      
      res.json(enhancedBookings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bookings" });
    }
  });
  
  app.get('/api/bookings/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view a booking" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      if (booking.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized to view this booking" });
      }
      
      const cruise = await storage.getCruise(booking.cruiseId);
      res.json({ ...booking, cruise });
    } catch (error) {
      res.status(500).json({ message: "Error fetching booking" });
    }
  });
  
  app.post('/api/bookings', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a booking" });
    }
    
    try {
      const user = req.user as any;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      // Verify cruise exists
      const cruise = await storage.getCruise(bookingData.cruiseId);
      if (!cruise) {
        return res.status(404).json({ message: "Cruise not found" });
      }
      
      const booking = await storage.createBooking(bookingData);
      
      // Send confirmation email
      try {
        await sendBookingConfirmation(booking, cruise, user);
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't fail the booking if email fails
      }
      
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating booking" });
    }
  });
  
  // Payment routes
  app.post('/api/create-payment-intent', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to process a payment" });
    }
    
    try {
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Missing booking ID" });
      }
      
      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      if (booking.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized to pay for this booking" });
      }
      
      // Create payment intent with Stripe
      if (stripe) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(booking.totalPrice * 100), // convert to cents
          currency: "usd",
          metadata: {
            bookingId: booking.id.toString(),
            cruiseId: booking.cruiseId.toString(),
            userId: user.id.toString()
          }
        });
        
        // Update booking with payment intent details
        await storage.updateBookingStripeInfo(
          booking.id,
          paymentIntent.id,
          paymentIntent.client_secret!
        );
        
        res.json({ clientSecret: paymentIntent.client_secret });
      } else {
        // Mock payment intent for development without Stripe
        console.log("STRIPE_SECRET_KEY not configured, mocking payment intent");
        const mockClientSecret = `mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`;
        
        await storage.updateBookingStripeInfo(
          booking.id,
          `mock_pi_${Date.now()}`,
          mockClientSecret
        );
        
        res.json({ clientSecret: mockClientSecret });
      }
    } catch (error) {
      console.error("Payment error:", error);
      res.status(500).json({ message: "Error processing payment" });
    }
  });
  
  // Payment webhook
  app.post('/api/stripe-webhook', async (req, res) => {
    if (!stripe) {
      return res.json({ received: true }); // Mock response when Stripe is not configured
    }
    
    let event;
    
    try {
      // Verify the event came from Stripe
      const signature = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!endpointSecret) {
        console.warn("Missing STRIPE_WEBHOOK_SECRET, skipping signature verification");
        event = req.body;
      } else {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          endpointSecret
        );
      }
      
      // Handle the event
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const bookingId = parseInt(paymentIntent.metadata.bookingId);
        
        if (bookingId) {
          await storage.updateBookingPaymentStatus(bookingId, "completed");
          console.log(`Payment succeeded for booking ${bookingId}`);
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}

function parseSearchFilters(query: any) {
  const filters: any = {};
  
  if (query.destination && query.destination !== 'any') {
    filters.destination = query.destination;
  }
  
  if (query.departurePort && query.departurePort !== 'any') {
    filters.departurePort = query.departurePort;
  }
  
  if (query.departureDate) {
    filters.departureDate = new Date(query.departureDate as string);
  }
  
  if (query.duration && query.duration !== '') {
    filters.duration = query.duration;
  }
  
  if (query.minPrice) {
    filters.minPrice = parseFloat(query.minPrice as string);
  }
  
  if (query.maxPrice) {
    filters.maxPrice = parseFloat(query.maxPrice as string);
  }
  
  if (query.cruiseLine) {
    // Handle both single value and array of values
    filters.cruiseLine = Array.isArray(query.cruiseLine) 
      ? query.cruiseLine 
      : [query.cruiseLine];
  }
  
  if (query.amenities) {
    // Handle both single value and array of values
    filters.amenities = Array.isArray(query.amenities) 
      ? query.amenities 
      : [query.amenities];
  }
  
  if (query.cabinTypes) {
    // Handle both single value and array of values
    filters.cabinTypes = Array.isArray(query.cabinTypes) 
      ? query.cabinTypes 
      : [query.cabinTypes];
  }
  
  if (query.rating) {
    filters.rating = parseInt(query.rating as string);
  }
  
  return filters;
}
