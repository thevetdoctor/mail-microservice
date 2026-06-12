import * as fc from 'fast-check';
import { checkForRequiredFields } from '../../src/utils/validation';

/**
 * Property-based tests for required field validation.
 *
 * **Validates: Requirements 1.5, 2.4**
 */
describe('Property 1: Required field validation rejects incomplete payloads', () => {
  it('should report all missing fields when a random subset of required fields is removed', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty array of unique field names (the required fields)
        fc.uniqueArray(fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0 && !(s in Object.prototype)), {
          minLength: 1,
          maxLength: 10,
        }),
        // Generate non-empty values to use for present fields
        fc.array(fc.oneof(fc.string({ minLength: 1 }), fc.integer(), fc.boolean()), {
          minLength: 10,
          maxLength: 20,
        }),
        (requiredFields, values) => {
          // Build a complete payload with all required fields present
          const fullPayload: Record<string, any> = {};
          for (let i = 0; i < requiredFields.length; i++) {
            fullPayload[requiredFields[i]] = values[i % values.length];
          }

          // Remove a random non-empty subset of required fields to create an incomplete payload
          // We use at least 1 field removed to ensure the payload is incomplete
          const numToRemove = Math.max(1, Math.floor(requiredFields.length / 2));
          const fieldsToRemove = requiredFields.slice(0, numToRemove);
          const incompletePayload: Record<string, any> = { ...fullPayload };
          for (const field of fieldsToRemove) {
            delete incompletePayload[field];
          }

          const result = checkForRequiredFields(incompletePayload, requiredFields);

          // The result should be invalid
          expect(result.valid).toBe(false);
          // The missing array should contain exactly the removed fields
          expect(result.missing.sort()).toEqual(fieldsToRemove.sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should report a field as missing when its value is null, undefined, or empty string', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty field name
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0 && !(s in Object.prototype)),
        // Generate an "empty" value (null, undefined, or empty string)
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant('')
        ),
        (fieldName, emptyValue) => {
          const payload: Record<string, any> = { [fieldName]: emptyValue };
          const result = checkForRequiredFields(payload, [fieldName]);

          expect(result.valid).toBe(false);
          expect(result.missing).toEqual([fieldName]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return valid:true only when all required fields have non-empty values', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty array of unique field names
        fc.uniqueArray(fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0 && !(s in Object.prototype)), {
          minLength: 1,
          maxLength: 10,
        }),
        // Generate non-empty, non-null values (strings with at least 1 char, numbers, booleans)
        fc.array(fc.oneof(fc.string({ minLength: 1 }), fc.integer(), fc.boolean()), {
          minLength: 10,
          maxLength: 20,
        }),
        (requiredFields, values) => {
          // Build a payload with all required fields having valid values
          const payload: Record<string, any> = {};
          for (let i = 0; i < requiredFields.length; i++) {
            payload[requiredFields[i]] = values[i % values.length];
          }

          const result = checkForRequiredFields(payload, requiredFields);

          expect(result.valid).toBe(true);
          expect(result.missing).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
