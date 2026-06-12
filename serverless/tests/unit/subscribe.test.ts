import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/subscribe';

// Mock DynamoDB service
jest.mock('../../src/services/dynamodb', () => ({
  dynamoDBService: {
    getSubscriptionByEndpoint: jest.fn(),
    createSubscription: jest.fn(),
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

import { dynamoDBService } from '../../src/services/dynamodb';

const mockedDynamoDB = dynamoDBService as jest.Mocked<typeof dynamoDBService>;

function createEvent(body: any): APIGatewayProxyEventV2 {
  return {
    body: body ? JSON.stringify(body) : undefined,
    headers: {},
    rawPath: '/notification/subscribe',
    rawQueryString: '',
    requestContext: {
      accountId: '123456',
      apiId: 'api-id',
      domainName: 'test.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method: 'POST',
        path: '/notification/subscribe',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest-test',
      },
      requestId: 'req-id',
      routeKey: 'POST /notification/subscribe',
      stage: '$default',
      time: '01/Jan/2024:00:00:00 +0000',
      timeEpoch: 1704067200000,
    },
    routeKey: 'POST /notification/subscribe',
    version: '2.0',
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

describe('Subscribe Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 for a new subscription with valid endpoint and keys', async () => {
    mockedDynamoDB.getSubscriptionByEndpoint.mockResolvedValue(null);
    mockedDynamoDB.createSubscription.mockResolvedValue(undefined);

    const event = createEvent({
      subscription: {
        endpoint: 'https://push.example.com/sub1',
        keys: { p256dh: 'key1', auth: 'auth1' },
      },
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Subscription created successfully');
    expect(body.data.id).toBe('test-uuid-1234');
    expect(mockedDynamoDB.createSubscription).toHaveBeenCalledTimes(1);
  });

  it('should return 200 when subscription with endpoint already exists', async () => {
    mockedDynamoDB.getSubscriptionByEndpoint.mockResolvedValue({
      id: 'existing-id',
      endpoint: 'https://push.example.com/sub1',
      keys: '{"p256dh":"key1","auth":"auth1"}',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });

    const event = createEvent({
      subscription: {
        endpoint: 'https://push.example.com/sub1',
        keys: { p256dh: 'key1', auth: 'auth1' },
      },
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Subscription already exists');
    expect(mockedDynamoDB.createSubscription).not.toHaveBeenCalled();
  });

  it('should return 400 when subscription object is missing from body', async () => {
    const event = createEvent({ foo: 'bar' });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Missing subscription object');
  });

  it('should return 400 when endpoint field is missing', async () => {
    const event = createEvent({
      subscription: {
        keys: { p256dh: 'key1', auth: 'auth1' },
      },
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('endpoint');
  });

  it('should return 400 when keys field is missing', async () => {
    const event = createEvent({
      subscription: {
        endpoint: 'https://push.example.com/sub1',
      },
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('keys');
  });

  it('should return 500 when DynamoDB throws an error', async () => {
    mockedDynamoDB.getSubscriptionByEndpoint.mockRejectedValue(
      new Error('DynamoDB connection failed'),
    );

    const event = createEvent({
      subscription: {
        endpoint: 'https://push.example.com/sub1',
        keys: { p256dh: 'key1', auth: 'auth1' },
      },
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error');
  });
});
