import { prisma } from '../db';

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const map: Record<string, string | null> = {};
  for (const key of keys) map[key] = null;
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

export async function setSettings(values: Record<string, string | null>): Promise<void> {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
    )
  );
}
