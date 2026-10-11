import sanitizeHtml from 'sanitize-html';

const BANNED_PATTERNS = [
  /\b(doxx|swat|threat|kys|hate)\b/i,
  /\b(slur|nigger|faggot|chink|kike|spic)\b/i
];

export class ModerationService {
  /**
   * Sanitizes user input, stripping dangerous HTML, scripts, and XSS attack vectors.
   */
  static sanitizeText(input: string): string {
    return sanitizeHtml(input, {
      allowedTags: [], // Strip all HTML tags
      allowedAttributes: {},
      disallowedTagsMode: 'discard'
    }).trim();
  }

  /**
   * Evaluates text for severe toxicity, hate speech, or harassment patterns.
   */
  static evaluateContent(text: string): { isFlagged: boolean; reason?: string } {
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(text)) {
        return {
          isFlagged: true,
          reason: 'Content contains prohibited or abusive language'
        };
      }
    }
    return { isFlagged: false };
  }
}
