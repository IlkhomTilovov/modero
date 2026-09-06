import { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  GripVertical, 
  Image as ImageIcon, 
  Search,
  Globe,
  AlertTriangle,
  Package,
  ExternalLink,
  Upload,
  X,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { convertImageToWebP } from '@/lib/imageToWebp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdminT } from '@/hooks/useAdminT';
import { useLanguage } from '@/hooks/useLanguage';

interface Category {
  id: string;
  name_uz: string;
  name_ru: string;
  slug: string;
  image: string | null;
  icon: string;
  sort_order: number;
  is_active: boolean;
  show_in_banner: boolean;
  parent_id: string | null;
  section_id: string | null;
  created_at: string;
  updated_at: string;
  meta_title_uz: string | null;
  meta_title_ru: string | null;
  meta_description_uz: string | null;
  meta_description_ru: string | null;
  meta_keywords: string | null;
  is_indexed: boolean;
  is_followed: boolean;
  products_count?: number;
  amocrm_category: string | null;
}

interface Section {
  id: string;
  name_uz: string;
  name_ru: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

interface FormData {
  name_uz: string;
  name_ru: string;
  slug: string;
  image: string;
  icon: string;
  is_active: boolean;
  show_in_banner: boolean;
  sort_order: number;
  parent_id: string;
  section_id: string;
  meta_title_uz: string;
  meta_title_ru: string;
  meta_description_uz: string;
  meta_description_ru: string;
  meta_keywords: string;
  is_indexed: boolean;
  is_followed: boolean;
  amocrm_category: string;
}

const AMOCRM_CATEGORY_OPTIONS = [
  'stul', 'office mebel', 'loft', 'shkaf', 'parta', 'kreslo koja', 'kreslo setka',
];

const initialFormData: FormData = {
  name_uz: '',
  name_ru: '',
  slug: '',
  image: '',
  icon: 'Package',
  is_active: true,
  show_in_banner: false,
  sort_order: 0,
  parent_id: '',
  section_id: '',
  meta_title_uz: '',
  meta_title_ru: '',
  meta_description_uz: '',
  meta_description_ru: '',
  meta_keywords: '',
  is_indexed: true,
  is_followed: true,
  amocrm_category: '',
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [slugError, setSlugError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const t = useAdminT();
  const { language } = useLanguage();
  const catName = (c: Category) => (language === 'ru' ? c.name_ru : c.name_uz);

  const sectionName = (s: Section) => (language === 'ru' ? s.name_ru : s.name_uz);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: t.categories.error, description: t.categories.imageTypeError });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: t.categories.error, description: t.categories.imageSizeError });
      return;
    }

    setImageUploading(true);
    try {
      const uploadFile = await convertImageToWebP(file);
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `category-${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, uploadFile, { contentType: uploadFile.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image: publicUrl }));
      toast({ title: t.categories.success, description: t.categories.imageUploaded });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: t.categories.error, description: t.categories.imageError + ': ' + error.message });
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);

      // Fetch active sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('id, name_uz, name_ru, slug, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!sectionsError) setSections(sectionsData || []);

      // Fetch product counts per category
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('category_id');

      if (!productsError && products) {
        const counts: Record<string, number> = {};
        products.forEach((p) => {
          if (p.category_id) {
            counts[p.category_id] = (counts[p.category_id] || 0) + 1;
          }
        });
        setProductCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({ variant: 'destructive', title: t.categories.error, description: t.categories.loadError });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    // Transliterate Uzbek/Russian characters
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
      'я': 'ya', 'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h'
    };
    
    return name
      .toLowerCase()
      .split('')
      .map(char => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const checkSlugUnique = async (slug: string, excludeId?: string): Promise<boolean> => {
    const query = supabase
      .from('categories')
      .select('id')
      .eq('slug', slug);
    
    if (excludeId) {
      query.neq('id', excludeId);
    }

    const { data } = await query;
    return !data || data.length === 0;
  };

  const openCreateDialog = () => {
    setSelectedCategory(null);
    setFormData({
      ...initialFormData,
      sort_order: categories.length,
    });
    setSlugError('');
    setActiveTab('general');
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name_uz: category.name_uz,
      name_ru: category.name_ru,
      slug: category.slug,
      image: category.image || '',
      icon: category.icon,
      is_active: category.is_active,
      show_in_banner: category.show_in_banner ?? false,
      sort_order: category.sort_order,
      parent_id: category.parent_id || '',
      section_id: category.section_id || '',
      meta_title_uz: category.meta_title_uz || '',
      meta_title_ru: category.meta_title_ru || '',
      meta_description_uz: category.meta_description_uz || '',
      meta_description_ru: category.meta_description_ru || '',
      meta_keywords: category.meta_keywords || '',
      is_indexed: category.is_indexed ?? true,
      is_followed: category.is_followed ?? true,
      amocrm_category: category.amocrm_category || '',
    });
    setSlugError('');
    setActiveTab('general');
    setDialogOpen(true);
  };

  const handleNameChange = (value: string, field: 'name_uz' | 'name_ru') => {
    const newFormData = { ...formData, [field]: value };
    
    // Auto-generate slug from UZ name if slug is empty or matches the previous auto-generated slug
    if (field === 'name_uz' && (!formData.slug || formData.slug === generateSlug(formData.name_uz))) {
      newFormData.slug = generateSlug(value);
    }
    
    setFormData(newFormData);
  };

  const handleSlugChange = async (value: string) => {
    const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    setFormData({ ...formData, slug: cleanSlug });
    
    if (cleanSlug) {
      const isUnique = await checkSlugUnique(cleanSlug, selectedCategory?.id);
      setSlugError(isUnique ? '' : t.categories.slugTaken);
    } else {
      setSlugError('');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name_uz || !formData.name_ru) {
      toast({ variant: 'destructive', title: t.categories.error, description: t.categories.requiredFields });
      return;
    }

    const slug = formData.slug || generateSlug(formData.name_uz);

    // Check slug uniqueness
    const isUnique = await checkSlugUnique(slug, selectedCategory?.id);
    if (!isUnique) {
      setSlugError(t.categories.slugTaken);
      return;
    }

    try {
      const categoryData = {
        name_uz: formData.name_uz.trim(),
        name_ru: formData.name_ru.trim(),
        slug,
        image: formData.image || null,
        icon: formData.icon,
        is_active: formData.is_active,
        show_in_banner: formData.show_in_banner,
        sort_order: formData.sort_order,
        parent_id: formData.parent_id || null,
        section_id: formData.section_id || null,
        meta_title_uz: formData.meta_title_uz || null,
        meta_title_ru: formData.meta_title_ru || null,
        meta_description_uz: formData.meta_description_uz || null,
        meta_description_ru: formData.meta_description_ru || null,
        meta_keywords: formData.meta_keywords || null,
        is_indexed: formData.is_indexed,
        is_followed: formData.is_followed,
        amocrm_category: formData.amocrm_category || null,
      };

      if (selectedCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', selectedCategory.id);

        if (error) throw error;
        toast({ title: t.categories.success, description: t.categories.updated });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;
        toast({ title: t.categories.success, description: t.categories.created });
      }

      setDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        setSlugError(t.categories.slugTaken);
      } else {
        toast({ variant: 'destructive', title: t.categories.error, description: error.message });
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    // Check if category has products
    const count = productCounts[selectedCategory.id] || 0;
    if (count > 0) {
      toast({ 
        variant: 'destructive', 
        title: t.categories.cantDelete, 
        description: t.categories.hasProducts(catName(selectedCategory), count) 
      });
      setDeleteDialogOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;
      toast({ title: t.categories.success, description: t.categories.deleted });
      setDeleteDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.categories.error, description: error.message });
    }
  };

  const toggleStatus = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      fetchCategories();
      toast({ 
        title: t.categories.success, 
        description: t.categories.toggled(!category.is_active) 
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.categories.error, description: error.message });
    }
  };

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cat.name_uz.toLowerCase().includes(query) ||
      cat.name_ru.toLowerCase().includes(query) ||
      cat.slug.toLowerCase().includes(query)
    );
  });

  // Order: parents first, then their children indented directly after
  const orderedCategories = (() => {
    const parents = filteredCategories.filter(c => !c.parent_id);
    const orphans = filteredCategories.filter(
      c => c.parent_id && !filteredCategories.some(p => p.id === c.parent_id)
    );
    const result: Array<Category & { _depth: number }> = [];
    parents.forEach(p => {
      result.push({ ...p, _depth: 0 });
      filteredCategories
        .filter(c => c.parent_id === p.id)
        .forEach(child => result.push({ ...child, _depth: 1 }));
    });
    orphans.forEach(o => result.push({ ...o, _depth: 1 }));
    return result;
  })();

  const getSeoStatus = (category: Category) => {
    const hasTitle = category.meta_title_uz || category.meta_title_ru;
    const hasDescription = category.meta_description_uz || category.meta_description_ru;
    
    if (hasTitle && hasDescription) {
      return { status: 'complete', label: t.categories.seoReady };
    } else if (hasTitle || hasDescription) {
      return { status: 'partial', label: t.categories.seoPartial };
    }
    return { status: 'missing', label: t.categories.seoMissing };
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.categories.title}</h1>
          <p className="text-muted-foreground">{t.categories.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="/sitemap.xml" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <Globe className="h-4 w-4" />
            {t.categories.sitemap}
            <ExternalLink className="h-3 w-3" />
          </a>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t.categories.newCategory}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.categories.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>{t.categories.allCategories} ({filteredCategories.length})</span>
            <Badge variant="outline" className="font-normal">
              {t.categories.activeCount(categories.filter(c => c.is_active).length)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-16">{t.categories.image}</TableHead>
                <TableHead>{t.categories.nameUzRu}</TableHead>
                <TableHead>{t.categories.slug}</TableHead>
                <TableHead>{t.categories.section}</TableHead>
                <TableHead className="text-center">{t.categories.products}</TableHead>
                <TableHead>{t.categories.seo}</TableHead>
                <TableHead>{t.categories.status}</TableHead>
                <TableHead className="text-right">{t.categories.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedCategories.map((category) => {
                const seoStatus = getSeoStatus(category);
                const productsCount = productCounts[category.id] || 0;
                const isChild = category._depth > 0;

                return (
                  <TableRow key={category.id} className={isChild ? 'bg-muted/20' : ''}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name_uz}
                          width={48}
                          height={48}
                          loading="lazy"
                          decoding="async"
                          className="h-12 w-12 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2" style={{ paddingLeft: isChild ? 20 : 0 }}>
                        {isChild && <span className="text-muted-foreground">└</span>}
                        <div>
                          <p className="font-medium">{catName(category)}</p>
                          <p className="text-sm text-muted-foreground">{language === 'ru' ? category.name_uz : category.name_ru}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">/{category.slug}</code>
                    </TableCell>
                    <TableCell>
                      {category.section_id ? (
                        <Badge variant="outline" className="font-normal">
                          {sectionName(sections.find((s) => s.id === category.section_id) || ({ name_uz: category.section_id, name_ru: category.section_id } as Section))}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Package className="h-3 w-3" />
                        {productsCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={seoStatus.status === 'complete' ? 'default' : seoStatus.status === 'partial' ? 'secondary' : 'outline'}
                        className={seoStatus.status === 'missing' ? 'text-muted-foreground' : ''}
                      >
                        {seoStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? t.categories.active : t.categories.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch 
                          checked={category.is_active} 
                          onCheckedChange={() => toggleStatus(category)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedCategory(category); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">{t.categories.notFound}</p>
                      {searchQuery && (
                        <Button variant="link" onClick={() => setSearchQuery('')}>
                          {t.categories.clearSearch}
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

      {/* Create/Edit Dialog with Tabs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? t.categories.editTitle : t.categories.newTitle}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">{t.categories.general}</TabsTrigger>
              <TabsTrigger value="seo" className="gap-2">
                <Globe className="h-4 w-4" />
                {t.categories.seo}
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.categories.nameUz}</Label>
                  <Input
                    value={formData.name_uz}
                    onChange={(e) => handleNameChange(e.target.value, 'name_uz')}
                    placeholder={t.categories.placeholderUz}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.categories.nameRu}</Label>
                  <Input
                    value={formData.name_ru}
                    onChange={(e) => handleNameChange(e.target.value, 'name_ru')}
                    placeholder={t.categories.placeholderRu}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'ru' ? 'Раздел каталога' : "Katalog bo'limi"}</Label>
                <Select
                  value={formData.section_id || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, section_id: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ru' ? '— Без раздела —' : "— Bo'limsiz —"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {language === 'ru' ? '— Без раздела —' : "— Bo'limsiz —"}
                    </SelectItem>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {sectionName(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru'
                    ? 'Выберите раздел, к которому относится категория.'
                    : "Kategoriya tegishli bo'lgan bo'limni tanlang."}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{language === 'ru' ? 'Родительская категория' : 'Ota kategoriya'}</Label>
                <Select
                  value={formData.parent_id || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, parent_id: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ru' ? 'Без родителя (верхний уровень)' : "Ota yo'q (yuqori daraja)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {language === 'ru' ? '— Без родителя (верхний уровень) —' : "— Ota yo'q (yuqori daraja) —"}
                    </SelectItem>
                    {categories
                      .filter(c => c.id !== selectedCategory?.id && !c.parent_id)
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {catName(c)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru'
                    ? 'Выберите родителя, чтобы сделать эту категорию подкатегорией.'
                    : 'Ushbu kategoriyani subkategoriya qilish uchun ota kategoriya tanlang.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{language === 'ru' ? 'Категория AmoCRM (поле "Mahsulot")' : 'AmoCRM kategoriyasi ("Mahsulot" maydoni)'}</Label>
                <Select
                  value={formData.amocrm_category || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, amocrm_category: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ru' ? '— Не выбрано —' : '— Belgilanmagan —'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {language === 'ru' ? '— Не выбрано —' : '— Belgilanmagan —'}
                    </SelectItem>
                    {AMOCRM_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru'
                    ? 'Заказы с товарами из этой категории будут отправлены в amoCRM с заполненным полем "Mahsulot".'
                    : "Shu kategoriyadagi mahsulot bilan tushgan buyurtmalar amoCRM'ga \"Mahsulot\" maydoni to'ldirilgan holda yuboriladi."}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t.categories.slugUrl}</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder={t.categories.slugAuto}
                  className={slugError ? 'border-destructive' : ''}
                />
                {slugError ? (
                  <p className="text-sm text-destructive">{slugError}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    URL: /catalog/{formData.slug || 'slug'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.categories.image}</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = '';
                  }}
                />
                
                {formData.image ? (
                  <div className="relative inline-block">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      width={128}
                      height={128}
                      loading="lazy"
                      decoding="async"
                      className="h-32 w-32 object-cover rounded-lg border"
                      onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-32 w-32 flex flex-col items-center justify-center gap-2 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                  >
                    {imageUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Plus className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{t.categories.uploadImage}</span>
                      </>
                    )}
                  </Button>
                )}
                
                {!formData.image && (
                  <p className="text-xs text-muted-foreground">
                    {t.categories.imageHint}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.categories.sortOrder}</Label>
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
                  <Label>{t.categories.active}</Label>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 flex items-start justify-between gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    {language === 'uz' ? 'Bosh sahifa bannerida ko‘rsatish' : 'Показывать в баннере на главной'}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {language === 'uz'
                      ? 'Bosh sahifadagi kolleksiya bannerlarida chiqadi (2 ta tanlash tavsiya etiladi, rasm majburiy).'
                      : 'Появится в баннерах коллекций на главной (рекомендуется выбрать 2, нужна картинка).'}
                  </p>
                </div>
                <Switch
                  checked={formData.show_in_banner}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_in_banner: checked })}
                />
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t.categories.seoHint}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">{t.categories.metaTitle}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.categories.metaTitleUz}</Label>
                    <Input
                      value={formData.meta_title_uz}
                      onChange={(e) => setFormData({ ...formData, meta_title_uz: e.target.value })}
                      placeholder={formData.name_uz || t.categories.metaTitlePlaceholderUz}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t.categories.chars60(formData.meta_title_uz.length)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.categories.metaTitleRu}</Label>
                    <Input
                      value={formData.meta_title_ru}
                      onChange={(e) => setFormData({ ...formData, meta_title_ru: e.target.value })}
                      placeholder={formData.name_ru || t.categories.metaTitlePlaceholderRu}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t.categories.chars60(formData.meta_title_ru.length)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">{t.categories.metaDescription}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.categories.metaDescriptionUz}</Label>
                    <Textarea
                      value={formData.meta_description_uz}
                      onChange={(e) => setFormData({ ...formData, meta_description_uz: e.target.value })}
                      placeholder={t.categories.metaDescPlaceholderUz}
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t.categories.chars160(formData.meta_description_uz.length)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.categories.metaDescriptionRu}</Label>
                    <Textarea
                      value={formData.meta_description_ru}
                      onChange={(e) => setFormData({ ...formData, meta_description_ru: e.target.value })}
                      placeholder={t.categories.metaDescPlaceholderRu}
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t.categories.chars160(formData.meta_description_ru.length)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t.categories.metaKeywords}</Label>
                <Input
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  placeholder={t.categories.metaKeywordsPlaceholder}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_indexed}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_indexed: checked })}
                  />
                  <div>
                    <Label>{t.categories.indexing}</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_indexed ? t.categories.indexOn : t.categories.indexOff}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_followed}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_followed: checked })}
                  />
                  <div>
                    <Label>{t.categories.follow}</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_followed ? t.categories.followOn : t.categories.followOff}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.categories.cancel}</Button>
            <Button onClick={handleSubmit} disabled={!!slugError}>
              {selectedCategory ? t.categories.save : t.categories.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {(productCounts[selectedCategory?.id || ''] || 0) > 0 && (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              {t.categories.deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(productCounts[selectedCategory?.id || ''] || 0) > 0 ? (
                <>
                  <span className="text-amber-600 font-medium">{t.categories.attention}</span>{' '}{t.categories.hasProducts(selectedCategory ? catName(selectedCategory) : '', productCounts[selectedCategory?.id || ''] || 0)}
                </>
              ) : (
                <>
                  {t.categories.confirmDelete(selectedCategory ? catName(selectedCategory) : '')}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.categories.cancel}</AlertDialogCancel>
            {(productCounts[selectedCategory?.id || ''] || 0) === 0 && (
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {t.categories.delete}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
