import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAllHeroSlides, type HeroSlide } from '@/hooks/useHeroSlides';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { convertImageToWebP } from '@/lib/imageToWebp';
import { LazyImage } from '@/components/LazyImage';
import { useLanguage } from '@/hooks/useLanguage';

type SlideForm = Omit<HeroSlide, 'id'>;

const emptyForm: SlideForm = {
  title_uz: '',
  title_ru: '',
  subtitle_uz: '',
  subtitle_ru: '',
  cta_text_uz: 'Katalogga o‘tish',
  cta_text_ru: 'Перейти в каталог',
  cta_link: '/catalog',
  image: '',
  mobile_image: '',
  sort_order: 0,
  is_active: true,
};

export default function HeroSlidesAdmin() {
  const { language } = useLanguage();
  const { data: slides = [], isLoading } = useAllHeroSlides();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState<SlideForm>(emptyForm);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [deleting, setDeleting] = useState<HeroSlide | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['hero_slides'] });
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: (slides[slides.length - 1]?.sort_order ?? 0) + 1 });
    setOpen(true);
  };

  const openEdit = (s: HeroSlide) => {
    setEditing(s);
    const { id, ...rest } = s;
    setForm({ ...rest, image: rest.image || '', mobile_image: rest.mobile_image || '' });
    setOpen(true);
  };

  const uploadImage = async (
    file: File,
    setUploading: (v: boolean) => void,
    onDone: (url: string) => void,
    prefix: string,
  ) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error(language === 'ru' ? 'Файл должен быть меньше 8 МБ' : 'Fayl 8 MB dan kichik bo‘lishi kerak');
      return;
    }
    setUploading(true);
    try {
      const webp = await convertImageToWebP(file);
      const path = `hero-slides/${prefix}-${Date.now()}.${webp.name.split('.').pop() || 'webp'}`;
      const { error } = await supabase.storage.from('product-images').upload(path, webp, { contentType: webp.type });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      onDone(publicUrl);
      toast.success(language === 'ru' ? 'Изображение загружено' : 'Rasm yuklandi');
    } catch (err: any) {
      toast.error(err.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.image) {
      toast.error(language === 'ru' ? 'Загрузите изображение' : 'Rasm yuklang');
      return;
    }
    const payload = {
      ...form,
      image: form.image || null,
      mobile_image: form.mobile_image || null,
    };
    const res = editing
      ? await supabase.from('hero_slides').update(payload).eq('id', editing.id)
      : await supabase.from('hero_slides').insert(payload);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(language === 'ru' ? 'Сохранено' : 'Saqlandi');
    setOpen(false);
    refresh();
  };

  const toggleActive = async (s: HeroSlide) => {
    await supabase.from('hero_slides').update({ is_active: !s.is_active }).eq('id', s.id);
    refresh();
  };

  const confirmRemove = async () => {
    if (!deleting) return;
    await supabase.from('hero_slides').delete().eq('id', deleting.id);
    toast.success(language === 'ru' ? 'Удалено' : 'O‘chirildi');
    setDeleting(null);
    refresh();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = slides[idx];
    const b = slides[idx + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from('hero_slides').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('hero_slides').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    refresh();
  };

  const displayTitle = (s: HeroSlide) => (language === 'ru' ? s.title_ru || s.title_uz : s.title_uz || s.title_ru);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ru' ? 'Баннер-карусель' : 'Banner karusel'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === 'ru'
              ? 'Слайды главного баннера на главной странице'
              : 'Bosh sahifadagi asosiy banner slaydlari'}
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ru' ? 'Новый слайд' : 'Yangi slayd'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          {language === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
        </div>
      ) : slides.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {language === 'ru' ? 'Пока нет слайдов' : 'Hozircha slaydlar yo‘q'}
          </p>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Создать первый' : 'Birinchisini yaratish'}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {slides.map((s, idx) => (
            <Card key={s.id} className="p-4 flex gap-4 items-stretch">
              <div className="w-48 aspect-[16/9] rounded-lg overflow-hidden bg-muted shrink-0">
                {s.image && <LazyImage src={s.image} alt={displayTitle(s)} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{displayTitle(s) || (language === 'ru' ? '(без заголовка)' : '(sarlavhasiz)')}</h3>
                  {!s.is_active && <Badge variant="secondary">{language === 'ru' ? 'Скрыт' : 'Yashirin'}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {language === 'ru' ? s.subtitle_ru : s.subtitle_uz}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  #{s.sort_order} • CTA: <span className="font-mono">{s.cta_link}</span>
                </p>
              </div>
              <div className="flex gap-1 shrink-0 items-start">
                <Button variant="ghost" size="icon" onClick={() => move(idx, -1)} disabled={idx === 0}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => move(idx, 1)} disabled={idx === slides.length - 1}>
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toggleActive(s)}>
                  {s.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(s)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? (language === 'ru' ? 'Редактировать слайд' : 'Slaydni tahrirlash')
                : (language === 'ru' ? 'Новый слайд' : 'Yangi slayd')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ru' ? 'Изображение (Desktop)' : 'Rasm (Desktop)'}</Label>
                {form.image ? (
                  <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mt-2 bg-muted">
                    <img src={form.image} alt="" className="w-full h-full object-cover" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setForm({ ...form, image: '' })}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="mt-2 flex flex-col items-center justify-center w-full aspect-[16/9] border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      {uploadingDesktop
                        ? (language === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...')
                        : (language === 'ru' ? 'Загрузить (1600×900)' : 'Yuklash (1600×900)')}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingDesktop}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadImage(f, setUploadingDesktop, (url) => setForm((p) => ({ ...p, image: url })), 'desktop');
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <Label>{language === 'ru' ? 'Изображение (Mobile, опционально)' : 'Rasm (Mobile, ixtiyoriy)'}</Label>
                {form.mobile_image ? (
                  <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mt-2 bg-muted">
                    <img src={form.mobile_image} alt="" className="w-full h-full object-cover" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setForm({ ...form, mobile_image: '' })}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="mt-2 flex flex-col items-center justify-center w-full aspect-[16/9] border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center px-2">
                      {uploadingMobile
                        ? (language === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...')
                        : (language === 'ru' ? 'Мобильная версия' : 'Mobil versiyasi')}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingMobile}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadImage(f, setUploadingMobile, (url) => setForm((p) => ({ ...p, mobile_image: url })), 'mobile');
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Titles */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{language === 'ru' ? 'Заголовок (UZ)' : 'Sarlavha (UZ)'}</Label>
                <Input value={form.title_uz} onChange={(e) => setForm({ ...form, title_uz: e.target.value })} placeholder="Yangi kolleksiya" />
              </div>
              <div>
                <Label>{language === 'ru' ? 'Заголовок (RU)' : 'Sarlavha (RU)'}</Label>
                <Input value={form.title_ru} onChange={(e) => setForm({ ...form, title_ru: e.target.value })} placeholder="Новая коллекция" />
              </div>
            </div>

            {/* Subtitles */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{language === 'ru' ? 'Подзаголовок (UZ)' : 'Matn (UZ)'}</Label>
                <Textarea rows={2} value={form.subtitle_uz} onChange={(e) => setForm({ ...form, subtitle_uz: e.target.value })} />
              </div>
              <div>
                <Label>{language === 'ru' ? 'Подзаголовок (RU)' : 'Matn (RU)'}</Label>
                <Textarea rows={2} value={form.subtitle_ru} onChange={(e) => setForm({ ...form, subtitle_ru: e.target.value })} />
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{language === 'ru' ? 'Текст кнопки (UZ)' : 'Tugma matni (UZ)'}</Label>
                <Input value={form.cta_text_uz} onChange={(e) => setForm({ ...form, cta_text_uz: e.target.value })} />
              </div>
              <div>
                <Label>{language === 'ru' ? 'Текст кнопки (RU)' : 'Tugma matni (RU)'}</Label>
                <Input value={form.cta_text_ru} onChange={(e) => setForm({ ...form, cta_text_ru: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{language === 'ru' ? 'Ссылка кнопки' : 'Tugma havolasi'}</Label>
                <Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/catalog" />
              </div>
              <div>
                <Label>{language === 'ru' ? 'Порядок' : 'Tartib'}</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label>{language === 'ru' ? 'Активен' : 'Faol'}</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {language === 'ru' ? 'Отмена' : 'Bekor qilish'}
            </Button>
            <Button onClick={save}>
              {language === 'ru' ? 'Сохранить' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Удалить слайд?' : 'Slaydni o‘chirish?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && displayTitle(deleting)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ru' ? 'Отмена' : 'Bekor qilish'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'ru' ? 'Удалить' : 'O‘chirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
