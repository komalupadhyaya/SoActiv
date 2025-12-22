import { v4 as uuidv4 } from "uuid";
import type { Request, Response, NextFunction } from "express";

interface ErrorLog {
    errorId: string;
    requestId: string;
    gymId?: string;
    userId?: string;
    route: string;
    method: string;
    statusCode: number;
    message: string;
    stack?: string;
    timestamp: Date;
    ip?: string;
    userAgent?: string;
}

// In-memory error store (in production, use MongoDB or external service)
const errorLogs: ErrorLog[] = [];
const MAX_LOGS = 1000; // Keep last 1000 errors

/**
 * Generate unique request ID for tracking
 */
export const attachRequestId = (req: Request, res: Response, next: NextFunction) => {
    (req as any).requestId = uuidv4();
    next();
};

/**
 * Log error with full context
 */
export const logError = (error: any, req: Request) => {
    const errorId = uuidv4();
    const requestId = (req as any).requestId || "unknown";
    const user = (req as any).user;
    const gymId = user?.gym?.toString();
    const userId = user?._id?.toString();

    const errorLog: ErrorLog = {
        errorId,
        requestId,
        gymId,
        userId,
        route: req.path,
        method: req.method,
        statusCode: error.statusCode || 500,
        message: error.message || "Unknown error",
        stack: error.stack,
        timestamp: new Date(),
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || "unknown"
    };

    // Add to in-memory store
    errorLogs.push(errorLog);

    // Keep only last MAX_LOGS
    if (errorLogs.length > MAX_LOGS) {
        errorLogs.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV !== "production") {
        console.error(`[ERROR ${errorId}]`, {
            route: errorLog.route,
            method: errorLog.method,
            message: errorLog.message,
            gymId: errorLog.gymId,
            userId: errorLog.userId
        });
    }

    return errorId;
};

/**
 * Error tracking middleware
 */
export const errorTracker = (error: any, req: Request, res: Response, next: NextFunction) => {
    const errorId = logError(error, req);

    // Attach error ID to response
    (error as any).errorId = errorId;

    next(error);
};

/**
 * Get error logs (for Super Admin debugging)
 */
export const getErrorLogs = (filters?: {
    gymId?: string;
    userId?: string;
    route?: string;
    limit?: number;
}) => {
    let logs = [...errorLogs];

    // Apply filters
    if (filters?.gymId) {
        logs = logs.filter(log => log.gymId === filters.gymId);
    }
    if (filters?.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters?.route) {
        logs = logs.filter(log => log.route.includes(filters.route));
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Limit results
    if (filters?.limit) {
        logs = logs.slice(0, filters.limit);
    }

    return logs;
};

/**
 * Get error statistics
 */
export const getErrorStats = () => {
    const now = Date.now();
    const last24h = errorLogs.filter(log => now - log.timestamp.getTime() < 24 * 60 * 60 * 1000);
    const lastHour = errorLogs.filter(log => now - log.timestamp.getTime() < 60 * 60 * 1000);

    // Group by status code
    const byStatusCode: Record<number, number> = {};
    errorLogs.forEach(log => {
        byStatusCode[log.statusCode] = (byStatusCode[log.statusCode] || 0) + 1;
    });

    // Group by route
    const byRoute: Record<string, number> = {};
    errorLogs.forEach(log => {
        byRoute[log.route] = (byRoute[log.route] || 0) + 1;
    });

    return {
        total: errorLogs.length,
        last24Hours: last24h.length,
        lastHour: lastHour.length,
        byStatusCode,
        topRoutes: Object.entries(byRoute)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([route, count]) => ({ route, count }))
    };
};
