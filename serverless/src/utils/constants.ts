/**
 * Environment variable configuration and constants for the serverless mail microservice.
 * All Lambda functions read their config from process.env, which is populated
 * by the serverless.yml environment section at deploy time.
 */

export interface Config {
  SUBSCRIPTIONS_TABLE: string;
  MAIL_CONFIGS_TABLE: string;
  LOGIN_ERRORS_TABLE: string;
  EVENT_BUS_NAME: string;
  ENCRYPTION_KEY: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_EMAIL: string;
  ADMIN_EMAIL: string;
  MAX_ERRORS: number;
  ERROR_WINDOW_MS: number;
  JWT_SECRET: string;
  SES_FROM_EMAIL: string;
}

export const config: Config = {
  SUBSCRIPTIONS_TABLE: process.env.SUBSCRIPTIONS_TABLE ?? 'Subscriptions',
  MAIL_CONFIGS_TABLE: process.env.MAIL_CONFIGS_TABLE ?? 'MailConfigs',
  LOGIN_ERRORS_TABLE: process.env.LOGIN_ERRORS_TABLE ?? 'LoginErrors',
  EVENT_BUS_NAME: process.env.EVENT_BUS_NAME ?? 'mail-service-bus',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ?? '',
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY ?? '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ?? '',
  VAPID_EMAIL: process.env.VAPID_EMAIL ?? '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? '',
  MAX_ERRORS: process.env.MAX_ERRORS ? Number(process.env.MAX_ERRORS) : 10,
  ERROR_WINDOW_MS: process.env.ERROR_WINDOW_MS ? Number(process.env.ERROR_WINDOW_MS) : 60000,
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  SES_FROM_EMAIL: process.env.SES_FROM_EMAIL ?? '',
};

/**
 * Event types used in EventBridge detail-type field.
 * These map directly to the event patterns defined in serverless.yml rules.
 */
export enum EventType {
  USER_LOGIN = 'user.login',
  USER_SIGNUP = 'user.signup',
  SUBMIT_FEEDBACK = 'submit.feedback',
  MAIL_SEND = 'mail.send',
  USER_LOGIN_ERROR = 'user.login.error',
  MAIL_SENT = 'mail.sent',
  MAIL_SEND_ERROR = 'mail.send.error',
}
