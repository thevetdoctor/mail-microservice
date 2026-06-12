/**
 * Request and response type definitions for API Gateway Lambda handlers.
 */

/** POST /notification/subscribe request body. */
export interface SubscribeRequest {
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    deviceId?: string;
  };
  userAgent?: string;
}

/** POST /feedback request body. */
export interface FeedbackRequest {
  name: string;
  email: string;
  message: string;
}

/** POST /mail/send request body. */
export interface MailSendRequest {
  from: string;
  to: string;
  message?: string;
  template?: string;
  apiUser?: string; // extracted from JWT claims
}

/** Successful API response structure. */
export interface ApiResponse {
  statusCode: number;
  body: {
    success: true;
    message: string;
    data?: Record<string, any>;
  };
}

/** Error API response structure. */
export interface ErrorResponse {
  statusCode: number;
  body: {
    success: false;
    error: string;
    correlationId: string;
  };
}
