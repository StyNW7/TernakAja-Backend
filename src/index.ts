import express, { Request, Response, NextFunction, Application } from "express";
import dotenv from "dotenv";
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcrypt';
// import { db } from './db/drizzle';
// import { usersTable } from './db/schema';
// import { eq } from 'drizzle-orm';

import cors from "cors";
import routes from "./routes/routes";

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;
const BACKEND_ADDR = process.env.BACKEND_ADDR || "";
const AI_ADDR = process.env.AI_ADDR || "";

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", BACKEND_ADDR, "http://172.178.82.251", AI_ADDR],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/", routes);

// Health check
app.get("/", (req: Request, res: Response): void => {
  res.send("Express server is running!");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
