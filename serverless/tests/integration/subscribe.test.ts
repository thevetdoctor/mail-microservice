import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/subscribe';
import { dynamoDBService } from '../../src/services/dynamodb';

jest.mock('../../src/services/dynamodb', () => ({
  dynamoDBService: {
    getSubscriptionByEndpoint: jest.fn(),
    createSubscription: jest.fn(),
  },
}));

const mockedDynamoDB = dynamoDBService as jest.Mocked<typeof dynamoDBService>;

function createSubscribeEvent(body: any): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'POST /notification/subscribe',
    rawPath: '/notification/subscribe',
    rawQueryString: '',
    headers: { 'content-type': 'application/json' },
    requestContext: {
      accountId: '123456789012',
      apiId: 'api-id',
      domainName: 'api.example.com',
      domainPrefix: 'api',
      http: {
        method: 'POST',
        path: '/notification/subscribe',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest-test',
      },
      requestId: 'req-123',
      routeKey: 'POST /notification/subscribe',
      stage: '$default',
      time: '01/Jan/2024:00:00:00 +0000',
      timeEpoch: 1704067200000,
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

async function invokeHandler(event: APIGatewayProxyEventV2) {
  return (await handler(event)) as APIGatewayProxyStructuredResultV2;
}

describe('POST /notification/subscribe - Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 when a new subscription is created', async () => {
    mockedDynamoDB.getSubscriptionByEndpoint.mockResolvedValue(null);
    mockedDynamoDB.createSubscription.mockResolvedValue(undefined);

    const event = createSubscribeEvent({
      subscription: {
        endpoint: 'https://push.example.com/sub/abc123',
        keys: { p256dh: 'key-p256dh', auth: 'key-auth' },
        deviceId: 'device-001',
      },
      userAgent: 'Mozilla/5.0',
    });

    const result = await invokeHandler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Subscription created successfully');
    expect(body.data.id).toBeDefined();
    expect(mockedDynamoDB.getSubscriptionByEndpoint).toHaveBeenCalledWith(
      'https://push.example.com/sub/abc123',
    );
    expect(mockedDynamoDB.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://push.example.com/sub/abc123',
        keys: JSON.stringify({ p256dh: 'key-p256dh', auth: 'key-auth' }),
        deviceId: 'device-001',
        userAgent: 'Mozilla/5.0',
      }),
    );
  });

  it('should return 200 when subscription already exists', async () => {
    mockedDynamoDB.getSubscriptionByEndpoint.mockResolvedValue({
      id: 'existing-id',
      endpoint: 'https://push.example.com/sub/abc123',
      keys: '{"p256dh":"key","auth":"key"}',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });

    const event = createSubscribeEvent({
      subscription: {
        endpoint: 'https://push.example.com/sub/abc123',
        keys: { p256dh: 'key', auth: 'key' },
      },
    });

    const result = await invokeHandler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Subscription already exists');
    expect(mockedDynamoDB.createSubscription).not.toHaveBeenCalled();
  });

  it('should return 400 when subscription object is missing', async () => {
    const event = createSubscribeEvent({});

    const result = await invokeHandler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Missing subscription object');
  });

  it('should return 400 when endpoint is missing', async () => {
    const event = createSubscribeEvent({
      subscription: {
        keys: { p256dh: 'key', auth: 'key' },
      },
    });

    const result = await invokeHandler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('endpoint');
  });

  it('should return 400 when keys are missing', async () => {
    const event = createSubscribeEvent({
      subscription: {
        endpoint: 'https://push.example.com/sub/abc123',
      },
    });

    const result = await invokeHandler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('keys');
  });

  it('should return 500 when DynamoDB throws an error', async () => {
    mockedDynamoDB.getSubscriptionByEndpoint.mockRejectedValue(
      new Error('DynamoDB connection failed'),
    );

    const event = createSubscribeEvent({
      subscription: {
        endpoint: 'https://push.example.com/sub/abc123',
        keys: { p256dh: 'key', auth: 'key' },
      },
    });

    const result = await invokeHandler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error');
    expect(body.correlationId).toBeDefined();
  });
});
