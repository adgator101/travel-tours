import { z } from "zod";

import { createHttpError } from "../utils/httpResponse.js";

const toLabel = (pathSegment = "value") =>
  String(pathSegment)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());

const formatIssueMessage = (issue, fallbackMessage) => {
  if (!issue) {
    return fallbackMessage;
  }

  const field = toLabel(issue.path?.[0] || "value");

  if (issue.code === "invalid_type" && issue.input === undefined) {
    return `${field} is required`;
  }

  return issue.message || `${field} is invalid`;
};

const withHttpError = (schema, body, fallbackMessage) => {
  const result = schema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw createHttpError(400, formatIssueMessage(firstIssue, fallbackMessage));
  }

  return result.data;
};

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  email: z.string().trim().email("Please provide a valid email address").transform((value) => value.toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  nationality: z.string().trim().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

const authHeaderSchema = z
  .string()
  .trim()
  .regex(/^Bearer\s+\S+$/, "Missing or invalid authorization token")
  .transform((value) => value.split(/\s+/)[1]);

export const validateRegisterInput = (body = {}) =>
  withHttpError(registerSchema, body, "Invalid register input");

export const validateLoginInput = (body = {}) =>
  withHttpError(loginSchema, body, "Invalid login input");

export const validateAuthToken = (authorizationHeader = "") =>
  withHttpError(authHeaderSchema, authorizationHeader, "Missing or invalid authorization token");