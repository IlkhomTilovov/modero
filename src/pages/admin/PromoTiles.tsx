import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAllPromoTiles, type PromoTile } from '@/hooks/usePromoTiles';
import { useAdminT } from '@/hooks/useAdminT';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { PROMO_ICONS, PROMO_ICON_NAMES, BG_PRESETS } from '@/lib/promoIcons';
import { cn } from '@/lib/utils';

const emptyForm: Omit<PromoTile, 'id'> = {
  title_uz: '',
  title_ru: '',
  icon: 'Sparkles',
  bg_class: 'bg-[#D4EDE0]',
  text_class: 'text-foreground',
  href: '/catalog',
  sort_order: 0,
  is_active: true,
};

export default function PromoTilesAdmin() {
  const { data: tiles = [], isLoading } = useAllPromoTiles();
  const qc = useQueryClient();
  const t = useAdminT();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PromoTile | null>(null);
  const [form, setForm] = useState<Omit<PromoTile, 'id'>>(emptyForm);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['promo_tiles'] });
    qc.invalidateQueries({ queryKey: ['promo_tiles_all'] });
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: (tiles[tiles.length - 1]?.sort_order ?? 0) + 1 });
    setOpen(true);
  };

  const openEdit = (tile: PromoTile) => {
    setEditing(tile);
    const { id, ...rest } = tile;
    setForm(rest);
    setOpen(true);
  };

  const save = async () => {
    if (!form.title_uz.trim() || !form.title_ru.trim()) {
      toast.error(t.promo.fillTitles);
      return;
    }
    if (editing) {
      const { error } = await supabase.from('promo_tiles').update(form).eq('id', editing.id);
      if (error) return toast.error(error.message);
      toast.success(t.promo.updated);
    } else {
      const { error } = await supabase.from('promo_tiles').insert(form);
      if (error) return toast.error(error.message);
      toast.success(t.promo.added);
    }
    setOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm(t.promo.confirmRemove)) return;
    const { error } = await supabase.from('promo_tiles').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(t.promo.removed);
    refresh();
  };

  const toggleActive = async (tile: PromoTile) => {
    const { error } = await supabase
      .from('promo_tiles').update({ is_active: !tile.is_active }).eq('id', tile.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = tiles[idx];
    const b = tiles[idx + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from('promo_tiles').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('promo_tiles').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    refresh();
  };

  const tileTitle = (tile: PromoTile) => language === 'ru' ? tile.title_ru : tile.title_uz;
  const otherLabel = language === 'ru' ? 'UZ' : 'RU';
  const otherTitle = (tile: PromoTile) => language === 'ru' ? tile.title_uz : tile.title_ru;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.promo.title}</h1>
          <p className="text-sm text-muted-foreground">{t.promo.subtitle}</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />{t.promo.addNew}</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">{t.promo.loading}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((tile, idx) => {
            const Icon = PROMO_ICONS[tile.icon] || PROMO_ICONS.Sparkles;
            return (
              <Card key={tile.id} className={cn('p-0 overflow-hidden', !tile.is_active && 'opacity-60')}>
                <div className={cn('aspect-[16/10] p-5 flex flex-col justify-between', tile.bg_class)}>
                  <h3 className={cn('font-semibold text-sm leading-tight', tile.text_class)}>{tileTitle(tile)}</h3>
                  <Icon className={cn('w-14 h-14 self-end', tile.text_class)} strokeWidth={1.5} />
                </div>
                <div className="p-3 space-y-2">
                  <div className="text-xs text-muted-foreground truncate">
                    {otherLabel}: {otherTitle(tile)} • <span className="font-mono">{tile.href}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === tiles.length - 1}>
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(tile)}>
                      {tile.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <div className="flex-1" />
                    <Button size="sm" variant="outline" onClick={() => openEdit(tile)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(tile.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t.promo.editCard : t.promo.newCard}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.promo.titleUz}</Label>
                <Input value={form.title_uz} onChange={e => setForm({ ...form, title_uz: e.target.value })} />
              </div>
              <div>
                <Label>{t.promo.titleRu}</Label>
                <Input value={form.title_ru} onChange={e => setForm({ ...form, title_ru: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>{t.promo.link}</Label>
              <Input value={form.href} onChange={e => setForm({ ...form, href: e.target.value })} placeholder="/catalog?filter=hit" />
            </div>

            <div>
              <Label>{t.promo.icon}</Label>
              <Select value={form.icon} onValueChange={v => setForm({ ...form, icon: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {PROMO_ICON_NAMES.map(name => {
                    const I = PROMO_ICONS[name];
                    return (
                      <SelectItem key={name} value={name}>
                        <span className="flex items-center gap-2"><I className="w-4 h-4" />{name}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">{t.promo.bgColor}</Label>
              <div className="grid grid-cols-4 gap-2">
                {BG_PRESETS.map(p => (
                  <button
                    key={p.bg}
                    type="button"
                    onClick={() => setForm({ ...form, bg_class: p.bg, text_class: p.text })}
                    className={cn(
                      'h-16 rounded-lg border-2 flex items-center justify-center text-xs',
                      p.bg, p.text,
                      form.bg_class === p.bg ? 'border-primary ring-2 ring-primary/30' : 'border-transparent',
                    )}
                  >
                    {(t.promo as any)[p.key]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>{t.promo.sortOrder}</Label>
                <Input type="number" value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2 h-10">
                <Switch checked={form.is_active}
                  onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>{t.promo.active}</Label>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label className="mb-2 block">{t.promo.preview}</Label>
              <div className={cn('aspect-[16/10] max-w-xs rounded-2xl p-5 flex flex-col justify-between', form.bg_class)}>
                <h3 className={cn('font-semibold text-sm', form.text_class)}>
                  {(language === 'ru' ? form.title_ru : form.title_uz) || t.promo.titlePlaceholder}
                </h3>
                {(() => {
                  const I = PROMO_ICONS[form.icon] || PROMO_ICONS.Sparkles;
                  return <I className={cn('w-14 h-14 self-end', form.text_class)} strokeWidth={1.5} />;
                })()}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t.promo.cancel}</Button>
            <Button onClick={save}>{t.promo.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
