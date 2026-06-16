import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  API_PREFIX: z.string().min(1).default("/api/v1"),
  CORS_ORIGIN: z.string().min(1).default("*"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  DATABASE_SSL_ACCEPT_INVALID_CERTS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters."),
  JWT_EXPIRES_IN_HOURS: z.coerce.number().int().positive().default(12),
  SESSION_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(20),
  AI_PROVIDER: z.enum(["ollama", "rules"]).default("ollama"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().min(1).default("qwen2.5:3b"),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(180000),
  CRON_SECRET: z.string().min(24).default("development-cron-secret-change-me"),
  ALLOW_INSECURE_PLAINTEXT_PASSWORDS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const flattened = parsedEnv.error.flatten().fieldErrors;
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(flattened)}`,
  );
}

export const env = parsedEnv.data;
