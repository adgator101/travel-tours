import { createHttpError } from "../utils/httpResponse.js";

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

export const validateRegisterInput = (body = {}) => {
  const name = normalizeText(body.name);
  const email = normalizeText(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !email || !password) {
    throw createHttpError(400, "Name, email and password are required");
  }

  if (name.length < 2) {
    throw createHttpError(400, "Name must be at least 2 characters long");
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValidEmail) {
    throw createHttpError(400, "Please provide a valid email address");
  }

  if (password.length < 6) {
    throw createHttpError(400, "Password must be at least 6 characters long");
  }

  return { name, email, password };
};

export const validateLoginInput = (body = {}) => {
  const email = normalizeText(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    throw createHttpError(400, "Email and password are required");
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValidEmail) {
    throw createHttpError(400, "Please provide a valid email address");
  }

  return { email, password };
};

export const validateAuthToken = (authorizationHeader = "") => {
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw createHttpError(401, "Missing or invalid authorization token");
  }

  return token;
};