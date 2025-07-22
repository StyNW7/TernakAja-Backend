import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../db/drizzle";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateSessionJwt } from "../utils/jwt";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and farm in a transaction
    const result = await db.transaction(async (tx) => {
      // Create user
      const [user] = await tx
        .insert(usersTable)
        .values({
          email,
          password: hashedPassword,
          name,
          role,
        })
        .returning();
      return user;
    });

    const sessionJwt = generateSessionJwt({
      id: result.id,
      email: result.email,
    });

    const { password: _, ...userWithoutPassword } = result;

    res.status(201).json({
      message: "User and farm registered successfully",
      user: userWithoutPassword,
      token: sessionJwt,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    const user = users[0];
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const sessionJwt = generateSessionJwt({ id: user.id, email: user.email });
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token: sessionJwt,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.user?.id;

  if (!id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    const user = users[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
