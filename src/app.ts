import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import bookingRoutes from "./routes/booking.routes";
import routingRoutes from "./routes/routing.routes";
import { errorHandler } from "./middlewares/errorHandler";

export function createApp(): Application {
  const app = express();

  // CORS Middleware for seamless local & deployed frontend requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Idempotency-Key");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Body parser with sensible limits
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from public directory (Frontend UI)
  const publicDir = path.join(process.cwd(), "public");
  app.use(express.static(publicDir));

  // Root endpoint: Serve frontend index.html
  app.get("/", (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

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

  // Fallback 404 handler for unmatched API routes
  app.use("/api/*", (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "API endpoint not found.",
        statusCode: 404,
      },
    });
  });

  // Fallback for any other route: serve index.html (SPA support)
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  // Centralized Error Handling Middleware (Production-Grade)
  app.use(errorHandler);

  return app;
}

export default createApp();
