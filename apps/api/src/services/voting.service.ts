import { prisma } from '../db/prisma.js';
import { cache } from '../redis/client.js';
import { BattleStatus, ConsentStatus, ProfileStatus } from '@prisma/client';
import { VoteResponseDTO } from '@campusface/shared';

export interface CastVoteParams {
  userId: string;
  battleId: string;
  selectedStudentId: string;
  idempotencyKey: string;
}

export class VotingService {
  static async castVote(params: CastVoteParams): Promise<VoteResponseDTO> {
    const { userId, battleId, selectedStudentId, idempotencyKey } = params;

    // 1. Idempotency Key Check
    const existingIdempotentVote = await prisma.vote.findUnique({
      where: { idempotencyKey }
    });

    if (existingIdempotentVote) {
      if (existingIdempotentVote.userId !== userId) {
        throw new Error('Idempotency key collision');
      }
      return {
        success: true,
        voteId: existingIdempotentVote.id,
        battleId: existingIdempotentVote.battleId,
        selectedStudentId: existingIdempotentVote.selectedStudentId,
        message: 'Vote previously confirmed (idempotent replay)'
      };
    }

    // 2. Check if user already voted in this battle
    const existingUserVote = await prisma.vote.findUnique({
      where: {
        userId_battleId: {
          userId,
          battleId
        }
      }
    });

    if (existingUserVote) {
      throw new Error('You have already cast a vote in this battle');
    }

    // 3. Fetch battle and contestants
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        contestantA: true,
        contestantB: true
      }
    });

    if (!battle) {
      throw new Error('Battle not found');
    }

    if (battle.status !== BattleStatus.ACTIVE) {
      throw new Error('This battle is no longer active');
    }

    // 4. Validate selectedStudentId is one of the contestants
    if (selectedStudentId !== battle.contestantAId && selectedStudentId !== battle.contestantBId) {
      throw new Error('Selected student is not a participant in this battle');
    }

    // 5. Verify contestants are active and consenting
    const selectedStudent = selectedStudentId === battle.contestantAId ? battle.contestantA : battle.contestantB;
    if (
      selectedStudent.consentStatus !== ConsentStatus.ACTIVE ||
      selectedStudent.profileStatus !== ProfileStatus.APPROVED
    ) {
      throw new Error('Selected contestant is no longer eligible or has withdrawn consent');
    }

    // 6. Verify user is not voting for their own linked student profile
    const userStudent = await prisma.student.findUnique({
      where: { userId }
    });
    if (userStudent && userStudent.id === selectedStudentId) {
      throw new Error('Participants cannot vote for themselves');
    }

    // 7. Atomic Transaction: Insert Vote + Increment Leaderboard Aggregate
    const result = await prisma.$transaction(async (tx) => {
      const vote = await tx.vote.create({
        data: {
          userId,
          battleId,
          selectedStudentId,
          idempotencyKey
        }
      });

      // Update or create aggregate counter
      await tx.leaderboardAggregate.upsert({
        where: { studentId: selectedStudentId },
        update: {
          totalVotes: { increment: 1 },
          lastReconciledAt: new Date()
        },
        create: {
          studentId: selectedStudentId,
          totalVotes: 1,
          rank: 0,
          lastReconciledAt: new Date()
        }
      });

      return vote;
    });

    // Invalidate cached leaderboard
    await cache.del('campusface:leaderboard');

    return {
      success: true,
      voteId: result.id,
      battleId: result.battleId,
      selectedStudentId: result.selectedStudentId,
      message: 'Vote registered successfully'
    };
  }
}
