import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

const url = new URL(process.env.DATABASE_URL!);

export default {
  schema: './shared/schema.ts',
  out: './server/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: url.searchParams.get('sslmode') === 'require',
  },
} satisfies Config;
