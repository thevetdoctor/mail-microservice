/**
 * DynamoDB item type definitions for the mail microservice.
 */

/** Subscription record as stored in the Subscriptions DynamoDB table. */
export interface Subscription {
  id: string;
  endpoint: string;
  keys: string; // JSON-stringified push keys { p256dh, auth }
  deviceId?: string;
  userAgent?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Input item for creating a new subscription (before UUID and timestamps are assigned). */
export interface SubscriptionItem {
  id: string;
  endpoint: string;
  keys: string;
  deviceId?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

/** Mail configuration record as stored in the MailConfigs DynamoDB table. */
export interface MailConfig {
  id: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string; // AES-encrypted SMTP password
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Input item for creating a new mail configuration. */
export interface MailConfigItem {
  id: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string; // AES-encrypted SMTP password
  createdAt: string;
  updatedAt: string;
}

/** Login error record as stored in the LoginErrors DynamoDB table. */
export interface LoginErrorItem {
  id: string;
  timestamp: number; // Unix epoch milliseconds (sort key)
  email: string;
  clientIp: string;
  ttl: number; // DynamoDB TTL for auto-expiry
}
