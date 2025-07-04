import type { Config } from "drizzle-kit";

export default {
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  breakpoints: true,
  verbose: true,
  strict: true,
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
} satisfies Config;
