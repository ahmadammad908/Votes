import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

const prisma = new PrismaClient();

async function makeAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || 'admin@superior.edu').toLowerCase().trim();
  const password = args[1] || 'Superior2026!';

  console.log(`Setting up Admin account for: ${email}...`);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.ADMIN,
      passwordHash,
      accountStatus: AccountStatus.ACTIVE
    },
    create: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE
    }
  });

  console.log(`✅ Admin account is ready!`);
  console.log(`   Email:    ${user.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${user.role}`);
}

makeAdmin()
  .catch((e) => {
    console.error('❌ Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
