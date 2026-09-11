// Single source of truth for FAQ content, shared by the /faq page (renders
// the accordion + FAQPage JSON-LD for JS-rendering crawlers) and the
// server's bot-prerender route (renders the same FAQPage JSON-LD for
// crawlers that don't execute JavaScript, e.g. GPTBot).

export interface FaqItem {
  id: string;
  question_uz: string;
  question_ru: string;
  answer_uz: string;
  answer_ru: string;
  category: 'ordering' | 'delivery' | 'warranty' | 'custom' | 'payment';
}

export const faqs: FaqItem[] = [
  {
    id: '1',
    question_uz: "Buyurtma qanday beriladi?",
    question_ru: "Как оформить заказ?",
    answer_uz: "Buyurtma berish uchun saytdan mahsulotni tanlang va \"Buyurtma berish\" tugmasini bosing. So'ngra savatga o'ting va buyurtmani rasmiylashtiring.",
    answer_ru: "Для оформления заказа выберите товар на сайте и нажмите \"Заказать\". Затем перейдите в корзину и оформите заказ.",
    category: 'ordering',
  },
  {
    id: '2',
    question_uz: "Yetkazib berish qancha vaqt oladi?",
    question_ru: "Сколько времени занимает доставка?",
    answer_uz: "Toshkent shahri bo'ylab 1-2 kun ichida yetkazib beriladi. Viloyatlarga 3-5 kun ichida.",
    answer_ru: "По Ташкенту доставка в течение 1-2 дней. В регионы — 3-5 дней.",
    category: 'delivery',
  },
  {
    id: '3',
    question_uz: "Kafolat muddati qancha?",
    question_ru: "Какой срок гарантии?",
    answer_uz: "Barcha mahsulotlarimizga 2 yil kafolat beramiz.",
    answer_ru: "На все наши товары предоставляется гарантия 2 года.",
    category: 'warranty',
  },
  {
    id: '4',
    question_uz: "Mahsulotni yig'ib-o'rnatib berasizlarmi?",
    question_ru: "Вы собираете и устанавливаете мебель?",
    answer_uz: "Ha, barcha mebellarni bepul yig'ib, joyiga o'rnatib beramiz.",
    answer_ru: "Да, мы бесплатно собираем и устанавливаем всю мебель на месте.",
    category: 'custom',
  },
  {
    id: '5',
    question_uz: "To'lov qanday amalga oshiriladi?",
    question_ru: "Как производится оплата?",
    answer_uz: "Naqd pul, bank kartasi, Click, Payme orqali, shuningdek 12 oygacha muddatli to'lov bilan ham to'lash mumkin.",
    answer_ru: "Можно оплатить наличными, банковской картой, через Click, Payme, а также в рассрочку до 12 месяцев.",
    category: 'payment',
  },
  {
    id: '6',
    question_uz: "Yetkazib berish pullikmi?",
    question_ru: "Доставка платная?",
    answer_uz: "Toshkent shahri bo'ylab barcha buyurtmalar uchun yetkazib berish bepul.",
    answer_ru: "Доставка по Ташкенту бесплатна для всех заказов.",
    category: 'delivery',
  },
];
