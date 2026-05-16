import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ?? "postgres://placeholder:placeholder@localhost:5432/livingphotos",
  },
  // Print warnings, not errors, when the URL is the placeholder (mock-mode workflow)
  verbose: true,
  strict: true,
});
