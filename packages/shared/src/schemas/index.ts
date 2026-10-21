import { z } from 'zod';
import { CURRENT_CONSENT_VERSION, APP_CONFIG } from '../constants/index.js';

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(100),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50).trim(),
  department: z.string().max(100).optional().nullable()
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

export const VoteSchema = z.object({
  selectedStudentId: z.string().uuid('Invalid student ID format'),
  idempotencyKey: z.string().min(10, 'Idempotency key is required').max(100)
});

export const CreateCommentSchema = z.object({
  body: z.string()
    .min(APP_CONFIG.MIN_COMMENT_LENGTH, `Comment must be at least ${APP_CONFIG.MIN_COMMENT_LENGTH} characters`)
    .max(APP_CONFIG.MAX_COMMENT_LENGTH, `Comment cannot exceed ${APP_CONFIG.MAX_COMMENT_LENGTH} characters`)
    .trim()
});

export const CreateReportSchema = z.object({
  targetType: z.enum(['COMMENT', 'STUDENT', 'BATTLE']),
  targetId: z.string().uuid('Invalid target ID format'),
  reason: z.string().min(5, 'Please provide a detailed reason').max(500).trim()
});

export const ConsentSchema = z.object({
  agreed: z.literal(true, {
    errorMap: () => ({ message: 'You must explicitly accept the participant consent terms' })
  }),
  consentVersion: z.string().default(CURRENT_CONSENT_VERSION),
  displayName: z.string().min(2).max(50).trim().optional(),
  department: z.string().max(100).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  imageStorageKey: z.string().optional().nullable()
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).trim().optional(),
  department: z.string().max(100).optional().nullable(),
  imageUrl: z.string().url().optional()
});

export const AdminReportUpdateSchema = z.object({
  status: z.enum(['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']),
  actionTaken: z.enum(['NONE', 'HIDE_CONTENT', 'REMOVE_CONTENT', 'SUSPEND_STUDENT', 'BAN_USER']).optional(),
  notes: z.string().max(500).optional()
});

export const AdminStudentStatusSchema = z.object({
  profileStatus: z.enum(['PENDING', 'APPROVED', 'SUSPENDED', 'REMOVED']),
  adminNotes: z.string().max(500).optional()
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VoteInput = z.infer<typeof VoteSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type ConsentInput = z.infer<typeof ConsentSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
