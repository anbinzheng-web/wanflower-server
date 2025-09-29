import { PrismaClient } from '@prisma/client'
import { registerGlobalProperties } from '../src/globalProperties';

registerGlobalProperties();
const prisma = new PrismaClient()
async function main() {
  const password = global.$md5('Qpalzm1.');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password: password
    },
    create: {
      email: 'admin@gmail.com',
      role: 'admin',
      password: password
    },
  })
  const user = await prisma.user.upsert({
    where: { email: 'user@gmail.com' },
    update: {
      password: password
    },
    create: {
      email: 'user@gmail.com',
      password: password,
      role: 'user'
    },
  })
  const staff = await prisma.user.upsert({
    where: { email: 'staff@gmail.com' },
    update: {
      password: password
    },
    create: {
      email: 'staff@gmail.com',
      password: password,
      role: 'staff'
    },
  })
  console.log({ admin, user, staff })
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