import express, { Application, Request, Response } from "express";
import bookingRoutes from "./routes/booking.routes";
import routingRoutes from "./routes/routing.routes";
import { errorHandler } from "./middlewares/errorHandler";

export function createApp(): Application {
  const app = express();

  // Middleware for parsing JSON with a sensible limit
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "UP",
      service: "tatkal-high-concurrency-booking",
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routes
  app.use("/api", bookingRoutes);
  app.use("/api/routes", routingRoutes);

  // Fallback 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Endpoint not found.",
        statusCode: 404,
      },
    });
  });

  // Centralized Error Handling Middleware (Production-Grade)
  app.use(errorHandler);

  return app;
}

export default createApp();

