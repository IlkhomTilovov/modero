import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('== Languages ==');
  await prisma.language.upsert({
    where: { code: 'uz' },
    update: {},
    create: { code: 'uz', name: "O'zbekcha", isDefault: true, sortOrder: 0 },
  });
  await prisma.language.upsert({
    where: { code: 'ru' },
    update: {},
    create: { code: 'ru', name: 'Русский', isDefault: false, sortOrder: 1 },
  });
  console.log('  uz, ru ready');

  console.log('== Sections ==');
  const sections = await prisma.section.findMany();
  for (const s of sections) {
    if (s.translations && Object.keys(s.translations as object).length > 0) continue;
    await prisma.section.update({
      where: { id: s.id },
      data: { translations: { uz: { name: s.nameUz }, ru: { name: s.nameRu } } },
    });
  }
  console.log(`  ${sections.length} section(s) backfilled`);

  console.log('== Categories ==');
  const categories = await prisma.category.findMany();
  for (const c of categories) {
    if (c.translations && Object.keys(c.translations as object).length > 0) continue;
    await prisma.category.update({
      where: { id: c.id },
      data: {
        translations: {
          uz: { name: c.nameUz, metaTitle: c.metaTitleUz ?? '', metaDescription: c.metaDescriptionUz ?? '' },
          ru: { name: c.nameRu, metaTitle: c.metaTitleRu ?? '', metaDescription: c.metaDescriptionRu ?? '' },
        },
      },
    });
  }
  console.log(`  ${categories.length} category(ies) backfilled`);

  console.log('== Products ==');
  const products = await prisma.product.findMany();
  for (const p of products) {
    if (p.translations && Object.keys(p.translations as object).length > 0) continue;
    await prisma.product.update({
      where: { id: p.id },
      data: {
        translations: {
          uz: {
            name: p.nameUz,
            description: p.descriptionUz ?? '',
            fullDescription: p.fullDescriptionUz ?? '',
            metaTitle: p.metaTitleUz ?? '',
            metaDescription: p.metaDescriptionUz ?? '',
          },
          ru: {
            name: p.nameRu,
            description: p.descriptionRu ?? '',
            fullDescription: p.fullDescriptionRu ?? '',
            metaTitle: p.metaTitleRu ?? '',
            metaDescription: p.metaDescriptionRu ?? '',
          },
        },
      },
    });
  }
  console.log(`  ${products.length} product(s) backfilled`);

  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
