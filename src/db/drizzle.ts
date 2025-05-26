<<<<<<< Updated upstream
import { drizzle } from "drizzle-orm/neon-serverless";
import dotenv from "dotenv";
import { Pool } from "@neondatabase/serverless";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
=======
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

>>>>>>> Stashed changes
export const db = drizzle(pool);
