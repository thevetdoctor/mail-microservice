import { extractClientIp, extractDeviceInfo, APIGatewayProxyEventV2 } from '../../src/utils/identity';

describe('extractClientIp', () => {
  it('should extract IP from X-Forwarded-For header (lowercase)', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178' },
      requestContext: { http: { sourceIp: '10.0.0.1' } },
    };
    expect(extractClientIp(event)).toBe('203.0.113.50');
  });

  it('should extract IP from X-Forwarded-For header (mixed case)', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: { 'X-Forwarded-For': '192.168.1.1' },
      requestContext: { http: { sourceIp: '10.0.0.1' } },
    };
    expect(extractClientIp(event)).toBe('192.168.1.1');
  });

  it('should fall back to sourceIp when X-Forwarded-For is absent', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: {},
      requestContext: { http: { sourceIp: '172.16.0.5' } },
    };
    expect(extractClientIp(event)).toBe('172.16.0.5');
  });

  it('should return "unknown" when no IP source is available', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: {},
      requestContext: { http: {} },
    };
    expect(extractClientIp(event)).toBe('unknown');
  });

  it('should return "unknown" when event has no headers or requestContext', () => {
    const event: APIGatewayProxyEventV2 = {};
    expect(extractClientIp(event)).toBe('unknown');
  });

  it('should trim whitespace from first IP in X-Forwarded-For', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: { 'x-forwarded-for': '  10.1.2.3 , 10.4.5.6' },
    };
    expect(extractClientIp(event)).toBe('10.1.2.3');
  });

  it('should skip empty X-Forwarded-For and fall back to sourceIp', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: { 'x-forwarded-for': '' },
      requestContext: { http: { sourceIp: '99.99.99.99' } },
    };
    expect(extractClientIp(event)).toBe('99.99.99.99');
  });
});

describe('extractDeviceInfo', () => {
  it('should extract User-Agent from lowercase header', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    };
    expect(extractDeviceInfo(event)).toBe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
  });

  it('should extract User-Agent from mixed-case header', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: { 'User-Agent': 'curl/7.64.1' },
    };
    expect(extractDeviceInfo(event)).toBe('curl/7.64.1');
  });

  it('should return "unknown" when User-Agent is not present', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: {},
    };
    expect(extractDeviceInfo(event)).toBe('unknown');
  });

  it('should return "unknown" when headers are undefined', () => {
    const event: APIGatewayProxyEventV2 = {};
    expect(extractDeviceInfo(event)).toBe('unknown');
  });

  it('should return "unknown" for empty User-Agent string', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: { 'user-agent': '   ' },
    };
    expect(extractDeviceInfo(event)).toBe('unknown');
  });

  it('should trim whitespace from User-Agent', () => {
    const event: APIGatewayProxyEventV2 = {
      headers: { 'user-agent': '  Chrome/91.0  ' },
    };
    expect(extractDeviceInfo(event)).toBe('Chrome/91.0');
  });
});
