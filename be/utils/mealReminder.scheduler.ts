import { Types } from 'mongoose';

/**
 * Normalizes time to Indian Standard Time (IST) / Asia/Kolkata
 */
export function getISTTime(): Date {
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istString);
}

/**
 * Checks all active members and sends reminders if they missed logging a specific meal.
 * Can be run by the scheduler or forced via a test endpoint.
 */
export async function checkAndNotifyMealMissed(forcedMeal?: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'): Promise<void> {
  try {
    const istDate = getISTTime();
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    let mealType: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner' | null = forcedMeal || null;

    if (!forcedMeal) {
      const hour = istDate.getHours();
      const minute = istDate.getMinutes();

      // Checkpoint 1: 10:01 AM -> Breakfast (7 AM to 10 AM)
      if (hour === 10 && minute === 1) {
        mealType = 'Breakfast';
      }
      // Checkpoint 2: 3:01 PM -> Lunch (1 PM to 3 PM)
      else if (hour === 15 && minute === 1) {
        mealType = 'Lunch';
      }
      // Checkpoint 3: 6:01 PM -> Snacks (5 PM to 6 PM)
      else if (hour === 18 && minute === 1) {
        mealType = 'Snacks';
      }
      // Checkpoint 4: 10:01 PM -> Dinner (8 PM to 10 PM)
      else if (hour === 22 && minute === 1) {
        mealType = 'Dinner';
      }
    }

    if (!mealType) return;

    console.log(`[MealReminder] Running check for meal type: ${mealType} on date: ${todayStr}`);

    const { User } = await import('../models/user.model.js');
    const { default: DietPlan } = await import('../models/dietPlan.model.js');
    const { createNotification } = await import('./notification.helper.js');

    // Get all registered members
    const members = await User.find({ role: 'member' }).select('_id gym');
    if (!members.length) return;

    for (const member of members) {
      const plan = await DietPlan.findOne({ member: member._id });
      if (!plan) continue;

      const todayLog = plan.dailyLogs?.find((log: any) => log.date === todayStr);
      const hasMeal = todayLog?.mealsLogged?.includes(mealType);

      if (!hasMeal) {
        let title = '';
        let message = '';

        if (mealType === 'Breakfast') {
          title = '🍳 Breakfast Reminder';
          message = 'You missed logging your breakfast between 7:00 AM and 10:00 AM. Please log your meal to keep your macro tracking accurate!';
        } else if (mealType === 'Lunch') {
          title = '🍱 Lunch Reminder';
          message = 'You missed logging your lunch between 1:00 PM and 3:00 PM. Stay on track and log your intake!';
        } else if (mealType === 'Snacks') {
          title = '🍌 Snacks Reminder';
          message = 'You missed logging your afternoon snacks between 5:00 PM and 6:00 PM. Fuel your body and log it now!';
        } else if (mealType === 'Dinner') {
          title = '🥗 Dinner Reminder';
          message = 'You missed logging your dinner between 8:00 PM and 10:00 PM. Complete your day and log your final meal!';
        }

        await createNotification({
          recipientId: member._id,
          recipientRole: 'member',
          gymId: member.gym,
          type: 'announcement',
          title,
          message,
          link: '/member/nutrition',
        });

        console.log(`[MealReminder] Dispatched reminder for member ${member._id} (${mealType})`);
      }
    }
  } catch (err) {
    console.error('[MealReminder] Error running reminder checker:', err);
  }
}

/**
 * Starts the scheduler to poll every 60 seconds
 */
export function startMealReminderScheduler(): void {
  console.log('[MealReminder] Background reminder scheduler successfully initialized.');
  
  // Run check every 60 seconds
  setInterval(() => {
    checkAndNotifyMealMissed();
  }, 60_000);
}
