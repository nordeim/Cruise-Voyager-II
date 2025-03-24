import { 
  users, User, InsertUser, 
  cruises, Cruise, InsertCruise,
  bookings, Booking, InsertBooking,
  reviews, Review, InsertReview,
  emailVerification, EmailVerification, InsertEmailVerification,
  passwordResetTokens, PasswordResetToken, InsertPasswordResetToken
} from "@shared/schema";
import { and, gte, lte, like, desc, sql, isNull, asc, inArray, eq, SQL } from "drizzle-orm";
import { PgSelectQueryBuilder } from "drizzle-orm/pg-core";
import { db } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  
  // Cruise operations
  getCruises(filters?: CruiseFilters): Promise<Cruise[]>;
  getCruise(id: number): Promise<Cruise | undefined>;
  createCruise(cruise: InsertCruise): Promise<Cruise>;
  getBestSellerCruises(limit?: number): Promise<Cruise[]>;
  getSpecialOfferCruises(limit?: number): Promise<Cruise[]>;
  getRecommendedCruises(destination?: string, limit?: number): Promise<Cruise[]>;
  
  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getUserBookings(userId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingPaymentStatus(id: number, status: string): Promise<Booking>;
  updateBookingStripeInfo(id: number, paymentIntentId: string, clientSecret: string): Promise<Booking>;
  
  // Review operations
  getCruiseReviews(cruiseId: number): Promise<Review[]>;
  getUserReviews(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getCruiseAverageRating(cruiseId: number): Promise<number>;
  getReviewCount(cruiseId: number): Promise<number>;
}

export interface CruiseFilters {
  destination?: string;
  departurePort?: string;
  departureDate?: Date;
  duration?: string;
  minPrice?: number;
  maxPrice?: number;
  cruiseLine?: string[];
  amenities?: string[];
  cabinTypes?: string[];
  rating?: number;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cruises: Map<number, Cruise>;
  private bookings: Map<number, Booking>;
  private reviews: Map<number, Review>;
  private userIdCounter: number;
  private cruiseIdCounter: number;
  private bookingIdCounter: number;
  private reviewIdCounter: number;

  constructor() {
    this.users = new Map();
    this.cruises = new Map();
    this.bookings = new Map();
    this.reviews = new Map();
    this.userIdCounter = 1;
    this.cruiseIdCounter = 1;
    this.bookingIdCounter = 1;
    this.reviewIdCounter = 1;
    
    // Add sample cruises for development
    this.initDummyCruises();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, stripeCustomerId: null, stripeSubscriptionId: null };
    this.users.set(id, user);
    return user;
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, stripeCustomerId };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { 
      ...user, 
      stripeCustomerId: stripeInfo.stripeCustomerId, 
      stripeSubscriptionId: stripeInfo.stripeSubscriptionId 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Cruise operations
  async getCruises(filters?: CruiseFilters): Promise<Cruise[]> {
    let cruises = Array.from(this.cruises.values());
    
    if (filters) {
      if (filters.destination) {
        cruises = cruises.filter(cruise => 
          cruise.destination.toLowerCase().includes(filters.destination!.toLowerCase()));
      }
      
      if (filters.departurePort) {
        cruises = cruises.filter(cruise => 
          cruise.departurePort.toLowerCase().includes(filters.departurePort!.toLowerCase()));
      }
      
      if (filters.departureDate) {
        cruises = cruises.filter(cruise => 
          new Date(cruise.departureDate) >= new Date(filters.departureDate!));
      }
      
      if (filters.duration) {
        switch (filters.duration) {
          case '1-5':
            cruises = cruises.filter(cruise => cruise.duration >= 1 && cruise.duration <= 5);
            break;
          case '6-9':
            cruises = cruises.filter(cruise => cruise.duration >= 6 && cruise.duration <= 9);
            break;
          case '10-14':
            cruises = cruises.filter(cruise => cruise.duration >= 10 && cruise.duration <= 14);
            break;
          case '15+':
            cruises = cruises.filter(cruise => cruise.duration >= 15);
            break;
        }
      }
      
      if (filters.minPrice !== undefined) {
        cruises = cruises.filter(cruise => 
          (cruise.salePrice || cruise.pricePerPerson) >= filters.minPrice!);
      }
      
      if (filters.maxPrice !== undefined) {
        cruises = cruises.filter(cruise => 
          (cruise.salePrice || cruise.pricePerPerson) <= filters.maxPrice!);
      }
      
      if (filters.cruiseLine && filters.cruiseLine.length > 0) {
        cruises = cruises.filter(cruise => 
          filters.cruiseLine!.includes(cruise.cruiseLine));
      }
      
      if (filters.amenities && filters.amenities.length > 0) {
        cruises = cruises.filter(cruise => 
          filters.amenities!.some(amenity => cruise.amenities.includes(amenity)));
      }
      
      if (filters.cabinTypes && filters.cabinTypes.length > 0) {
        cruises = cruises.filter(cruise => 
          filters.cabinTypes!.some(cabinType => cruise.cabinTypes.includes(cabinType)));
      }
      
      if (filters.rating) {
        cruises = await Promise.all(cruises.map(async cruise => {
          const rating = await this.getCruiseAverageRating(cruise.id);
          return { cruise, rating };
        })).then(results => 
          results
            .filter(({ rating }) => rating >= (filters.rating || 0))
            .map(({ cruise }) => cruise)
        );
      }
    }
    
    return cruises;
  }

  async getCruise(id: number): Promise<Cruise | undefined> {
    return this.cruises.get(id);
  }

  async createCruise(insertCruise: InsertCruise): Promise<Cruise> {
    const id = this.cruiseIdCounter++;
    const cruise: Cruise = {
      id,
      title: insertCruise.title,
      description: insertCruise.description,
      destination: insertCruise.destination,
      imageUrl: insertCruise.imageUrl,
      cruiseLine: insertCruise.cruiseLine,
      shipName: insertCruise.shipName,
      departurePort: insertCruise.departurePort,
      departureDate: insertCruise.departureDate,
      returnDate: insertCruise.returnDate,
      duration: insertCruise.duration,
      pricePerPerson: insertCruise.pricePerPerson,
      salePrice: insertCruise.salePrice || null,
      isBestSeller: insertCruise.isBestSeller || false,
      isSpecialOffer: insertCruise.isSpecialOffer || false,
      amenities: insertCruise.amenities || [],
      cabinTypes: insertCruise.cabinTypes || []
    };
    this.cruises.set(id, cruise);
    return cruise;
  }
  
  async getBestSellerCruises(limit: number = 3): Promise<Cruise[]> {
    return Array.from(this.cruises.values())
      .filter(cruise => cruise.isBestSeller)
      .slice(0, limit);
  }
  
  async getSpecialOfferCruises(limit: number = 3): Promise<Cruise[]> {
    return Array.from(this.cruises.values())
      .filter(cruise => cruise.isSpecialOffer)
      .slice(0, limit);
  }
  
  async getRecommendedCruises(destination?: string, limit: number = 3): Promise<Cruise[]> {
    let cruises = Array.from(this.cruises.values());
    
    if (destination) {
      cruises = cruises.filter(cruise => cruise.destination === destination);
    }
    
    // Sort by a combination of factors to get "recommended" cruises
    cruises.sort((a, b) => {
      const aScore = (a.isBestSeller ? 10 : 0) + (a.isSpecialOffer ? 5 : 0);
      const bScore = (b.isBestSeller ? 10 : 0) + (b.isSpecialOffer ? 5 : 0);
      return bScore - aScore;
    });
    
    return cruises.slice(0, limit);
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.userId === userId
    );
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = this.bookingIdCounter++;
    const newBooking: Booking = {
      id,
      bookingDate: new Date(),
      paymentStatus: 'pending',
      stripePaymentIntentId: null,
      stripeClientSecret: null,
      specialRequests: booking.specialRequests || null,
      contactPhone: booking.contactPhone || null,
      guestDetails: booking.passengers || null,
      userId: booking.userId,
      cruiseId: booking.cruiseId,
      departureDate: booking.departureDate,
      returnDate: booking.returnDate,
      numberOfGuests: booking.numberOfGuests,
      cabinType: booking.cabinType,
      totalPrice: booking.totalPrice,
      contactEmail: booking.contactEmail
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }
  
  async updateBookingPaymentStatus(id: number, status: string): Promise<Booking> {
    const booking = await this.getBooking(id);
    if (!booking) {
      throw new Error("Booking not found");
    }
    
    const updatedBooking = { ...booking, paymentStatus: status };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
  
  async updateBookingStripeInfo(id: number, paymentIntentId: string, clientSecret: string): Promise<Booking> {
    const booking = await this.getBooking(id);
    if (!booking) {
      throw new Error("Booking not found");
    }
    
    const updatedBooking = { 
      ...booking, 
      stripePaymentIntentId: paymentIntentId,
      stripeClientSecret: clientSecret
    };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Review operations
  async getCruiseReviews(cruiseId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.cruiseId === cruiseId
    );
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.userId === userId
    );
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const review: Review = { ...insertReview, id, createdAt: new Date() };
    this.reviews.set(id, review);
    return review;
  }
  
  async getCruiseAverageRating(cruiseId: number): Promise<number> {
    const reviews = await this.getCruiseReviews(cruiseId);
    if (reviews.length === 0) {
      return 0;
    }
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }
  
  async getReviewCount(cruiseId: number): Promise<number> {
    const reviews = await this.getCruiseReviews(cruiseId);
    return reviews.length;
  }
  
  // Initialize with some dummy cruises for development
  private initDummyCruises() {
    const cruises: InsertCruise[] = [
      {
        title: "Caribbean Paradise Cruise",
        description: "Explore the breathtaking beaches of Jamaica, Cozumel, and the Bahamas on this 7-night cruise with luxury accommodations and world-class dining.",
        destination: "Caribbean",
        imageUrl: "https://images.unsplash.com/photo-1580541631971-c7f8c0053551?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        cruiseLine: "Royal Caribbean",
        shipName: "Allure of the Seas",
        departurePort: "Miami, FL",
        departureDate: new Date("2023-11-15"),
        returnDate: new Date("2023-11-22"),
        duration: 7,
        pricePerPerson: 1299,
        salePrice: 899,
        isBestSeller: true,
        isSpecialOffer: false,
        amenities: ["pools", "casino", "spa", "kidsClub"],
        cabinTypes: ["interior", "oceanview", "balcony", "suite"]
      },
      {
        title: "Mediterranean Adventure",
        description: "Discover the rich history and stunning coastlines of Italy, Greece, and Spain on this 10-night Mediterranean adventure.",
        destination: "Mediterranean",
        imageUrl: "https://images.unsplash.com/photo-1548574505-5e239809ee19?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        cruiseLine: "Norwegian Cruise Line",
        shipName: "Norwegian Epic",
        departurePort: "Barcelona, Spain",
        departureDate: new Date("2023-12-10"),
        returnDate: new Date("2023-12-20"),
        duration: 10,
        pricePerPerson: 1899,
        salePrice: 1499,
        isBestSeller: false,
        isSpecialOffer: true,
        amenities: ["pools", "casino", "spa"],
        cabinTypes: ["interior", "oceanview", "balcony", "suite"]
      },
      {
        title: "Alaskan Glaciers Expedition",
        description: "Witness the majestic glaciers and wildlife of Alaska's Inside Passage with stops in Juneau, Skagway, and Ketchikan.",
        destination: "Alaska",
        imageUrl: "https://images.unsplash.com/photo-1566288623394-377af472d81b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        cruiseLine: "Princess Cruises",
        shipName: "Discovery Princess",
        departurePort: "Seattle, WA",
        departureDate: new Date("2024-05-20"),
        returnDate: new Date("2024-05-27"),
        duration: 7,
        pricePerPerson: 1249,
        salePrice: null,
        isBestSeller: false,
        isSpecialOffer: false,
        amenities: ["pools", "spa"],
        cabinTypes: ["interior", "oceanview", "balcony"]
      }
    ];
    
    // Add cruises to storage
    cruises.forEach(cruise => {
      const id = this.cruiseIdCounter++;
      this.cruises.set(id, { ...cruise, id });
    });
    
    // Add some reviews
    const reviews: InsertReview[] = [
      {
        userId: 1,
        cruiseId: 1,
        rating: 5,
        comment: "Amazing experience! The staff was incredibly friendly and the destinations were breathtaking."
      },
      {
        userId: 2,
        cruiseId: 1,
        rating: 4,
        comment: "Great cruise overall. Food was excellent and the entertainment options were plentiful."
      },
      {
        userId: 1,
        cruiseId: 2,
        rating: 4,
        comment: "Beautiful ports of call and excellent service. The ship was a bit crowded at times."
      }
    ];
    
    // Add reviews to storage
    reviews.forEach(review => {
      const id = this.reviewIdCounter++;
      this.reviews.set(id, { ...review, id, createdAt: new Date() });
    });
  }
}

// DatabaseStorage implementation for PostgreSQL
import { db } from "./db";
import { eq, and, gte, lte, like, desc, sql, isNull, asc, inArray } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId: stripeInfo.stripeCustomerId, 
        stripeSubscriptionId: stripeInfo.stripeSubscriptionId 
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }

  // Cruise operations
  async getCruises(filters?: CruiseFilters): Promise<Cruise[]> {
    let query = db.select().from(cruises);
    const conditions: SQL<unknown>[] = [];
    
    if (filters) {
      if (filters.destination) {
        conditions.push(like(cruises.destination, `%${filters.destination}%`));
      }
      
      if (filters.departurePort) {
        conditions.push(like(cruises.departurePort, `%${filters.departurePort}%`));
      }
      
      if (filters.departureDate) {
        conditions.push(gte(cruises.departureDate, filters.departureDate));
      }
      
      if (filters.duration) {
        switch (filters.duration) {
          case '1-5':
            conditions.push(and(gte(cruises.duration, 1), lte(cruises.duration, 5)));
            break;
          case '6-9':
            conditions.push(and(gte(cruises.duration, 6), lte(cruises.duration, 9)));
            break;
          case '10-14':
            conditions.push(and(gte(cruises.duration, 10), lte(cruises.duration, 14)));
            break;
          case '15+':
            conditions.push(gte(cruises.duration, 15));
            break;
        }
      }
      
      if (filters.minPrice !== undefined) {
        conditions.push(
          sql`COALESCE(${cruises.salePrice}, ${cruises.pricePerPerson}) >= ${filters.minPrice}`
        );
      }
      
      if (filters.maxPrice !== undefined) {
        conditions.push(
          sql`COALESCE(${cruises.salePrice}, ${cruises.pricePerPerson}) <= ${filters.maxPrice}`
        );
      }
      
      if (filters.cruiseLine && filters.cruiseLine.length > 0) {
        conditions.push(inArray(cruises.cruiseLine, filters.cruiseLine));
      }
      
      if (filters.amenities && filters.amenities.length > 0) {
        const amenityConditions = filters.amenities.map(amenity => 
          sql`${cruises.amenities}::text[] @> array[${amenity}]::text[]`
        );
        conditions.push(sql`(${sql.join(amenityConditions, sql` OR `)})`);
      }
      
      if (filters.cabinTypes && filters.cabinTypes.length > 0) {
        const cabinConditions = filters.cabinTypes.map(cabinType => 
          sql`${cruises.cabinTypes}::text[] @> array[${cabinType}]::text[]`
        );
        conditions.push(sql`(${sql.join(cabinConditions, sql` OR `)})`);
      }
      
      if (conditions.length > 0) {
        query = query.where(sql.join(conditions, sql` AND `));
      }
    }
    
    const results = await query.orderBy(
      desc(cruises.isBestSeller),
      desc(cruises.isSpecialOffer),
      asc(cruises.departureDate)
    );
    
    return results;
  }

  async getCruise(id: number): Promise<Cruise | undefined> {
    const [cruise] = await db.select().from(cruises).where(eq(cruises.id, id));
    return cruise;
  }

  async createCruise(cruise: InsertCruise): Promise<Cruise> {
    const id = this.cruiseIdCounter++;
    const newCruise: Cruise = {
      id,
      title: cruise.title,
      description: cruise.description,
      destination: cruise.destination,
      imageUrl: cruise.imageUrl,
      cruiseLine: cruise.cruiseLine,
      shipName: cruise.shipName,
      departurePort: cruise.departurePort,
      departureDate: cruise.departureDate,
      returnDate: cruise.returnDate,
      duration: cruise.duration,
      pricePerPerson: cruise.pricePerPerson,
      salePrice: cruise.salePrice || null,
      isBestSeller: cruise.isBestSeller || false,
      isSpecialOffer: cruise.isSpecialOffer || false,
      amenities: cruise.amenities || [],
      cabinTypes: cruise.cabinTypes || []
    };
    this.cruises.set(id, newCruise);
    return newCruise;
  }
  
  async getBestSellerCruises(limit: number = 3): Promise<Cruise[]> {
    return await db
      .select()
      .from(cruises)
      .where(eq(cruises.isBestSeller, true))
      .limit(limit);
  }
  
  async getSpecialOfferCruises(limit: number = 3): Promise<Cruise[]> {
    return await db
      .select()
      .from(cruises)
      .where(eq(cruises.isSpecialOffer, true))
      .limit(limit);
  }
  
  async getRecommendedCruises(destination?: string, limit: number = 3): Promise<Cruise[]> {
    let query = db.select().from(cruises);
    
    if (destination) {
      query = query.where(eq(cruises.destination, destination));
    }
    
    // Order first by bestseller status, then by special offer
    return await query
      .orderBy(
        desc(cruises.isBestSeller),
        desc(cruises.isSpecialOffer),
        asc(cruises.pricePerPerson)
      )
      .limit(limit);
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.bookingDate));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const bookingData = {
      ...booking,
      guestDetails: booking.passengers as any
    };
    
    const [newBooking] = await db
      .insert(bookings)
      .values(bookingData)
      .returning();
      
    return newBooking;
  }
  
  async updateBookingPaymentStatus(id: number, status: string): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ paymentStatus: status })
      .where(eq(bookings.id, id))
      .returning();
    
    if (!updatedBooking) {
      throw new Error("Booking not found");
    }
    
    return updatedBooking;
  }
  
  async updateBookingStripeInfo(id: number, paymentIntentId: string, clientSecret: string): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ 
        stripePaymentIntentId: paymentIntentId,
        stripeClientSecret: clientSecret
      })
      .where(eq(bookings.id, id))
      .returning();
    
    if (!updatedBooking) {
      throw new Error("Booking not found");
    }
    
    return updatedBooking;
  }

  // Review operations
  async getCruiseReviews(cruiseId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.cruiseId, cruiseId))
      .orderBy(desc(reviews.createdAt));
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
      
    return newReview;
  }
  
  async getCruiseAverageRating(cruiseId: number): Promise<number | null> {
    const result = await db
      .select({ 
        avgRating: sql<number>`AVG(${reviews.rating})::float` 
      })
      .from(reviews)
      .where(eq(reviews.cruiseId, cruiseId))
      .groupBy(reviews.cruiseId);

    return result[0]?.avgRating ?? null;
  }
  
  async getReviewCount(cruiseId: number): Promise<number> {
    const result = await db
      .select({ 
        count: sql<number>`COUNT(*)::int` 
      })
      .from(reviews)
      .where(eq(reviews.cruiseId, cruiseId));

    return result[0]?.count ?? 0;
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
