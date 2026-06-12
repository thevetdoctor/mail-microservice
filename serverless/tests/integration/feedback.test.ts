import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/feedback';
import { publishEvent } from '../../src/services/eventbridge';

jest.mock('../../src/services/eventbridge', () => ({
  publishEvent: jest.fn(),
}));

const mockedPublishEvent = publishEvent as jest.MockedFunction<typeof publishEvent>;

function createFeedbackEvent(
  body: any,
  options?: { withJwtClaims?: boolean },
): APIGatewayProxyEventV2 {
  const requestContext: any = {
    accountId: '123456789012',
    apiId: 'api-id',
    domainName: 'api.example.com',
    domainPrefix: 'api',
    http: {
      method: 'POST',
      path: '/feedback',
      protocol: 'HTTP/1.1',
      sourceIp: '192.168.1.1',
      userAgent: 'jest-test',
    },
    requestId: 'req-456',
    routeKey: 'POST /feedback',
    stage: '$default',
    time: '01/Jan/2024:00:00:00 +0000',
    timeEpoch: 1704067200000,
  };

  // Simulate JWT authorizer context (API Gateway populates this after successful JWT validation)
  if (options?.withJwtClaims) {
    requestContext.authorizer = {
      jwt: {
        claims: {
          sub: 'user-123',
          email: 'authenticated@example.com',
          iss: 'https://mail-microservice.auth',
        },
        scopes: [],
      },
    };
  }

  return {
    version: '2.0',
    routeKey: 'POST /feedback',
    rawPath: '/feedback',
    rawQueryString: '',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer valid-jwt-token',
    },
    requestContext,
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

async function invokeHandler(event: APIGatewayProxyEventV2) {
  return (await handler(event)) as APIGatewayProxyStructuredResultV2;
}

describe('POST /feedback - Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with valid JWT (authorized request)', () => {
    it('should return 201 and publish event for valid feedback', async () => {
      mockedPublishEvent.mockResolvedValue(undefined);

      const event = createFeedbackEvent(
        {
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Great service!',
        },
        { withJwtClaims: true },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Feedback submitted successfully');

      expect(mockedPublishEvent).toHaveBeenCalledWith(
        'submit.feedback',
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Great service!',
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });

    it('should return 400 when name is missing', async () => {
      const event = createFeedbackEvent(
        {
          email: 'john@example.com',
          message: 'Great service!',
        },
        { withJwtClaims: true },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toContain('name');
      expect(mockedPublishEvent).not.toHaveBeenCalled();
    });

    it('should return 400 when email is missing', async () => {
      const event = createFeedbackEvent(
        {
          name: 'John Doe',
          message: 'Great service!',
        },
        { withJwtClaims: true },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toContain('email');
      expect(mockedPublishEvent).not.toHaveBeenCalled();
    });

    it('should return 400 when message is missing', async () => {
      const event = createFeedbackEvent(
        {
          name: 'John Doe',
          email: 'john@example.com',
        },
        { withJwtClaims: true },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toContain('message');
      expect(mockedPublishEvent).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const event = createFeedbackEvent(
        {
          name: 'John Doe',
          email: 'not-an-email',
          message: 'Great service!',
        },
        { withJwtClaims: true },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid email format');
      expect(mockedPublishEvent).not.toHaveBeenCalled();
    });

    it('should return 500 when EventBridge publish fails', async () => {
      mockedPublishEvent.mockRejectedValue(new Error('EventBridge unavailable'));

      const event = createFeedbackEvent(
        {
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Great service!',
        },
        { withJwtClaims: true },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error');
      expect(body.correlationId).toBeDefined();
    });
  });

  describe('handler behavior without JWT context', () => {
    // Note: In production, API Gateway JWT authorizer would reject the request
    // before it reaches the Lambda. These tests verify the handler itself still
    // processes the request correctly (it doesn't check JWT — that's API Gateway's job).
    it('should still process valid feedback without JWT context in event', async () => {
      mockedPublishEvent.mockResolvedValue(undefined);

      const event = createFeedbackEvent({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Excellent!',
      });

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
    });
  });
});
