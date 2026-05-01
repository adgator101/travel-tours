import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { createBookingController } from "../controllers/bookingController.js";
import { createAuthMiddleware } from "../middlewares/authMiddleware.js";
import { createBookingService } from "../services/bookingService.js";
import * as authUtils from "../utils/authUtils.js";

const router = Router();
const bookingService = createBookingService({ prisma });
const bookingController = createBookingController({ bookingService });
const { requireAuth, requireRole } = createAuthMiddleware({ prisma, authUtils });

router.use(requireAuth);

// Public routes
router.get("/my-bookings", bookingController.listMyBookings);
router.post("/", bookingController.createBooking);

// Admin routes
router.get("/admin/all", requireRole(["ADMIN"]), bookingController.listAllBookings);
router.patch("/:id/status", requireRole(["ADMIN"]), bookingController.updateBookingStatus);

// Shared route (Service layer handles role-based permission check)
router.get("/:id", bookingController.getBookingById);

export default router;
