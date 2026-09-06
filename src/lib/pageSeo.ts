// Per-page SEO metadata (title/description/ogTitle) in both languages.
// Used with the useSEO hook to give each route unique meta tags.

export type Lang = 'uz' | 'ru';

type PageSeo = {
  title: string;
  description: string;
};

type PageKey = 'home' | 'catalog' | 'about' | 'contact' | 'faq';

const SEO: Record<PageKey, Record<Lang, PageSeo>> = {
  home: {
    uz: {
      title: 'OrisHome — Premium mebel va interyer',
      description:
        "OrisHome — zamonaviy va minimalist premium mebel do'koni: divanlar, stollar, kreslolar va to'liq xona dizayni. Samarqand va butun O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title: 'OrisHome — Премиальная мебель и интерьер',
      description:
        'OrisHome — современный магазин премиальной мебели: диваны, столы, кресла и комплексный дизайн интерьера. Доставка по Самарканду и всему Узбекистану.',
    },
  },
  catalog: {
    uz: {
      title: 'Katalog — OrisHome mebel va interyer',
      description:
        "OrisHome katalogi: divanlar, kreslolar, stollar, shkaflar va boshqa premium mebel mahsulotlari. Narxlar, o'lchamlar va foto bilan tanlang.",
    },
    ru: {
      title: 'Каталог — мебель и интерьер OrisHome',
      description:
        'Каталог OrisHome: диваны, кресла, столы, шкафы и другая премиальная мебель. Выбирайте по цене, размеру и фото.',
    },
  },
  about: {
    uz: {
      title: 'Biz haqimizda — OrisHome',
      description:
        "OrisHome haqida: 10+ yillik tajriba, 5000+ mahsulot va 3000+ mamnun mijoz. Bizning qadriyatlarimiz, jamoamiz va O'zbekistondagi filiallarimiz.",
    },
    ru: {
      title: 'О нас — OrisHome',
      description:
        'О компании OrisHome: 10+ лет опыта, 5000+ товаров и 3000+ довольных клиентов. Наши ценности, команда и филиалы по Узбекистану.',
    },
  },
  contact: {
    uz: {
      title: 'Aloqa — OrisHome filiallari va manzillari',
      description:
        "OrisHome filiallari, manzillari va telefon raqamlari. Xaritada joylashuvni ko'ring, savolingizni yozing yoki bevosita bog'laning.",
    },
    ru: {
      title: 'Контакты — филиалы и адреса OrisHome',
      description:
        'Филиалы, адреса и телефоны OrisHome. Посмотрите расположение на карте, напишите нам или свяжитесь напрямую.',
    },
  },
  faq: {
    uz: {
      title: 'Savol-javob — OrisHome',
      description:
        "OrisHome bo'yicha eng ko'p beriladigan savollar: buyurtma, yetkazib berish, to'lov, kafolat va individual buyurtmalar haqida javoblar.",
    },
    ru: {
      title: 'Вопросы и ответы — OrisHome',
      description:
        'Самые частые вопросы об OrisHome: оформление заказа, доставка, оплата, гарантия и индивидуальные заказы.',
    },
  },
};

export function getPageSeo(page: PageKey, language: Lang): PageSeo {
  return SEO[page][language] || SEO[page].uz;
}
