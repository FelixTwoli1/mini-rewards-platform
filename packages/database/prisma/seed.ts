import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  const ADMIN_HASH    = await bcrypt.hash('Admin@123456', 12);
  const CUSTOMER_HASH = await bcrypt.hash('Customer@123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rewardsplatform.com' },
    update: { password: ADMIN_HASH },
    create: {
      email: 'admin@rewardsplatform.com',
      firstName: 'Platform',
      lastName: 'Admin',
      password: ADMIN_HASH,
      role: UserRole.ADMIN,
      rewardAccount: { create: { balance: 0 } },
      wallet: { create: { balance: 0.0 } },
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'demo@rewardsplatform.com' },
    update: { password: CUSTOMER_HASH },
    create: {
      email: 'demo@rewardsplatform.com',
      firstName: 'Demo',
      lastName: 'Customer',
      password: CUSTOMER_HASH,
      role: UserRole.CUSTOMER,
      rewardAccount: { create: { balance: 1000, totalEarned: 1000 } },
      wallet: { create: { balance: 10.0 } },
    },
  });

  await prisma.rewardRule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000001', name: 'SIGNUP_BONUS', description: 'Points awarded on sign up', points: 500, isActive: true },
  });
  await prisma.rewardRule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000002', name: 'PURCHASE_REWARD', description: '10 points per $1 spent', points: 10, isActive: true },
  });
  await prisma.rewardRule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000003', name: 'PROMOTIONAL_CAMPAIGN', description: 'Bonus promotional points', points: 200, isActive: true },
  });

  console.log(`✅ Admin:    ${admin.email}`);
  console.log(`✅ Customer: ${customer.email}  (1000 pts | $10 wallet)`);
  console.log('✅ 3 reward rules seeded');
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
