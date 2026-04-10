import crypto from "crypto";
import jwt from "jsonwebtoken";

const SCRYPT_KEYLEN = 64;
const DEFAULT_EXPIRES_IN = "1d";

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password, storedHash) => {
  const [salt, passwordHash] = storedHash.split(":");
  if (!salt || !passwordHash) {
    return false;
  }

  const incomingHash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(incomingHash, "hex"),
    Buffer.from(passwordHash, "hex")
  );
};

export const signToken = (payload) => {
  const secret = process.env.JWT_SECRET || "dev-jwt-secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN;
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || "dev-jwt-secret";
  return jwt.verify(token, secret);
};