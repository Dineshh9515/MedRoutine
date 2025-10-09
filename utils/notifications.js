const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send email notification
exports.sendEmailNotification = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'MedRoutine <noreply@medroutine.com>',
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send medication reminder email
exports.sendMedicationReminder = async (user, medication, reminderTime) => {
  const subject = `Medication Reminder: ${medication.name}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }
        .content {
          background: white;
          padding: 30px;
          border-radius: 8px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          background: linear-gradient(to right, #106EBE, #0FFCBE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .medication-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(to right, #106EBE, #0FFCBE);
          color: white;
          text-decoration: none;
          border-radius: 25px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="header">
            <div class="logo">💊 MedRoutine</div>
            <h2>Time for Your Medication!</h2>
          </div>
          
          <p>Hi ${user.firstName},</p>
          <p>This is a friendly reminder to take your medication:</p>
          
          <div class="medication-info">
            <h3>${medication.name}</h3>
            <p><strong>Dosage:</strong> ${medication.dosage.amount} ${medication.dosage.unit}</p>
            <p><strong>Time:</strong> ${new Date(reminderTime).toLocaleTimeString()}</p>
            ${medication.instructions ? `<p><strong>Instructions:</strong> ${medication.instructions}</p>` : ''}
          </div>
          
          <p>Remember to take your medication as prescribed for the best health outcomes.</p>
          
          <center>
            <a href="${process.env.CLIENT_URL}/reminders" class="button">Mark as Taken</a>
          </center>
          
          <div class="footer">
            <p>© 2025 MedRoutine. All rights reserved.</p>
            <p>This is an automated reminder. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await this.sendEmailNotification(user.email, subject, html);
};

// Send SMS notification (using Twilio or similar service)
exports.sendSMSNotification = async (phone, message) => {
  try {
    // Implement Twilio or other SMS service here
    console.log(`SMS to ${phone}: ${message}`);
    return { success: true };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
};

// Send push notification
exports.sendPushNotification = async (userId, title, body, data) => {
  try {
    // Implement push notification service (FCM, OneSignal, etc.)
    console.log(`Push notification to user ${userId}: ${title}`);
    return { success: true };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to MedRoutine!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }
        .content {
          background: white;
          padding: 30px;
          border-radius: 8px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(to right, #106EBE, #0FFCBE);
          color: white;
          text-decoration: none;
          border-radius: 25px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <h1>Welcome to MedRoutine, ${user.firstName}! 🎉</h1>
          <p>We're excited to have you on board. MedRoutine helps you never miss a dose and stay on track with your medication schedule.</p>
          
          <h3>Get Started:</h3>
          <ul>
            <li>Add your medications</li>
            <li>Set up reminders</li>
            <li>Invite caregivers to help you</li>
            <li>Track your adherence</li>
          </ul>
          
          <center>
            <a href="${process.env.CLIENT_URL}/dashboard" class="button">Go to Dashboard</a>
          </center>
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Stay healthy!<br>The MedRoutine Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await this.sendEmailNotification(user.email, subject, html);
};

module.exports = exports;