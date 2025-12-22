import { type Request, type Response } from "express";
import { asyncHandler } from "../lib/AsyncHandler.js";
import { HttpStatusCode } from "../lib/const.js";
import { Gym } from "../models/gym.model.js";
import { User } from "../models/user.model.js";
import { Client } from "../models/client.model.js";
import { SuperAdminLog } from "../models/superAdminLog.model.js";
import { Subscription } from "../models/subscription.model.js";

/**
 * Get dashboard metrics
 * GET /api/v1/super-admin/dashboard/metrics
 */
export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
    // Get gym counts by status
    const [
        totalGyms,
        activeGyms,
        trialGyms,
        suspendedGyms,
        expiredGyms,
        totalMembers,
        newGyms7Days,
        newGyms30Days
    ] = await Promise.all([
        Gym.countDocuments({ deletedAt: null }),
        Gym.countDocuments({ status: "active", deletedAt: null }),
        Gym.countDocuments({ status: "trial", deletedAt: null }),
        Gym.countDocuments({ status: "suspended", deletedAt: null }),
        Gym.countDocuments({ status: "expired", deletedAt: null }),
        Client.countDocuments(),
        Gym.countDocuments({
            deletedAt: null,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        Gym.countDocuments({
            deletedAt: null,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
    ]);

    // Calculate SaaS revenue
    const subscriptions = await Subscription.find({ status: { $in: ["active", "trialing"] } });
    const monthlyRevenue = subscriptions.reduce((sum, sub) => {
        if (sub.billingCycle === "monthly") return sum + sub.amount;
        return sum + (sub.amount / 12); // Convert yearly to monthly
    }, 0);

    // Calculate ARR
    const annualRecurringRevenue = monthlyRevenue * 12;

    // Calculate Churn Rate (Expired Gyms / Total Historical Gyms)
    const churnRate = totalGyms > 0 ? (expiredGyms / totalGyms) * 100 : 0;

    // Calculate Revenue Growth (Comparison with last month)
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

    const lastMonthSubscriptions = await Subscription.find({
        status: "active",
        createdAt: { $lt: lastMonthDate }
    });

    const lastMonthMRR = lastMonthSubscriptions.reduce((sum, sub) => {
        if (sub.billingCycle === "monthly") return sum + sub.amount;
        return sum + (sub.amount / 12);
    }, 0);

    const revenueGrowth = lastMonthMRR > 0 ? ((monthlyRevenue - lastMonthMRR) / lastMonthMRR) * 100 : 0;

    // ALERTS Logic
    const [expiringTrials, pastDue, dormantGyms] = await Promise.all([
        // 1. Expiring Trials (Ending in < 3 days)
        Gym.countDocuments({
            status: "trial",
            deletedAt: null,
            trialEndsAt: {
                $gt: new Date(),
                $lt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            }
        }),
        // 2. Failed Payments (Past Due Subscriptions)
        Subscription.countDocuments({ status: "past_due" }),
        // 3. Dormant Gyms (No new clients in 7 days)
        // This is a heuristic: finds gyms that existed > 7 days ago but have zero clients added in last 7 days
        Gym.aggregate([
            { $match: { deletedAt: null, createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
            {
                $lookup: {
                    from: "clients",
                    let: { gymOwner: "$owner" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$userId", "$$gymOwner"] },
                                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "recentActivity"
                }
            },
            { $match: { recentActivity: { $size: 0 } } },
            { $count: "count" }
        ]).then(res => res[0]?.count || 0)
    ]);

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: {
            gyms: {
                total: totalGyms,
                active: activeGyms,
                trial: trialGyms,
                suspended: suspendedGyms,
                expired: expiredGyms
            },
            members: {
                total: totalMembers
            },
            revenue: {
                monthly: monthlyRevenue,
                annual: annualRecurringRevenue,
                growth: revenueGrowth,
                currency: "INR"
            },
            churnRate: churnRate.toFixed(2),
            growth: {
                newGyms7Days,
                newGyms30Days
            },
            alerts: {
                expiringTrials,
                failedPayments: pastDue,
                dormantGyms
            }
        }
    });
});

/**
 * Get dashboard charts data
 * GET /api/v1/super-admin/dashboard/charts
 */
export const getCharts = asyncHandler(async (req: Request, res: Response) => {
    // 1. Gym growth over last 12 months
    const gymGrowth = await Gym.aggregate([
        {
            $match: {
                deletedAt: null,
                createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 2. Feature usage
    const featureUsage = await Gym.aggregate([
        { $match: { deletedAt: null } },
        {
            $group: {
                _id: null,
                payments: { $sum: { $cond: ["$features.payments", 1, 0] } },
                attendance: { $sum: { $cond: ["$features.attendance", 1, 0] } },
                pt: { $sum: { $cond: ["$features.pt", 1, 0] } },
                classes: { $sum: { $cond: ["$features.classes", 1, 0] } },
                memberPortal: { $sum: { $cond: ["$features.memberPortal", 1, 0] } }
            }
        }
    ]);

    // 3. Trial Gyms Trend (Last 30 days daily)
    const trialTrend = await Gym.aggregate([
        {
            $match: {
                deletedAt: null,
                status: "trial",
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // 4. Revenue Trend (Monthly for last 12 months)
    const revenueOverTime = await Subscription.aggregate([
        {
            $match: {
                status: { $in: ["active"] },
                createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                amount: { $sum: "$amount" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 5. Plan distribution
    const planDistribution = await Gym.aggregate([
        { $match: { deletedAt: null } },
        {
            $group: {
                _id: "$plan",
                count: { $sum: 1 }
            }
        }
    ]);

    // 6. Trial to paid conversion history (Last 6 months)
    const conversionHistory = await Gym.aggregate([
        {
            $match: {
                deletedAt: null,
                createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                trials: { $sum: { $cond: [{ $eq: ["$status", "trial"] }, 1, 0] } },
                paid: { $sum: { $cond: [{ $ne: ["$status", "trial"] }, 1, 0] } }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 7. Overall Conversion Rate
    const totalTrialGyms = await Gym.countDocuments({
        status: { $in: ["trial", "active", "suspended", "expired"] },
        deletedAt: null
    });
    const convertedGyms = await Gym.countDocuments({
        status: { $in: ["active", "suspended", "expired"] },
        deletedAt: null
    });
    const conversionRate = totalTrialGyms > 0 ? (convertedGyms / totalTrialGyms) * 100 : 0;

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: {
            gymGrowth,
            trialTrend,
            revenueOverTime,
            conversionHistory,
            featureUsage: featureUsage[0] || {
                payments: 0,
                attendance: 0,
                pt: 0,
                classes: 0,
                memberPortal: 0
            },
            conversion: {
                rate: conversionRate.toFixed(2),
                total: totalTrialGyms,
                converted: convertedGyms
            },
            planDistribution
        }
    });
});

/**
 * Get audit logs with filters
 * GET /api/v1/super-admin/logs
 */
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 50,
        action,
        targetType,
        performedBy,
        startDate,
        endDate
    } = req.query;

    const query: any = {};

    // Filters
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (performedBy) query.performedBy = performedBy;

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate as string);
        if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
        SuperAdminLog.find(query)
            .populate("performedBy", "fullname email")
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(Number(limit)),
        SuperAdminLog.countDocuments(query)
    ]);

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: {
            logs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});
