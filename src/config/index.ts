import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  OPENAI_API_KEY: z.string().startsWith('sk-'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  ENABLE_LLM_SKILL_EXTRACTION: z.coerce.boolean().default(false),

  FRONTEND_URL: z.string().url().optional(),

  GITHUB_TOKEN: z.string().optional().default(''),

  DAILY_ANALYSIS_LIMIT: z.coerce.number().default(5),

  WORKER_POLL_INTERVAL_MS: z.coerce.number().default(2000),
  JOB_STALE_THRESHOLD_MINUTES: z.coerce.number().default(5),
  JOB_MAX_ATTEMPTS: z.coerce.number().default(3),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
