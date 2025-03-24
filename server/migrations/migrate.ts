import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db } from '../db';

// This will run migrations on the database, skipping the ones already applied
async function main() {
  try {
    await migrate(db, { migrationsFolder: './server/migrations' });
    console.log('Migrations completed');
    process.exit(0);
  } catch (error) {
    console.error('Error performing migrations:', error);
    process.exit(1);
  }
}

main(); 