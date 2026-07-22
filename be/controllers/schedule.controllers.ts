import type { Request, Response } from 'express';
import Schedule from '../models/schedule.model';
import { Staff } from '../models/staff.model';
import { FollowUp } from '../models/followUp.model';
import mongoose, { Types } from 'mongoose';

/**
 * Helper: Get Admin ID (owner of the gym account)
 */
const getAdminId = async (req: Request): Promise<string> => {
    const user = (req as any).user;
    if (!user) throw new Error('Unauthorized: User not authenticated');

    // If user is Admin or Superadmin, they ARE the admin owner
    if (user.role === 'admin' || user.role === 'superadmin') {
        return user.id;
    }

    // If user is Staff, find their Admin via createdBy
    if (user.role === 'staff') {
        const staffDoc = await Staff.findOne({ userId: user.id }).select('createdBy');
        if (!staffDoc) throw new Error('Staff record not found for this user');
        return staffDoc.createdBy.toString();
    }

    // Default fallback (should not happen for valid roles)
    throw new Error('Unable to determine Admin ID');
};

/**
 * Helper: Check for Holiday Conflicts
 * Returns conflict message if blocked, null otherwise.
 */
const checkHolidayConflict = async (
    scheduledDate: Date,
    startTime: string | undefined,
    endTime: string | undefined,
    adminId: string
): Promise<string | null> => {
    // Find any holidays on this date for this admin
    const holidays = await Schedule.find({
        adminId: adminId,
        type: 'holiday',
        scheduledDate: {
            $gte: new Date(scheduledDate.setHours(0, 0, 0, 0)),
            $lt: new Date(scheduledDate.setHours(23, 59, 59, 999))
        }
    });

    if (!holidays || holidays.length === 0) return null;

    for (const holiday of holidays) {
        // 1. Full Day Holiday -> BLOCK ALL
        if (holiday.holidayType === 'full_day') {
            return `Cannot schedule event: ${holiday.title} is a Full Day holiday.`;
        }

        // 2. Partial Holiday -> Check Time Overlap
        // Both holiday and new event must have times to compare
        if (holiday.startTime && holiday.endTime && startTime && endTime) {
            // Helper to convert HH:MM to minutes
            const toMinutes = (time: string) => {
                const parts = time.split(':');
                if (parts.length < 2) return 0; // Fallback
                const h = Number(parts[0]);
                const m = Number(parts[1]);
                return h * 60 + m;
            };

            const holStart = toMinutes(holiday.startTime);
            const holEnd = toMinutes(holiday.endTime);
            const evtStart = toMinutes(startTime);
            const evtEnd = toMinutes(endTime);

            // Check overlap: (StartA < EndB) && (EndA > StartB)
            if (evtStart < holEnd && evtEnd > holStart) {
                return `Cannot schedule event: Overlaps with holiday '${holiday.title}' (${holiday.startTime} - ${holiday.endTime}).`;
            }
        } else if (holiday.startTime && holiday.endTime && !startTime) {
            // If new event has NO time (e.g. task without time?), assume it might overlap?
            // Or if specific requirement says block specific times.
            // If event has no time, we can't strict check overlap.
            // Let's assume tasks without time are 'all day' or 'any time' and might be allowed?
            // But traditionally, if there is a partial holiday, maybe we warn?
            // For now, only block if we know times overlap.
        }
    }

    return null;
};

/**
 * @route   GET /api/v1/schedule/holiday-check
 * @desc    Check if a date has a holiday and return blocking details
 * @access  Private
 */
