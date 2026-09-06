import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, MapPin, Phone, ExternalLink } from 'lucide-react';

interface Branch {
  id: string;
  name_uz: string;
  name_ru: string;
  address_uz: string;
  address_ru: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  order_index: number;
  is_active: boolean;
}

const empty: Omit<Branch, 'id'> = {
  name_uz: '',
  name_ru: '',
  address_uz: '',
  address_ru: '',
  phone: '',
  latitude: 39.6547,
  longitude: 66.9757,
  order_index: 0,
  is_active: true,
};

export default function Branches() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Branch, 'id'>>(empty);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) {
      toast({ title: 'Xatolik', description: error.message, variant: 'destructive' });
    } else {
      setRows((data as Branch[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...empty, order_index: rows.length });
    setOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditingId(b.id);
    setForm({
      name_uz: b.name_uz,
      name_ru: b.name_ru,
      address_uz: b.address_uz,
      address_ru: b.address_ru,
      phone: b.phone ?? '',
      latitude: Number(b.latitude),
      longitude: Number(b.longitude),
      order_index: b.order_index,
      is_active: b.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name_uz.trim() || !form.address_uz.trim()) {
      toast({ title: 'Nom va manzil (UZ) shart', variant: 'destructive' });
      return;
    }
    if (!form.latitude || !form.longitude) {
      toast({ title: 'Koordinatalarni kiriting', variant: 'destructive' });
      return;
    }
    const payload = {
      ...form,
      phone: form.phone?.trim() || null,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };
    const { error } = editingId
      ? await supabase.from('branches').update(payload).eq('id', editingId)
      : await supabase.from('branches').insert(payload);
    if (error) {
      toast({ title: 'Xatolik', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'Yangilandi' : "Qo'shildi" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Filialni o'chirishga ishonchingiz komilmi?")) return;
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) {
      toast({ title: 'Xatolik', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: "O'chirildi" });
    load();
  };

  const toggleActive = async (b: Branch) => {
    const { error } = await supabase.from('branches').update({ is_active: !b.is_active }).eq('id', b.id);
    if (error) toast({ title: 'Xatolik', description: error.message, variant: 'destructive' });
    else load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Filiallar (Manzillar)</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kontakt sahifasida Yandex xaritada ko'rsatiladi
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Yangi filial
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Hozircha filial yo'q. "Yangi filial" tugmasini bosing.
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((b) => (
            <Card key={b.id} className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{b.name_uz}</h3>
                  {!b.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Nofaol
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{b.address_uz}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  {b.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {b.phone}
                    </span>
                  )}
                  <span>
                    {Number(b.latitude).toFixed(5)}, {Number(b.longitude).toFixed(5)}
                  </span>
                  <a
                    href={`https://yandex.uz/maps/?ll=${b.longitude},${b.latitude}&z=17&pt=${b.longitude},${b.latitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <ExternalLink className="w-3 h-3" /> Yandex'da ko'rish
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b)} />
                <Button size="icon" variant="ghost" onClick={() => openEdit(b)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(b.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Filialni tahrirlash' : 'Yangi filial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Nom (UZ) *</Label>
                <Input
                  value={form.name_uz}
                  onChange={(e) => setForm({ ...form, name_uz: e.target.value })}
                  placeholder="Asosiy filial"
                />
              </div>
              <div>
                <Label>Nom (RU)</Label>
                <Input
                  value={form.name_ru}
                  onChange={(e) => setForm({ ...form, name_ru: e.target.value })}
                  placeholder="Главный филиал"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Manzil (UZ) *</Label>
                <Input
                  value={form.address_uz}
                  onChange={(e) => setForm({ ...form, address_uz: e.target.value })}
                  placeholder="Samarqand sh. ..."
                />
              </div>
              <div>
                <Label>Manzil (RU)</Label>
                <Input
                  value={form.address_ru}
                  onChange={(e) => setForm({ ...form, address_ru: e.target.value })}
                  placeholder="г. Самарканд ..."
                />
              </div>
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                value={form.phone ?? ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+998 90 123 45 67"
              />
            </div>
            <div className="rounded-lg border p-3 bg-muted/30 text-xs text-muted-foreground">
              <p className="font-medium mb-1 text-foreground">Koordinatalarni qanday olish?</p>
              <p>
                <a
                  href="https://yandex.uz/maps"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  yandex.uz/maps
                </a>{' '}
                → manzilingizni toping → o'sha nuqtaga sichqoncha o'ng tugmasi → "Bu yer nima?" → pastda 2 ta raqam chiqadi (lat, lng), nusxa oling.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Kenglik (Latitude) *</Label>
                <Input
                  type="number"
                  step="0.0000001"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Uzunlik (Longitude) *</Label>
                <Input
                  type="number"
                  step="0.0000001"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Tartib</Label>
                <Input
                  type="number"
                  value={form.order_index}
                  onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Faol (saytda ko'rsatilsin)</Label>
            </div>
            {form.latitude && form.longitude && (
              <div className="rounded-lg overflow-hidden border h-64">
                <iframe
                  title="preview"
                  src={`https://yandex.uz/map-widget/v1/?ll=${form.longitude}%2C${form.latitude}&z=16&pt=${form.longitude}%2C${form.latitude}%2Cpm2rdm`}
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={save}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
