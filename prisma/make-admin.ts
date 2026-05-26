/**
 * Promote a user to admin by email.
 * Usage: pnpm db:make-admin user@example.com
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm db:make-admin <email>");
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`✗ No user found with email: ${email}`);
    console.error("  Register an account on the site first, then run this again.");
    process.exit(1);
  }
  await prisma.user.update({ where: { email }, data: { role: "admin" } });
  console.log(`✓ ${email} is now an admin`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
