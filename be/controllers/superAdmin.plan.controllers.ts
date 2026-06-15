import { type Request, type Response } from "express";
import { asyncHandler } from "../lib/AsyncHandler.js";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";
import { Plan } from "../models/plan.model.js";
import { Gym } from "../models/gym.model.js";
import { logSuperAdminAction, getSuperAdminContext } from "../utils/superAdminLogger.js";

/**
 * Get all plans
 * GET /api/v1/super-admin/plans
 */
export const listPlans = asyncHandler(async (req: Request, res: Response) => {
    const { includeInactive } = req.query;

    const query: any = { deletedAt: null };

    // By default, only show active plans
    if (includeInactive !== "true") {
        query.isActive = true;
    }

    const plans = await Plan.find(query).sort({ price: 1 });

    // Get gym count for each plan
    const plansWithStats = await Promise.all(
        plans.map(async (plan) => {
            const gymCount = await Gym.countDocuments({
                plan: plan.name,
                deletedAt: null
            });

            return {
                ...plan.toObject(),
                gymCount
            };
        })
    );

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: plansWithStats
    });
});

/**
 * Create a new plan
 * POST /api/v1/super-admin/plans
 */
export const createPlan = asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        displayName,
        price,
        currency,
        billingCycle,
        maxMembers,
        maxStaff,
        features,
        description
    } = req.body;

    // Validation
    if (!name || !displayName || price === undefined || maxMembers === undefined || maxStaff === undefined) {
        throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Name, display name, price, maxMembers, and maxStaff are required"
        );
    }

    // Check if plan name already exists
    const existingPlan = await Plan.findOne({ name: name.toLowerCase() });
    if (existingPlan) {
        throw new ApiError(HttpStatusCode.CONFLICT, "Plan with this name already exists");
    }

    // Create plan
    const plan = await Plan.create({
        name: name.toLowerCase(),
        displayName,
        price,
        currency: currency || "INR",
        billingCycle: billingCycle || "monthly",
        maxMembers,
        maxStaff,
        features: features || {
            payments: true,
            attendance: true,
            pt: true,
            classes: true,
            memberPortal: true
        },
        description,
        isActive: true
    });

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "create_gym", // Using closest match
        targetType: "system",
        performedBy: context.performedBy,
        metadata: {
            action: "create_plan",
            planName: plan.name,
            price: plan.price,
            maxMembers: plan.maxMembers,
            maxStaff: plan.maxStaff
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Plan created successfully",
        data: plan
    });
});

/**
 * Update a plan
 * PATCH /api/v1/super-admin/plans/:id
 */
export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        displayName,
        price,
        currency,
        billingCycle,
        maxMembers,
        maxStaff,
        features,
        description,
        isActive
    } = req.body;

    const plan = await Plan.findById(id);
    if (!plan || plan.deletedAt) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Plan not found");
    }

    const oldValues = { ...plan.toObject() };

    // Update fields
    if (displayName !== undefined) plan.displayName = displayName;
    if (price !== undefined) plan.price = price;
    if (currency !== undefined) plan.currency = currency;
    if (billingCycle !== undefined) plan.billingCycle = billingCycle;
    if (maxMembers !== undefined) plan.maxMembers = maxMembers;
    if (maxStaff !== undefined) plan.maxStaff = maxStaff;
    if (features !== undefined) plan.features = { ...plan.features, ...features };
    if (description !== undefined) plan.description = description;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "update_gym", // Using closest match
        targetType: "system",
        performedBy: context.performedBy,
        metadata: {
            action: "update_plan",
            planName: plan.name,
            oldValues,
            newValues: req.body
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Plan updated successfully",
        data: plan
    });
});

/**
 * Soft delete a plan
 * DELETE /api/v1/super-admin/plans/:id
 */
export const deletePlan = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const plan = await Plan.findById(id);
    if (!plan || plan.deletedAt) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Plan not found");
    }

    // Check if any gyms are using this plan
    const gymsUsingPlan = await Gym.countDocuments({
        plan: plan.name,
        deletedAt: null
    });

    if (gymsUsingPlan > 0) {
        throw new ApiError(
            HttpStatusCode.CONFLICT,
            `Cannot delete plan. ${gymsUsingPlan} gym(s) are currently using this plan.`
        );
    }

    // Soft delete
    plan.deletedAt = new Date();
    plan.isActive = false;
    await plan.save();

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "delete_gym", // Using closest match
        targetType: "system",
        performedBy: context.performedBy,
        metadata: {
            action: "delete_plan",
            planName: plan.name
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Plan deleted successfully"
    });
});
