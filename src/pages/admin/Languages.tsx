import { useState } from 'react';
import { Plus, Pencil, Trash2, Star, Languages as LanguagesIcon } from 'lucide-react';
import { apiPost, apiPatch, apiDelete } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useAllLanguages, type CatalogLanguage } from '@/hooks/useLanguages';

interface FormData {
  code: string;
  name: string;
  is_active: boolean;
}

const initialFormData: FormData = { code: '', name: '', is_active: true };

export default function LanguagesAdmin() {
  const { language: uiLanguage } = useLanguage();
  const { languages, loading, refetch } = useAllLanguages();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<CatalogLanguage | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const isUz = uiLanguage === 'uz';
  const L = {
    title: isUz ? 'Tillar' : 'Языки',
    subtitle: isUz
      ? "Katalog tarkibi (toifa/mahsulot nomlari) qaysi tillarda tahrirlanishi mumkinligini boshqaring"
      : 'Управляйте языками, на которых можно вести каталог (названия категорий/товаров)',
    newLanguage: isUz ? "Til qo'shish" : 'Добавить язык',
    code: isUz ? 'Kod' : 'Код',
    name: isUz ? 'Nomi' : 'Название',
    status: isUz ? 'Holati' : 'Статус',
    active: isUz ? 'Faol' : 'Активен',
    inactive: isUz ? 'Nofaol' : 'Неактивен',
    default: isUz ? 'Standart' : 'По умолчанию',
    actions: isUz ? 'Amallar' : 'Действия',
    editTitle: isUz ? 'Tilni tahrirlash' : 'Редактировать язык',
    newTitle: isUz ? 'Yangi til' : 'Новый язык',
    codePlaceholder: isUz ? 'masalan: en' : 'например: en',
    namePlaceholder: isUz ? 'masalan: English' : 'например: English',
    codeHint: isUz
      ? "Qisqa kod, masalan 'en', 'tr' — keyin o'zgartirib bo'lmaydi"
      : "Короткий код, например 'en', 'tr' — потом изменить нельзя",
    cancel: isUz ? 'Bekor qilish' : 'Отмена',
    save: isUz ? 'Saqlash' : 'Сохранить',
    create: isUz ? 'Yaratish' : 'Создать',
    deleteTitle: isUz ? "Tilni o'chirish" : 'Удалить язык',
    confirmDelete: (name: string) =>
      isUz
        ? `"${name}" tilini o'chirmoqchimisiz? Bu tildagi tarjimalar bazada qoladi, lekin admin panelda ko'rinmaydi.`
        : `Удалить язык "${name}"? Переводы на этом языке останутся в базе, но не будут видны в админ-панели.`,
    delete: isUz ? "O'chirish" : 'Удалить',
    cantDeleteDefault: isUz
      ? "Standart (fallback) tilni o'chirib bo'lmaydi"
      : 'Нельзя удалить язык по умолчанию',
    success: isUz ? 'Muvaffaqiyat' : 'Успешно',
    error: isUz ? 'Xatolik' : 'Ошибка',
    created: isUz ? 'Til yaratildi' : 'Язык создан',
    updated: isUz ? 'Til yangilandi' : 'Язык обновлён',
    deleted: isUz ? "Til o'chirildi" : 'Язык удалён',
    makeDefault: isUz ? 'Standart qilish' : 'Сделать по умолчанию',
    empty: isUz ? 'Tillar topilmadi' : 'Языки не найдены',
  };

  const openCreateDialog = () => {
    setSelected(null);
    setFormData({ ...initialFormData, is_active: true });
    setDialogOpen(true);
  };

  const openEditDialog = (lang: CatalogLanguage) => {
    setSelected(lang);
    setFormData({ code: lang.code, name: lang.name, is_active: lang.is_active });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const code = formData.code.trim().toLowerCase();
    const name = formData.name.trim();
    if (!code || !name) {
      toast({ variant: 'destructive', title: L.error, description: isUz ? 'Kod va nomni kiriting' : 'Введите код и название' });
      return;
    }

    try {
      if (selected) {
        await apiPatch(`/api/languages/${selected.id}`, { name, isActive: formData.is_active });
        toast({ title: L.success, description: L.updated });
      } else {
        await apiPost('/api/languages', { code, name, isActive: formData.is_active, sortOrder: languages.length });
        toast({ title: L.success, description: L.created });
      }
      setDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({ variant: 'destructive', title: L.error, description: error.message });
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (selected.is_default) {
      toast({ variant: 'destructive', title: L.error, description: L.cantDeleteDefault });
      setDeleteDialogOpen(false);
      return;
    }
    try {
      await apiDelete(`/api/languages/${selected.id}`);
      toast({ title: L.success, description: L.deleted });
      setDeleteDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({ variant: 'destructive', title: L.error, description: error.message });
    }
  };

  const toggleStatus = async (lang: CatalogLanguage) => {
    try {
      await apiPatch(`/api/languages/${lang.id}`, { isActive: !lang.is_active });
      refetch();
    } catch (error: any) {
      toast({ variant: 'destructive', title: L.error, description: error.message });
    }
  };

  const makeDefault = async (lang: CatalogLanguage) => {
    try {
      await apiPatch(`/api/languages/${lang.id}`, { isDefault: true });
      refetch();
    } catch (error: any) {
      toast({ variant: 'destructive', title: L.error, description: error.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{L.title}</h1>
          <p className="text-muted-foreground">{L.subtitle}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {L.newLanguage}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{L.title} ({languages.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L.code}</TableHead>
                <TableHead>{L.name}</TableHead>
                <TableHead>{L.status}</TableHead>
                <TableHead className="text-right">{L.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {languages.map((lang) => (
                <TableRow key={lang.id}>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded uppercase">{lang.code}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lang.name}</span>
                      {lang.is_default && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Star className="h-3 w-3" />
                          {L.default}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lang.is_active ? 'default' : 'secondary'}>
                      {lang.is_active ? L.active : L.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!lang.is_default && (
                        <Button variant="ghost" size="sm" onClick={() => makeDefault(lang)}>
                          {L.makeDefault}
                        </Button>
                      )}
                      <Switch checked={lang.is_active} onCheckedChange={() => toggleStatus(lang)} />
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(lang)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={lang.is_default}
                        onClick={() => {
                          setSelected(lang);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {languages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <LanguagesIcon className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">{L.empty}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? L.editTitle : L.newTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{L.code}</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={L.codePlaceholder}
                disabled={!!selected}
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">{L.codeHint}</p>
            </div>
            <div className="space-y-2">
              <Label>{L.name}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={L.namePlaceholder}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>{L.active}</Label>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {L.cancel}
            </Button>
            <Button onClick={handleSubmit}>{selected ? L.save : L.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{L.deleteTitle}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>{selected ? L.confirmDelete(selected.name) : ''}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>{L.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {L.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
