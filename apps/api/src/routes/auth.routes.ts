import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { RegisterSchema, LoginSchema } from '@campusface/shared';
import { UserRole, AccountStatus } from '@prisma/client';
import { verifyAuth, requireAuth } from '../middleware/auth.js';
import { cache } from '../redis/client.js';
import { sendVerificationEmail } from '../services/email.service.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a 6-digit numeric OTP */
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Redis key for pending registration data */
const pendingKey = (email: string) => `otp:pending:${email}`;

/** Redis key for OTP attempt count (rate-limit) */
const attemptKey = (email: string) => `otp:attempts:${email}`;

/** OTP TTL: 10 minutes */
const OTP_TTL_SECONDS = 10 * 60;

/** Max wrong attempts before lockout */
const MAX_ATTEMPTS = 5;

// ─── Routes ─────────────────────────────────────────────────────────────────

export async function authRoutes(app: FastifyInstance) {

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  // Accepts registration data, sends OTP to email, does NOT write to DB yet.
  app.post('/register/send-otp', async (request, reply) => {
    const parseResult = RegisterSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parseResult.error.errors[0]?.message || 'Invalid input'
      });
    }

    const { email, password, displayName, department } = parseResult.data;

    // Check if email is already registered in DB
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'An account with this university email already exists'
      });
    }

    // Rate-limit: prevent OTP spam
    const attemptsRaw = await cache.get(attemptKey(email));
    const attempts = attemptsRaw ? parseInt(attemptsRaw, 10) : 0;
    if (attempts >= 3) {
      return reply.status(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Too many OTP requests. Please wait 10 minutes before trying again.'
      });
    }

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 10);

    // Store pending registration + OTP in Redis (expires in 10 min)
    const pendingData = JSON.stringify({
      email,
      passwordHash,
      displayName,
      department: department || null,
      otp
    });

    await cache.set(pendingKey(email), pendingData, OTP_TTL_SECONDS);
    // Track OTP send count with same TTL
    await cache.set(attemptKey(email), (attempts + 1).toString(), OTP_TTL_SECONDS);

    // Send verification email
    try {
      await sendVerificationEmail(email, otp);
    } catch (err: any) {
      // In development, log the OTP to console as fallback
      if (process.env.NODE_ENV !== 'production') {
        app.log.warn(`[DEV] Email send failed — OTP for ${email}: ${otp}`);
      } else {
        app.log.error('Failed to send verification email:', err.message);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to send verification email. Please try again.'
        });
      }
    }

    return reply.status(200).send({
      message: 'Verification code sent to your email. It expires in 10 minutes.',
      email
    });
  });


  // ── Step 2: Verify OTP & Create Account ───────────────────────────────────
  // Validates OTP, creates user in DB, returns JWT.
  app.post('/register/verify-otp', async (request, reply) => {
    const { email, otp } = request.body as { email: string; otp: string };

    if (!email || !otp || otp.length !== 6) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'A valid 6-digit verification code is required'
      });
    }

    // Fetch pending registration from Redis
    const pendingRaw = await cache.get(pendingKey(email));
    if (!pendingRaw) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Verification code expired or not found. Please register again.'
      });
    }

    const pending = JSON.parse(pendingRaw) as {
      email: string;
      passwordHash: string;
      displayName: string;
      department: string | null;
      otp: string;
    };

    // Check OTP match
    if (pending.otp !== otp.trim()) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid verification code. Please check and try again.'
      });
    }

    // Double-check DB (in case another request created the user in parallel)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      await cache.del(pendingKey(email));
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'An account with this email already exists. Please log in.'
      });
    }

    // ✅ OTP verified — create user in database
    const user = await prisma.user.create({
      data: {
        email: pending.email,
        passwordHash: pending.passwordHash,
        role: UserRole.STUDENT,
        accountStatus: AccountStatus.ACTIVE
      }
    });

    // Clean up Redis keys
    await cache.del(pendingKey(email));
    await cache.del(attemptKey(email));

    // Issue JWT
    const token = app.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    reply.setCookie('campusface_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return reply.status(201).send({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt.toISOString()
      }
    });
  });


  // ── Login ─────────────────────────────────────────────────────────────────
  app.post('/login', async (request, reply) => {
    const parseResult = LoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid email or password format'
      });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            department: true,
            imageUrl: true,
            consentStatus: true,
            profileStatus: true
          }
        }
      }
    });

    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'This account has been suspended or deactivated'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    const token = app.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    reply.setCookie('campusface_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt.toISOString(),
        student: user.student
      }
    };
  });


  // ── Logout ────────────────────────────────────────────────────────────────
  app.post('/logout', async (request, reply) => {
    reply.clearCookie('campusface_token', { path: '/' });
    return { success: true, message: 'Logged out successfully' };
  });


  // ── Get current user session ──────────────────────────────────────────────
  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.userId },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            department: true,
            imageUrl: true,
            imageStorageKey: true,
            consentStatus: true,
            consentRecordedAt: true,
            profileStatus: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'User account not found'
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt.toISOString(),
        student: user.student
      }
    };
  });
}
