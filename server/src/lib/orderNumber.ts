import { prisma } from '../db';

// Collision-free: backed by a real Postgres sequence instead of Math.random().
export async function nextOrderNumber(): Promise<string> {
  const [{ nextval }] = await prisma.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('order_number_seq') AS nextval`;
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seqPart = nextval.toString().padStart(4, '0');
  return `ORD-${datePart}-${seqPart}`;
}
