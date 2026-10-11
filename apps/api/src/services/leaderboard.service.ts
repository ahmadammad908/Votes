import { prisma } from '../db/prisma.js';
import { cache } from '../redis/client.js';
import { ConsentStatus, ProfileStatus } from '@prisma/client';
import { LeaderboardResponseDTO, LeaderboardEntryDTO, APP_CONFIG } from '@campusface/shared';

const CACHE_KEY = 'campusface:leaderboard';

export class LeaderboardService {
  /**
   * Retrieves the current beauty leaderboard, utilizing Redis caching with database fallback.
   */
  static async getLeaderboard(department?: string): Promise<LeaderboardResponseDTO> {
    const cacheKey = department ? `${CACHE_KEY}:dept:${department}` : CACHE_KEY;

    // 1. Try reading from cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData) as LeaderboardResponseDTO;
        return { ...parsed, fromCache: true };
      } catch (e) {
        // Cache parse error, proceed to DB
      }
    }

    // 2. Query from database using pre-aggregated leaderboard_aggregates
    const aggregates = await prisma.leaderboardAggregate.findMany({
      where: {
        student: {
          consentStatus: ConsentStatus.ACTIVE,
          profileStatus: ProfileStatus.APPROVED,
          department: department ? department : undefined
        }
      },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            department: true,
            imageUrl: true,
            imageStorageKey: true
          }
        }
      },
      orderBy: { totalVotes: 'desc' },
      take: 100
    });

    const entries: LeaderboardEntryDTO[] = aggregates.map((agg, index) => ({
      rank: index + 1,
      studentId: agg.student.id,
      displayName: agg.student.displayName,
      department: agg.student.department,
      imageUrl: agg.student.imageUrl || `/api/v1/media/${agg.student.imageStorageKey}`,
      totalVotes: agg.totalVotes
    }));

    const response: LeaderboardResponseDTO = {
      entries,
      totalParticipants: entries.length,
      lastUpdated: new Date().toISOString(),
      fromCache: false
    };

    // 3. Save to cache
    await cache.set(cacheKey, JSON.stringify(response), APP_CONFIG.CACHE_TTL_LEADERBOARD_SECONDS);

    return response;
  }

  /**
   * Reconciles aggregate totals against actual vote records in PostgreSQL.
   * Can be triggered by cron or admin dashboard.
   */
  static async reconcileAggregates(): Promise<{ reconciledCount: number }> {
    const students = await prisma.student.findMany({
      select: { id: true }
    });

    let count = 0;
    for (const student of students) {
      const actualVotesCount = await prisma.vote.count({
        where: { selectedStudentId: student.id }
      });

      await prisma.leaderboardAggregate.upsert({
        where: { studentId: student.id },
        update: {
          totalVotes: actualVotesCount,
          lastReconciledAt: new Date()
        },
        create: {
          studentId: student.id,
          totalVotes: actualVotesCount,
          rank: 0,
          lastReconciledAt: new Date()
        }
      });
      count++;
    }

    // Invalidate caches
    await cache.del(CACHE_KEY);

    return { reconciledCount: count };
  }
}
