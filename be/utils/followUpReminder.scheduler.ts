import { FollowUp } from '../models/followUp.model';
import { Staff } from '../models/staff.model';
import { createNotification } from './notification.helper';

/**
 * Normalizes time to Indian Standard Time (IST) / Asia/Kolkata
 */
export function getISTTime(): Date {
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istString);
}

/**
 * Reconstructs target follow-up scheduled date and time into a comparable IST Date object.
 */
export function getFollowUpISTDate(scheduledDate: Date, scheduledTime: string): Date {
  const year = scheduledDate.getUTCFullYear();
  const month = scheduledDate.getUTCMonth(); // 0-indexed
  const day = scheduledDate.getUTCDate();
  const [hours, minutes] = scheduledTime.split(':').map(Number);

  // Return a Date object with calendar fields set in the server's timezone to align with getISTTime()
  return new Date(year, month, day, hours, minutes, 0, 0);
}

/**
 * Checks all pending follow-ups that haven't had a reminder sent, and triggers a
 * notification if they are scheduled to occur in 1 hour or less.
 */
export async function checkAndSendFollowUpReminders(): Promise<void> {
  try {
    const now = getISTTime();

    // Find all pending follow-ups that haven't received a reminder yet
    const pendingFollowUps = await FollowUp.find({
      status: 'pending',
      reminderSent: false
    });

    if (pendingFollowUps.length === 0) return;

    // Quietly inspect pending follow-ups without spamming the console every 60 seconds


    for (const followUp of pendingFollowUps) {
      const targetTime = getFollowUpISTDate(followUp.scheduledDate, followUp.scheduledTime);
      const diffMs = targetTime.getTime() - now.getTime();

      // Send reminder if target is scheduled in <= 1 hour (3600000 ms)
      if (diffMs <= 60 * 60 * 1000) {
        try {
          const staffDoc = await Staff.findById(followUp.assignedTo);
          if (staffDoc && staffDoc.userId) {
            await createNotification({
              recipientId: staffDoc.userId.toString(),
              recipientRole: 'staff',
              gymId: staffDoc.gym?.toString(),
              type: 'follow_up_due',
              title: '🔔 Upcoming Follow-up Reminder',
              message: `Reminder: You have a follow-up scheduled for ${followUp.relatedName} in 1 hour (at ${followUp.scheduledTime}).`,
              link: '/staff/follow-ups',
              metadata: {
                followUpId: (followUp as any)._id.toString(),
                relatedId: followUp.relatedId.toString(),
                relatedName: followUp.relatedName
              }
            });
            console.log(`[FollowUpReminder] Sent reminder to staff ${staffDoc.userId} for follow-up ${followUp._id}`);
          }
        } catch (staffErr) {
          console.error(`[FollowUpReminder] Error querying/notifying staff for follow-up ${followUp._id}:`, staffErr);
        }

        // Mark reminderSent as true regardless of notification dispatch outcome so we don't infinite loop/retry
        followUp.reminderSent = true;
        await followUp.save();
      }
    }
  } catch (err) {
    console.error('[FollowUpReminder] Error running reminder checker:', err);
  }
}

/**
 * Starts the background follow-up reminder scheduler to poll every 60 seconds
 */
export function startFollowUpReminderScheduler(): void {
  console.log('[FollowUpReminder] Background follow-up reminder scheduler successfully initialized.');

  // Run check every 60 seconds
  setInterval(() => {
    checkAndSendFollowUpReminders();
  }, 60_000);
}
