/**
 * Input validation utilities for Lambda handlers.
 */

/**
 * Checks that all required fields exist and are not empty/null/undefined in the payload.
 *
 * @param payload - The request payload to validate
 * @param requiredFields - Array of field names that must be present and non-empty
 * @returns An object with `valid` boolean and `missing` array of missing field names
 */
export function checkForRequiredFields(
  payload: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    const value = payload[field];

    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validates an email address against a standard user@domain.tld pattern.
 *
 * @param email - The email string to validate
 * @returns true if the email matches a valid format, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