export const checkHoliday = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

        const adminId = await getAdminId(req);
        const scheduledDate = new Date(date as string);

        const holidays = await Schedule.find({
            adminId: adminId,
            type: 'holiday',
            scheduledDate: {
                $gte: new Date(scheduledDate.setHours(0, 0, 0, 0)),
                $lt: new Date(scheduledDate.setHours(23, 59, 59, 999))
            }
        });

        if (!holidays || holidays.length === 0) {
            return res.status(200).json({ hasHoliday: false });
        }

        // Return details of the first blocking holiday found (or list logic)
        // Usually one holiday per day?
        const holiday = holidays[0];
        if (!holiday) {
            return res.status(200).json({ hasHoliday: false });
        }

        return res.status(200).json({
            hasHoliday: true,
            holiday: {
                title: holiday.title,
                type: holiday.holidayType,
                startTime: holiday.startTime,
                endTime: holiday.endTime
            }
        });

    } catch (error: any) {
        console.error('Check holiday error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/v1/schedule
 * @desc    Create a new schedule event
 * @access  Private (Admin, Manager)
 */
export const createScheduleEvent = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const adminId = await getAdminId(req);

        // Security check: Only Admin, Manager, or Receptionist can create
        if (user.role === 'staff' && user.position !== 'manager' && user.position !== 'receptionist') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only Admin, Manager, or Receptionist can create schedules.'
            });
        }

        const {
            title,
            description,
            scheduledDate,
            scheduledTime,
            startTime,
            endTime,
            startDate, // New
            endDate,   // New
            assignedTo,
            type,
            roleScope,
            relatedFollowUp,
            relatedMember,
            relatedClass,
            isEditable = true,
            holidayType // New field
        } = req.body;

        // Validation
        if (!title || !scheduledDate || !type) {
            return res.status(400).json({
                success: false,
                message: 'Title, scheduled date, and type are required'
            });
        }

        const titleWordCount = title.trim().split(/\s+/).filter(Boolean).length;
        if (titleWordCount > 15) {
            return res.status(400).json({
                success: false,
                message: 'Title cannot exceed 15 words'
            });
        }
        if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(title.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Title can only contain letters, numbers, spaces, and basic punctuation'
            });
        }

        if (description) {
            const descTrimmed = description.trim();
            if (descTrimmed) {
                const descWordCount = descTrimmed.split(/\s+/).filter(Boolean).length;
                const maxDescWords = (type === 'holiday' || type === 'class') ? 50 : 15;
                if (descWordCount > maxDescWords) {
                    return res.status(400).json({
                        success: false,
                        message: `Description cannot exceed ${maxDescWords} words`
                    });
                }
                if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(descTrimmed)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Description can only contain letters, numbers, spaces, and basic punctuation'
                    });
                }
            }
        }

        const targetDate = new Date(scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (targetDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled date cannot be in the past'
            });
        }

        if (startTime && endTime) {
            if (startTime === endTime) {
                return res.status(400).json({
                    success: false,
                    message: 'End time cannot be the same as start time'
                });
            }
            const toMin = (t: string) => { const parts = t.split(':').map(Number); return (parts[0] ?? 0) * 60 + (parts[1] ?? 0); };
            if (toMin(endTime) < toMin(startTime)) {
                return res.status(400).json({
                    success: false,
                    message: 'End time must be after start time'
                });
            }
        }

        // --- HOLIDAY CONFLICT CHECK ---
        // Verify we aren't creating a normal event during a holiday
        if (type !== 'holiday') {
            const conflictMsg = await checkHolidayConflict(
                new Date(scheduledDate),
                startTime || scheduledTime,
                endTime,
                adminId
            );
            if (conflictMsg) {
                // Strict 400 Return as requested
                return res.status(400).json({
                    success: false,
                    message: conflictMsg // "Cannot schedule event: ... holiday ..." matches intent
                    // Or strictly: "Cannot create events during a holiday"
                    // Let's use the specific message from helper but ensure 400
                });
            }
        }

        // Normalize assignedTo to array
        let assignedToArray: string[] = [];
        if (type === 'holiday') {
            assignedToArray = []; // Holidays have no specific assignee
            // Start/End date are required for holiday
            if (!startDate || !endDate) {
                return res.status(400).json({ success: false, message: 'Start and End dates are required for holidays.' });
            }
        } else {
            if (Array.isArray(assignedTo)) {
                assignedToArray = assignedTo;
            } else if (assignedTo) {
                assignedToArray = [assignedTo];
            }
        }

        // ... (Time validation)

        // Determine effective start/end time
        const effectiveStartTime = startTime || scheduledTime;

        if (!effectiveStartTime && type !== 'holiday') {
            return res.status(400).json({
                success: false,
                message: 'Start time (or scheduled time) is required'
            });
        }


        // Create schedule event
        const scheduleEvent = await Schedule.create({
            title,
            description,
            scheduledDate: new Date(scheduledDate),
            scheduledTime: effectiveStartTime, // Keep legacy field synced
            startTime: effectiveStartTime,
            endTime,
            startDate: type === 'holiday' ? new Date(startDate) : undefined,
            endDate: type === 'holiday' ? new Date(endDate) : undefined,
            adminId: adminId,
            createdBy: user.id, // The specific user (Admin or Manager) who created it
            assignedTo: assignedToArray,
            type,
            roleScope: roleScope || [],
            isEditable,
            relatedFollowUp,
            relatedMember,
            relatedClass,
            holidayType, // Save holiday type
            status: 'pending'
        });

        const populatedEvent = await Schedule.findById(scheduleEvent._id)
            .populate('assignedTo', 'fullName position email')
            .populate('createdBy', 'fullname email')
            .populate('completedBy', 'fullName');

        return res.status(201).json({
            success: true,
            message: 'Schedule event created successfully',
            data: populatedEvent
        });
    } catch (error: any) {
        console.error('Create schedule event error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create schedule event',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/v1/schedule
 * @desc    Get all schedule events (with stricter RBAC filtering)
 * @access  Private
 */
export const getAllScheduleEvents = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { status, type, date, filter: filterType } = req.query;

        const filter: any = {};

        // RBAC Filtering Logic
        if (user.role === 'admin' || user.role === 'superadmin') {
            // Admin: See all schedules they own (where adminId == their ID)
            filter.adminId = user.id;
        } else if (user.role === 'staff') {
            const staffDoc = await Staff.findOne({ userId: user.id });
            if (!staffDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff record not found'
                });
            }

            // MANAGER and RECEPTIONIST see ALL events for their admin
            if (user.position === 'manager' || user.position === 'receptionist') {
                filter.adminId = staffDoc.createdBy;
            } else {
                // STAFF (Trainer, Sales, Receptionist)
                // Visibility:
                // 1. Events assigned to them
                // 2. OR Events of type 'holiday' (Global Visibility)

                filter.adminId = staffDoc.createdBy; // Must be in same gym

                // If filtering by specific type 'holiday', we just show them (since adminId matches)
                if (type === 'holiday') {
                    // No need to restrict assignedTo
                } else {
                    // Show if (Assigned To Me) OR (Type is Holiday)
                    // If 'type' is specified as something else (e.g. 'task'), this OR clause might let holidays leak in if not careful?
                    // BUT if user asks for type='task', mongo will filter type='task' AND ($or conditions).
                    // (Assigned OR Holiday) AND (Type=Task) => (Assigned AND Task) OR (Holiday AND Task) -> Holiday AND Task is impossible.
                    // So we are safe with just adding the OR condition always.

                    filter.$or = [
                        { assignedTo: staffDoc._id },
                        { type: 'holiday' }
                    ];
                }
            }
        }

        // Additional Filters
        if (status) filter.status = status;
        if (type) filter.type = type;

        // Date logic (Specific date OR filter types)
        if (date) {
            const targetDate = new Date(date as string);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            filter.scheduledDate = { $gte: targetDate, $lt: nextDay };
        } else if (filterType) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (filterType === 'today') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                filter.scheduledDate = { $gte: today, $lt: tomorrow };
            } else if (filterType === 'upcoming') {
                filter.scheduledDate = { $gte: today };
            }
        }

        const scheduleEvents = await Schedule.find(filter)
            .populate('assignedTo', 'fullName position email')
            .populate('createdBy', 'fullname email')
            .populate('completedBy', 'fullName')
            .populate('relatedMember', 'fullName email')
            .sort({ scheduledDate: 1, scheduledTime: 1 });

        return res.status(200).json({
            success: true,
            message: 'Schedule events fetched successfully',
            data: scheduleEvents
        });
    } catch (error: any) {
        console.error('Get schedule events error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch schedule events',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/v1/schedule/my-schedule
 * @desc    Get schedule events assigned to logged-in staff
 * @access  Private (Staff only)
 */
export const getMySchedule = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { status, type, filter: filterType } = req.query;

        if (user.role !== 'staff') {
            return res.status(403).json({
                success: false,
                message: 'This endpoint is for staff only'
            });
        }

        const staffDoc = await Staff.findOne({ userId: user.id });
        if (!staffDoc) {
            return res.status(404).json({
                success: false,
                message: 'Staff record not found'
            });
        }

        const filter: any = { assignedTo: staffDoc._id };

        // Apply filters
        if (status) filter.status = status;
        if (type) filter.type = type;

        // Date filters
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filterType === 'today') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            filter.scheduledDate = { $gte: today, $lt: tomorrow };
        } else if (filterType === 'upcoming') {
            filter.scheduledDate = { $gte: today };
        }

        const scheduleEvents = await Schedule.find(filter)
            .populate('assignedTo', 'fullName position email')
            .populate('createdBy', 'fullname email')
            .populate('completedBy', 'fullName')
            .populate('relatedMember', 'fullName email')
            .sort({ scheduledDate: 1, scheduledTime: 1 });

        return res.status(200).json({
            success: true,
            message: 'My schedule fetched successfully',
            data: scheduleEvents
        });
    } catch (error: any) {
        console.error('Get my schedule error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch my schedule',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/v1/schedule/:id
 * @desc    Update a schedule event
 * @access  Private (Admin, Manager)
 */
export const updateScheduleEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;
        const adminId = await getAdminId(req);

        // Security check: Only Admin, Manager, or Receptionist can edit
        if (user.role === 'staff' && user.position !== 'manager' && user.position !== 'receptionist') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only Admin, Manager, or Receptionist can edit schedules.'
            });
        }

        const scheduleEvent = await Schedule.findById(id);
        if (!scheduleEvent) {
            return res.status(404).json({
                success: false,
                message: 'Schedule event not found'
            });
        }

        const newStartTime = req.body.startTime !== undefined ? req.body.startTime : scheduleEvent.startTime;
        const newEndTime = req.body.endTime !== undefined ? req.body.endTime : scheduleEvent.endTime;
        if (newStartTime && newEndTime) {
            if (newStartTime === newEndTime) {
                return res.status(400).json({
                    success: false,
                    message: 'End time cannot be the same as start time'
                });
            }
            const toMin = (t: string) => { const parts = t.split(':').map(Number); return (parts[0] ?? 0) * 60 + (parts[1] ?? 0); };
            if (toMin(newEndTime) < toMin(newStartTime)) {
                return res.status(400).json({
                    success: false,
                    message: 'End time must be after start time'
                });
            }
        }

        if (req.body.title !== undefined) {
            const titleTrimmed = req.body.title.trim();
            if (!titleTrimmed) {
                return res.status(400).json({
                    success: false,
                    message: 'Title is required'
                });
            }
            const titleWordCount = titleTrimmed.split(/\s+/).filter(Boolean).length;
            if (titleWordCount > 15) {
                return res.status(400).json({
                    success: false,
                    message: 'Title cannot exceed 15 words'
                });
            }
            if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(titleTrimmed)) {
                return res.status(400).json({
                    success: false,
                    message: 'Title can only contain letters, numbers, spaces, and basic punctuation'
                });
            }
        }

        if (req.body.description !== undefined && req.body.description !== null) {
            const descTrimmed = req.body.description.trim();
            if (descTrimmed) {
                const descWordCount = descTrimmed.split(/\s+/).filter(Boolean).length;
                const currentType = req.body.type || scheduleEvent.type;
                const maxDescWords = (currentType === 'holiday' || currentType === 'class') ? 50 : 15;
                if (descWordCount > maxDescWords) {
                    return res.status(400).json({
                        success: false,
                        message: `Description cannot exceed ${maxDescWords} words`
                    });
                }
                if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(descTrimmed)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Description can only contain letters, numbers, spaces, and basic punctuation'
                    });
                }
            }
        }

        // Restrict follow-up event edits to Admins only
        if (scheduleEvent.type === 'followup' || req.body.type === 'followup') {
            if (user.role !== 'admin' && user.role !== 'superadmin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Only Admins can edit follow-up events.'
                });
            }
        }

        // Check if event is editable (Admins/Superadmins can edit follow-up events even if isEditable is false)
        if (!scheduleEvent.isEditable) {
            const isFollowUpEditByAdmin = scheduleEvent.type === 'followup' && (user.role === 'admin' || user.role === 'superadmin');
            if (!isFollowUpEditByAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'This schedule event cannot be edited'
                });
            }
        }

        // Access Control for Edit
        if (user.role === 'staff' && (user.position === 'manager' || user.position === 'receptionist')) {
            // Receptionists and Managers can only edit schedules they created.
            if (scheduleEvent.createdBy.toString() !== user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Staff can only edit schedules they created.'
                });
            }
        } else if (user.role === 'admin') {
            // Admin can edit any schedule in their org
            if (scheduleEvent.adminId.toString() !== user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to edit this schedule event'
                });
            }
        }

        const {
            title,
            description,
            scheduledDate,
            scheduledTime,
            startTime,
            endTime,
            assignedTo,
            type,
            roleScope,
            status,
            holidayType
        } = req.body;

        // Update fields
        if (title) scheduleEvent.title = title;
        if (description !== undefined) scheduleEvent.description = description;

        let newDate = scheduleEvent.scheduledDate;
        let newStart = scheduleEvent.startTime;
        let newEnd = scheduleEvent.endTime;

        if (scheduledDate) {
            scheduleEvent.scheduledDate = new Date(scheduledDate);
            newDate = new Date(scheduledDate);
        }

        if (startTime) {
            scheduleEvent.startTime = startTime;
            scheduleEvent.scheduledTime = startTime; // Sync legacy
            newStart = startTime;
        } else if (scheduledTime) {
            scheduleEvent.scheduledTime = scheduledTime;
            scheduleEvent.startTime = scheduledTime; // Sync new
            newStart = scheduledTime;
        }

        if (endTime) {
            scheduleEvent.endTime = endTime;
            newEnd = endTime;
        }

        // --- HOLIDAY CONFLICT CHECK ---
        // Verify we aren't updating to a time that conflicts with a holiday
        // Check only if it's NOT a holiday itself
        if ((type && type !== 'holiday') || (!type && scheduleEvent.type !== 'holiday')) {
            // Need valid inputs for check
            if (newDate && newStart) {
                const conflictMsg = await checkHolidayConflict(
                    newDate,
                    newStart,
                    newEnd,
                    adminId
                );
                if (conflictMsg) {
                    return res.status(400).json({
                        success: false,
                        message: conflictMsg
                    });
                }
            }
        }

        if (assignedTo !== undefined) {
            if (Array.isArray(assignedTo)) {
                scheduleEvent.assignedTo = assignedTo;
            } else {
                scheduleEvent.assignedTo = [assignedTo];
            }
        }

        if (type) scheduleEvent.type = type;
        if (roleScope) scheduleEvent.roleScope = roleScope;
        if (status) scheduleEvent.status = status;
        if (holidayType) scheduleEvent.holidayType = holidayType;

        await scheduleEvent.save();

        // Sync follow-up task updates
        if (scheduleEvent.type === 'followup' && scheduleEvent.relatedFollowUp) {
            const followUpUpdates: any = {};
            if (title) followUpUpdates.relatedName = title.replace(/^Follow-up:\s*/i, '');
            if (description !== undefined) followUpUpdates.note = description;
            if (scheduledDate) followUpUpdates.scheduledDate = new Date(scheduledDate);
            if (newStart) followUpUpdates.scheduledTime = newStart;
            if (assignedTo !== undefined) {
                const newAssignee = Array.isArray(assignedTo) ? assignedTo[0] : assignedTo;
                if (newAssignee) followUpUpdates.assignedTo = new Types.ObjectId(newAssignee);
            }
            await FollowUp.findByIdAndUpdate(scheduleEvent.relatedFollowUp, followUpUpdates);
        }

        const populatedEvent = await Schedule.findById(scheduleEvent._id)
            .populate('assignedTo', 'fullName position email')
            .populate('createdBy', 'fullname email')
            .populate('completedBy', 'fullName');

        return res.status(200).json({
            success: true,
            message: 'Schedule event updated successfully',
            data: populatedEvent
        });
    } catch (error: any) {
        console.error('Update schedule event error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update schedule event',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/v1/schedule/:id/complete
 * @desc    Mark schedule event as completed
 * @access  Private (Assigned staff)
 */
export const completeScheduleEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { completionNotes } = req.body;
        const user = (req as any).user;

        const scheduleEvent = await Schedule.findById(id);
        if (!scheduleEvent) {
            return res.status(404).json({
                success: false,
                message: 'Schedule event not found'
            });
        }

        // Check if user is assigned to this event (for staff)
        let staffDocForSync = null;
        if (scheduleEvent.type === 'followup') {
            const staffDoc = await Staff.findOne({ userId: user.id });
            if (!staffDoc || !scheduleEvent.assignedTo?.some(id => id.toString() === staffDoc._id.toString())) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Only the assigned staff member can mark this follow-up as completed.'
                });
            }
            scheduleEvent.completedBy = staffDoc._id;
            staffDocForSync = staffDoc;
        } else if (user.role === 'staff') {
            const staffDoc = await Staff.findOne({ userId: user.id });
            if (!staffDoc || !scheduleEvent.assignedTo?.some(id => id.toString() === staffDoc._id.toString())) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to this schedule event'
                });
            }
            scheduleEvent.completedBy = staffDoc._id;
            staffDocForSync = staffDoc;
        }

        scheduleEvent.status = 'completed';
        scheduleEvent.completedAt = new Date();
        if (completionNotes) {
            scheduleEvent.completionNotes = completionNotes;
        }

        await scheduleEvent.save();

        // Sync follow-up task status back
        if (scheduleEvent.type === 'followup' && scheduleEvent.relatedFollowUp) {
            await FollowUp.findByIdAndUpdate(scheduleEvent.relatedFollowUp, {
                status: 'completed',
                completedAt: new Date(),
                completedBy: staffDocForSync ? staffDocForSync._id : undefined,
                completionNotes: completionNotes || 'Completed from Calendar'
            });
        }

        const populatedEvent = await Schedule.findById(scheduleEvent._id)
            .populate('assignedTo', 'fullName position email')
            .populate('createdBy', 'fullname email')
            .populate('completedBy', 'fullName');

        return res.status(200).json({
            success: true,
            message: 'Schedule event marked as completed',
            data: populatedEvent
        });
    } catch (error: any) {
        console.error('Complete schedule event error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to complete schedule event',
            error: error.message
        });
    }
};

