import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VotingService } from '../src/services/voting.service.js';
import { prisma } from '../src/db/prisma.js';
import { BattleStatus, ConsentStatus, ProfileStatus } from '@prisma/client';

// Mock prisma client for unit & integration isolation
vi.mock('../src/db/prisma.js', () => {
  return {
    prisma: {
      vote: {
        findUnique: vi.fn(),
        create: vi.fn(),
        count: vi.fn()
      },
      battle: {
        findUnique: vi.fn(),
        updateMany: vi.fn()
      },
      student: {
        findUnique: vi.fn()
      },
      leaderboardAggregate: {
        upsert: vi.fn()
      },
      $transaction: vi.fn(async (cb) => {
        return cb({
          vote: {
            create: vi.fn().mockResolvedValue({
              id: 'vote-uuid-1',
              userId: 'user-uuid-1',
              battleId: 'battle-uuid-1',
              selectedStudentId: 'student-uuid-a',
              idempotencyKey: 'idempotent-key-123'
            })
          },
          leaderboardAggregate: {
            upsert: vi.fn().mockResolvedValue({})
          }
        });
      })
    }
  };
});

describe('Voting Engine & Idempotency Tests', () => {
  const mockBattle = {
    id: 'battle-uuid-1',
    contestantAId: 'student-uuid-a',
    contestantBId: 'student-uuid-b',
    status: BattleStatus.ACTIVE,
    contestantA: {
      id: 'student-uuid-a',
      displayName: 'Alice Student',
      consentStatus: ConsentStatus.ACTIVE,
      profileStatus: ProfileStatus.APPROVED
    },
    contestantB: {
      id: 'student-uuid-b',
      displayName: 'Bob Student',
      consentStatus: ConsentStatus.ACTIVE,
      profileStatus: ProfileStatus.APPROVED
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully cast a vote for Contestant A in an active battle', async () => {
    (prisma.vote.findUnique as any).mockResolvedValue(null);
    (prisma.battle.findUnique as any).mockResolvedValue(mockBattle);
    (prisma.student.findUnique as any).mockResolvedValue(null);

    const result = await VotingService.castVote({
      userId: 'user-uuid-1',
      battleId: 'battle-uuid-1',
      selectedStudentId: 'student-uuid-a',
      idempotencyKey: 'idempotent-key-123'
    });

    expect(result.success).toBe(true);
    expect(result.selectedStudentId).toBe('student-uuid-a');
    expect(result.message).toBe('Vote registered successfully');
  });

  it('should replay existing vote on duplicate idempotency key without creating a new record', async () => {
    (prisma.vote.findUnique as any).mockResolvedValueOnce({
      id: 'vote-uuid-1',
      userId: 'user-uuid-1',
      battleId: 'battle-uuid-1',
      selectedStudentId: 'student-uuid-a',
      idempotencyKey: 'idempotent-key-123'
    });

    const result = await VotingService.castVote({
      userId: 'user-uuid-1',
      battleId: 'battle-uuid-1',
      selectedStudentId: 'student-uuid-a',
      idempotencyKey: 'idempotent-key-123'
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('idempotent replay');
  });

  it('should reject vote if the user has already voted in this battle', async () => {
    (prisma.vote.findUnique as any)
      .mockResolvedValueOnce(null) // no idempotency match
      .mockResolvedValueOnce({ id: 'previous-vote' }); // user-battle duplicate match

    await expect(
      VotingService.castVote({
        userId: 'user-uuid-1',
        battleId: 'battle-uuid-1',
        selectedStudentId: 'student-uuid-a',
        idempotencyKey: 'idempotent-new-key'
      })
    ).rejects.toThrow('already cast a vote in this battle');
  });

  it('should reject vote for an invalid contestant ID not belonging to the battle', async () => {
    (prisma.vote.findUnique as any).mockResolvedValue(null);
    (prisma.battle.findUnique as any).mockResolvedValue(mockBattle);
    (prisma.student.findUnique as any).mockResolvedValue(null);

    await expect(
      VotingService.castVote({
        userId: 'user-uuid-1',
        battleId: 'battle-uuid-1',
        selectedStudentId: 'student-uuid-stranger',
        idempotencyKey: 'idempotent-key-xyz'
      })
    ).rejects.toThrow('Selected student is not a participant in this battle');
  });

  it('should reject vote if contestant has withdrawn consent', async () => {
    const battleWithWithdrawnStudent = {
      ...mockBattle,
      contestantA: {
        ...mockBattle.contestantA,
        consentStatus: ConsentStatus.WITHDRAWN
      }
    };

    (prisma.vote.findUnique as any).mockResolvedValue(null);
    (prisma.battle.findUnique as any).mockResolvedValue(battleWithWithdrawnStudent);
    (prisma.student.findUnique as any).mockResolvedValue(null);

    await expect(
      VotingService.castVote({
        userId: 'user-uuid-1',
        battleId: 'battle-uuid-1',
        selectedStudentId: 'student-uuid-a',
        idempotencyKey: 'idempotent-key-withdrawn'
      })
    ).rejects.toThrow('no longer eligible or has withdrawn consent');
  });

  it('should prevent participants from voting for their own profile', async () => {
    (prisma.vote.findUnique as any).mockResolvedValue(null);
    (prisma.battle.findUnique as any).mockResolvedValue(mockBattle);
    // User owns student-uuid-a
    (prisma.student.findUnique as any).mockResolvedValue({ id: 'student-uuid-a', userId: 'user-uuid-1' });

    await expect(
      VotingService.castVote({
        userId: 'user-uuid-1',
        battleId: 'battle-uuid-1',
        selectedStudentId: 'student-uuid-a',
        idempotencyKey: 'idempotent-self-vote'
      })
    ).rejects.toThrow('Participants cannot vote for themselves');
  });
});
