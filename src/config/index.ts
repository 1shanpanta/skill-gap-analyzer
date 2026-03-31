import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  ENABLE_LLM_SKILL_EXTRACTION: z.coerce.boolean().default(false),

  FRONTEND_URL: z.string().url().optional(),

  GITHUB_TOKEN: z.string().optional().default(''),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().optional().default('http://localhost:3001/api/auth/google/callback'),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_FROM_EMAIL: z.string().optional().default('noreply@skillgap.dev'),

  // DodoPayments
  DODO_API_KEY: z.string().optional().default(''),
  DODO_WEBHOOK_SECRET: z.string().optional().default(''),
  DODO_ENVIRONMENT: z.enum(['test_mode', 'live_mode']).default('test_mode'),
  DODO_PRODUCT_10: z.string().optional().default(''),
  DODO_PRODUCT_30: z.string().optional().default(''),
  DODO_PRODUCT_100: z.string().optional().default(''),

  WORKER_POLL_INTERVAL_MS: z.coerce.number().default(2000),
  JOB_STALE_THRESHOLD_MINUTES: z.coerce.number().default(5),
  JOB_MAX_ATTEMPTS: z.coerce.number().default(3),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
