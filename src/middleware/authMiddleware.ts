import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  sub: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string };
    }
  }
}

export const verifyJwt = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded === "string") {
      res.status(401).json({ error: "Invalid JWT format" });
      return;
    }

    const payload = decoded as unknown as JwtPayload;
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid JWT" });
  }
};
