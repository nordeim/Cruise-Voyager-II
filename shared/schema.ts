import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

// Email Verification Schema
export const emailVerification = pgTable("email_verification", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password Reset Schema
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cruise Schema
export const cruises = pgTable("cruises", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  destination: text("destination").notNull(),
  imageUrl: text("image_url").notNull(),
  cruiseLine: text("cruise_line").notNull(),
  shipName: text("ship_name").notNull(),
  departurePort: text("departure_port").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  returnDate: timestamp("return_date").notNull(),
  duration: integer("duration").notNull(),
  pricePerPerson: doublePrecision("price_per_person").notNull(),
  salePrice: doublePrecision("sale_price"),
  isBestSeller: boolean("is_best_seller").default(false),
  isSpecialOffer: boolean("is_special_offer").default(false),
  amenities: text("amenities").array(),
  cabinTypes: text("cabin_types").array(),
});

// Booking Schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cruiseId: integer("cruise_id").notNull(),
  bookingDate: timestamp("booking_date").defaultNow().notNull(),
  departureDate: timestamp("departure_date").notNull(),
  returnDate: timestamp("return_date").notNull(),
  numberOfGuests: integer("number_of_guests").notNull(),
  cabinType: text("cabin_type").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeClientSecret: text("stripe_client_secret"),
  specialRequests: text("special_requests"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  guestDetails: json("guest_details").$type<any[]>(),
});

// Review Schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cruiseId: integer("cruise_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
  emailVerification: one(emailVerification, {
    fields: [users.id],
    references: [emailVerification.userId],
  }),
  passwordResetTokens: many(passwordResetTokens),
}));

export const emailVerificationRelations = relations(emailVerification, ({ one }) => ({
  user: one(users, {
    fields: [emailVerification.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const cruisesRelations = relations(cruises, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  cruise: one(cruises, {
    fields: [bookings.cruiseId],
    references: [cruises.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  cruise: one(cruises, {
    fields: [reviews.cruiseId],
    references: [cruises.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
}).omit({
  id: true,
  emailVerified: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export const insertEmailVerificationSchema = createInsertSchema(emailVerification).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const insertCruiseSchema = createInsertSchema(cruises).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingDate: true,
  paymentStatus: true,
  stripePaymentIntentId: true,
  stripeClientSecret: true,
}).extend({
  passengers: z.array(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      dateOfBirth: z.string(),
      nationality: z.string(),
      passportNumber: z.string().optional(),
    })
  ),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type EmailVerification = typeof emailVerification.$inferSelect;
export type InsertEmailVerification = z.infer<typeof insertEmailVerificationSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export type Cruise = typeof cruises.$inferSelect;
export type InsertCruise = z.infer<typeof insertCruiseSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
