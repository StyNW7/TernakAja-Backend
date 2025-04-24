import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });