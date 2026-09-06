import { useState } from 'react';
import { Send, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const orderSchema = z.object({
  name: z.string().trim().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak').max(100),
  phone: z.string().trim().min(9, 'Telefon raqamini to\'liq kiriting').max(20),
  message: z.string().max(500).optional(),
});

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderForm({ open, onOpenChange }: OrderFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { language } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const isMobile = useIsMobile();

  const t = {
    uz: {
      title: 'Buyurtma berish',
      description: 'Ma\'lumotlaringizni kiriting, biz siz bilan bog\'lanamiz',
      name: 'Ismingiz',
      namePlaceholder: 'To\'liq ismingiz',
      phone: 'Telefon raqamingiz',
      phonePlaceholder: '+998 90 123 45 67',
      message: 'Qo\'shimcha xabar',
      messagePlaceholder: 'Sizning xabaringiz (ixtiyoriy)',
      submit: 'Buyurtma yuborish',
      success: 'Buyurtmangiz qabul qilindi! Tez orada siz bilan bog\'lanamiz.',
      error: 'Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.',
      total: 'Jami',
      more: 'ta mahsulot',
      safe: 'Ma\'lumotlaringiz xavfsiz saqlanadi',
    },
    ru: {
      title: 'Оформить заказ',
      description: 'Введите ваши данные, мы свяжемся с вами',
      name: 'Ваше имя',
      namePlaceholder: 'Полное имя',
      phone: 'Номер телефона',
      phonePlaceholder: '+998 90 123 45 67',
      message: 'Дополнительное сообщение',
      messagePlaceholder: 'Ваше сообщение (необязательно)',
      submit: 'Отправить заказ',
      success: 'Ваш заказ принят! Мы скоро свяжемся с вами.',
      error: 'Произошла ошибка. Пожалуйста, попробуйте снова.',
      total: 'Итого',
      more: 'товаров',
      safe: 'Ваши данные в безопасности',
    },
  };

  const text = t[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = orderSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Savat bo\'sh',
        description: 'Iltimos, mahsulot qo\'shing',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        selected_options: {
          size: item.selectedSize,
          color: item.selectedColor,
        },
      }));

      const { data: orderResult, error: orderError } = await supabase.functions.invoke('create-order', {
        body: {
          customer_name: formData.name.trim(),
          customer_phone: formData.phone.replace(/\s/g, ''),
          customer_message: formData.message || undefined,
          items: orderItems,
        },
      });

      if (orderError) throw orderError;

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Buyurtma yaratishda xatolik');
      }

      toast({
        title: language === 'uz' ? 'Muvaffaqiyat!' : 'Успешно!',
        description: text.success,
      });

      clearCart();
      onOpenChange(false);
      setFormData({ name: '', phone: '', message: '' });
    } catch (error: any) {
      console.error('Order error:', error);
      toast({
        title: language === 'uz' ? 'Xatolik' : 'Ошибка',
        description: error.message || text.error,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const summary = (
    <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
      {items.slice(0, 3).map(item => (
        <div key={item.product.id} className="flex justify-between gap-3 text-sm">
          <span className="text-muted-foreground line-clamp-1">
            {language === 'uz' ? item.product.name_uz : item.product.name_ru} × {item.quantity}
          </span>
          <span className="whitespace-nowrap tabular-nums">{formatPrice(item.product.price * item.quantity)}</span>
        </div>
      ))}
      {items.length > 3 && (
        <p className="text-xs text-muted-foreground">+{items.length - 3} {text.more}</p>
      )}
      <div className="border-t border-border pt-2 flex justify-between items-baseline">
        <span className="text-sm font-medium">{text.total}</span>
        <span className="font-serif text-lg font-bold tabular-nums">{formatPrice(totalPrice)}</span>
      </div>
    </div>
  );

  const fields = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {text.name} *
        </Label>
        <Input
          id="name"
          className="h-12 rounded-xl text-base"
          placeholder={text.namePlaceholder}
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {text.phone} *
        </Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          className="h-12 rounded-xl text-base"
          placeholder={text.phonePlaceholder}
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          required
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {text.message}
        </Label>
        <Textarea
          id="message"
          className="rounded-xl text-base resize-none"
          placeholder={text.messagePlaceholder}
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          rows={3}
        />
      </div>
    </div>
  );

  const submitButton = (
    <Button type="submit" size="lg" className="w-full h-12 rounded-xl gap-2" disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {language === 'uz' ? 'Yuborilmoqda...' : 'Отправка...'}
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          {text.submit}
        </>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="p-0 rounded-t-3xl border-t max-h-[92vh] flex flex-col gap-0"
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            {/* Grabber + header */}
            <div className="flex-shrink-0 px-5 pt-3 pb-4 border-b border-border">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/25" />
              <h2 className="font-serif text-xl font-bold text-center">{text.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground text-center">{text.description}</p>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
              {summary}
              {fields}
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> {text.safe}
              </p>
            </div>

            {/* Sticky footer */}
            <div
              className="flex-shrink-0 border-t border-border bg-background px-5 pt-3"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {submitButton}
            </div>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {summary}
          {fields}
          {submitButton}
        </form>
      </DialogContent>
    </Dialog>
  );
}
