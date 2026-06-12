import * as nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Logger } from '../utils/logger';
import { config } from '../utils/constants';
import { decrypt } from '../utils/encryption';
import { getMailTemplate } from '../utils/templates';
import { dynamoDBService } from '../services/dynamodb';
import { publishEvent } from '../services/eventbridge';
import { errorTracker } from '../services/errorTracker';
import { MailEventDetail, MailEventType } from '../types/events';
import { MailConfig } from '../types/models';

const sesClient = new SESClient({});

/** Event types that trigger email delivery. */
const EMAIL_EVENT_TYPES: MailEventType[] = [
  'user.login',
  'user.signup',
  'submit.feedback',
  'mail.send',
];

/**
 * EventBridge event structure received by the handler.
 */
interface EventBridgeEvent {
  'detail-type': string;
  detail: MailEventDetail;
  [key: string]: unknown;
}

/**
 * Event Processor Lambda handler.
 *
 * Consumes events from EventBridge and routes them by event type:
 * - Email events: try SES first, fall back to SMTP/Nodemailer
 * - user.login.error: track error rate and optionally send admin alert
 */
export async function handler(event: EventBridgeEvent): Promise<void> {
  const logger = new Logger();
  const detail = event.detail;

  // eventType can come from detail.eventType (structured events) or from the EventBridge detail-type field
  const eventType = (detail.eventType || event['detail-type']) as MailEventType;
  // payload can be nested under detail.payload or the detail itself IS the payload
  const payload = detail.payload || detail;
  const correlationId = detail.correlationId || (payload as any).correlationId || '';

  if (correlationId) {
    logger.setCorrelationId(correlationId);
  }

  logger.info('Event received', { eventType, correlationId });

  if (eventType === 'user.login.error') {
    await handleLoginError(payload, logger);
    return;
  }

  if (EMAIL_EVENT_TYPES.includes(eventType)) {
    await handleEmailEvent(eventType, payload, logger, correlationId);
    return;
  }

  logger.warn('Unknown event type received, skipping', { eventType });
}

/**
 * Handle email delivery events.
 * Tries SES first. If SES fails or SES_FROM_EMAIL is not configured, falls back to SMTP.
 */
async function handleEmailEvent(
  eventType: MailEventType,
  payload: Record<string, any>,
  logger: Logger,
  correlationId: string,
): Promise<void> {
  const template = getMailTemplate(eventType);
  const to = payload.to || payload.email || config.ADMIN_EMAIL;
  const senderEmail = payload.apiUser || config.ADMIN_EMAIL;

  // Try SES first
  if (config.SES_FROM_EMAIL) {
    const sesSent = await trySES(config.SES_FROM_EMAIL, to, template.subject, template.html(payload), logger);
    if (sesSent) {
      logger.info('Email sent via SES', { eventType, to, subject: template.subject });
      await publishEvent('mail.sent', {
        eventType,
        to,
        provider: 'ses',
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    logger.warn('SES delivery failed, falling back to SMTP', { to });
  }

  // Fall back to SMTP via Nodemailer
  await trySMTP(senderEmail, to, template.subject, template.html(payload), eventType, correlationId, logger);
}

/**
 * Attempt to send email via AWS SES.
 * Returns true on success, false on failure.
 */
async function trySES(
  from: string,
  to: string,
  subject: string,
  html: string,
  logger: Logger,
): Promise<boolean> {
  try {
    await sesClient.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      }),
    );
    return true;
  } catch (err) {
    logger.error('SES send failed', err, JSON.stringify({ from, to, subject }));
    return false;
  }
}

/**
 * Send email via SMTP/Nodemailer using config from DynamoDB MailConfigs table.
 */
