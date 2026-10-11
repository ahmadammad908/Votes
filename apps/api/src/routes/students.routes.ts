import { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma.js';
import { cache } from '../redis/client.js';
import { requireAuth } from '../middleware/auth.js';
import { ConsentSchema, UpdateProfileSchema, CURRENT_CONSENT_VERSION, CONSENT_TERMS_TEXT } from '@campusface/shared';
import { ConsentStatus, ProfileStatus, BattleStatus } from '@prisma/client';
import { StorageService } from '../services/storage.service.js';

export async function studentsRoutes(app: FastifyInstance) {
  // Get current user's student profile
  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.userId;

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        consentRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        },
        leaderboardAggregate: true
      }
    });

    if (!student) {
      return { student: null, hasProfile: false };
    }

    return {
      student: {
        id: student.id,
        userId: student.userId,
        displayName: student.displayName,
        department: student.department,
        imageUrl: student.imageUrl || `/api/v1/media/${student.imageStorageKey}`,
        consentStatus: student.consentStatus,
        consentRecordedAt: student.consentRecordedAt ? student.consentRecordedAt.toISOString() : null,
        profileStatus: student.profileStatus,
        totalVotes: student.leaderboardAggregate?.totalVotes || 0,
        createdAt: student.createdAt.toISOString()
      },
      hasProfile: true
    };
  });

  // Agree to participant consent
  app.post('/me/consent', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.userId;
    const parseResult = ConsentSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parseResult.error.errors[0]?.message || 'Invalid consent agreement'
      });
    }

    const { displayName, department, consentVersion } = parseResult.data;

    // Check if student profile exists or create one
    let student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      // Profile stays PENDING until admin manually approves it
      student = await prisma.student.create({
        data: {
          userId,
          displayName: displayName || request.user!.email.split('@')[0],
          department: department || null,
          imageStorageKey: 'defaults/avatar-placeholder.png',
          imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
          consentStatus: ConsentStatus.ACTIVE,
          consentRecordedAt: new Date(),
          profileStatus: ProfileStatus.PENDING   // ← Admin approval required
        }
      });
    } else {
      // Re-consent: keep existing status if already approved, else reset to PENDING
      const newStatus = student.profileStatus === ProfileStatus.APPROVED
        ? ProfileStatus.APPROVED
        : ProfileStatus.PENDING;

      student = await prisma.student.update({
        where: { id: student.id },
        data: {
          displayName: displayName || student.displayName,
          department: department !== undefined ? department : student.department,
          consentStatus: ConsentStatus.ACTIVE,
          consentRecordedAt: new Date(),
          profileStatus: newStatus
        }
      });
    }

    // Record formal consent audit trail
    await prisma.consentRecord.create({
      data: {
        studentId: student.id,
        consentVersion: consentVersion || CURRENT_CONSENT_VERSION,
        termsText: CONSENT_TERMS_TEXT,
        status: ConsentStatus.ACTIVE,
        ipAddressHash: request.ip || 'unknown',
        recordedAt: new Date()
      }
    });

    // Invalidate caches
    await cache.del('campusface:leaderboard');

    return {
      success: true,
      message: student.profileStatus === ProfileStatus.APPROVED
        ? 'Consent updated successfully. Your profile remains active.'
        : 'Consent recorded! Your profile is under admin review and will go live once approved.',
      student,
      pendingApproval: student.profileStatus === ProfileStatus.PENDING
    };
  });

  // Withdraw Consent Immediately
  app.post('/me/withdraw-consent', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.userId;

    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Student profile not found'
      });
    }

    // 1. Mark consent as WITHDRAWN and profile as REMOVED
    await prisma.student.update({
      where: { id: student.id },
      data: {
        consentStatus: ConsentStatus.WITHDRAWN,
        profileStatus: ProfileStatus.REMOVED
      }
    });

    // 2. Record withdrawal in consent_records
    await prisma.consentRecord.create({
      data: {
        studentId: student.id,
        consentVersion: CURRENT_CONSENT_VERSION,
        termsText: 'User initiated consent withdrawal and profile delisting.',
        status: ConsentStatus.WITHDRAWN,
        ipAddressHash: request.ip || 'unknown',
        recordedAt: new Date(),
        withdrawnAt: new Date()
      }
    });

    // 3. Close all active battles containing this student
    await prisma.battle.updateMany({
      where: {
        OR: [
          { contestantAId: student.id },
          { contestantBId: student.id }
        ],
        status: BattleStatus.ACTIVE
      },
      data: {
        status: BattleStatus.CLOSED,
        closedAt: new Date()
      }
    });

    // 4. Invalidate all leaderboard & battle caches
    await cache.del('campusface:leaderboard');

    return {
      success: true,
      message: 'Consent withdrawn successfully. Your profile has been immediately removed from all active battles and public listings.'
    };
  });

  // Update profile
  app.patch('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.userId;
    const parseResult = UpdateProfileSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parseResult.error.errors[0]?.message || 'Invalid input'
      });
    }

    const { displayName, department, imageUrl } = parseResult.data;

    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Student profile not found'
      });
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        displayName: displayName || student.displayName,
        department: department !== undefined ? department : student.department,
        imageUrl: imageUrl || student.imageUrl
      }
    });

    await cache.del('campusface:leaderboard');

    return { success: true, student: updated };
  });

  // Photo Upload Endpoint
  app.post('/upload-photo', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.userId;
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'No photo file provided'
      });
    }

    const buffer = await data.toBuffer();

    try {
      const { storageKey, url } = await StorageService.saveImage(buffer, data.mimetype, data.filename);

      // If student profile exists, update it
      const student = await prisma.student.findUnique({
        where: { userId }
      });

      if (student) {
        await prisma.student.update({
          where: { id: student.id },
          data: {
            imageStorageKey: storageKey,
            imageUrl: url
          }
        });
      }

      return {
        success: true,
        storageKey,
        imageUrl: url
      };
    } catch (err: any) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: err.message || 'Failed to process image'
      });
    }
  });

  // Public Student Profile
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        leaderboardAggregate: true
      }
    });

    if (!student || student.consentStatus !== ConsentStatus.ACTIVE || student.profileStatus !== ProfileStatus.APPROVED) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Participant profile not found or inactive'
      });
    }

    return {
      student: {
        id: student.id,
        displayName: student.displayName,
        department: student.department,
        imageUrl: student.imageUrl || `/api/v1/media/${student.imageStorageKey}`,
        totalVotes: student.leaderboardAggregate?.totalVotes || 0,
        createdAt: student.createdAt.toISOString()
      }
    };
  });
}
