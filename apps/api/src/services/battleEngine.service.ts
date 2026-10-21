import { prisma } from '../db/prisma.js';
import { BattleStatus, ConsentStatus, ProfileStatus } from '@prisma/client';
import { BattleDTO } from '@campusface/shared';

export class BattleEngineService {
  /**
   * Retrieves the next eligible battle for a given user (or anonymous visitor),
   * ensuring the user hasn't already voted on it and both contestants are approved & consented.
   */
  static async getNextBattle(userId?: string): Promise<{ battle: BattleDTO | null; totalAvailable: number }> {
    // 1. Find battle IDs where the user has already voted
    let votedBattleIds: string[] = [];
    if (userId) {
      const userVotes = await prisma.vote.findMany({
        where: { userId },
        select: { battleId: true }
      });
      votedBattleIds = userVotes.map((v) => v.battleId);
    }

    // 2. Query for existing ACTIVE battles where both contestants have ACTIVE consent and APPROVED status
    const eligibleBattles = await prisma.battle.findMany({
      where: {
        status: BattleStatus.ACTIVE,
        id: votedBattleIds.length > 0 ? { notIn: votedBattleIds } : undefined,
        contestantA: {
          consentStatus: ConsentStatus.ACTIVE,
          profileStatus: ProfileStatus.APPROVED
        },
        contestantB: {
          consentStatus: ConsentStatus.ACTIVE,
          profileStatus: ProfileStatus.APPROVED
        }
      },
      include: {
        contestantA: {
          select: { id: true, displayName: true, department: true, imageUrl: true, imageStorageKey: true }
        },
        contestantB: {
          select: { id: true, displayName: true, department: true, imageUrl: true, imageStorageKey: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 5
    });

    if (eligibleBattles.length > 0) {
      const selected = eligibleBattles[0];
      const [aggA, aggB] = await Promise.all([
        prisma.leaderboardAggregate.findUnique({ where: { studentId: selected.contestantA.id } }),
        prisma.leaderboardAggregate.findUnique({ where: { studentId: selected.contestantB.id } })
      ]);
      const votesA = aggA?.totalVotes ?? 0;
      const votesB = aggB?.totalVotes ?? 0;

      return {
        battle: {
          id: selected.id,
          status: selected.status as any,
          createdAt: selected.createdAt.toISOString(),
          votesA,
          votesB,
          totalVotes: votesA + votesB,
          contestantA: {
            id: selected.contestantA.id,
            displayName: selected.contestantA.displayName,
            department: selected.contestantA.department,
            imageUrl: selected.contestantA.imageUrl || `/api/v1/media/${selected.contestantA.imageStorageKey}`,
            votes: votesA
          },
          contestantB: {
            id: selected.contestantB.id,
            displayName: selected.contestantB.displayName,
            department: selected.contestantB.department,
            imageUrl: selected.contestantB.imageUrl || `/api/v1/media/${selected.contestantB.imageStorageKey}`,
            votes: votesB
          }
        },
        totalAvailable: eligibleBattles.length
      };
    }

    // 3. If no pre-existing unvoted battle exists, check if we can create a dynamic pairing between 2 eligible students
    const dynamicBattle = await this.generateDynamicPairing(userId, votedBattleIds);
    if (dynamicBattle) {
      return {
        battle: dynamicBattle,
        totalAvailable: 1
      };
    }

    return { battle: null, totalAvailable: 0 };
  }

  /**
   * Generates a new pairing dynamically between two eligible students if all static pairs are exhausted.
   */
  private static async generateDynamicPairing(
    userId?: string,
    votedBattleIds: string[] = []
  ): Promise<BattleDTO | null> {
    const eligibleStudents = await prisma.student.findMany({
      where: {
        consentStatus: ConsentStatus.ACTIVE,
        profileStatus: ProfileStatus.APPROVED
      },
      select: {
        id: true,
        displayName: true,
        department: true,
        imageUrl: true,
        imageStorageKey: true
      },
      take: 20
    });

    if (eligibleStudents.length < 2) {
      return null;
    }

    // Find a pair (A, B) that doesn't have an active unvoted battle for this user
    for (let i = 0; i < eligibleStudents.length; i++) {
      for (let j = i + 1; j < eligibleStudents.length; j++) {
        const studentA = eligibleStudents[i];
        const studentB = eligibleStudents[j];

        // Check if a battle between A and B exists
        const existingBattle = await prisma.battle.findFirst({
          where: {
            OR: [
              { contestantAId: studentA.id, contestantBId: studentB.id },
              { contestantAId: studentB.id, contestantBId: studentA.id }
            ]
          }
        });

        if (!existingBattle) {
          // Create new battle atomically
          const newBattle = await prisma.battle.create({
            data: {
              contestantAId: studentA.id,
              contestantBId: studentB.id,
              status: BattleStatus.ACTIVE
            }
          });

          // Fetch actual lifetime votes for dynamic pair (matches Admin Dashboard & Leaderboard)
          const [aggA, aggB] = await Promise.all([
            prisma.leaderboardAggregate.findUnique({ where: { studentId: studentA.id } }),
            prisma.leaderboardAggregate.findUnique({ where: { studentId: studentB.id } })
          ]);
          const votesA = aggA?.totalVotes ?? 0;
          const votesB = aggB?.totalVotes ?? 0;

          return {
            id: newBattle.id,
            status: newBattle.status as any,
            createdAt: newBattle.createdAt.toISOString(),
            votesA,
            votesB,
            totalVotes: votesA + votesB,
            contestantA: {
              id: studentA.id,
              displayName: studentA.displayName,
              department: studentA.department,
              imageUrl: studentA.imageUrl || `/api/v1/media/${studentA.imageStorageKey}`,
              votes: votesA
            },
            contestantB: {
              id: studentB.id,
              displayName: studentB.displayName,
              department: studentB.department,
              imageUrl: studentB.imageUrl || `/api/v1/media/${studentB.imageStorageKey}`,
              votes: votesB
            }
          };
        } else if (!votedBattleIds.includes(existingBattle.id) && existingBattle.status === BattleStatus.ACTIVE) {
          const [aggA, aggB] = await Promise.all([
            prisma.leaderboardAggregate.findUnique({ where: { studentId: studentA.id } }),
            prisma.leaderboardAggregate.findUnique({ where: { studentId: studentB.id } })
          ]);
          const votesA = aggA?.totalVotes ?? 0;
          const votesB = aggB?.totalVotes ?? 0;

          return {
            id: existingBattle.id,
            status: existingBattle.status as any,
            createdAt: existingBattle.createdAt.toISOString(),
            votesA,
            votesB,
            totalVotes: votesA + votesB,
            contestantA: {
              id: studentA.id,
              displayName: studentA.displayName,
              department: studentA.department,
              imageUrl: studentA.imageUrl || `/api/v1/media/${studentA.imageStorageKey}`,
              votes: votesA
            },
            contestantB: {
              id: studentB.id,
              displayName: studentB.displayName,
              department: studentB.department,
              imageUrl: studentB.imageUrl || `/api/v1/media/${studentB.imageStorageKey}`,
              votes: votesB
            }
          };
        }
      }
    }

    return null;
  }
}
