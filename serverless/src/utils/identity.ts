/**
 * Client identity extraction utilities.
 * Extracts client IP and device information from API Gateway HTTP API v2 events.
 */

/**
 * Minimal interface for API Gateway HTTP API v2 event structure.
 * Only includes fields required for identity extraction.
 */
export interface APIGatewayProxyEventV2 {
  headers?: Record<string, string | undefined>;
  requestContext?: {
    http?: {
      sourceIp?: string;
      userAgent?: string;
    };
  };
}

/**
 * Extracts the client IP address from an API Gateway HTTP API v2 event.
 *
 * Priority:
 * 1. X-Forwarded-For header (first IP in the comma-separated list)
 * 2. requestContext.http.sourceIp
 * 3. Falls back to 'unknown' if neither is available
 */
export function extractClientIp(event: APIGatewayProxyEventV2): string {
  // Check X-Forwarded-For header (case-insensitive lookup)
  const headers = event.headers ?? {};
  const forwardedFor =
    headers['x-forwarded-for'] ?? headers['X-Forwarded-For'];

  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // Fall back to sourceIp from request context
  const sourceIp = event.requestContext?.http?.sourceIp;
  if (sourceIp) {
    return sourceIp;
  }

  return 'unknown';
}

/**
 * Extracts device information from the User-Agent header of an API Gateway HTTP API v2 event.
 *
 * Returns the raw User-Agent string, or 'unknown' if not present.
 */
export function extractDeviceInfo(event: APIGatewayProxyEventV2): string {
  const headers = event.headers ?? {};
  const userAgent =
    headers['user-agent'] ?? headers['User-Agent'];

  return userAgent?.trim() || 'unknown';
}
