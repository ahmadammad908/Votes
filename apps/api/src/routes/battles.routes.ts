import { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma.js';
import { verifyAuth, requireAuth } from '../middleware/auth.js';
import { BattleEngineService } from '../services/battleEngine.service.js';
import { VotingService } from '../services/voting.service.js';
import { ModerationService } from '../services/moderation.service.js';
import { VoteSchema, CreateCommentSchema, APP_CONFIG } from '@campusface/shared';
import { ModerationStatus, UserRole } from '@prisma/client';

export async function battlesRoutes(app: FastifyInstance) {
  // Get next eligible battle + prefetch next
  app.get('/next', { preHandler: [verifyAuth] }, async (request, reply) => {
    const userId = request.user?.userId;
    const { battle, totalAvailable } = await BattleEngineService.getNextBattle(userId);

    // If a battle exists, attempt to prefetch the subsequent one for ultra-low latency transition
    let prefetchedNextBattle = null;
    if (battle) {
      // Temporary check with this battle marked as excluded
      const subResult = await BattleEngineService.getNextBattle(userId);
      if (subResult.battle && subResult.battle.id !== battle.id) {
        prefetchedNextBattle = subResult.battle;
      }
    }

    return {
      battle,
      prefetchedNextBattle,
      hasMore: battle !== null,
      totalAvailableBattles: totalAvailable
    };
  });

  // Get specific battle
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const battle = await prisma.battle.findUnique({
      where: { id },
      include: {
        contestantA: {
          select: { id: true, displayName: true, department: true, imageUrl: true, imageStorageKey: true }
        },
        contestantB: {
          select: { id: true, displayName: true, department: true, imageUrl: true, imageStorageKey: true }
        }
      }
    });

    if (!battle) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Battle not found'
      });
    }

    return {
      battle: {
        id: battle.id,
        status: battle.status,
        createdAt: battle.createdAt.toISOString(),
        contestantA: {
          id: battle.contestantA.id,
          displayName: battle.contestantA.displayName,
          department: battle.contestantA.department,
          imageUrl: battle.contestantA.imageUrl || `/api/v1/media/${battle.contestantA.imageStorageKey}`
        },
        contestantB: {
          id: battle.contestantB.id,
          displayName: battle.contestantB.displayName,
          department: battle.contestantB.department,
          imageUrl: battle.contestantB.imageUrl || `/api/v1/media/${battle.contestantB.imageStorageKey}`
        }
      }
    };
  });

  // Cast a Vote in Battle (Atomic Transaction + Idempotency)
  app.post('/:id/vote', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id: battleId } = request.params as { id: string };
    const userId = request.user!.userId;

    const parseResult = VoteSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parseResult.error.errors[0]?.message || 'Invalid vote parameters'
      });
    }

    const { selectedStudentId, idempotencyKey } = parseResult.data;

    try {
      const voteResult = await VotingService.castVote({
        userId,
        battleId,
        selectedStudentId,
        idempotencyKey
      });

      return reply.status(200).send(voteResult);
    } catch (err: any) {
      const message = err.message || 'Vote failed';
      if (message.includes('already') || message.includes('Unique constraint')) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'You have already voted in this battle'
        });
      }
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message
      });
    }
  });

  // Get Comments for Battle (Cursor-based Pagination)
  app.get('/:id/comments', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { id: battleId } = request.params as { id: string };
    const { cursor, limit = 20 } = request.query as { cursor?: string; limit?: string };
    const currentUserId = request.user?.userId;
    const take = Math.min(parseInt(limit.toString(), 10) || 20, 50);

    const comments = await prisma.comment.findMany({
      where: {
        battleId,
        moderationStatus: { in: [ModerationStatus.VISIBLE, ModerationStatus.FLAGGED] }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            student: { select: { displayName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0
    });

    const hasMore = comments.length > take;
    const returnItems = hasMore ? comments.slice(0, take) : comments;
    const nextCursor = hasMore ? returnItems[returnItems.length - 1].id : null;

    const totalCount = await prisma.comment.count({
      where: {
        battleId,
        moderationStatus: { in: [ModerationStatus.VISIBLE, ModerationStatus.FLAGGED] }
      }
    });

    return {
      comments: returnItems.map((c) => ({
        id: c.id,
        battleId: c.battleId,
        userId: c.userId,
        authorName: c.user.student?.displayName || c.user.email.split('@')[0],
        body: c.body,
        moderationStatus: c.moderationStatus,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        isOwner: currentUserId === c.userId
      })),
      nextCursor,
      hasMore,
      totalCount
    };
  });

  // Post Comment on Battle
  app.post('/:id/comments', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id: battleId } = request.params as { id: string };
    const userId = request.user!.userId;

    const parseResult = CreateCommentSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parseResult.error.errors[0]?.message || 'Invalid comment format'
      });
    }

    // Verify battle exists
    const battle = await prisma.battle.findUnique({
      where: { id: battleId }
    });

    if (!battle) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Battle not found'
      });
    }

    const sanitizedBody = ModerationService.sanitizeText(parseResult.data.body);
    const modCheck = ModerationService.evaluateContent(sanitizedBody);

    const comment = await prisma.comment.create({
      data: {
        userId,
        battleId,
        body: sanitizedBody,
        moderationStatus: modCheck.isFlagged ? ModerationStatus.FLAGGED : ModerationStatus.VISIBLE
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            student: { select: { displayName: true } }
          }
        }
      }
    });

    return reply.status(201).send({
      comment: {
        id: comment.id,
        battleId: comment.battleId,
        userId: comment.userId,
        authorName: comment.user.student?.displayName || comment.user.email.split('@')[0],
        body: comment.body,
        moderationStatus: comment.moderationStatus,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        isOwner: true
      }
    });
  });

  // Delete own comment or admin delete
  app.delete('/:battleId/comments/:commentId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { commentId } = request.params as { battleId: string; commentId: string };
    const userId = request.user!.userId;
    const userRole = request.user!.role;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Comment not found'
      });
    }

    const isAuthorized = comment.userId === userId || userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

    if (!isAuthorized) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You cannot delete another user’s comment'
      });
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { moderationStatus: ModerationStatus.REMOVED }
    });

    return { success: true, message: 'Comment removed' };
  });
}
