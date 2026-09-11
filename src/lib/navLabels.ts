// Small, hand-picked translation set for the always-visible navbar/footer
// labels (nav links + the header's contact CTA), independent of the big
// uz/ru-only translations.ts dictionary. Keyed by the actual language codes
// configured in the admin panel (Languages page) — falls back to Uzbek for
// any language not listed here.

export interface NavLabels {
  home: string;
  catalog: string;
  about: string;
  contact: string;
  cta: string;
}

const NAV_LABELS: Record<string, NavLabels> = {
  uz: { home: 'Bosh sahifa', catalog: 'Katalog', about: 'Biz xaqimizda', contact: 'Aloqa', cta: "Bog'lanish" },
  ru: { home: 'Главная', catalog: 'Каталог', about: 'О нас', contact: 'Контакты', cta: 'Связаться' },
  tgk: { home: 'Саҳифаи асосӣ', catalog: 'Каталог', about: 'Дар бораи мо', contact: 'Тамос', cta: 'Тамос гирифтан' },
  tg: { home: 'Саҳифаи асосӣ', catalog: 'Каталог', about: 'Дар бораи мо', contact: 'Тамос', cta: 'Тамос гирифтан' },
  kz: { home: 'Басты бет', catalog: 'Каталог', about: 'Біз туралы', contact: 'Байланыс', cta: 'Байланысу' },
  kk: { home: 'Басты бет', catalog: 'Каталог', about: 'Біз туралы', contact: 'Байланыс', cta: 'Байланысу' },
};

export function getNavLabels(languageCode: string): NavLabels {
  return NAV_LABELS[languageCode] ?? NAV_LABELS.uz;
}
