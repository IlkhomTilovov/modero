import { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, GripVertical, FolderOpen, Save, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ATTRIBUTE_ICONS, getAttributeIcon } from '@/lib/attributeIcons';
import { cn } from '@/lib/utils';

export interface ProductAttribute {
  id: string;
  icon: string; // icon key
  label_uz: string;
  label_ru: string;
  value_uz: string;
  value_ru: string;
}

interface AttributeTemplate {
  id: string;
  name: string;
  items: Omit<ProductAttribute, 'id'>[];
  created_at: number;
}

const TEMPLATES_KEY = 'orsi:attribute-templates:v1';

function loadTemplates(): AttributeTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AttributeTemplate[];
  } catch {
    return [];
  }
}

function saveTemplates(items: AttributeTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(items));
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface Props {
  value: ProductAttribute[];
  onChange: (v: ProductAttribute[]) => void;
  language?: 'uz' | 'ru';
}

export function AttributesEditor({ value, onChange, language = 'uz' }: Props) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AttributeTemplate[]>(() => loadTemplates());
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const dragIndexRef = useRef<number | null>(null);

  const L = language === 'ru' ? {
    title: 'Характеристики',
    subtitle: 'Добавьте технические характеристики товара',
    templates: 'Шаблоны',
    saveAsTemplate: 'Сохранить как шаблон',
    add: 'Добавить',
    empty: 'Характеристик пока нет. Нажмите «Добавить» или воспользуйтесь шаблоном.',
    addFirst: 'Добавить первую характеристику',
    templatesDialog: 'Шаблоны',
    noTemplates: 'Пока нет шаблонов. Заполните характеристики и нажмите «Сохранить как шаблон».',
    itemsCount: (n: number) => `${n} характеристик`,
    apply: 'Применить',
    saveTemplateTitle: 'Сохранить как шаблон',
    templateName: 'Название шаблона',
    templateNamePh: 'Например: Мягкий диван',
    templateSaveHint: (n: number) => `Текущие ${n} характеристик будут сохранены под этим именем.`,
    cancel: 'Отмена',
    save: 'Сохранить',
    templateAdded: 'Шаблон добавлен',
    error: 'Ошибка',
    enterName: 'Введите название шаблона',
    addOne: 'Добавьте хотя бы одну характеристику',
    saved: 'Сохранено',
    savedDesc: (name: string) => `Шаблон «${name}» сохранён`,
  } : {
    title: 'Xususiyatlar',
    subtitle: "Mahsulot uchun texnik ma'lumotlarni qo'shing",
    templates: 'Shablonlar',
    saveAsTemplate: 'Shablon sifatida saqlash',
    add: "Qo'shish",
    empty: "Hali xususiyatlar qo'shilmagan. Boshlash uchun \"Qo'shish\" tugmasini bosing yoki shablondan foydalaning.",
    addFirst: "Birinchi xususiyatni qo'shish",
    templatesDialog: 'Shablonlar',
    noTemplates: "Hozircha shablonlar yo'q. Xususiyatlarni to'ldirib, \"Shablon sifatida saqlash\" tugmasini bosing.",
    itemsCount: (n: number) => `${n} ta xususiyat`,
    apply: "Qo'llash",
    saveTemplateTitle: 'Shablon sifatida saqlash',
    templateName: 'Shablon nomi',
    templateNamePh: 'Masalan: Yumshoq divan',
    templateSaveHint: (n: number) => `Hozirgi ${n} ta xususiyat shu nom bilan saqlanadi.`,
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    templateAdded: "Shablon qo'shildi",
    error: 'Xatolik',
    enterName: 'Shablon nomini kiriting',
    addOne: "Kamida bitta xususiyat qo'shing",
    saved: 'Saqlandi',
    savedDesc: (name: string) => `"${name}" shabloni saqlandi`,
  };

  const addRow = () => {
    onChange([
      ...value,
      { id: uid(), icon: 'star', label_uz: '', label_ru: '', value_uz: '', value_ru: '' },
    ]);
  };

  const updateRow = (id: string, patch: Partial<ProductAttribute>) => {
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    onChange(value.filter((r) => r.id !== id));
  };

  const onDragStart = (i: number) => {
    dragIndexRef.current = i;
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (i: number) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === i) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(i, 0, item);
    onChange(next);
  };

  const applyTemplate = (t: AttributeTemplate) => {
    onChange([...value, ...t.items.map((i) => ({ ...i, id: uid() }))]);
    setTemplatesOpen(false);
    toast({ title: L.templateAdded, description: t.name });
  };

  const deleteTemplate = (id: string) => {
    const next = templates.filter((t) => t.id !== id);
    setTemplates(next);
    saveTemplates(next);
  };

  const commitSaveTemplate = () => {
    if (!saveName.trim()) {
      toast({ variant: 'destructive', title: L.error, description: L.enterName });
      return;
    }
    if (value.length === 0) {
      toast({ variant: 'destructive', title: L.error, description: L.addOne });
      return;
    }
    const tpl: AttributeTemplate = {
      id: uid(),
      name: saveName.trim(),
      created_at: Date.now(),
      items: value.map(({ id, ...rest }) => rest),
    };
    const next = [tpl, ...templates];
    setTemplates(next);
    saveTemplates(next);
    setSaveOpen(false);
    setSaveName('');
    toast({ title: L.saved, description: L.savedDesc(tpl.name) });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{L.title}</h3>
          <p className="text-sm text-muted-foreground">
            {L.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTemplatesOpen(true)}
            className="gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            {L.templates} ({templates.length})
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSaveOpen(true)}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {L.saveAsTemplate}
          </Button>
          <Button type="button" size="sm" onClick={addRow} className="gap-2">
            <Plus className="w-4 h-4" />
            {L.add}
          </Button>
        </div>
      </div>

      {/* Rows */}
      {value.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {L.empty}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-2">
            <Plus className="w-4 h-4" /> {L.addFirst}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((row, i) => (
            <AttributeRow
              key={row.id}
              row={row}
              index={i}
              language={language}
              onUpdate={(p) => updateRow(row.id, p)}
              onRemove={() => removeRow(row.id)}
              onDragStart={() => onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(i)}
            />
          ))}
        </div>
      )}

      {/* Templates dialog */}
      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{L.templatesDialog}</DialogTitle>
          </DialogHeader>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {L.noTemplates}
            </p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {L.itemsCount(t.items.length)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" onClick={() => applyTemplate(t)} className="gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {L.apply}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTemplate(t.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Save template dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{L.saveTemplateTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{L.templateName}</Label>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={L.templateNamePh}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {L.templateSaveHint(value.length)}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              {L.cancel}
            </Button>
            <Button onClick={commitSaveTemplate}>{L.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RowProps {
  row: ProductAttribute;
  index: number;
  language: 'uz' | 'ru';
  onUpdate: (p: Partial<ProductAttribute>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

function AttributeRow({
  row,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  language,
}: RowProps) {
  const [iconOpen, setIconOpen] = useState(false);
  const [iconQuery, setIconQuery] = useState('');
  const dragTitle = language === 'ru' ? 'Перетащите' : "Sudrab olib qo'ying";
  const iconSearchPh = language === 'ru' ? 'Поиск иконки...' : 'Ikonka qidirish...';

  const Icon = getAttributeIcon(row.icon);
  const currentIconLabel = useMemo(
    () => ATTRIBUTE_ICONS.find((i) => i.key === row.icon)?.label || 'Ikonka',
    [row.icon]
  );

  const filteredIcons = useMemo(() => {
    const q = iconQuery.trim().toLowerCase();
    if (!q) return ATTRIBUTE_ICONS;
    return ATTRIBUTE_ICONS.filter(
      (i) => i.label.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)
    );
  }, [iconQuery]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="group relative border rounded-xl bg-card p-3 md:p-4 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-1 mt-2 shrink-0"
          title={dragTitle}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Icon selector */}
        <Popover open={iconOpen} onOpenChange={setIconOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="shrink-0 w-11 h-11 rounded-lg border bg-background hover:bg-muted/50 hover:border-primary/40 flex items-center justify-center text-primary transition-colors"
              title={currentIconLabel}
            >
              <Icon className="w-5 h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                placeholder={iconSearchPh}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-6 gap-1 max-h-56 overflow-y-auto">
              {filteredIcons.map((i) => {
                const I = i.Icon;
                const active = i.key === row.icon;
                return (
                  <button
                    key={i.key}
                    type="button"
                    title={i.label}
                    onClick={() => {
                      onUpdate({ icon: i.key });
                      setIconOpen(false);
                    }}
                    className={cn(
                      'aspect-square rounded-md flex items-center justify-center hover:bg-muted transition-colors',
                      active && 'bg-primary/10 text-primary ring-1 ring-primary'
                    )}
                  >
                    <I className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* UZ + RU fields */}
        <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">UZ</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={row.label_uz}
                onChange={(e) => onUpdate({ label_uz: e.target.value })}
                placeholder="Xususiyat nomi"
                className="h-9"
              />
              <Input
                value={row.value_uz}
                onChange={(e) => onUpdate({ value_uz: e.target.value })}
                placeholder="Qiymati"
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">RU</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={row.label_ru}
                onChange={(e) => onUpdate({ label_ru: e.target.value })}
                placeholder="Название"
                className="h-9"
              />
              <Input
                value={row.value_ru}
                onChange={(e) => onUpdate({ value_ru: e.target.value })}
                placeholder="Значение"
                className="h-9"
              />
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

