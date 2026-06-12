import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/mailSend';
import { publishEvent } from '../../src/services/eventbridge';

jest.mock('../../src/services/eventbridge', () => ({
  publishEvent: jest.fn(),
}));

const mockedPublishEvent = publishEvent as jest.MockedFunction<typeof publishEvent>;

function createMailSendEvent(
  body: any,
  options?: {
    jwtClaims?: Record<string, string>;
    sourceIp?: string;
    userAgent?: string;
  },
): APIGatewayProxyEventV2 {
  const requestContext: any = {
    accountId: '123456789012',
    apiId: 'api-id',
    domainName: 'api.example.com',
    domainPrefix: 'api',
    http: {
      method: 'POST',
      path: '/mail/send',
      protocol: 'HTTP/1.1',
      sourceIp: options?.sourceIp ?? '10.0.0.1',
      userAgent: options?.userAgent ?? 'jest-integration-test',
    },
    requestId: 'req-789',
    routeKey: 'POST /mail/send',
    stage: '$default',
    time: '01/Jan/2024:00:00:00 +0000',
    timeEpoch: 1704067200000,
  };

  if (options?.jwtClaims) {
    requestContext.authorizer = {
      jwt: {
        claims: options.jwtClaims,
        scopes: [],
      },
    };
  }

  return {
    version: '2.0',
    routeKey: 'POST /mail/send',
    rawPath: '/mail/send',
    rawQueryString: '',
    headers: {
      'content-type': 'application/json',
      'user-agent': options?.userAgent ?? 'jest-integration-test',
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

describe('POST /mail/send - Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with valid JWT claims', () => {
    const defaultJwtClaims = {
      sub: 'user-456',
      email: 'sender@example.com',
      iss: 'https://mail-microservice.auth',
    };

    it('should return 201 and publish mail.send event with message', async () => {
      mockedPublishEvent.mockResolvedValue(undefined);

      const event = createMailSendEvent(
        {
          from: 'sender@example.com',
          to: 'recipient@example.com',
          message: 'Hello, this is a test email',
        },
        { jwtClaims: defaultJwtClaims, sourceIp: '203.0.113.50' },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Mail send request accepted');

      // Verify the published event structure
      expect(mockedPublishEvent).toHaveBeenCalledWith(
        'mail.send',
        expect.objectContaining({
          from: 'sender@example.com',
          to: 'recipient@example.com',
          message: 'Hello, this is a test email',
          apiUser: 'user-456',
          clientIp: '203.0.113.50',
          deviceInfo: expect.any(String),
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });

    it('should return 201 and publish mail.send event with template', async () => {
      mockedPublishEvent.mockResolvedValue(undefined);

      const event = createMailSendEvent(
        {
          from: 'admin@example.com',
          to: 'user@example.com',
          template: 'welcome',
        },
        { jwtClaims: defaultJwtClaims },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(201);
      expect(mockedPublishEvent).toHaveBeenCalledWith(
        'mail.send',
        expect.objectContaining({
          from: 'admin@example.com',
          to: 'user@example.com',
          template: 'welcome',
          apiUser: 'user-456',
        }),
      );
    });

    it('should extract caller identity from JWT sub claim', async () => {
      mockedPublishEvent.mockResolvedValue(undefined);

      const event = createMailSendEvent(
        { from: 'a@b.com', to: 'c@d.com', message: 'test' },
        { jwtClaims: { sub: 'jwt-subject-id', email: 'fallback@example.com' } },
      );

      await invokeHandler(event);

      expect(mockedPublishEvent).toHaveBeenCalledWith(
        'mail.send',
        expect.objectContaining({ apiUser: 'jwt-subject-id' }),
      );
    });

    it('should fallback to email claim when sub is missing', async () => {
      mockedPublishEvent.mockResolvedValue(undefined);

      const event = createMailSendEvent(
        { from: 'a@b.com', to: 'c@d.com', message: 'test' },
        { jwtClaims: { email: 'user-email@example.com' } },
      );

      await invokeHandler(event);

      expect(mockedPublishEvent).toHaveBeenCalledWith(
        'mail.send',
        expect.objectContaining({ apiUser: 'user-email@example.com' }),
      );
    });

    it('should return 400 when from field is missing', async () => {
      const event = createMailSendEvent(
        { to: 'recipient@example.com', message: 'Hello' },
        { jwtClaims: defaultJwtClaims },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toContain('from');
      expect(mockedPublishEvent).not.toHaveBeenCalled();
    });

    it('should return 400 when to field is missing', async () => {
      const event = createMailSendEvent(
        { from: 'sender@example.com', message: 'Hello' },
        { jwtClaims: defaultJwtClaims },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toContain('to');
      expect(mockedPublishEvent).not.toHaveBeenCalled();
    });

    it('should return 400 when neither message nor template is provided', async () => {
      const event = createMailSendEvent(
        { from: 'sender@example.com', to: 'recipient@example.com' },
        { jwtClaims: defaultJwtClaims },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toContain('message or template');
      expect(mockedPublishEvent).not.toHaveBeenCalled();
    });

    it('should return 400 and publish error event when EventBridge publish fails', async () => {
      // First call (mail.send) fails, second call (mail.send.error) succeeds
      mockedPublishEvent
        .mockRejectedValueOnce(new Error('EventBridge timeout'))
        .mockResolvedValueOnce(undefined);

      const event = createMailSendEvent(
        { from: 'sender@example.com', to: 'recipient@example.com', message: 'Hello' },
        { jwtClaims: defaultJwtClaims },
      );

      const result = await invokeHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to process mail send request');

      // Verify error event was published
      expect(mockedPublishEvent).toHaveBeenCalledTimes(2);
      expect(mockedPublishEvent).toHaveBeenNthCalledWith(
        2,
        'mail.send.error',
        expect.objectContaining({
          from: 'sender@example.com',
          to: 'recipient@example.com',
          error: 'EventBridge timeout',
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('without JWT claims (handler behavior)', () => {
    // Note: In production, API Gateway would return 401 before invoking this Lambda.
    // These tests verify that the handler defaults to 'unknown' when no JWT context is present.
    it('should default apiUser to unknown when no authorizer context', async () => {
      mockedPublishEvent.mockResolvedValue(undefined);

      const event = createMailSendEvent({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        message: 'test',
      });

      await invokeHandler(event);

      expect(mockedPublishEvent).toHaveBeenCalledWith(
        'mail.send',
        expect.objectContaining({ apiUser: 'unknown' }),
      );
    });
  });

  describe('client identity extraction', () => {
    it('should extract client IP from X-Forwarded-For header', async () => {
      mockedPublishEvent.mockResolvedValue(undefined);

      const event = createMailSendEvent(
        { from: 'a@b.com', to: 'c@d.com', message: 'test' },
        { jwtClaims: { sub: 'user-1' }, sourceIp: '10.0.0.1' },
      );
      // Add X-Forwarded-For header
      event.headers!['x-forwarded-for'] = '203.0.113.195, 70.41.3.18';

      await invokeHandler(event);

      expect(mockedPublishEvent).toHaveBeenCalledWith(
        'mail.send',
        expect.objectContaining({ clientIp: '203.0.113.195' }),
      );
    });

    it('should extract device info from user-agent header', async () => {
      mockedPublishEvent.mockResolvedValue(undefined);

      const event = createMailSendEvent(
        { from: 'a@b.com', to: 'c@d.com', message: 'test' },
        {
          jwtClaims: { sub: 'user-1' },
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
      );

      await invokeHandler(event);

      expect(mockedPublishEvent).toHaveBeenCalledWith(
        'mail.send',
        expect.objectContaining({
          deviceInfo: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        }),
      );
    });
  });
});
