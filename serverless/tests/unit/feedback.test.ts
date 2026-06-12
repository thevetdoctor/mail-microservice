import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/feedback';

// Mock EventBridge service
jest.mock('../../src/services/eventbridge', () => ({
  publishEvent: jest.fn(),
}));

import { publishEvent } from '../../src/services/eventbridge';

const mockedPublishEvent = publishEvent as jest.MockedFunction<typeof publishEvent>;

function createEvent(body: any): APIGatewayProxyEventV2 {
  return {
    body: body ? JSON.stringify(body) : undefined,
    headers: {},
    rawPath: '/feedback',
    rawQueryString: '',
    requestContext: {
      accountId: '123456',
      apiId: 'api-id',
      domainName: 'test.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method: 'POST',
        path: '/feedback',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest-test',
      },
      requestId: 'req-id',
      routeKey: 'POST /feedback',
      stage: '$default',
      time: '01/Jan/2024:00:00:00 +0000',
      timeEpoch: 1704067200000,
    },
    routeKey: 'POST /feedback',
    version: '2.0',
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

describe('Feedback Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 with valid name, email, and message', async () => {
    mockedPublishEvent.mockResolvedValue(undefined);

    const event = createEvent({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Great service!',
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

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
      }),
    );
  });

  it('should return 400 when name is missing', async () => {
    const event = createEvent({
      email: 'john@example.com',
      message: 'Great service!',
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('name');
  });

  it('should return 400 when email is missing', async () => {
    const event = createEvent({
      name: 'John Doe',
      message: 'Great service!',
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('email');
  });

  it('should return 400 when message is missing', async () => {
    const event = createEvent({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('message');
  });

  it('should return 400 for invalid email format', async () => {
    const event = createEvent({
      name: 'John Doe',
      email: 'not-an-email',
      message: 'Great service!',
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid email format');
  });

  it('should return 500 when EventBridge publish fails', async () => {
    mockedPublishEvent.mockRejectedValue(new Error('EventBridge unavailable'));

    const event = createEvent({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Great service!',
    });

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error');
  });
});
