import { describe, it, expect } from 'vitest';
import { ConsentSchema, CURRENT_CONSENT_VERSION } from '@campusface/shared';

describe('Participant Consent Validation Tests', () => {
  it('should accept valid consent agreement with explicit terms confirmation', () => {
    const validPayload = {
      agreed: true,
      consentVersion: CURRENT_CONSENT_VERSION,
      displayName: 'Elena Rostova',
      department: 'Architecture & Design'
    };

    const parsed = ConsentSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('should reject consent agreement if agreed flag is false or omitted', () => {
    const invalidPayload = {
      agreed: false,
      consentVersion: CURRENT_CONSENT_VERSION
    };

    const parsed = ConsentSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });
});
