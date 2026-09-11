// Per-page SEO metadata (title/description) in both languages.
// Single source of truth used by both the client (useSEO hook) and the
// server's bot-prerender routes, so a crawler and a real visitor always see
// the same title/description for a given page.

export type Lang = 'uz' | 'ru';

export type PageSeo = {
  title: string;
  description: string;
};

export type PageKey = 'home' | 'catalog' | 'about' | 'contact' | 'faq';

const SEO: Record<PageKey, Record<Lang, PageSeo>> = {
  home: {
    uz: {
      title:
        "Moredo — Toshkentda premium mebel do'koni | Divan, stol, kreslo va to'liq interyer yechimlari",
      description:
        "Moredo — Toshkentdagi zamonaviy va minimalist premium mebel do'koni: divanlar, stollar, kreslolar va to'liq xona dizayni. Toshkent va butun O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title:
        'Moredo — магазин премиальной мебели в Ташкенте | Диваны, столы, кресла и комплексные решения для интерьера',
      description:
        'Moredo — современный магазин премиальной мебели в Ташкенте: диваны, столы, кресла и комплексный дизайн интерьера. Доставка по Ташкенту и всему Узбекистану.',
    },
  },
  catalog: {
    uz: {
      title: 'Katalog — Moredo mebel va interyer',
      description:
        "Moredo katalogi: divanlar, kreslolar, stollar, shkaflar va boshqa premium mebel mahsulotlari. Narxlar, o'lchamlar va foto bilan tanlang.",
    },
    ru: {
      title: 'Каталог — мебель и интерьер Moredo',
      description:
        'Каталог Moredo: диваны, кресла, столы, шкафы и другая премиальная мебель. Выбирайте по цене, размеру и фото.',
    },
  },
  about: {
    uz: {
      title: 'Biz haqimizda — Moredo',
      description:
        "Moredo haqida: 10+ yillik tajriba, 5000+ mahsulot va 3000+ mamnun mijoz. Bizning qadriyatlarimiz, jamoamiz va O'zbekistondagi filiallarimiz.",
    },
    ru: {
      title: 'О нас — Moredo',
      description:
        'О компании Moredo: 10+ лет опыта, 5000+ товаров и 3000+ довольных клиентов. Наши ценности, команда и филиалы по Узбекистану.',
    },
  },
  contact: {
    uz: {
      title: 'Aloqa — Moredo filiallari va manzillari',
      description:
        "Moredo filiallari, manzillari va telefon raqamlari. Xaritada joylashuvni ko'ring, savolingizni yozing yoki bevosita bog'laning.",
    },
    ru: {
      title: 'Контакты — филиалы и адреса Moredo',
      description:
        'Филиалы, адреса и телефоны Moredo. Посмотрите расположение на карте, напишите нам или свяжитесь напрямую.',
    },
  },
  faq: {
    uz: {
      title: 'Savol-javob — Moredo',
      description:
        "Moredo bo'yicha eng ko'p beriladigan savollar: buyurtma, yetkazib berish, to'lov, kafolat va individual buyurtmalar haqida javoblar.",
    },
    ru: {
      title: 'Вопросы и ответы — Moredo',
      description:
        'Самые частые вопросы об Moredo: оформление заказа, доставка, оплата, гарантия и индивидуальные заказы.',
    },
  },
};

export function getPageSeo(page: PageKey, language: Lang): PageSeo {
  return SEO[page][language] || SEO[page].uz;
}
