import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, AlertTriangle, LayoutGrid, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
import { useAdminT } from '@/hooks/useAdminT';
import { useLanguage } from '@/hooks/useLanguage';

interface Section {
  id: string;
  name_uz: string;
  name_ru: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories_count?: number;
}

interface FormData {
  name_uz: string;
  name_ru: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

const initialFormData: FormData = {
  name_uz: '',
  name_ru: '',
  slug: '',
  sort_order: 0,
  is_active: true,
};

export default function Sections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [slugError, setSlugError] = useState('');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const t = useAdminT();
  const { language } = useLanguage();
  const sectionName = (s: Section) => (language === 'ru' ? s.name_ru : s.name_uz);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSections(data || []);

      // Count categories per section
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('section_id');

      if (!catError && categories) {
        const counts: Record<string, number> = {};
        categories.forEach((c) => {
          if (c.section_id) {
            counts[c.section_id] = (counts[c.section_id] || 0) + 1;
          }
        });
        setCategoryCounts(counts);
      }
    } catch (error: any) {
      console.error('Error fetching sections:', error);
      toast({ variant: 'destructive', title: t.sections.error, description: t.sections.loadError });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    const translitMap: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
      з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
      п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts',
      ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
      я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
    };

    return name
      .toLowerCase()
      .split('')
      .map((char) => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const checkSlugUnique = async (slug: string, excludeId?: string): Promise<boolean> => {
    const query = supabase.from('sections').select('id').eq('slug', slug);
    if (excludeId) query.neq('id', excludeId);
    const { data } = await query;
    return !data || data.length === 0;
  };

  const openCreateDialog = () => {
    setSelectedSection(null);
    setFormData({ ...initialFormData, sort_order: sections.length });
    setSlugError('');
    setDialogOpen(true);
  };

  const openEditDialog = (section: Section) => {
    setSelectedSection(section);
    setFormData({
      name_uz: section.name_uz,
      name_ru: section.name_ru,
      slug: section.slug,
      sort_order: section.sort_order,
      is_active: section.is_active,
    });
    setSlugError('');
    setDialogOpen(true);
  };

  const handleNameChange = (value: string, field: 'name_uz' | 'name_ru') => {
    const newFormData = { ...formData, [field]: value };
    if (field === 'name_uz' && (!formData.slug || formData.slug === generateSlug(formData.name_uz))) {
      newFormData.slug = generateSlug(value);
    }
    setFormData(newFormData);
  };

  const handleSlugChange = async (value: string) => {
    const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    setFormData({ ...formData, slug: cleanSlug });
    if (cleanSlug) {
      const isUnique = await checkSlugUnique(cleanSlug, selectedSection?.id);
      setSlugError(isUnique ? '' : t.sections.slugTaken);
    } else {
      setSlugError('');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name_uz || !formData.name_ru) {
      toast({ variant: 'destructive', title: t.sections.error, description: t.sections.requiredFields });
      return;
    }

    const slug = formData.slug || generateSlug(formData.name_uz);
    const isUnique = await checkSlugUnique(slug, selectedSection?.id);
    if (!isUnique) {
      setSlugError(t.sections.slugTaken);
      return;
    }

    try {
      const sectionData = {
        name_uz: formData.name_uz.trim(),
        name_ru: formData.name_ru.trim(),
        slug,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (selectedSection) {
        const { error } = await supabase.from('sections').update(sectionData).eq('id', selectedSection.id);
        if (error) throw error;
        toast({ title: t.sections.success, description: t.sections.updated });
      } else {
        const { error } = await supabase.from('sections').insert([sectionData]);
        if (error) throw error;
        toast({ title: t.sections.success, description: t.sections.created });
      }

      setDialogOpen(false);
      fetchSections();
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        setSlugError(t.sections.slugTaken);
      } else {
        toast({ variant: 'destructive', title: t.sections.error, description: error.message });
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedSection) return;

    const count = categoryCounts[selectedSection.id] || 0;
    if (count > 0) {
      toast({
        variant: 'destructive',
        title: t.sections.cantDelete,
        description: t.sections.hasCategories(sectionName(selectedSection), count),
      });
      setDeleteDialogOpen(false);
      return;
    }

    try {
      const { error } = await supabase.from('sections').delete().eq('id', selectedSection.id);
      if (error) throw error;
      toast({ title: t.sections.success, description: t.sections.deleted });
      setDeleteDialogOpen(false);
      fetchSections();
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.sections.error, description: error.message });
    }
  };

  const toggleStatus = async (section: Section) => {
    try {
      const { error } = await supabase.from('sections').update({ is_active: !section.is_active }).eq('id', section.id);
      if (error) throw error;
      fetchSections();
      toast({ title: t.sections.success, description: t.sections.toggled(!section.is_active) });
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.sections.error, description: error.message });
    }
  };

  const filteredSections = sections.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name_uz.toLowerCase().includes(q) ||
      s.name_ru.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.sections.title}</h1>
          <p className="text-muted-foreground">{t.sections.subtitle}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.sections.newSection}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.sections.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sections Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>{t.sections.allSections} ({filteredSections.length})</span>
            <Badge variant="outline" className="font-normal">
              {t.sections.activeCount(sections.filter((s) => s.is_active).length)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>{t.sections.nameUzRu}</TableHead>
                <TableHead>{t.sections.slug}</TableHead>
                <TableHead className="text-center">{t.sections.categories}</TableHead>
                <TableHead>{t.sections.status}</TableHead>
                <TableHead className="text-right">{t.sections.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSections.map((section) => {
                const categoriesCount = categoryCounts[section.id] || 0;
                return (
                  <TableRow key={section.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sectionName(section)}</p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ru' ? section.name_uz : section.name_ru}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">/{section.slug}</code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <LayoutGrid className="h-3 w-3" />
                        {categoriesCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={section.is_active ? 'default' : 'secondary'}>
                        {section.is_active ? t.sections.active : t.sections.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch checked={section.is_active} onCheckedChange={() => toggleStatus(section)} />
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(section)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSection(section);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredSections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">{t.sections.notFound}</p>
                      {searchQuery && (
                        <Button variant="link" onClick={() => setSearchQuery('')}>
                          {t.sections.clearSearch}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSection ? t.sections.editTitle : t.sections.newTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.sections.nameUz}</Label>
                <Input
                  value={formData.name_uz}
                  onChange={(e) => handleNameChange(e.target.value, 'name_uz')}
                  placeholder={t.sections.placeholderUz}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.sections.nameRu}</Label>
                <Input
                  value={formData.name_ru}
                  onChange={(e) => handleNameChange(e.target.value, 'name_ru')}
                  placeholder={t.sections.placeholderRu}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.sections.slugUrl}</Label>
              <Input
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder={t.sections.slugAuto}
                className={slugError ? 'border-destructive' : ''}
              />
              {slugError ? (
                <p className="text-sm text-destructive">{slugError}</p>
              ) : (
                <p className="text-sm text-muted-foreground">URL: /catalog?section={formData.slug || 'slug'}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.sections.sortOrder}</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>{t.sections.active}</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.sections.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={!!slugError}>
              {selectedSection ? t.sections.save : t.sections.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {(categoryCounts[selectedSection?.id || ''] || 0) > 0 && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              {t.sections.deleteTitle}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {selectedSection ?
              (categoryCounts[selectedSection.id] || 0) > 0
                ? t.sections.hasCategories(sectionName(selectedSection), categoryCounts[selectedSection.id])
                : t.sections.confirmDelete(sectionName(selectedSection))
              : ''}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>{t.sections.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={(categoryCounts[selectedSection?.id || ''] || 0) > 0}
            >
              {t.sections.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
