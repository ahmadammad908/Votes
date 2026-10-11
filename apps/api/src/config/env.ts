import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current working dir or apps/api/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/campusface_db?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16).default('super_secret_jwt_key_at_least_32_characters_long_for_dev'),
  JWT_REFRESH_SECRET: z.string().min(16).default('super_secret_refresh_jwt_key_32_characters_long_dev'),
  COOKIE_SECRET: z.string().min(16).default('super_secret_cookie_signing_key_32_chars_long'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  RATE_LIMIT_MAX_PER_MINUTE: z.coerce.number().default(120),
  // Email / SMTP
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('CampusFace <no-reply@campusface.edu>')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

// Ensure process.env.DATABASE_URL is explicitly set for Prisma
process.env.DATABASE_URL = parsed.data.DATABASE_URL;

export const env = parsed.data;
