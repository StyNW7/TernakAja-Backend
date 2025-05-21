import { drizzle } from "drizzle-orm/neon-serverless";
import dotenv from "dotenv";
import { Pool } from "@neondatabase/serverless";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool);