/**
 * @route   DELETE /api/v1/schedule/:id
 * @desc    Delete a schedule event
 * @access  Private (Admin only)
 */
export const deleteScheduleEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        // Requirement: "MANAGER: ... ❌ Cannot delete schedules"
        // So ONLY Admin can delete.
        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only Admins can delete schedule events'
            });
        }

        const scheduleEvent = await Schedule.findById(id);
        if (!scheduleEvent) {
            return res.status(404).json({
                success: false,
                message: 'Schedule event not found'
            });
        }

        // Check ownership (Admin can only delete events in their gym)
        // Since user is admin, they can only delete if schedule.adminId == user.id
        // But schedule might not have adminId for legacy? We assume all have it or fallback to createdBy check.
        // For now, assume migration or new schedules.
        // Let's use createdBy or adminId.
        // If createdBy was the admin, matches user.id
        // If createdBy was a manager, adminId matches user.id

        let canDelete = false;
        if (scheduleEvent.adminId && scheduleEvent.adminId.toString() === user.id) {
            canDelete = true;
        } else if (scheduleEvent.createdBy.toString() === user.id) {
            canDelete = true;
        }

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this schedule event'
            });
        }

        await Schedule.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Schedule event deleted successfully',
            data: null
        });
    } catch (error: any) {
        console.error('Delete schedule event error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete schedule event',
            error: error.message
        });
    }
};
