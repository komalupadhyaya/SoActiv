// server.ts
import dns from "dns";
// Bypass router DNS lookup failures for MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import path from "path";
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
import scheduleRouter from "./routes/schedule.routes";
import ptRouter from "./routes/pt.routes";
import announcementRouter from "./routes/announcement.routes";
import superAdminRouter from "./routes/superAdmin.routes";
import clientAttendanceRouter from "./routes/clientAttendance.routes";
import contactRouter from "./routes/contact.routes";
import progressPhotoRouter from "./routes/progressPhoto.routes";
import fitnessGoalRouter from "./routes/fitnessGoal.routes";
import dietPlanRouter from "./routes/dietPlan.routes";
import exerciseRouter from "./routes/exercise.routes";
import notificationRouter from "./routes/notification.routes";
import Enquiry from './models/enquiry.model';
import Contact from './models/contact.model';
import { Notification } from './models/notification.model';
import cleaningRouter from "./routes/cleaning.routes";
import { CleaningTemplate } from "./models/cleaningTemplate.model";
import { CleaningChecklist } from "./models/cleaningChecklist.model";
import gymClassRouter from "./routes/gymClass.routes";
import classSessionRouter from "./routes/classSession.routes";
import classBookingRouter from "./routes/classBooking.routes";
import classAttendanceRouter from "./routes/classAttendance.routes";
import { GymClass } from "./models/gymClass.model";
import { ClassSession } from "./models/classSession.model";
import { ClassBooking } from "./models/classBooking.model";
import { ClassAttendance } from "./models/classAttendance.model";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
  .then(async () => {
    // Sync indexes after DB connection
    await Promise.all([
      Enquiry.syncIndexes(),
      Contact.syncIndexes(),
      Notification.syncIndexes(),
      CleaningTemplate.syncIndexes(),
      CleaningChecklist.syncIndexes(),
      GymClass.syncIndexes(),
      ClassSession.syncIndexes(),
      ClassBooking.syncIndexes(),
      ClassAttendance.syncIndexes(),
    ]);

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
    app.use("/api/v1/schedule", scheduleRouter);
    app.use("/api/v1/pt", ptRouter);
    app.use("/api/v1/announcements", announcementRouter);
    app.use("/api/v1/client-attendance", clientAttendanceRouter);
    app.use("/api/v1/super-admin", superAdminRouter);
    app.use("/api/v1/contact", contactRouter);
    app.use("/api/v1/progress-photos", progressPhotoRouter);
    app.use("/api/v1/fitness-goals", fitnessGoalRouter);
    app.use("/api/v1/diet-plans", dietPlanRouter);
    app.use("/api/v1/exercises", exerciseRouter);
    app.use("/api/v1/notifications", notificationRouter);
    app.use("/api/v1/cleaning", cleaningRouter);
    app.use("/api/v1/classes", gymClassRouter);
    app.use("/api/v1/class-sessions", classSessionRouter);
    app.use("/api/v1/class-bookings", classBookingRouter);
    app.use("/api/v1/class-attendance", classAttendanceRouter);

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

      // Start background meal reminder scheduler
      import('./utils/mealReminder.scheduler.js')
        .then(({ startMealReminderScheduler }) => {
          startMealReminderScheduler();
        })
        .catch((err) => {
          console.error('[MealReminder] Failed to initialize scheduler:', err);
        });

      // Start background follow-up reminder scheduler
      import('./utils/followUpReminder.scheduler.js')
        .then(({ startFollowUpReminderScheduler }) => {
          startFollowUpReminderScheduler();
        })
        .catch((err) => {
          console.error('[FollowUpReminder] Failed to initialize scheduler:', err);
        });
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