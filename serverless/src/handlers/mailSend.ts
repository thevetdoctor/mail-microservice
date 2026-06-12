import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Logger } from '../utils/logger';
import { checkForRequiredFields } from '../utils/validation';
import { publishEvent } from '../services/eventbridge';
import { extractClientIp, extractDeviceInfo } from '../utils/identity';
import { EventType } from '../utils/constants';
import { MailSendRequest } from '../types/api';

/**
 * Lambda handler for POST /mail/send.
 * Validates the mail send payload, extracts caller identity from JWT claims,
 * and publishes a mail.send event to EventBridge.
 * JWT authentication is handled by API Gateway before this handler is invoked.
 */
export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const logger = new Logger();
  const correlationId = logger.getCorrelationId();

  try {
    logger.info('Mail send request received', {
      path: event.rawPath,
      method: event.requestContext?.http?.method,
    });

    const body: MailSendRequest = event.body ? JSON.parse(event.body) : {};

    // Validate required fields: from, to, and either message or template
    const { valid, missing } = checkForRequiredFields(body as Record<string, any>, [
      'from',
      'to',
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

    // Validate that either message or template is provided
    if (!body.message && !body.template) {
      logger.warn('Validation failed: message or template required');
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Either message or template must be provided',
          correlationId,
        }),
      };
    }

    // Extract caller identity from JWT claims or Lambda authorizer context
    const authorizer = (event.requestContext as any)?.authorizer;
    const claims = authorizer?.jwt?.claims ?? authorizer?.lambda ?? {};
    const callerIdentity = claims.sub ?? claims.email ?? 'unknown';

    // Extract client IP and device info
    const clientIp = extractClientIp(event);
    const deviceInfo = extractDeviceInfo(event);

    // Publish mail.send event to EventBridge
    try {
      await publishEvent(EventType.MAIL_SEND, {
        from: body.from,
        to: body.to,
        message: body.message,
        template: body.template,
        apiUser: callerIdentity,
        clientIp,
        deviceInfo,
        correlationId,
        timestamp: new Date().toISOString(),
      });
    } catch (publishError) {
      logger.error(
        'Failed to publish mail.send event',
        publishError,
        JSON.stringify({ from: body.from, to: body.to }),
      );

      // Attempt to publish error event
      try {
        await publishEvent(EventType.MAIL_SEND_ERROR, {
          from: body.from,
          to: body.to,
          error: publishError instanceof Error ? publishError.message : String(publishError),
          correlationId,
          timestamp: new Date().toISOString(),
        });
      } catch (errorEventError) {
        logger.error(
          'Failed to publish mail-send-error event',
          errorEventError,
          JSON.stringify({ from: body.from, to: body.to }),
        );
      }

      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Failed to process mail send request',
          correlationId,
        }),
      };
    }

    logger.info('Mail send event published successfully', {
      from: body.from,
      to: body.to,
      callerIdentity,
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: 'Mail send request accepted',
      }),
    };
  } catch (error) {
    logger.error(
      'Failed to process mail send request',
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
