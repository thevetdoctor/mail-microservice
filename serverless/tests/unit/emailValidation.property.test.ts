import * as fc from 'fast-check';
import { validateEmail } from '../../src/utils/validation';

/**
 * Property-based tests for email format validation.
 *
 * **Validates: Requirements 2.5**
 *
 * The validateEmail function uses the regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 * which requires:
 * - A local part with no spaces or @ characters
 * - Exactly one @ separator
 * - A domain part containing at least one dot, with no spaces or @ characters
 */
describe('Property 7: Email format validation', () => {
  /**
   * Arbitrary that generates valid email-like strings that conform to the regex:
   * localpart@domain.tld where:
   * - localpart: 1+ chars, no spaces or @
   * - domain: 1+ chars, no spaces or @
   * - tld: 1+ chars, no spaces or @
   */
  const validEmailArb = fc
    .tuple(
      // local part: at least 1 char, no whitespace or @
      fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.length > 0 && !/[\s@]/.test(s)),
      // domain part (before dot): at least 1 char, no whitespace or @
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.length > 0 && !/[\s@.]/.test(s)),
      // tld part (after dot): at least 1 char, no whitespace or @
      fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.length > 0 && !/[\s@.]/.test(s))
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

  it('should accept all strings matching the valid email pattern (local@domain.tld)', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        expect(validateEmail(email)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject strings that have no @ character', () => {
    // Generate strings without @ character
    const noAtArb = fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => !s.includes('@'));

    fc.assert(
      fc.property(noAtArb, (input) => {
        expect(validateEmail(input)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject strings that contain whitespace', () => {
    // Generate strings with at least one whitespace character that also contain @
    const withSpaceArb = fc
      .tuple(
        fc.string({ minLength: 0, maxLength: 10 }),
        fc.constantFrom(' ', '\t', '\n', '\r'),
        fc.string({ minLength: 0, maxLength: 10 })
      )
      .map(([before, space, after]) => `${before}${space}${after}@domain.com`);

    fc.assert(
      fc.property(withSpaceArb, (input) => {
        expect(validateEmail(input)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject empty strings', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('should reject strings where the domain part has no dot', () => {
    // Generate local@domainwithnodot (domain has no dot)
    const noDotDomainArb = fc
      .tuple(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !/[\s@]/.test(s) && s.length > 0),
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !/[\s@.]/.test(s) && s.length > 0)
      )
      .map(([local, domain]) => `${local}@${domain}`);

    fc.assert(
      fc.property(noDotDomainArb, (input) => {
        expect(validateEmail(input)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject strings with multiple @ characters', () => {
    // Generate strings with at least two @ characters
    const multipleAtArb = fc
      .tuple(
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => !/[\s@]/.test(s) && s.length > 0),
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => !/[\s@]/.test(s) && s.length > 0),
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => !/[\s@]/.test(s) && s.length > 0)
      )
      .map(([a, b, c]) => `${a}@${b}@${c}.com`);

    fc.assert(
      fc.property(multipleAtArb, (input) => {
        // The regex ^[^\s@]+@[^\s@]+\.[^\s@]+$ won't match because
        // after the first @, the rest contains another @ which fails [^\s@]+
        expect(validateEmail(input)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
