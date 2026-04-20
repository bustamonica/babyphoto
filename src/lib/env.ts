import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_UPLOADS: z.string().optional(),
  R2_BUCKET_OUTPUTS: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_FAMILY: z.string().optional(),
  STRIPE_PRICE_TOPUP: z.string().optional(),

  KLING_API_KEY: z.string().optional(),
  RUNWAY_API_KEY: z.string().optional(),
  HIVE_API_KEY: z.string().optional(),

  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

// Lazy validation: we defer .parse until first access so that `next build`
// (which imports server modules without real env) and CI typecheck don't fail.
// Runtime callers (routes, workers) get a clear error if a required key is missing.
let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new Error(`Invalid environment variables:\n${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}
