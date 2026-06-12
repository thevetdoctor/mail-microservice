/**
 * EventBridge event type definitions for the mail microservice.
 */

/** Supported event types processed by the Event Processor Lambda. */
export type MailEventType =
  | 'user.login'
  | 'user.signup'
  | 'submit.feedback'
  | 'mail.send'
  | 'user.login.error';

/** Detail structure for events published to and consumed from EventBridge. */
export interface MailEventDetail {
  eventType: MailEventType;
  payload: Record<string, any>;
  correlationId: string;
  timestamp: string; // ISO 8601
}
