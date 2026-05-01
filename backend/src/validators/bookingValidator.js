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

const createBookingSchema = z.object({
  tourId: z.coerce.number().int().positive("Tour ID must be a positive integer"),
  contactEmail: z.string().trim().email("Must be a valid email address"),
  passportNumber: z.string().trim().min(1, "Passport number is required"),
});

const updateBookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"], {
    errorMap: () => ({ message: "Status must be PENDING, CONFIRMED, or CANCELLED" }),
  }),
});

const bookingIdSchema = z.object({
  id: z.coerce.number().int().positive("Booking id must be a positive integer"),
});

export const validateBookingIdParam = (params = {}) =>
  withHttpError(bookingIdSchema, params, "Invalid booking id");

export const validateCreateBookingInput = (body = {}) =>
  withHttpError(createBookingSchema, body, "Invalid booking input");

export const validateUpdateBookingStatusInput = (body = {}) =>
  withHttpError(updateBookingStatusSchema, body, "Invalid status update input");
