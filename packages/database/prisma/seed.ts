import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rewardsplatform.com' },
    update: {},
    create: {
      email: 'admin@rewardsplatform.com',
      firstName: 'Platform',
      lastName: 'Admin',
      password: adminPassword,
      role: UserRole.ADMIN,
      rewardAccount: {
        create: { balance: 0 },
      },
      wallet: {
        create: { balance: 0.0 },
      },
    },
  });

  // Create demo customer
  const customerPassword = await bcrypt.hash('Customer@123456', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'demo@rewardsplatform.com' },
    update: {},
    create: {
      email: 'demo@rewardsplatform.com',
      firstName: 'Demo',
      lastName: 'Customer',
      password: customerPassword,
      role: UserRole.CUSTOMER,
      rewardAccount: {
        create: { balance: 1000 },
      },
      wallet: {
        create: { balance: 5.0 },
      },
    },
  });

  // Seed reward rules
  await prisma.rewardRule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'SIGNUP_BONUS',
      description: 'Points awarded on first sign up',
      points: 500,
      isActive: true,
    },
  });

  await prisma.rewardRule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'PURCHASE_REWARD',
      description: 'Points per $1 spent on purchase',
      points: 10,
      isActive: true,
    },
  });

  await prisma.rewardRule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'PROMOTIONAL_CAMPAIGN',
      description: 'Bonus points for promotional campaigns',
      points: 200,
      isActive: true,
    },
  });

  console.log(`Seeded admin: ${admin.email}`);
  console.log(`Seeded customer: ${customer.email}`);
  console.log('Reward rules seeded.');
  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
