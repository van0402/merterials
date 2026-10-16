import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@smee.vn';
  const newPassword = process.env.NEW_ADMIN_PASSWORD;

  if (!newPassword || newPassword.length < 8) {
    throw new Error('Cần đặt NEW_ADMIN_PASSWORD (ít nhất 8 ký tự)');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
    if (!user) {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, status: true },
    });
    console.log(`Không thấy ${email}. Các tài khoản ADMIN hiện có:`, admins);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, 12), status: 'ACTIVE' },
  });

  console.log(`Đã đặt lại mật khẩu cho ${email} (vai trò ${user.role})`);
}

main().finally(() => prisma.$disconnect());