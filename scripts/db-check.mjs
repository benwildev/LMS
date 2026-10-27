// Tests the database connection and tells you what is wrong.
// Usage: npm run db:check
import { prisma } from "./_prisma.mjs";

const url = new URL(process.env.DATABASE_URL.replace(/^postgres(ql)?:/, "http:"));
console.log(`Connecting to ${url.hostname}:${url.port || 5432} / ${url.pathname.slice(1)} as ${url.username} …`);
const t0 = Date.now();
try {
  await prisma.$queryRaw`SELECT 1`;
  const connectMs = Date.now() - t0;
  const t1 = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  console.log(`✔ Connected in ${connectMs} ms; a query on the open connection takes ${Date.now() - t1} ms.`);
  if (connectMs > 2000) console.log("  The database is slow to connect (far away or waking from sleep). The app allows for this.");
  try {
    const n = await prisma.setting.count();
    const users = await prisma.user.count();
    console.log(`✔ Tables exist (${n} settings, ${users} users).`);
  } catch {
    console.log("✘ Connected, but the tables are missing. Run: npm run db:migrate");
  }
} catch (e) {
  const m = String(e?.message || e);
  console.log("✘ Could not connect.");
  if (/Authentication failed|password/i.test(m)) console.log("  The username or password in DATABASE_URL is wrong.");
  else if (/does not exist/i.test(m)) console.log("  The database name in DATABASE_URL does not exist. Create it first.");
  else if (/Can't reach|ECONNREFUSED/i.test(m)) console.log("  Nothing is answering at that host and port. Is PostgreSQL running?");
  else if (/ssl|SSL|pg_hba/i.test(m)) console.log("  The server needs SSL: add ?sslmode=require to the end of DATABASE_URL.");
  else if (/timeout|transaction/i.test(m)) console.log("  The server did not answer in time. Check the host, your network, or add ?sslmode=require for a cloud database.");
  console.log("\n" + m.split("\n").filter(Boolean).slice(-3).join("\n"));
  process.exitCode = 1;
}
await prisma.$disconnect().catch(() => {});