async function trySMTP(
  senderEmail: string,
  to: string,
  subject: string,
  html: string,
  eventType: MailEventType,
  correlationId: string,
  logger: Logger,
): Promise<void> {
  // Retrieve SMTP config from DynamoDB
  let mailConfig: MailConfig | null;
  try {
    mailConfig = await dynamoDBService.getMailConfigByEmail(senderEmail);
  } catch (err) {
    logger.error('Failed to retrieve SMTP config', err, JSON.stringify({ eventType, senderEmail }));
    return;
  }

  if (!mailConfig) {
    logger.warn('SMTP configuration not found, skipping email delivery', {
      senderEmail,
      eventType,
    });
    return;
  }

  // Decrypt SMTP password
  let decryptedPassword: string;
  try {
    decryptedPassword = decrypt(mailConfig.smtpPass, config.ENCRYPTION_KEY);
  } catch (err) {
    logger.error('Failed to decrypt SMTP password', err, JSON.stringify({ eventType, senderEmail }));
    return;
  }

  // Create Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: mailConfig.smtpHost,
    port: mailConfig.smtpPort,
    secure: mailConfig.smtpPort === 465,
    auth: {
      user: mailConfig.smtpUser,
      pass: decryptedPassword,
    },
  });

  // Send email
  try {
    await transporter.sendMail({ from: mailConfig.smtpUser, to, subject, html });

    logger.info('Email sent via SMTP', { eventType, to, subject });

    await publishEvent('mail.sent', {
      eventType,
      to,
      provider: 'smtp',
      correlationId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(
      'SMTP delivery failed',
      err,
      JSON.stringify({ eventType, to, senderEmail }),
      { eventType, to, senderEmail },
    );
  }
}

/**
 * Handle user.login.error events.
 */
async function handleLoginError(
  payload: Record<string, any>,
  logger: Logger,
): Promise<void> {
  const result = await errorTracker.trackLoginError({
    email: payload.email || '',
    clientIp: payload.clientIp || '',
  });

  if (result.alertTriggered) {
    logger.warn('Login error threshold reached, sending admin alert');
    await sendAdminAlert(payload, logger);
  }
}

/**
 * Send admin alert — tries SES first, falls back to SMTP.
 */
async function sendAdminAlert(
  payload: Record<string, any>,
  logger: Logger,
): Promise<void> {
  const adminEmail = config.ADMIN_EMAIL;
  const alertHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Login Error Alert</title></head>
<body>
  <h2>Login Error Rate Alert</h2>
  <p>The login error rate has exceeded the configured threshold (${config.MAX_ERRORS} errors within ${config.ERROR_WINDOW_MS / 1000}s).</p>
  <p><strong>Last failed email:</strong> ${payload.email || 'Unknown'}</p>
  <p><strong>Last failed IP:</strong> ${payload.clientIp || 'Unknown'}</p>
  <p><strong>Time:</strong> ${new Date().toISOString()}</p>
  <p>Please investigate potential security issues.</p>
</body>
</html>`;

  // Try SES first
  if (config.SES_FROM_EMAIL) {
    const sent = await trySES(config.SES_FROM_EMAIL, adminEmail, 'Login Error Rate Alert', alertHtml, logger);
    if (sent) {
      logger.info('Admin alert sent via SES', { adminEmail });
      return;
    }
  }

  // Fall back to SMTP
  let mailConfig: MailConfig | null;
  try {
    mailConfig = await dynamoDBService.getMailConfigByEmail(adminEmail);
  } catch (err) {
    logger.error('Failed to retrieve admin SMTP config', err, JSON.stringify({ adminEmail }));
    return;
  }

  if (!mailConfig) {
    logger.warn('Admin SMTP config not found, cannot send alert', { adminEmail });
    return;
  }

  let decryptedPassword: string;
  try {
    decryptedPassword = decrypt(mailConfig.smtpPass, config.ENCRYPTION_KEY);
  } catch (err) {
    logger.error('Failed to decrypt admin SMTP password', err, JSON.stringify({ adminEmail }));
    return;
  }

  const transporter = nodemailer.createTransport({
    host: mailConfig.smtpHost,
    port: mailConfig.smtpPort,
    secure: mailConfig.smtpPort === 465,
    auth: { user: mailConfig.smtpUser, pass: decryptedPassword },
  });

  try {
    await transporter.sendMail({
      from: mailConfig.smtpUser,
      to: adminEmail,
      subject: 'Login Error Rate Alert',
      html: alertHtml,
    });
    logger.info('Admin alert sent via SMTP', { adminEmail });
  } catch (err) {
    logger.error('Failed to send admin alert', err, JSON.stringify({ adminEmail }));
  }
}
