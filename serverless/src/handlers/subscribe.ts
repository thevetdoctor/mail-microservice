import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { SubscribeRequest } from '../types/api';
import { SubscriptionItem } from '../types/models';
import { dynamoDBService } from '../services/dynamodb';
import { checkForRequiredFields } from '../utils/validation';
import { Logger } from '../utils/logger';

/**
 * POST /notification/subscribe
 *
 * Registers a new push notification subscription or returns existing one.
 * Validates required fields (endpoint, keys), checks for duplicates by endpoint,
 * and stores new subscriptions with generated UUID and timestamps.
 */
export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const logger = new Logger();

  try {
    logger.info('Subscribe request received', {
      path: event.rawPath,
      method: event.requestContext?.http?.method,
    });

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : null;

    if (!body || !body.subscription) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Missing subscription object in request body',
          correlationId: logger.getCorrelationId(),
        }),
      };
    }

    const subscribeRequest: SubscribeRequest = body;
    const { subscription } = subscribeRequest;

    // Validate required fields
    const validation = checkForRequiredFields(
      { endpoint: subscription.endpoint, keys: subscription.keys },
      ['endpoint', 'keys'],
    );

    if (!validation.valid) {
      logger.warn('Validation failed', { missing: validation.missing });
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Missing required fields: ${validation.missing.join(', ')}`,
          correlationId: logger.getCorrelationId(),
        }),
      };
    }

    // Check for existing subscription by endpoint
    const existing = await dynamoDBService.getSubscriptionByEndpoint(subscription.endpoint);

    if (existing) {
      logger.info('Subscription already exists', { endpoint: subscription.endpoint });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Subscription already exists',
        }),
      };
    }

    // Create new subscription
    const now = new Date().toISOString();
    const newSubscription: SubscriptionItem = {
      id: uuidv4(),
      endpoint: subscription.endpoint,
      keys: JSON.stringify(subscription.keys),
      deviceId: subscription.deviceId,
      userAgent: subscribeRequest.userAgent,
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDBService.createSubscription(newSubscription);

    logger.info('Subscription created', {
      subscriptionId: newSubscription.id,
      endpoint: subscription.endpoint,
    });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Subscription created successfully',
        data: { id: newSubscription.id },
      }),
    };
  } catch (error) {
    logger.error(
      'Subscribe handler error',
      error,
      event.body ? event.body.substring(0, 200) : 'no body',
    );

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        correlationId: logger.getCorrelationId(),
      }),
    };
  }
}
