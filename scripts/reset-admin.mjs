// Creates or resets the admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env.
// Usage: npm run reset-admin
import bcrypt from "bcryptjs";
import { prisma } from "./_prisma.mjs";

const email = (process.env.ADMIN_EMAIL || "admin@biologyuniverse.test").toLowerCase();
const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "changeme123", 10);
await prisma.user.upsert({
  where: { email },
  update: { passwordHash, role: "admin" },
  create: { email, passwordHash, role: "admin", name: process.env.ADMIN_NAME || "Admin" },
});
console.log(`Admin ready: ${email} (password from ADMIN_PASSWORD)`);
await prisma.$disconnect();
