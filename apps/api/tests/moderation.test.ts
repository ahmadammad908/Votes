import { describe, it, expect } from 'vitest';
import { ModerationService } from '../src/services/moderation.service.js';

describe('Moderation & Content Sanitization Tests', () => {
  it('should strip malicious script tags and XSS payloads', () => {
    const maliciousInput = '<script>alert("xss")</script>Great smile! <img src="x" onerror="steal()"/>';
    const sanitized = ModerationService.sanitizeText(maliciousInput);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).toContain('Great smile!');
  });

  it('should detect abusive patterns and flag content', () => {
    const toxicInput = 'I will threat and doxx your dorm address';
    const result = ModerationService.evaluateContent(toxicInput);

    expect(result.isFlagged).toBe(true);
    expect(result.reason).toBeDefined();
  });

  it('should pass benign and supportive comments without flagging', () => {
    const benignInput = 'Amazing photo from the Architecture department! Good luck!';
    const result = ModerationService.evaluateContent(benignInput);

    expect(result.isFlagged).toBe(false);
  });
});
