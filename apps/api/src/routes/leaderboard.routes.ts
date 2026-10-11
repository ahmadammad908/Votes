import { FastifyInstance } from 'fastify';
import { LeaderboardService } from '../services/leaderboard.service.js';
import { requireRole } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

export async function leaderboardRoutes(app: FastifyInstance) {
  // Get Leaderboard (Cached)
  app.get('/', async (request, reply) => {
    const { department } = request.query as { department?: string };
    const leaderboard = await LeaderboardService.getLeaderboard(department);
    return leaderboard;
  });

  // Reconcile vote counts against DB records (Admin/Moderator only)
  app.post('/reconcile', { preHandler: [requireRole([UserRole.ADMIN, UserRole.MODERATOR])] }, async (request, reply) => {
    const result = await LeaderboardService.reconcileAggregates();
    return {
      success: true,
      message: `Successfully reconciled ${result.reconciledCount} student leaderboard aggregates against raw vote records`
    };
  });
}
