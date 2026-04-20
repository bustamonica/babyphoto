import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function db() {
  if (!cachedDb) {
    const client = neon(env().DATABASE_URL);
    cachedDb = drizzle(client, { schema });
  }
  return cachedDb;
}
