import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  console.log('🗑️  Cleaning all data from database...');

  // Foreign key order mein delete karna zaroori hai
  await prisma.auditLog.deleteMany();
  await prisma.leaderboardAggregate.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.report.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.battle.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ All data removed. Database is now empty.');
}

clean()
  .catch((e) => {
    console.error('❌ Error during clean:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
