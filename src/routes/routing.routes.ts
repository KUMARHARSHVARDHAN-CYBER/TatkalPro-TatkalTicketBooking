import { Router } from "express";
import { searchRoutesHandler } from "../controllers/routing.controller";

const router = Router();

/**
 * Split-Ticket and Direct Route Discovery Endpoint
 * GET /api/routes/search?source=NDLS&destination=MMCT&seats=1
 */
router.get("/search", searchRoutesHandler);

export default router;

