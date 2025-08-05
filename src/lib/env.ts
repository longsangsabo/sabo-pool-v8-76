import { z } from 'zod';

const envSchema = z.object({
  // VNPAY Configuration
  VITE_VNP_TMN_CODE: z.string().optional(),
  VITE_VNP_HASH_SECRET: z.string().optional(),
  VITE_VNP_RETURN_URL: z.string().optional(),
  VITE_VNP_PAYMENT_URL: z.string().optional(),

  // Supabase Configuration
  VITE_SUPABASE_URL: z.string().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),

  // App Configuration
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_APP_NAME: z.string().default('SABO ARENA Hub'),

  // Sentry Configuration
  VITE_SENTRY_DSN: z.string().optional(),

  // Feature Flags
  VITE_ENABLE_PWA: z
    .string()
    .transform(val => val === 'true')
    .default('true'),
  VITE_ENABLE_ANALYTICS: z
    .string()
    .transform(val => val === 'true')
    .default('true'),
  VITE_ENABLE_NOTIFICATIONS: z
    .string()
    .transform(val => val === 'true')
    .default('true'),

  // Development
  DEV: z.boolean().default(false),
  PROD: z.boolean().default(false),
});

export const env = envSchema.parse({
  VITE_VNP_TMN_CODE: import.meta.env.VITE_VNP_TMN_CODE,
  VITE_VNP_HASH_SECRET: import.meta.env.VITE_VNP_HASH_SECRET,
  VITE_VNP_RETURN_URL: import.meta.env.VITE_VNP_RETURN_URL,
  VITE_VNP_PAYMENT_URL: import.meta.env.VITE_VNP_PAYMENT_URL,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA,
  VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
  VITE_ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
});

export type Env = z.infer<typeof envSchema>;
