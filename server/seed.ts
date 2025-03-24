import { db } from "./db";
import { cruises, users, reviews } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("Seeding database...");

  // Check if we already have cruises
  const existingCruises = await db.select().from(cruises);
  if (existingCruises.length > 0) {
    console.log("Database already seeded with cruises.");
    return;
  }

  // Add sample cruises
  await db.insert(cruises).values([
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
  ]);

  console.log("Cruises seeded successfully");

  // Add a test user
  const hashedPassword = await hashPassword("password123");
  const [user] = await db.insert(users).values({
    username: "testuser",
    password: hashedPassword,
    email: "test@example.com",
    firstName: "Test",
    lastName: "User"
  }).returning();

  console.log("Test user created:", user.username);

  // Add some sample reviews
  if (user) {
    await db.insert(reviews).values([
      {
        userId: user.id,
        cruiseId: 1,
        rating: 5,
        comment: "Amazing experience! The staff was incredibly friendly and the destinations were breathtaking."
      },
      {
        userId: user.id,
        cruiseId: 2,
        rating: 4,
        comment: "Beautiful ports of call and excellent service. The ship was a bit crowded at times."
      }
    ]);

    console.log("Sample reviews added");
  }

  console.log("Database seeding completed");
}

// Run the seed function
seed()
  .catch(e => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });