import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function placeholderImage(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="48" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function upsertSection(slug: string, nameUz: string, nameRu: string, sortOrder: number) {
  return prisma.section.upsert({
    where: { slug },
    update: { nameUz, nameRu },
    create: { slug, nameUz, nameRu, sortOrder },
  });
}

async function upsertCategory(opts: {
  slug: string;
  nameUz: string;
  nameRu: string;
  sectionId: string;
  sortOrder: number;
}) {
  return prisma.category.upsert({
    where: { slug: opts.slug },
    update: { nameUz: opts.nameUz, nameRu: opts.nameRu, sectionId: opts.sectionId },
    create: {
      slug: opts.slug,
      nameUz: opts.nameUz,
      nameRu: opts.nameRu,
      sectionId: opts.sectionId,
      sortOrder: opts.sortOrder,
    },
  });
}

async function upsertProduct(opts: {
  slug: string;
  nameUz: string;
  nameRu: string;
  descriptionUz: string;
  descriptionRu: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  showInDiscountBanner?: boolean;
  images?: string[];
}) {
  const data = {
    nameUz: opts.nameUz,
    nameRu: opts.nameRu,
    descriptionUz: opts.descriptionUz,
    descriptionRu: opts.descriptionRu,
    categoryId: opts.categoryId,
    price: opts.price,
    originalPrice: opts.originalPrice,
    showInDiscountBanner: opts.showInDiscountBanner ?? false,
    images: opts.images ?? [],
  };
  return prisma.product.upsert({
    where: { slug: opts.slug },
    update: data,
    create: { slug: opts.slug, ...data },
  });
}

async function upsertPromoTile(opts: {
  titleUz: string;
  titleRu: string;
  icon: string;
  href: string;
  sortOrder: number;
}) {
  const existing = await prisma.promoTile.findFirst({ where: { titleUz: opts.titleUz } });
  if (existing) {
    return prisma.promoTile.update({ where: { id: existing.id }, data: opts });
  }
  return prisma.promoTile.create({ data: opts });
}

async function upsertSet(opts: { titleUz: string; titleRu: string; productIds: string[]; sortOrder: number }) {
  const existing = await prisma.set.findFirst({ where: { titleUz: opts.titleUz } });
  if (existing) {
    return prisma.set.update({ where: { id: existing.id }, data: opts });
  }
  return prisma.set.create({ data: opts });
}

async function main() {
  console.log('== Bo\'limlar (Sections) ==');
  const livingRoom = await upsertSection('yashash-xonasi', 'Yashash xonasi', 'Гостиная', 1);
  const bedroom = await upsertSection('yotoqxona', 'Yotoqxona', 'Спальня', 2);
  const kitchen = await upsertSection('oshxona', 'Oshxona', 'Кухня', 3);
  console.log(`  ${livingRoom.nameUz}, ${bedroom.nameUz}, ${kitchen.nameUz}`);

  console.log('== Toifalar (Categories) ==');
  const sofas = await upsertCategory({
    slug: 'divanlar',
    nameUz: 'Divanlar',
    nameRu: 'Диваны',
    sectionId: livingRoom.id,
    sortOrder: 1,
  });
  const beds = await upsertCategory({
    slug: 'krevatlar',
    nameUz: 'Krevatlar',
    nameRu: 'Кровати',
    sectionId: bedroom.id,
    sortOrder: 2,
  });
  const kitchenTables = await upsertCategory({
    slug: 'oshxona-stollari',
    nameUz: 'Oshxona stollari',
    nameRu: 'Кухонные столы',
    sectionId: kitchen.id,
    sortOrder: 3,
  });
  console.log(`  ${sofas.nameUz}, ${beds.nameUz}, ${kitchenTables.nameUz}`);

  console.log('== Mahsulotlar (Products) ==');
  const milano = await upsertProduct({
    slug: 'milano-burchak-divani',
    nameUz: 'Milano burchak divani',
    nameRu: 'Угловой диван Milano',
    descriptionUz:
      "Zamonaviy dizaynli, yumshoq va bardoshli matoli Milano burchak divani. Katta oilalar uchun qulay, yotoqqa aylanadi.",
    descriptionRu:
      'Угловой диван Milano с современным дизайном, мягкой и износостойкой тканью. Удобен для больших семей, раскладывается в кровать.',
    categoryId: sofas.id,
    price: 8500000,
    originalPrice: 10600000,
    showInDiscountBanner: true,
    images: [placeholderImage('Milano', '#8a7458')],
  });
  const verona = await upsertProduct({
    slug: 'verona-ikki-kishilik-krovat',
    nameUz: 'Verona ikki kishilik krovat',
    nameRu: 'Двуспальная кровать Verona',
    descriptionUz: "Yog'och asosli, minimalist uslubdagi Verona krovati. Yotoqxonaga sokinlik va zamonaviylik baxsh etadi.",
    descriptionRu: 'Кровать Verona на деревянном каркасе в минималистичном стиле. Придаёт спальне уют и современность.',
    categoryId: beds.id,
    price: 4200000,
    images: [placeholderImage('Verona', '#5c6b73')],
  });
  const nordic = await upsertProduct({
    slug: 'nordic-oshxona-stoli',
    nameUz: 'Nordic oshxona stoli',
    nameRu: 'Кухонный стол Nordic',
    descriptionUz: "Skandinaviya uslubidagi Nordic oshxona stoli, 4-6 kishilik oilalar uchun mos keladi.",
    descriptionRu: 'Кухонный стол Nordic в скандинавском стиле, подходит для семей из 4-6 человек.',
    categoryId: kitchenTables.id,
    price: 3100000,
    images: [placeholderImage('Nordic', '#3f4a3d')],
  });
  console.log(`  ${milano.nameUz}, ${verona.nameUz}, ${nordic.nameUz}`);

  console.log('== Promo kartochkalar (Promo tiles) ==');
  await upsertPromoTile({
    titleUz: 'Bepul yetkazib berish',
    titleRu: 'Бесплатная доставка',
    icon: 'truck',
    href: '/catalog',
    sortOrder: 1,
  });
  await upsertPromoTile({
    titleUz: "12 oygacha muddatli to'lov",
    titleRu: 'Рассрочка до 12 месяцев',
    icon: 'credit-card',
    href: '/catalog',
    sortOrder: 2,
  });
  await upsertPromoTile({
    titleUz: '2 yil kafolat',
    titleRu: 'Гарантия 2 года',
    icon: 'shield-check',
    href: '/catalog',
    sortOrder: 3,
  });
  console.log('  3 ta promo kartochka tayyor');

  console.log('== Setlar to\'plami (Sets) ==');
  await upsertSet({
    titleUz: 'Yashash xonasi to\'plami',
    titleRu: 'Комплект для гостиной',
    productIds: [milano.id, nordic.id],
    sortOrder: 1,
  });
  await upsertSet({
    titleUz: 'Yotoqxona to\'plami',
    titleRu: 'Комплект для спальни',
    productIds: [verona.id],
    sortOrder: 2,
  });
  await upsertSet({
    titleUz: "To'liq uy jihozi to'plami",
    titleRu: 'Полный комплект для дома',
    productIds: [milano.id, verona.id, nordic.id],
    sortOrder: 3,
  });
  console.log('  3 ta set tayyor');

  console.log('\nTayyor! Barcha yozuvlar admin panelda tahrirlash uchun mavjud.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
