import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚂 Tatkal Booking Engine running on http://localhost:${PORT}`);
  console.log(`⚡ High-concurrency Redis Atomic Locking active`);
  console.log(`🛡️  Zod Schema Validation enabled`);
  console.log(`🧭 Split-Ticket Graph Algorithm ready`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received. Closing HTTP server gracefully...");
  server.close(() => {
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT received. Shutting down...");
  server.close(() => {
    console.log("[Server] Server closed.");
    process.exit(0);
  });
});

export default server;

