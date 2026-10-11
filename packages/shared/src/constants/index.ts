export const CURRENT_CONSENT_VERSION = 'v1.0';

export const CONSENT_TERMS_TEXT = `
CAMPUSFACE PARTICIPANT CONSENT AND PRIVACY AGREEMENT (VERSION 1.0)

1. EXPLICIT CONSENT: By consenting, you explicitly authorize CampusFace to display your submitted photograph, chosen display name, and department for university community voting battles.
2. RIGHT TO WITHDRAW: You retain the absolute right to withdraw your consent at any time through your account settings or profile page. Upon withdrawal, your profile and photo will be immediately and irrevocably delisted from all active and future battles.
3. DATA PROTECTION: CampusFace will never sell, transfer, or distribute your photographs to third parties. Photographs are used solely for pairwise on-platform voting.
4. NO HARASSMENT TOLERANCE: Any derogatory, abusive, non-consensual sexual, or bullying comments targeting participants are strictly forbidden and subject to automated filtering and immediate administrative removal.
5. NO SCRAPED MEDIA: All contestant photographs must be directly uploaded by the verified student account owner.
`.trim();

export const UNIVERSITY_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Computer Engineering',
  'Business Administration & Management',
  'Architecture & Design',
  'Biomedical Sciences & Medicine',
  'Law & Public Policy',
  'Media Arts & Communications',
  'Economics & Finance',
  'Mechanical & Aerospace Engineering',
  'Psychology & Social Sciences',
  'Fine Arts & Photography',
  'Environmental Sciences'
] as const;

export const APP_CONFIG = {
  PAGE_SIZE_COMMENTS: 20,
  MAX_COMMENT_LENGTH: 500,
  MIN_COMMENT_LENGTH: 2,
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  CACHE_TTL_LEADERBOARD_SECONDS: 60,
  CACHE_TTL_BATTLE_SECONDS: 30,
  RATE_LIMIT: {
    AUTH: 10, // req per minute
    VOTE: 60, // req per minute
    COMMENT: 15, // req per minute
    GENERAL: 120 // req per minute
  }
} as const;
