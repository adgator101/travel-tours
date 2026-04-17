import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { createTourController } from "../controllers/tourController.js";
import { createAuthMiddleware } from "../middlewares/authMiddleware.js";
import { createTourService } from "../services/tourService.js";
import * as authUtils from "../utils/authUtils.js";

const router = Router();
const tourService = createTourService({ prisma });
const tourController = createTourController({ tourService });
const { requireAuth, requireRole } = createAuthMiddleware({ prisma, authUtils });

router.use(requireAuth);

router.get("/", tourController.listTours);
router.get("/:id", tourController.getTourById);

router.post("/", requireRole(["ADMIN"]), tourController.createTour);
router.put("/:id", requireRole(["ADMIN"]), tourController.updateTour);
router.delete("/:id", requireRole(["ADMIN"]), tourController.deleteTour);

export default router;