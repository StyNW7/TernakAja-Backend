import jwt from 'jsonwebtoken';

export const generateSessionJwt = (user: { id: number; email: string }): string => {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET!, {
    expiresIn: '1h',
  });
};
