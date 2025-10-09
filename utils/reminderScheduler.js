const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Medication = require('../models/Medication');
const User = require('../models/User');
const { sendMedicationReminder, sendSMSNotification, sendPushNotification } = require('./notifications');

// Check for pending reminders and send notifications
const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

    // Find reminders due in the next 5 minutes that haven't been sent
    const pendingReminders = await Reminder.find({
      scheduledTime: { $gte: now, $lte: fiveMinutesFromNow },
      status: 'pending',
      notificationSent: false
    })
    .populate('medication')
    .populate('user');

    for (const reminder of pendingReminders) {
      const user = reminder.user;
      const medication = reminder.medication;

      // Send notifications based on user preferences
      if (user.notificationPreferences.email) {
        await sendMedicationReminder(user, medication, reminder.scheduledTime);
      }

      if (user.notificationPreferences.sms && user.phone && user.isPhoneVerified) {
        const message = `Medication reminder: Time to take ${medication.name} (${medication.dosage.amount} ${medication.dosage.unit})`;
        await sendSMSNotification(user.phone, message);
      }

      if (user.notificationPreferences.push) {
        await sendPushNotification(
          user._id,
          'Medication Reminder',
          `Time to take ${medication.name}`,
          { reminderId: reminder._id, medicationId: medication._id }
        );
      }

      // Mark notification as sent
      reminder.notificationSent = true;
      reminder.notificationSentAt = new Date();
      reminder.notificationChannels = [];
      if (user.notificationPreferences.email) reminder.notificationChannels.push('email');
      if (user.notificationPreferences.sms) reminder.notificationChannels.push('sms');
      if (user.notificationPreferences.push) reminder.notificationChannels.push('push');
      
      await reminder.save();

      console.log(`Reminder sent to ${user.email} for ${medication.name}`);
    }

    if (pendingReminders.length > 0) {
      console.log(`Processed ${pendingReminders.length} reminders`);
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

// Check for missed reminders
const checkMissedReminders = async () => {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000);

    // Find reminders that are still pending but scheduled time has passed
    const missedReminders = await Reminder.find({
      scheduledTime: { $lt: thirtyMinutesAgo },
      status: 'pending'
    });

    for (const reminder of missedReminders) {
      await reminder.markAsMissed();
    }

    if (missedReminders.length > 0) {
      console.log(`Marked ${missedReminders.length} reminders as missed`);
    }
  } catch (error) {
    console.error('Error checking missed reminders:', error);
  }
};

// Generate reminders for active medications
const generateDailyReminders = async () => {
  try {
    console.log('Generating daily reminders...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all active medications
    const activeMedications = await Medication.find({ isActive: true });

    for (const medication of activeMedications) {
      // Check each schedule entry
      for (const schedule of medication.schedule) {
        const [hours, minutes] = schedule.time.split(':');
        
        // Check if today's day is in the schedule
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (!schedule.days.includes(dayName)) {
          continue;
        }

        // Create reminder time for today
        const reminderTime = new Date(today);
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Check if this reminder already exists
        const existingReminder = await Reminder.findOne({
          user: medication.user,
          medication: medication._id,
          scheduledTime: reminderTime
        });

        if (!existingReminder && reminderTime > new Date()) {
          await Reminder.create({
            user: medication.user,
            medication: medication._id,
            scheduledTime: reminderTime
          });
          console.log(`Created reminder for ${medication.name} at ${reminderTime}`);
        }
      }
    }
  } catch (error) {
    console.error('Error generating daily reminders:', error);
  }
};

// Check refill reminders
const checkRefillReminders = async () => {
  try {
    const medications = await Medication.find({
      isActive: true,
      'refillReminder.enabled': true
    }).populate('user');

    for (const medication of medications) {
      if (medication.refillReminder.remainingQuantity <= medication.refillReminder.daysBeforeRefill) {
        const user = medication.user;
        
        // Send refill reminder (implement your notification logic)
        console.log(`Refill reminder for ${user.email}: ${medication.name}`);
        
        // You can add email/SMS notification here
      }
    }
  } catch (error) {
    console.error('Error checking refill reminders:', error);
  }
};

// Schedule cron jobs
const startScheduler = () => {
  // Check for reminders every minute
  cron.schedule('* * * * *', () => {
    checkAndSendReminders();
  });

  // Check for missed reminders every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    checkMissedReminders();
  });

  // Generate daily reminders at midnight
  cron.schedule('0 0 * * *', () => {
    generateDailyReminders();
  });

  // Check refill reminders daily at 9 AM
  cron.schedule('0 9 * * *', () => {
    checkRefillReminders();
  });

  console.log('✅ Reminder scheduler started');
};

module.exports = {
  startScheduler,
  checkAndSendReminders,
  checkMissedReminders,
  generateDailyReminders,
  checkRefillReminders
};