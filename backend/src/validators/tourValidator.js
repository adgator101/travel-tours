import { z } from "zod";

import { createHttpError } from "../utils/httpResponse.js";

const withHttpError = (schema, input, fallbackMessage) => {
  const result = schema.safeParse(input);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw createHttpError(400, firstIssue?.message || fallbackMessage);
  }

  return result.data;
};

const imageUrlSchema = z.string().trim().url("Image must be a valid URL");

const tourBaseSchema = {
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  price: z.coerce.number().positive("Price must be a positive number"),
  durationDays: z.coerce.number().int().positive("Duration days must be a positive integer"),
  itinerary: z.string().trim().min(1, "Itinerary is required"),
  included: z.string().trim().min(1, "Included is required"),
  images: z.array(imageUrlSchema).optional(),
};

const createTourSchema = z.object(tourBaseSchema);

const updateTourSchema = z
  .object({
    title: z.string().trim().min(1, "Title must be a non-empty string").optional(),
    description: z.string().trim().min(1, "Description must be a non-empty string").optional(),
    destination: z.string().trim().min(1, "Destination must be a non-empty string").optional(),
    price: z.coerce.number().positive("Price must be a positive number").optional(),
    durationDays: z.coerce.number().int().positive("Duration days must be a positive integer").optional(),
    itinerary: z.string().trim().min(1, "Itinerary must be a non-empty string").optional(),
    included: z.string().trim().min(1, "Included must be a non-empty string").optional(),
    images: z.array(imageUrlSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

const tourIdSchema = z.object({
  id: z.coerce.number().int().positive("Tour id must be a positive integer"),
});

export const validateTourIdParam = (params = {}) =>
  withHttpError(tourIdSchema, params, "Invalid tour id");

export const validateCreateTourInput = (body = {}) =>
  withHttpError(createTourSchema, body, "Invalid tour input");

export const validateUpdateTourInput = (body = {}) =>
  withHttpError(updateTourSchema, body, "Invalid tour update input");