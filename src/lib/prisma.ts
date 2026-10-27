import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  const adapter = new PrismaPg({
    connectionString: url,
    // Keep a few connections open and reuse them: a cloud database far away is slow to connect,
    // so only the first request should pay for it.
    max: num(process.env.DATABASE_POOL_SIZE, 10),
    idleTimeoutMillis: 5 * 60_000,
    keepAlive: true,
    // Give up on a connection that never answers, with a clear error instead of hanging.
    connectionTimeoutMillis: num(process.env.DATABASE_CONNECT_TIMEOUT_MS, 15_000),
  });
  return new PrismaClient({
    adapter,
    // Prisma's default is to wait only 2 seconds for a connection before a transaction fails
    // ("Unable to start a transaction in the given time"). Slow networks need longer.
    transactionOptions: { maxWait: 15_000, timeout: 30_000 },
  });
}

/** One client per process (and one across hot reloads in development). */
export const prisma = globalThis.__prisma ?? (globalThis.__prisma = create());
