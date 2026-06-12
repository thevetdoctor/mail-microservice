/**
 * Email HTML templates for the serverless mail microservice.
 * Maps event types to subject lines and HTML template renderers.
 */

export interface MailTemplate {
  subject: string;
  html: (payload: Record<string, any>) => string;
}

/**
 * Shared email wrapper with modern, clean styling.
 * Uses inline styles for maximum email client compatibility.
 */
function wrapEmail(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.3px;">${title}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #edf0f4;text-align:center;">
              <p style="margin:0;font-size:12px;color:#8c95a6;line-height:1.5;">
                This is an automated message from <strong>Hobar</strong>.<br>
                &copy; ${new Date().getFullYear()} hobar.link &mdash; All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Reusable detail row for metadata like IP, time, device */
function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px;font-size:13px;color:#8c95a6;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:#3d4f5f;word-break:break-all;">${value}</td>
  </tr>`;
}

/** Metadata table wrapper */
function metadataTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fb;border-radius:8px;margin-top:20px;">
    ${rows}
  </table>`;
}

export const mailTemplates: Record<string, MailTemplate> = {
  'user.login': {
    subject: 'New Login to Your Account',
    html: (payload) => {
      const content = `
        <p style="margin:0 0 20px;font-size:15px;color:#3d4f5f;line-height:1.6;">
          A new sign-in was detected on your account:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fb;border-radius:8px;margin-bottom:20px;border:1px solid #edf0f4;">
          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #edf0f4;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">IP Address</p>
                    <p style="margin:0;font-size:16px;color:#1a2b3c;font-weight:500;">${payload.clientIp ?? 'Unknown'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0;border-bottom:1px solid #edf0f4;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">Device</p>
                    <p style="margin:0;font-size:15px;color:#1a2b3c;">${payload.deviceInfo ?? 'Unknown'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">Time</p>
                    <p style="margin:0;font-size:15px;color:#1a2b3c;">${payload.currentTime ?? new Date().toISOString()}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div style="background-color:#fff8e1;border-left:4px solid #ffc107;padding:14px 16px;border-radius:6px;">
          <p style="margin:0;font-size:14px;color:#665200;line-height:1.5;">
            ⚠️ If this wasn't you, please reset your password immediately and review your account security.
          </p>
        </div>`;
      return wrapEmail('New Login Detected', content);
    },
  },

  'user.signup': {
    subject: 'Welcome! Your Account is Ready',
    html: (payload) => {
      const content = `
        <p style="margin:0 0 20px;font-size:15px;color:#3d4f5f;line-height:1.6;">
          Welcome aboard! Your account has been created successfully. Here are the details:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fb;border-radius:8px;margin-bottom:20px;border:1px solid #edf0f4;">
          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #edf0f4;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">IP Address</p>
                    <p style="margin:0;font-size:16px;color:#1a2b3c;font-weight:500;">${payload.clientIp ?? 'Unknown'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0;border-bottom:1px solid #edf0f4;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">Device</p>
                    <p style="margin:0;font-size:15px;color:#1a2b3c;">${payload.deviceInfo ?? 'Unknown'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">Time</p>
                    <p style="margin:0;font-size:15px;color:#1a2b3c;">${payload.currentTime ?? new Date().toISOString()}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div style="background-color:#e8f5e9;border-left:4px solid #4caf50;padding:14px 16px;border-radius:6px;">
          <p style="margin:0;font-size:14px;color:#2e7d32;line-height:1.5;">
            ✅ You're all set. Start exploring your dashboard now.
          </p>
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:#8c95a6;line-height:1.5;">
          If you did not create this account, please contact our support team immediately.
        </p>`;
      return wrapEmail('Welcome!', content);
    },
  },

  'submit.feedback': {
    subject: 'New Feedback Received',
    html: (payload) => {
      const content = `
        <p style="margin:0 0 20px;font-size:15px;color:#3d4f5f;line-height:1.6;">
          You've received new feedback from your website:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fb;border-radius:8px;margin-bottom:20px;border:1px solid #edf0f4;">
          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #edf0f4;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">Name</p>
                    <p style="margin:0;font-size:16px;color:#1a2b3c;font-weight:500;">${payload.name ?? 'Anonymous'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0;border-bottom:1px solid #edf0f4;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">Email</p>
                    <p style="margin:0;font-size:15px;color:#1a2b3c;">
                      <a href="mailto:${payload.email ?? ''}" style="color:#667eea;text-decoration:none;">${payload.email ?? 'N/A'}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">Message</p>
                    <p style="margin:0;font-size:15px;color:#1a2b3c;line-height:1.6;white-space:pre-wrap;">${payload.message ?? ''}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        ${metadataTable(
          detailRow('IP Address', payload.clientIp ?? 'Unknown') +
          detailRow('Device', payload.deviceInfo ?? 'Unknown') +
          detailRow('Time', payload.timestamp ?? payload.currentTime ?? new Date().toISOString())
        )}`;
      return wrapEmail('New Feedback', content);
    },
  },

  'mail.send': {
    subject: 'You Have a New Message',
    html: (payload) => {
      const content = `
        <p style="margin:0 0 20px;font-size:15px;color:#3d4f5f;line-height:1.6;">
          You've received a new message:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fb;border-radius:8px;margin-bottom:20px;border:1px solid #edf0f4;">
          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #edf0f4;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">From</p>
                    <p style="margin:0;font-size:16px;color:#1a2b3c;font-weight:500;">${payload.from ?? 'System'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#8c95a6;text-transform:uppercase;letter-spacing:0.8px;">Message</p>
                    <p style="margin:0;font-size:15px;color:#1a2b3c;line-height:1.6;white-space:pre-wrap;">${payload.message ?? 'You have received a new notification.'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        ${metadataTable(
          detailRow('IP Address', payload.clientIp ?? 'Unknown') +
          detailRow('Device', payload.deviceInfo ?? 'Unknown') +
          detailRow('Time', payload.currentTime ?? new Date().toISOString())
        )}`;
      return wrapEmail('New Message', content);
    },
  },
};

/**
 * Get the email template for a given event type.
 * Returns the template if found, or a default notification template if the event type is unknown.
 */
export function getMailTemplate(eventType: string): MailTemplate {
  return mailTemplates[eventType] ?? mailTemplates['mail.send'];
}
