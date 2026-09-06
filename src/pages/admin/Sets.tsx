import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAllSets, type ProductSet } from '@/hooks/useSets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { convertImageToWebP } from '@/lib/imageToWebp';
import { LazyImage } from '@/components/LazyImage';
import { useAdminT } from '@/hooks/useAdminT';
import { useLanguage } from '@/hooks/useLanguage';

interface ProductLite { id: string; name_uz: string; name_ru: string; images: string[] | null; }

const emptyForm = {
  title_uz: '', title_ru: '', image: '', href: '/catalog',
  product_ids: [] as string[], sort_order: 0, is_active: true,
};

export default function SetsAdmin() {
  const t = useAdminT().sets;
  const { language } = useLanguage();
  const { sets, loading, refetch } = useAllSets();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductSet | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductLite[]>([]);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<ProductSet | null>(null);

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name_uz, name_ru, images')
      .eq('is_active', true)
      .order('name_uz')
      .then(({ data }) => setAllProducts((data || []) as ProductLite[]));
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: (sets[sets.length - 1]?.sort_order ?? 0) + 1 });
    setOpen(true);
  };

  const openEdit = (s: ProductSet) => {
    setEditing(s);
    setForm({
      title_uz: s.title_uz, title_ru: s.title_ru,
      image: s.image || '', href: s.href || '/catalog',
      product_ids: s.product_ids || [],
      sort_order: s.sort_order, is_active: s.is_active,
    });
    setOpen(true);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t.imageSizeError); return; }
    setUploading(true);
    try {
      const webp = await convertImageToWebP(file);
      // Fayl nomiga tayanmaymiz (bo'sh joy/kirill harflar InvalidKey xatosini beradi)
      const ext = (webp.type.split('/')[1] || 'webp').replace(/[^a-z0-9]/gi, '') || 'webp';
      const path = `sets/set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, webp, { contentType: webp.type, upsert: true, cacheControl: '31536000' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setForm(f => ({ ...f, image: publicUrl }));
      toast.success(t.imageUploaded);
    } catch (err: any) {
      toast.error(t.uploadError(err.message));
    } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title_uz.trim() || !form.title_ru.trim()) { toast.error(t.fillTitles); return; }
    if (!form.image) { toast.error(t.uploadImageError); return; }
    const payload = { ...form, image: form.image || null, href: form.href || '/catalog' };
    const res = editing
      ? await supabase.from('sets').update(payload).eq('id', editing.id)
      : await supabase.from('sets').insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? t.updated : t.added);
    setOpen(false);
    refetch();
  };

  const toggleActive = async (s: ProductSet) => {
    await supabase.from('sets').update({ is_active: !s.is_active }).eq('id', s.id);
    refetch();
  };

  const confirmRemove = async () => {
    if (!deleting) return;
    await supabase.from('sets').delete().eq('id', deleting.id);
    toast.success(t.deleted);
    setDeleting(null);
    refetch();
  };

  const toggleProduct = (id: string) => {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(id)
        ? f.product_ids.filter(x => x !== id)
        : [...f.product_ids, id],
    }));
  };

  const filteredProducts = allProducts.filter(p =>
    p.name_uz.toLowerCase().includes(search.toLowerCase()) ||
    p.name_ru.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />{t.newSet}</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t.loading}</div>
      ) : sets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">{t.empty}</p>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />{t.createFirst}</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sets.map(s => {
            const displayTitle = language === 'ru' ? (s.title_ru || s.title_uz) : s.title_uz;
            const secondaryTitle = language === 'ru' ? s.title_uz : s.title_ru;
            return (
              <Card key={s.id} className="p-4 flex gap-4 items-stretch">
                <div className="w-40 self-stretch rounded-lg overflow-hidden bg-muted shrink-0">
                  {s.image && <LazyImage src={s.image} alt={displayTitle} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{displayTitle}</h3>
                    {!s.is_active && <Badge variant="secondary">{t.hidden}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{secondaryTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.productsCount(s.product_ids?.length || 0)} • #{s.sort_order}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(s)}>
                    {s.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(s)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? t.editTitle : t.newTitle}</DialogTitle></DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.titleUz}</Label>
                <Input value={form.title_uz} onChange={e => setForm({ ...form, title_uz: e.target.value })} placeholder={t.titlePlaceholderUz} />
              </div>
              <div>
                <Label>{t.titleRu}</Label>
                <Input value={form.title_ru} onChange={e => setForm({ ...form, title_ru: e.target.value })} placeholder={t.titlePlaceholderRu} />
              </div>
            </div>

            <div>
              <Label>{t.mainImage}</Label>
              {form.image ? (
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mt-2 bg-muted">
                  <img src={form.image} alt="" width={640} height={480} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setForm({ ...form, image: '' })}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">{uploading ? t.uploading : t.uploadImage}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={uploading} />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.link}</Label>
                <Input value={form.href} onChange={e => setForm({ ...form, href: e.target.value })} placeholder="/catalog" />
              </div>
              <div>
                <Label>{t.sortOrder}</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label>{t.active}</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t.productsInSet(form.product_ids.length)}</Label>
              </div>
              <Input placeholder={t.searchProducts} value={search} onChange={e => setSearch(e.target.value)} className="mb-2" />
              <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
                {filteredProducts.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">{t.productNotFound}</p>
                ) : filteredProducts.map(p => {
                  const selected = form.product_ids.includes(p.id);
                  const productName = language === 'ru' ? (p.name_ru || p.name_uz) : p.name_uz;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className={`w-full flex items-center gap-3 p-2 hover:bg-muted/50 text-left ${selected ? 'bg-primary/5' : ''}`}
                    >
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                        {p.images?.[0] && <img src={p.images[0]} alt="" width={40} height={40} loading="lazy" decoding="async" className="w-full h-full object-cover" />}
                      </div>
                      <span className="flex-1 text-sm truncate">{productName}</span>
                      {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button onClick={save}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteConfirm(language === 'ru' ? (deleting?.title_ru || deleting?.title_uz || '') : (deleting?.title_uz || ''))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
