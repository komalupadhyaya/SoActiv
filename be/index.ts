// server.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./db/db";
import http from "http";
import { Server as IOServer } from "socket.io";

// Routes
import userRouter from "./routes/user.router";
import staffRouter from "./routes/staff.routes";
import enquiry_router from "./routes/enquiry.routes";
import clientRouter from "./routes/client.routes";
import staffAttendance_router from "./routes/staffAttendance.routes";
import followUpRouter from "./routes/followUp.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || `http://localhost:5173`,
    credentials: true,
  })
);

app.use(express.static("public"));
app.use(cookieParser());

// Health check
app.get("/", (req, res) => {
  res.send("Hello World! API is running 🚀");
});

// ✅ CONNECT TO DATABASE
connectDB()
  .then(() => {
    const server = http.createServer(app);
    const io = new IOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || `http://localhost:5173`,
        methods: ["GET", "POST"],
        credentials: true,
      },
      // No custom path unless needed
    });

    // Attach `io` to `req` for use in controllers
    app.use((req, _res, next) => {
      (req as any).io = io;
      next();
    });

    // Register routes
    app.use("/api/v1/user", userRouter);
    app.use("/api/v1/staff", staffRouter);
    app.use("/api/v1/enquiry", enquiry_router);
    app.use("/api/v1/client", clientRouter);
    app.use("/api/v1/staff-attendance", staffAttendance_router);
    app.use("/api/v1/follow-up", followUpRouter);

    // Global Error Handler
    app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ): void => {
        console.error("🚨 Global Error:", err.message || err);
        const statusCode = err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(statusCode).json({
          success: false,
          message,
        });
      }
    );

    // Start server
    server.listen(PORT, () => {
      console.log(`✅ DB Connected`);
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📡 Socket.IO is active and ready`);
    });

    process.on("SIGTERM", () => {
      console.log("Shutting down gracefully...");
      server.close(() => {
        console.log("HTTP server closed");
      });
    });
  })
  .catch((err) => {
    console.log("❌ DB connection failed:", err);
    process.exit(1);
  });

export default app;