import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/constants';
import { Logger } from '../utils/logger';
import { dynamoDBService, DynamoDBService } from './dynamodb';
import { LoginErrorItem } from '../types/models';

export interface ErrorEvent {
  email: string;
  clientIp: string;
}

export interface TrackLoginErrorResult {
  alertTriggered: boolean;
}

export class ErrorTracker {
  private dynamodb: DynamoDBService;
  private logger: Logger;

  constructor(dynamodb?: DynamoDBService, logger?: Logger) {
    this.dynamodb = dynamodb ?? dynamoDBService;
    this.logger = logger ?? new Logger();
  }

  /**
   * Track a login error event. Stores the error in DynamoDB, then checks
   * whether the error count within the configured time window has reached
   * or exceeded the MAX_ERRORS threshold.
   *
   * If the threshold is met, returns { alertTriggered: true } and clears
   * the error records. The caller is responsible for sending the alert email.
   */
  async trackLoginError(errorEvent: ErrorEvent): Promise<TrackLoginErrorResult> {
    const now = Date.now();
    const ttlSeconds = Math.floor((now + config.ERROR_WINDOW_MS) / 1000);

    const errorRecord: LoginErrorItem = {
      id: uuidv4(),
      timestamp: now,
      email: errorEvent.email,
      clientIp: errorEvent.clientIp,
      ttl: ttlSeconds,
    };

    // Store the error record
    await this.dynamodb.putLoginError(errorRecord);

    this.logger.info('Login error recorded', {
      email: errorEvent.email,
      clientIp: errorEvent.clientIp,
      timestamp: now,
    });

    // Query errors within the configured time window
    const windowStart = now - config.ERROR_WINDOW_MS;
    const recentErrors = await this.dynamodb.getLoginErrors(windowStart);

    if (recentErrors.length >= config.MAX_ERRORS) {
      this.logger.warn('Login error threshold reached, triggering alert', {
        errorCount: recentErrors.length,
        maxErrors: config.MAX_ERRORS,
        windowMs: config.ERROR_WINDOW_MS,
      });

      // Reset error records after alert is triggered
      await this.dynamodb.clearLoginErrors();

      return { alertTriggered: true };
    }

    this.logger.info('Login error count below threshold', {
      errorCount: recentErrors.length,
      maxErrors: config.MAX_ERRORS,
    });

    return { alertTriggered: false };
  }
}

/** Singleton instance for use across Lambda handlers */
export const errorTracker = new ErrorTracker();
