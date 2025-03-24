import { db } from '../db';
import { users, cruises, reviews } from '@shared/schema';
import bcrypt from 'bcrypt';

async function main() {
  try {
    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [user1] = await db.insert(users).values({
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: true,
    }).returning();

    const [user2] = await db.insert(users).values({
      username: 'janedoe',
      email: 'jane.doe@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      emailVerified: false,
    }).returning();

    // Create sample cruises
    const [cruise1] = await db.insert(cruises).values({
      title: 'Caribbean Paradise',
      description: 'Experience the beauty of the Caribbean islands',
      destination: 'Caribbean',
      imageUrl: 'https://picsum.photos/800/600',
      cruiseLine: 'Royal Caribbean',
      shipName: 'Oasis of the Seas',
      departurePort: 'Miami',
      departureDate: new Date('2024-07-15'),
      returnDate: new Date('2024-07-22'),
      duration: 7,
      pricePerPerson: 1299.99,
      salePrice: 999.99,
      isBestSeller: true,
      isSpecialOffer: true,
      amenities: ['Pool', 'Spa', 'Casino', 'Theater', 'Fine Dining'],
      cabinTypes: ['Interior', 'Ocean View', 'Balcony', 'Suite'],
    }).returning();

    const [cruise2] = await db.insert(cruises).values({
      title: 'Mediterranean Adventure',
      description: 'Explore the rich history and culture of the Mediterranean',
      destination: 'Mediterranean',
      imageUrl: 'https://picsum.photos/800/600',
      cruiseLine: 'Norwegian',
      shipName: 'Norwegian Epic',
      departurePort: 'Barcelona',
      departureDate: new Date('2024-08-01'),
      returnDate: new Date('2024-08-15'),
      duration: 14,
      pricePerPerson: 2499.99,
      isBestSeller: false,
      isSpecialOffer: false,
      amenities: ['Pool', 'Spa', 'Gym', 'Kids Club', 'Multiple Restaurants'],
      cabinTypes: ['Interior', 'Ocean View', 'Balcony', 'Haven Suite'],
    }).returning();

    // Create sample reviews
    await db.insert(reviews).values([
      {
        userId: user1.id,
        cruiseId: cruise1.id,
        rating: 5,
        comment: 'Amazing experience! The staff was incredibly friendly and the amenities were top-notch.',
        createdAt: new Date(),
      },
      {
        userId: user2.id,
        cruiseId: cruise1.id,
        rating: 4,
        comment: 'Great cruise overall. The food was excellent and the entertainment was fantastic.',
        createdAt: new Date(),
      },
      {
        userId: user1.id,
        cruiseId: cruise2.id,
        rating: 5,
        comment: 'The Mediterranean ports were breathtaking. This cruise exceeded all expectations.',
        createdAt: new Date(),
      },
    ]);

    console.log('Sample data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

main(); 