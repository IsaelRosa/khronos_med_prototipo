import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
    throw new Error('JWT_SECRET deve conter pelo menos 32 caracteres em produção.');
  }
  return secret || 'secret';
};

export const generateToken = (userId: string, email: string, name: string, role: string) => {
  return jwt.sign(
    { id: userId, email, name, role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};
