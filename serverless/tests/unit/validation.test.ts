import { checkForRequiredFields, validateEmail } from '../../src/utils/validation';

describe('checkForRequiredFields', () => {
  it('should return valid when all required fields are present and non-empty', () => {
    const payload = { name: 'John', email: 'john@example.com', message: 'Hello' };
    const result = checkForRequiredFields(payload, ['name', 'email', 'message']);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('should return invalid with missing fields when fields are absent', () => {
    const payload = { name: 'John' };
    const result = checkForRequiredFields(payload, ['name', 'email', 'message']);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['email', 'message']);
  });

  it('should treat null values as missing', () => {
    const payload = { name: null, email: 'test@test.com' };
    const result = checkForRequiredFields(payload, ['name', 'email']);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['name']);
  });

  it('should treat undefined values as missing', () => {
    const payload = { name: undefined, email: 'test@test.com' };
    const result = checkForRequiredFields(payload, ['name', 'email']);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['name']);
  });

  it('should treat empty string values as missing', () => {
    const payload = { name: '', email: 'test@test.com' };
    const result = checkForRequiredFields(payload, ['name', 'email']);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['name']);
  });

  it('should return valid for an empty required fields array', () => {
    const payload = { name: 'John' };
    const result = checkForRequiredFields(payload, []);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('should accept non-string truthy values (numbers, objects, arrays)', () => {
    const payload = { count: 0, items: [], config: {} };
    // 0, [], {} are truthy in the sense they are not null/undefined/empty-string
    const result = checkForRequiredFields(payload, ['count', 'items', 'config']);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });
});

describe('validateEmail', () => {
  it('should accept a standard email format', () => {
    expect(validateEmail('user@domain.com')).toBe(true);
  });

  it('should accept email with subdomain', () => {
    expect(validateEmail('user@mail.domain.co.uk')).toBe(true);
  });

  it('should accept email with plus sign', () => {
    expect(validateEmail('user+tag@domain.com')).toBe(true);
  });

  it('should accept email with dots in local part', () => {
    expect(validateEmail('first.last@domain.com')).toBe(true);
  });

  it('should reject email without @ symbol', () => {
    expect(validateEmail('userdomain.com')).toBe(false);
  });

  it('should reject email without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('should reject email without TLD', () => {
    expect(validateEmail('user@domain')).toBe(false);
  });

  it('should reject email with spaces', () => {
    expect(validateEmail('user @domain.com')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('should reject email without local part', () => {
    expect(validateEmail('@domain.com')).toBe(false);
  });
});
