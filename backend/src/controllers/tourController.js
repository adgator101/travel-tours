import { sendError } from "../utils/httpResponse.js";
import {
  validateCreateTourInput,
  validateTourIdParam,
  validateUpdateTourInput,
} from "../validators/tourValidator.js";

const tourErrorStatusMap = {
  TOUR_NOT_FOUND: 404,
  TOUR_HAS_DEPENDENCIES: 409,
};

const sendServiceError = (res, serviceError) => {
  const statusCode = tourErrorStatusMap[serviceError.code] || 400;
  return res.status(statusCode).json({
    success: false,
    message: serviceError.message,
  });
};

export const createTourController = ({ tourService }) => ({
  listTours: async (req, res) => {
    try {
      const result = await tourService.listTours();

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

  getTourById: async (req, res) => {
    try {
      const input = validateTourIdParam(req.params);
      const result = await tourService.getTourById(input);

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

  createTour: async (req, res) => {
    try {
      const input = validateCreateTourInput(req.body);
      const result = await tourService.createTour(input);

      if (!result.ok) {
        return sendServiceError(res, result.error);
      }

      return res.status(201).json({
        success: true,
        message: "Tour created successfully",
        ...result.data,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },

  updateTour: async (req, res) => {
    try {
      const { id } = validateTourIdParam(req.params);
      const changes = validateUpdateTourInput(req.body);
      const result = await tourService.updateTour({ id, changes });

      if (!result.ok) {
        return sendServiceError(res, result.error);
      }

      return res.status(200).json({
        success: true,
        message: "Tour updated successfully",
        ...result.data,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },

  deleteTour: async (req, res) => {
    try {
      const input = validateTourIdParam(req.params);
      const result = await tourService.deleteTour(input);

      if (!result.ok) {
        return sendServiceError(res, result.error);
      }

      return res.status(200).json({
        success: true,
        message: "Tour deleted successfully",
      });
    } catch (error) {
      return sendError(res, error);
    }
  },
});