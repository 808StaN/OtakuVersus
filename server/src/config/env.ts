import { config } from 'dotenv';
import { z } from 'zod';

config();

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  STORAGE_PROVIDER: z.enum(['noop', 'cloudinary', 'supabase']).default('noop'),
  CLOUDINARY_CLOUD_NAME: emptyToUndefined(z.string()),
  CLOUDINARY_API_KEY: emptyToUndefined(z.string()),
  CLOUDINARY_API_SECRET: emptyToUndefined(z.string()),
  CLOUDINARY_UPLOAD_PRESET: emptyToUndefined(z.string()),
  SUPABASE_URL: emptyToUndefined(z.string().url()),
  SUPABASE_SERVICE_ROLE_KEY: emptyToUndefined(z.string()),
  SUPABASE_STORAGE_BUCKET: emptyToUndefined(z.string())
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed');
}

export const env = parsed.data;
