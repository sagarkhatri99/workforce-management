import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User'
    }
  });

  await prisma.user.upsert({
    where: { email: 'worker@example.com' },
    update: {},
    create: {
      email: 'worker@example.com',
      password: hashedPassword,
      role: 'WORKER',
      firstName: 'Test',
      lastName: 'Worker'
    }
  });

  await prisma.shift.create({
    data: {
      title: 'Morning Shift',
      startTime: new Date('2026-01-28T08:00:00Z'),
      endTime: new Date('2026-01-28T16:00:00Z'),
      location: 'Main Office',
      status: 'OPEN'
    }
  });

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
