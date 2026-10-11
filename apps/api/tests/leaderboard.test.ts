import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaderboardService } from '../src/services/leaderboard.service.js';
import { prisma } from '../src/db/prisma.js';
import { cache } from '../src/redis/client.js';

vi.mock('../src/db/prisma.js', () => ({
  prisma: {
    leaderboardAggregate: {
      findMany: vi.fn(),
      upsert: vi.fn()
    },
    student: {
      findMany: vi.fn()
    },
    vote: {
      count: vi.fn()
    }
  }
}));

vi.mock('../src/redis/client.js', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn()
  }
}));

describe('Leaderboard Service & Cache Reconciliation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached leaderboard when present in Redis', async () => {
    const mockCached = {
      entries: [
        { rank: 1, studentId: 'student-1', displayName: 'Elena', department: 'Arts', imageUrl: '/img.jpg', totalVotes: 50 }
      ],
      totalParticipants: 1,
      lastUpdated: new Date().toISOString(),
      fromCache: false
    };

    (cache.get as any).mockResolvedValue(JSON.stringify(mockCached));

    const result = await LeaderboardService.getLeaderboard();

    expect(result.fromCache).toBe(true);
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].displayName).toBe('Elena');
  });

  it('should fallback to database aggregate query on cache miss and update Redis', async () => {
    (cache.get as any).mockResolvedValue(null);
    (prisma.leaderboardAggregate.findMany as any).mockResolvedValue([
      {
        totalVotes: 100,
        student: {
          id: 'student-2',
          displayName: 'Marcus',
          department: 'Engineering',
          imageUrl: '/marcus.jpg',
          imageStorageKey: 'marcus.jpg'
        }
      }
    ]);

    const result = await LeaderboardService.getLeaderboard();

    expect(result.fromCache).toBe(false);
    expect(result.entries[0].rank).toBe(1);
    expect(result.entries[0].displayName).toBe('Marcus');
    expect(cache.set).toHaveBeenCalled();
  });
});
