import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('AdminPassword123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookingapp.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@bookingapp.com',
      passwordHash: hashedPassword,
      city: 'Hyderabad',
      role: UserRole.ADMIN,
    },
  });

  console.log(`Admin created: ${admin.email}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
