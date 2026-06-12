import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/mailSend';

// Mock EventBridge service
jest.mock('../../src/services/eventbridge', () => ({
  publishEvent: jest.fn(),
}));

import { publishEvent } from '../../src/services/eventbridge';

const mockedPublishEvent = publishEvent as jest.MockedFunction<typeof publishEvent>;

function createEvent(body: any, claims?: Record<string, string>): APIGatewayProxyEventV2 {
  return {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'test-agent/1.0',
    },
    rawPath: '/mail/send',
    rawQueryString: '',
    requestContext: {
      accountId: '123456',
      apiId: 'api-id',
      domainName: 'test.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method: 'POST',
        path: '/mail/send',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent/1.0',
      },
      requestId: 'req-id',
      routeKey: 'POST /mail/send',
      stage: '$default',
      time: '01/Jan/2024:00:00:00 +0000',
      timeEpoch: 1704067200000,
      authorizer: claims
        ? { jwt: { claims, scopes: [] } }
        : undefined,
    } as any,
    routeKey: 'POST /mail/send',
    version: '2.0',
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

describe('MailSend Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 with valid from, to, and message', async () => {
    mockedPublishEvent.mockResolvedValue(undefined);

    const event = createEvent(
      { from: 'sender@example.com', to: 'recipient@example.com', message: 'Hello!' },
      { sub: 'user-123', email: 'sender@example.com' },
    );

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Mail send request accepted');
    expect(mockedPublishEvent).toHaveBeenCalledWith(
      'mail.send',
      expect.objectContaining({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        message: 'Hello!',
        apiUser: 'user-123',
      }),
    );
  });

  it('should return 400 when from field is missing', async () => {
    const event = createEvent({ to: 'recipient@example.com', message: 'Hello!' });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('from');
  });

  it('should return 400 when to field is missing', async () => {
    const event = createEvent({ from: 'sender@example.com', message: 'Hello!' });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('to');
  });

  it('should return 400 when neither message nor template is provided', async () => {
    const event = createEvent({ from: 'sender@example.com', to: 'recipient@example.com' });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('message or template');
  });

  it('should return 400 when EventBridge publish fails and publishes error event', async () => {
    // First call (mail.send) rejects, second call (mail.send.error) resolves
    mockedPublishEvent
      .mockRejectedValueOnce(new Error('EventBridge unavailable'))
      .mockResolvedValueOnce(undefined);

    const event = createEvent({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      message: 'Hello!',
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to process mail send request');

    // Verify error event was published
    expect(mockedPublishEvent).toHaveBeenCalledTimes(2);
    expect(mockedPublishEvent).toHaveBeenLastCalledWith(
      'mail.send.error',
      expect.objectContaining({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        error: 'EventBridge unavailable',
      }),
    );
  });

  it('should extract caller identity from JWT claims (sub)', async () => {
    mockedPublishEvent.mockResolvedValue(undefined);

    const event = createEvent(
      { from: 'sender@example.com', to: 'recipient@example.com', message: 'Hi' },
      { sub: 'user-456' },
    );

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(201);
    expect(mockedPublishEvent).toHaveBeenCalledWith(
      'mail.send',
      expect.objectContaining({ apiUser: 'user-456' }),
    );
  });

  it('should extract caller identity from JWT claims (email fallback)', async () => {
    mockedPublishEvent.mockResolvedValue(undefined);

    const event = createEvent(
      { from: 'sender@example.com', to: 'recipient@example.com', message: 'Hi' },
      { email: 'caller@example.com' },
    );

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(201);
    expect(mockedPublishEvent).toHaveBeenCalledWith(
      'mail.send',
      expect.objectContaining({ apiUser: 'caller@example.com' }),
    );
  });
});
