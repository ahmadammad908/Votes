import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from apps/api/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

import { PrismaClient, UserRole, AccountStatus, ConsentStatus, ProfileStatus, BattleStatus, ModerationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CURRENT_CONSENT_VERSION, CONSENT_TERMS_TEXT } from '@campusface/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CampusFace database seeding...');

  // 1. Clean existing records in safe order
  await prisma.auditLog.deleteMany();
  await prisma.leaderboardAggregate.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.report.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.battle.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('CampusFace2026!', 10);

  // 2. Create Core Admin & Moderator Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@campusface.edu',
      passwordHash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE
    }
  });

  const moderatorUser = await prisma.user.create({
    data: {
      email: 'moderator@campusface.edu',
      passwordHash,
      role: UserRole.MODERATOR,
      accountStatus: AccountStatus.ACTIVE
    }
  });

  const voterUser = await prisma.user.create({
    data: {
      email: 'student.voter@campusface.edu',
      passwordHash,
      role: UserRole.STUDENT,
      accountStatus: AccountStatus.ACTIVE
    }
  });

  console.log('✅ Created Admin, Moderator, and Demo Voter accounts.');

  // 3. Create Sample Consenting Student Profiles across diverse departments
  const sampleStudents = [
    {
      email: 'elena.rostova@campusface.edu',
      displayName: 'Elena Rostova',
      department: 'Architecture & Design',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      imageStorageKey: 'seed/elena_rostova.jpg'
    },
    {
      email: 'marcus.vance@campusface.edu',
      displayName: 'Marcus Vance',
      department: 'Computer Science & Engineering',
      imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
      imageStorageKey: 'seed/marcus_vance.jpg'
    },
    {
      email: 'sophia.chen@campusface.edu',
      displayName: 'Sophia Chen',
      department: 'Biomedical Sciences & Medicine',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      imageStorageKey: 'seed/sophia_chen.jpg'
    },
    {
      email: 'liam.o.connor@campusface.edu',
      displayName: 'Liam O’Connor',
      department: 'Economics & Finance',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      imageStorageKey: 'seed/liam_oconnor.jpg'
    },
    {
      email: 'aaliyah.patel@campusface.edu',
      displayName: 'Aaliyah Patel',
      department: 'Law & Public Policy',
      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      imageStorageKey: 'seed/aaliyah_patel.jpg'
    },
    {
      email: 'mateo.silva@campusface.edu',
      displayName: 'Mateo Silva',
      department: 'Fine Arts & Photography',
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      imageStorageKey: 'seed/mateo_silva.jpg'
    },
    {
      email: 'chloe.dubois@campusface.edu',
      displayName: 'Chloé Dubois',
      department: 'Media Arts & Communications',
      imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
      imageStorageKey: 'seed/chloe_dubois.jpg'
    },
    {
      email: 'david.kim@campusface.edu',
      displayName: 'David Kim',
      department: 'Electrical & Computer Engineering',
      imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
      imageStorageKey: 'seed/david_kim.jpg'
    }
  ];

  const createdStudents = [];

  for (const s of sampleStudents) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash,
        role: UserRole.STUDENT,
        accountStatus: AccountStatus.ACTIVE
      }
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        displayName: s.displayName,
        department: s.department,
        imageStorageKey: s.imageStorageKey,
        imageUrl: s.imageUrl,
        consentStatus: ConsentStatus.ACTIVE,
        consentRecordedAt: new Date(),
        profileStatus: ProfileStatus.APPROVED
      }
    });

    // Record explicit consent
    await prisma.consentRecord.create({
      data: {
        studentId: student.id,
        consentVersion: CURRENT_CONSENT_VERSION,
        termsText: CONSENT_TERMS_TEXT,
        status: ConsentStatus.ACTIVE,
        ipAddressHash: 'seed_ip_hash_local',
        recordedAt: new Date()
      }
    });

    // Initial Leaderboard Aggregate
    await prisma.leaderboardAggregate.create({
      data: {
        studentId: student.id,
        totalVotes: 0,
        rank: 0,
        lastReconciledAt: new Date()
      }
    });

    createdStudents.push(student);
  }

  console.log(`✅ Created ${createdStudents.length} consenting student profiles with consent records.`);

  // 4. Create Initial Battles Between Eligible Students
  const battles = [];
  for (let i = 0; i < createdStudents.length - 1; i += 2) {
    const battle = await prisma.battle.create({
      data: {
        contestantAId: createdStudents[i].id,
        contestantBId: createdStudents[i + 1].id,
        status: BattleStatus.ACTIVE
      }
    });
    battles.push(battle);
  }

  // Cross battles
  const crossBattle1 = await prisma.battle.create({
    data: {
      contestantAId: createdStudents[0].id,
      contestantBId: createdStudents[2].id,
      status: BattleStatus.ACTIVE
    }
  });
  battles.push(crossBattle1);

  console.log(`✅ Created ${battles.length} active 1-vs-1 student battles.`);

  // 5. Seed sample votes and comments
  if (battles.length > 0) {
    const firstBattle = battles[0];
    
    // Seed vote from voterUser
    await prisma.vote.create({
      data: {
        userId: voterUser.id,
        battleId: firstBattle.id,
        selectedStudentId: firstBattle.contestantAId,
        idempotencyKey: `seed-vote-${voterUser.id}-${firstBattle.id}`
      }
    });

    // Increment aggregate
    await prisma.leaderboardAggregate.update({
      where: { studentId: firstBattle.contestantAId },
      data: { totalVotes: 1 }
    });

    // Seed sample comments
    await prisma.comment.create({
      data: {
        userId: voterUser.id,
        battleId: firstBattle.id,
        body: 'Both contestants have such great style and energy! Clean match-up.',
        moderationStatus: ModerationStatus.VISIBLE
      }
    });

    await prisma.comment.create({
      data: {
        userId: adminUser.id,
        battleId: firstBattle.id,
        body: 'Welcome to CampusFace! Keep discussions respectful, supportive, and friendly.',
        moderationStatus: ModerationStatus.VISIBLE
      }
    });
  }

  console.log('✅ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
