import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import healthRoutes from "./routes/healthRoutes.js";
import authRouter from "./routes/auth.js";
import toursRouter from "./routes/tours.js";
import bookingsRouter from "./routes/bookings.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "../../frontend");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static(frontendDir));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRouter);
app.use("/api/tours", toursRouter);
app.use("/api/bookings", bookingsRouter);

export default app;
