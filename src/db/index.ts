import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { fetchWithin } from "./time-limit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

// Waking from sleep took about a second when measured, so this only ever ends a request that isn't coming back.
// An order cut off here is safe to retry: its key finds it if it did get saved.
neonConfig.fetchFunction = fetchWithin(15_000);

export const db = drizzle(neon(databaseUrl), { schema });
