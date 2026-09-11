import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.siteContent.findMany();
  let count = 0;
  for (const row of rows) {
    if (row.translations && Object.keys(row.translations as object).length > 0) continue;
    const translations: Record<string, { value: string }> = {};
    if (row.valueUz) translations.uz = { value: row.valueUz };
    if (row.valueRu) translations.ru = { value: row.valueRu };
    if (Object.keys(translations).length === 0) continue;
    await prisma.siteContent.update({ where: { id: row.id }, data: { translations } });
    count++;
  }
  console.log(`SiteContent backfilled: ${count} of ${rows.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
