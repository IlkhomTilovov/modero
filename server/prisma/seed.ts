import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || 'Admin';

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in server/.env before seeding.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email} — skipping user creation.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash } });
      await tx.profile.create({ data: { userId: user.id, name, email, status: 'active' } });
      await tx.userRole.create({ data: { userId: user.id, role: 'admin' } });
    });
    console.log(`Created admin user: ${email}`);
  }

  const settingsCount = await prisma.systemSettings.count();
  if (settingsCount === 0) {
    await prisma.systemSettings.create({
      data: {
        siteName: 'Modero',
        defaultLanguage: 'uz',
        languagesEnabled: ['uz', 'ru'],
      },
    });
    console.log('Created default system_settings row.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
