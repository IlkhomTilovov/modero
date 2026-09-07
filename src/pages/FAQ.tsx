import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { EditableText } from '@/components/EditableText';
import { getPageSeo } from '@/lib/pageSeo';

interface FAQItem {
  id: string;
  question_uz: string;
  question_ru: string;
  answer_uz: string;
  answer_ru: string;
  category: 'ordering' | 'delivery' | 'warranty' | 'custom' | 'payment';
}

const faqs: FAQItem[] = [
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

export default function FAQ() {
  const { language, t } = useLanguage();
  const { settings } = useSystemSettings();
  const seo = getPageSeo('faq', language);
  const whatsappDigits = (settings?.whatsapp_number || '').replace(/\D/g, '');

  useSEO({ title: seo.title, description: seo.description, ogTitle: seo.title, ogDescription: seo.description });

  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);

  const categoryNames = {
    ordering: t.faq.categories.ordering,
    delivery: t.faq.categories.delivery,
    warranty: t.faq.categories.warranty,
    custom: t.faq.categories.custom,
    payment: t.faq.categories.payment,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: language === 'uz' ? f.question_uz : f.question_ru,
      acceptedAnswer: {
        '@type': 'Answer',
        text: language === 'uz' ? f.answer_uz : f.answer_ru,
      },
    })),
  };

  return (
    <div id="hero" className="min-h-screen py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold mb-4">
            <EditableText 
              contentKey="faq_title" 
              fallback={t.faq.title}
              as="span"
              className="font-serif text-4xl font-bold"
              section="faq"
              field="title"
            />
          </h1>
          <p className="text-muted-foreground text-lg">
            <EditableText 
              contentKey="faq_subtitle" 
              fallback={t.faq.subtitle}
              as="span"
              className="text-lg"
              section="faq"
              field="subtitle"
            />
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {Object.entries(groupedFaqs).map(([category, items]) => (
            <div key={category} className="bg-card rounded-2xl shadow-warm p-6">
              <h2 className="font-serif text-xl font-bold mb-4">
                <EditableText 
                  contentKey={`faq_category_${category}`} 
                  fallback={categoryNames[category as keyof typeof categoryNames]}
                  as="span"
                  className="font-serif text-xl font-bold"
                  section="faq"
                  field={`category_${category}`}
                />
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {items.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline">
                      {language === 'uz' ? faq.question_uz : faq.question_ru}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {language === 'uz' ? faq.answer_uz : faq.answer_ru}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            <EditableText 
              contentKey="faq_cta_text" 
              fallback={language === 'uz' 
                ? "Savolingizga javob topa olmadingizmi?"
                : "Не нашли ответ на свой вопрос?"
              }
              as="span"
              section="faq"
              field="cta_text"
            />
          </p>
          <a
            href={whatsappDigits ? `https://wa.me/${whatsappDigits}` : '/contact'}
            target={whatsappDigits ? '_blank' : undefined}
            rel={whatsappDigits ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center gap-2 bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground px-6 py-3 rounded-full font-medium transition-colors"
          >
            <EditableText 
              contentKey="faq_cta_button" 
              fallback="WhatsApp orqali yozing"
              as="span"
              section="faq"
              field="cta_button"
            />
          </a>
        </div>
      </div>
    </div>
  );
}