import nodemailer from 'nodemailer';
import { AlertModel, UserModel } from '../models/index.js';

let transporter = null;
let etherealAccount = null;

async function getTransporter() {
  if (transporter) return transporter;

  // If user provided SMTP credentials in .env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  }

  // Fallback: Generate an instant Ethereal test inbox account (Nodemailer zero-config test inbox)
  try {
    etherealAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass
      }
    });
    console.log(`[MAILER] Initialized Ethereal test mailer: ${etherealAccount.user}`);
    return transporter;
  } catch (err) {
    console.warn('[MAILER] Could not create Ethereal account, using console transport:', err.message);
    // Console fallback
    return {
      sendMail: async (opts) => {
        console.log(`[EMAIL DISPATCHED TO: ${opts.to}] Subject: ${opts.subject}`);
        return { messageId: 'console_' + Date.now() };
      }
    };
  }
}

/**
 * Dispatches an email alert to linked family members upon an out-of-range vital or missed dose.
 * Enforces strictly ONE email per event (no duplicates).
 */
export async function sendAlertEmail({ entryId, patient, reason, vitalOrMedicineDetails }) {
  // Deduplication check: verify no email was already sent for this entry
  const existingAlert = await AlertModel.findOne({ entryId });
  if (existingAlert) {
    console.log(`[ALERT] Email already dispatched for entry ${entryId}. Skipping duplicate.`);
    return existingAlert;
  }

  // Find linked family emails
  const familyUsers = [];
  for (const fId of (patient.familyIds || [])) {
    const user = await UserModel.findById(fId);
    if (user && user.email) familyUsers.push(user);
  }

  const recipientEmails = familyUsers.map(f => f.email);
  const recipientNames = familyUsers.map(f => f.name).join(', ') || 'Family Member';
  const targetEmail = recipientEmails.length > 0 ? recipientEmails.join(', ') : 'family@thecarepal.com';

  const subject = `[TheCarePal Alert] Care update for ${patient.name}: ${reason.split(':')[0]}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F1F3F2; padding: 24px; border-radius: 12px; color: #3A342D;">
      <div style="background-color: #3A342D; padding: 18px 24px; border-radius: 8px 8px 0 0; color: #F1F3F2;">
        <h1 style="margin: 0; font-size: 20px; font-weight: bold;">TheCarePal Clinical Care Alert</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #D3ECF0;">Patient: ${patient.name} (78 yrs, Bhopal)</p>
      </div>

      <div style="background-color: #FFFFFF; padding: 24px; border: 1px solid #D9D3CA; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 15px; margin-top: 0;">Hello ${recipientNames},</p>
        <p style="font-size: 14px; line-height: 1.6;">A care reading logged during today's shift requires your attention:</p>

        <div style="background-color: #FFF5F5; border-left: 4px solid #B3261E; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
          <strong style="color: #B3261E; font-size: 15px;">Incident Details:</strong>
          <p style="margin: 6px 0 0; font-size: 14px; color: #3A342D; font-weight: 600;">${reason}</p>
        </div>

        <p style="font-size: 13px; color: #7A7268; line-height: 1.5;">
          Logged by visiting nurse Rekha Yadav. You can review the full day timeline and 7-day trend chart in your dashboard.
        </p>

        <div style="margin-top: 24px; text-align: center;">
          <a href="http://localhost:5173" style="background-color: #17707F; color: #F1F3F2; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Open CarePal Dashboard
          </a>
        </div>
      </div>

      <div style="margin-top: 16px; text-align: center; font-size: 11px; color: #7A7268;">
        Recorded by care staff. Not a medical diagnosis. Reference ranges are demo defaults.
      </div>
    </div>
  `;

  try {
    const mailer = await getTransporter();
    const mailOptions = {
      from: process.env.ALERT_FROM || '"TheCarePal Alerts" <alerts@thecarepal.com>',
      to: targetEmail,
      subject,
      html: htmlContent,
      text: `TheCarePal Care Alert for ${patient.name}:\n\n${reason}\n\nReview at http://localhost:5173\nLogged by care staff.`
    };

    const info = await mailer.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;

    console.log(`=======================================================`);
    console.log(`📧 [EMAIL ALERT SENT]`);
    console.log(`   To: ${targetEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Reason: ${reason}`);
    if (previewUrl) {
      console.log(`   🔗 Ethereal Live Inbox Preview: ${previewUrl}`);
    }
    console.log(`=======================================================`);

    // Record alert in database (enforcing deduplication)
    const alertRecord = await AlertModel.create({
      entryId,
      patientId: patient._id,
      reason,
      recipients: recipientEmails.length > 0 ? recipientEmails : [targetEmail],
      subject,
      previewUrl: previewUrl || null,
      sentAt: new Date().toISOString()
    });

    return alertRecord;
  } catch (err) {
    console.error('[MAILER ERROR] Failed to send email alert:', err);
    // Still record alert failure
    return await AlertModel.create({
      entryId,
      patientId: patient._id,
      reason,
      recipients: [targetEmail],
      subject,
      sentAt: new Date().toISOString(),
      error: err.message
    });
  }
}
