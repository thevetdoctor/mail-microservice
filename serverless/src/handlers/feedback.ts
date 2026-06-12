import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Logger } from '../utils/logger';
import { checkForRequiredFields, validateEmail } from '../utils/validation';
import { publishEvent } from '../services/eventbridge';
import { extractClientIp, extractDeviceInfo } from '../utils/identity';
import { EventType } from '../utils/constants';
import { FeedbackRequest } from '../types/api';

/**
 * Lambda handler for POST /feedback.
 * Validates the feedback payload and publishes a submit.feedback event to EventBridge.
 * JWT authentication is handled by API Gateway before this handler is invoked.
 */
export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const logger = new Logger();
  const correlationId = logger.getCorrelationId();

  try {
    logger.info('Feedback request received', {
      path: event.rawPath,
      method: event.requestContext?.http?.method,
    });

    const body: FeedbackRequest = event.body ? JSON.parse(event.body) : {};

    // Validate required fields
    const { valid, missing } = checkForRequiredFields(body as Record<string, any>, [
      'name',
      'email',
      'message',
    ]);

    if (!valid) {
      logger.warn('Validation failed: missing required fields', { missing });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: `Missing required fields: ${missing.join(', ')}`,
          correlationId,
        }),
      };
    }

    // Validate email format
    if (!validateEmail(body.email)) {
      logger.warn('Validation failed: invalid email format', { email: body.email });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Invalid email format',
          correlationId,
        }),
      };
    }

    // Publish feedback event to EventBridge
    const clientIp = extractClientIp(event);
    const deviceInfo = extractDeviceInfo(event);

    await publishEvent(EventType.SUBMIT_FEEDBACK, {
      name: body.name,
      email: body.email,
      message: body.message,
      clientIp,
      deviceInfo,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    logger.info('Feedback event published successfully', {
      email: body.email,
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: 'Feedback submitted successfully',
      }),
    };
  } catch (error) {
    logger.error(
      'Failed to process feedback request',
      error,
      event.body ? event.body.substring(0, 200) : '',
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        correlationId,
      }),
    };
  }
}
