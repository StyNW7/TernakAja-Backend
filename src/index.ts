import express, { Request, Response, NextFunction, Application } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from './db/drizzle';
import { usersTable } from './db/schema';
import { eq } from 'drizzle-orm';

import cors from 'cors';

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());

// Interface for JWT payload
interface JwtPayload {
  sub: number;
  email: string;
}

// Extend Request interface for TypeScript
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string };
    }
  }
}

// Generate session JWT
const generateSessionJwt = (user: { id: number; email: string }): string => {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1h' });
};

// Middleware to verify session JWT
const verifyJwt = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded === 'string') {
      res.status(401).json({ error: 'Invalid JWT format' });
      return;
    }

    const payload = decoded as unknown as JwtPayload;
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid JWT' });
  }
};

// Register endpoint
app.post('/register', async (req: Request, res: Response): Promise<void> => {
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
});

// Login endpoint
app.post('/login', async (req: Request, res: Response): Promise<void> => {
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
});

// Example protected route
app.get('/profile', verifyJwt, async (req: Request, res: Response): Promise<void> => {
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
});

// Health check
app.get('/', (req: Request, res: Response): void => {
  res.send('Express server is running!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});