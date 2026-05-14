import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const BCRYPT_ROUNDS = 10;
const DEFAULT_EXPIRES_IN = "1d";
const tokenBlacklist = new Set();

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const verifyPassword = async (password, storedHash) => {
  return await bcrypt.compare(password, storedHash);
};

export const signToken = (payload) => {
  const secret = process.env.JWT_SECRET || "dev-jwt-secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN;
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token) => {
  if (tokenBlacklist.has(token)) {
    throw new Error("Token is invalidated");
  }
  const secret = process.env.JWT_SECRET || "dev-jwt-secret";
  return jwt.verify(token, secret);
};

export const invalidateToken = (token) => {
  tokenBlacklist.add(token);
};