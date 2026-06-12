import { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerWithContextResult } from 'aws-lambda';
import * as crypto from 'crypto';

interface JwtPayload {
  sub?: string;
  email?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Custom Lambda authorizer for HTTP API (payload format 2.0).
 * Verifies JWT tokens using HMAC-SHA256 with the configured JWT_SECRET.
 * Returns an IAM-like simple response with isAuthorized and context.
 */
export async function handler(
  event: APIGatewayRequestAuthorizerEventV2,
): Promise<APIGatewaySimpleAuthorizerWithContextResult<Record<string, string>>> {
  const token = extractToken(event);

  if (!token) {
    return deny();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured');
    return deny();
  }

  const payload = verifyToken(token, secret);
  if (!payload) {
    return deny();
  }

  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return deny();
  }

  return {
    isAuthorized: true,
    context: {
      sub: payload.sub ?? '',
      email: (payload.email as string) ?? '',
    },
  };
}

function extractToken(event: APIGatewayRequestAuthorizerEventV2): string | null {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return authHeader;
}

function verifyToken(token: string, secret: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature (HMAC-SHA256)
    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = base64UrlEncode(
      crypto.createHmac('sha256', secret).update(signatureInput).digest(),
    );

    if (!timingSafeEqual(expectedSignature, signatureB64)) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64url');
}

function base64UrlDecode(str: string): string {
  // Add padding if needed
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded, 'base64url').toString('utf8');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to avoid timing leaks on length
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function deny(): APIGatewaySimpleAuthorizerWithContextResult<Record<string, string>> {
  return {
    isAuthorized: false,
    context: {
      sub: '',
      email: '',
    },
  };
}
