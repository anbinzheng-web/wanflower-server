import { PrismaClient } from '@prisma/client'
import { registerGlobalProperties } from '../src/globalProperties';

registerGlobalProperties();
const prisma = new PrismaClient()

async function main() {
  console.log('开始创建测试用户...');
  
  // 使用全局注册的密码加密函数
  const password = await global.$hashPassword('Qpalzm1.');
  
  // 创建管理员账号
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password: password,
      is_verified: true,
      is_active: true,
      first_name: 'Admin',
      last_name: 'User',
    },
    create: {
      email: 'admin@gmail.com',
      role: 'admin',
      password: password,
      is_verified: true,
      is_active: true,
      first_name: 'Admin',
      last_name: 'User',
    },
  })

  // 创建普通用户账号
  const user = await prisma.user.upsert({
    where: { email: 'user@gmail.com' },
    update: {
      password: password,
      is_verified: true,
      is_active: true,
      first_name: 'Test',
      last_name: 'User',
    },
    create: {
      email: 'user@gmail.com',
      password: password,
      role: 'user',
      is_verified: true,
      is_active: true,
      first_name: 'Test',
      last_name: 'User',
    },
  })

  // 创建员工账号
  const staff = await prisma.user.upsert({
    where: { email: 'staff@gmail.com' },
    update: {
      password: password,
      is_verified: true,
      is_active: true,
      first_name: 'Staff',
      last_name: 'User',
    },
    create: {
      email: 'staff@gmail.com',
      password: password,
      role: 'staff',
      is_verified: true,
      is_active: true,
      first_name: 'Staff',
      last_name: 'User',
    },
  })

  // 创建未验证的测试账号（用于测试邮箱验证功能）
  const unverifiedUser = await prisma.user.upsert({
    where: { email: 'unverified@gmail.com' },
    update: {
      password: password,
      is_verified: false,
      is_active: true,
      first_name: 'Unverified',
      last_name: 'User',
    },
    create: {
      email: 'unverified@gmail.com',
      password: password,
      role: 'user',
      is_verified: false,
      is_active: true,
      first_name: 'Unverified',
      last_name: 'User',
    },
  })

  // 创建被禁用的测试账号（用于测试账户状态功能）
  const disabledUser = await prisma.user.upsert({
    where: { email: 'disabled@gmail.com' },
    update: {
      password: password,
      is_verified: true,
      is_active: false,
      first_name: 'Disabled',
      last_name: 'User',
    },
    create: {
      email: 'disabled@gmail.com',
      password: password,
      role: 'user',
      is_verified: true,
      is_active: false,
      first_name: 'Disabled',
      last_name: 'User',
    },
  })

  // 创建一些测试邮箱验证码
  const verificationCodes = [
    {
      email: 'unverified@gmail.com',
      code: '123456',
      type: 'REGISTER',
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10分钟后过期
      is_used: false,
    },
    {
      email: 'admin@gmail.com',
      code: '654321',
      type: 'RESET_PASSWORD',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      is_used: false,
    },
  ];

  for (const codeData of verificationCodes) {
    // 先删除现有的验证码，然后创建新的
    await prisma.emailVerification.deleteMany({
      where: {
        email: codeData.email,
        type: codeData.type as any,
      },
    });
    
    await prisma.emailVerification.create({
      data: {
        email: codeData.email,
        code: codeData.code,
        type: codeData.type as any,
        expires_at: codeData.expires_at,
        is_used: codeData.is_used,
      },
    });
  }

  console.log('测试用户创建完成:');
  console.log('✅ 管理员账号:', { email: admin.email, role: admin.role, verified: admin.is_verified });
  console.log('✅ 普通用户账号:', { email: user.email, role: user.role, verified: user.is_verified });
  console.log('✅ 员工账号:', { email: staff.email, role: staff.role, verified: staff.is_verified });
  console.log('✅ 未验证用户账号:', { email: unverifiedUser.email, role: unverifiedUser.role, verified: unverifiedUser.is_verified });
  console.log('✅ 禁用用户账号:', { email: disabledUser.email, role: disabledUser.role, active: disabledUser.is_active });
  console.log('✅ 测试验证码已创建');
  
  console.log('\n📋 测试账号信息:');
  console.log('所有账号密码: Qpalzm1.');
  console.log('验证码: 123456 (unverified@gmail.com)');
  console.log('重置密码验证码: 654321 (admin@gmail.com)');
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })