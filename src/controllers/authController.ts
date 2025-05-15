import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db/drizzle';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateSessionJwt } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, role, farm_id } = req.body;
      if (!email || !password || !name || !role || !farm_id) {
        res.status(400).json({ error: 'all credentials are required' });
        return;
      }
  
      // Check if user exists
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);
  
      if (existingUser.length > 0) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds
  
      // Create user
      const user = await db
        .insert(usersTable)
        .values({
          email,
          password: hashedPassword,
          name: name || null,
          role,
          farm_id,
        })
        .returning();
  
      // Generate session JWT
      const sessionJwt = generateSessionJwt({ id: user[0].id, email: user[0].email });
      res.status(201).json({
        message: 'User registered successfully',
        user: user[0],
        token: sessionJwt,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }
  
      // Check if user exists
      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);
  
      if (user.length === 0) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
  
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user[0].password);
      if (!passwordMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
  
      // Generate session JWT
      const sessionJwt = generateSessionJwt({ id: user[0].id, email: user[0].email });
      res.json({
        message: 'Login successful',
        user: user[0],
        token: sessionJwt,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, req.user!.id))
          .limit(1);
    
        if (user.length === 0) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        res.json({ user: user[0] });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
