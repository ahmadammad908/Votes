import { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CreateReportSchema, AdminReportUpdateSchema } from '@campusface/shared';
import { UserRole, ReportStatus, ModerationStatus, ProfileStatus } from '@prisma/client';

export async function reportsRoutes(app: FastifyInstance) {
  // Submit a Report
  app.post('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.userId;
    const parseResult = CreateReportSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parseResult.error.errors[0]?.message || 'Invalid report payload'
      });
    }

    const { targetType, targetId, reason } = parseResult.data;

    const report = await prisma.report.create({
      data: {
        reporterUserId: userId,
        targetType,
        targetId,
        reason,
        status: ReportStatus.PENDING
      }
    });

    return reply.status(201).send({
      success: true,
      message: 'Report submitted for review',
      reportId: report.id
    });
  });

  // Admin/Mod List Reports
  app.get('/admin', { preHandler: [requireRole([UserRole.ADMIN, UserRole.MODERATOR])] }, async (request, reply) => {
    const { status, limit = 50 } = request.query as { status?: ReportStatus; limit?: string };

    const reports = await prisma.report.findMany({
      where: status ? { status } : undefined,
      include: {
        reporter: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit.toString(), 10) || 50, 100)
    });

    return { reports };
  });

  // Admin/Mod Update Report & Apply Action
  app.patch('/admin/:id', { preHandler: [requireRole([UserRole.ADMIN, UserRole.MODERATOR])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = AdminReportUpdateSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid update parameters'
      });
    }

    const { status, actionTaken, notes } = parseResult.data;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Report not found'
      });
    }

    // Execute moderation action if specified
    if (actionTaken === 'HIDE_CONTENT' || actionTaken === 'REMOVE_CONTENT') {
      if (report.targetType === 'COMMENT') {
        await prisma.comment.update({
          where: { id: report.targetId },
          data: {
            moderationStatus: actionTaken === 'REMOVE_CONTENT' ? ModerationStatus.REMOVED : ModerationStatus.HIDDEN
          }
        });
      }
    } else if (actionTaken === 'SUSPEND_STUDENT') {
      if (report.targetType === 'STUDENT') {
        await prisma.student.update({
          where: { id: report.targetId },
          data: { profileStatus: ProfileStatus.SUSPENDED }
        });
      }
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED ? new Date() : null
      }
    });

    // Record admin audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: request.user!.userId,
        action: `REPORT_MODERATED_${status}`,
        targetEntity: 'REPORT',
        targetId: id,
        metadata: { actionTaken, notes, previousStatus: report.status }
      }
    });

    return {
      success: true,
      report: updatedReport
    };
  });
}
