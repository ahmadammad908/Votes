import { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma.js';
import { requireRole } from '../middleware/auth.js';
import { UserRole, ProfileStatus, BattleStatus, ConsentStatus } from '@prisma/client';
import { AdminStudentStatusSchema } from '@campusface/shared';
import { cache } from '../redis/client.js';

export async function adminRoutes(app: FastifyInstance) {
  // Admin & Moderator Only Guard
  app.addHook('preHandler', requireRole([UserRole.ADMIN, UserRole.MODERATOR]));

  // Metrics Overview
  app.get('/overview', async (request, reply) => {
    const [
      totalUsers,
      totalStudents,
      activeBattles,
      totalVotes,
      pendingReports,
      flaggedComments,
      pendingApprovals
    ] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.battle.count({ where: { status: BattleStatus.ACTIVE } }),
      prisma.vote.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.comment.count({ where: { moderationStatus: 'FLAGGED' } }),
      prisma.student.count({ where: { profileStatus: ProfileStatus.PENDING } })
    ]);

    return {
      metrics: {
        totalUsers,
        totalStudents,
        activeBattles,
        totalVotes,
        pendingReports,
        flaggedComments,
        pendingApprovals
      }
    };
  });

  // List all students
  app.get('/students', async (request, reply) => {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { email: true } },
        leaderboardAggregate: { select: { totalVotes: true } },
        consentRecords: { orderBy: { recordedAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      students: students.map((s) => ({
        id: s.id,
        email: s.user?.email,
        displayName: s.displayName,
        department: s.department,
        imageUrl: s.imageUrl || `/api/v1/media/${s.imageStorageKey}`,
        consentStatus: s.consentStatus,
        consentRecordedAt: s.consentRecordedAt?.toISOString() || null,
        profileStatus: s.profileStatus,
        totalVotes: s.leaderboardAggregate?.totalVotes || 0,
        createdAt: s.createdAt.toISOString()
      }))
    };
  });

  // Update student status (Approve, Suspend, Remove)
  app.patch('/students/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = AdminStudentStatusSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid profile status'
      });
    }

    const { profileStatus, adminNotes } = parseResult.data;

    const student = await prisma.student.update({
      where: { id },
      data: { profileStatus }
    });

    // If suspended or removed, close their active battles
    if (profileStatus === ProfileStatus.SUSPENDED || profileStatus === ProfileStatus.REMOVED) {
      await prisma.battle.updateMany({
        where: {
          OR: [
            { contestantAId: id },
            { contestantBId: id }
          ],
          status: BattleStatus.ACTIVE
        },
        data: { status: BattleStatus.CLOSED, closedAt: new Date() }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: request.user!.userId,
        action: `STUDENT_STATUS_${profileStatus}`,
        targetEntity: 'STUDENT',
        targetId: id,
        metadata: { adminNotes, newStatus: profileStatus }
      }
    });

    await cache.del('campusface:leaderboard');

    return { success: true, student };
  });

  // Audit Logs
  app.get('/audit-logs', async (request, reply) => {
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: { select: { email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return { logs };
  });
}
