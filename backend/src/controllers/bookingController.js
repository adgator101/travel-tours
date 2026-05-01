import { sendError } from "../utils/httpResponse.js";
import {
  validateBookingIdParam,
  validateCreateBookingInput,
  validateUpdateBookingStatusInput,
} from "../validators/bookingValidator.js";

const bookingErrorStatusMap = {
  BOOKING_NOT_FOUND: 404,
  TOUR_NOT_FOUND: 404,
  FORBIDDEN: 403,
};

const sendServiceError = (res, serviceError) => {
  const statusCode = bookingErrorStatusMap[serviceError.code] || 400;
  return res.status(statusCode).json({
    success: false,
    message: serviceError.message,
  });
};

export const createBookingController = ({ bookingService }) => ({
  listMyBookings: async (req, res) => {
    try {
      const result = await bookingService.listMyBookings({ userId: req.user.id });

      if (!result.ok) {
        return sendServiceError(res, result.error);
      }

      return res.status(200).json({
        success: true,
        ...result.data,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },

  listAllBookings: async (req, res) => {
    try {
      const result = await bookingService.listAllBookings();

      if (!result.ok) {
        return sendServiceError(res, result.error);
      }

      return res.status(200).json({
        success: true,
        ...result.data,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },

  getBookingById: async (req, res) => {
    try {
      const { id } = validateBookingIdParam(req.params);
      const result = await bookingService.getBookingById({
        id,
        userId: req.user.id,
        role: req.user.role,
      });

      if (!result.ok) {
        return sendServiceError(res, result.error);
      }

      return res.status(200).json({
        success: true,
        ...result.data,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },

  createBooking: async (req, res) => {
    try {
      const input = validateCreateBookingInput(req.body);
      const result = await bookingService.createBooking({
        userId: req.user.id,
        input,
      });

      if (!result.ok) {
        return sendServiceError(res, result.error);
      }

      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        ...result.data,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },

  updateBookingStatus: async (req, res) => {
    try {
      const { id } = validateBookingIdParam(req.params);
      const { status } = validateUpdateBookingStatusInput(req.body);
      const result = await bookingService.updateBookingStatus({ id, status });

      if (!result.ok) {
        return sendServiceError(res, result.error);
      }

      return res.status(200).json({
        success: true,
        message: "Booking status updated successfully",
        ...result.data,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },
});
