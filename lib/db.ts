import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { participants, winners } from "@/drizzle/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema: { participants, winners } });

export { db, participants, winners };
