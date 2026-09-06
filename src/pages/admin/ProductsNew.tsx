import { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Image as ImageIcon,
  X,
  Upload,
  Download,
  Globe,
  Search,
  Star,
  Package,
  GripVertical,
  RefreshCw,
  Video
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { convertImageToWebP } from '@/lib/imageToWebp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useAdminT } from '@/hooks/useAdminT';
import { AddMediaModal, MediaItem } from '@/components/admin/AddMediaModal';
import { MediaGrid } from '@/components/admin/MediaGrid';
import { useAllPromoTiles } from '@/hooks/usePromoTiles';
import { PROMO_ICONS } from '@/lib/promoIcons';
import { Checkbox } from '@/components/ui/checkbox';
import { AttributesEditor, ProductAttribute } from '@/components/admin/AttributesEditor';

interface Category {
  id: string;
  name_uz: string;
  name_ru: string;
  parent_id?: string | null;
}

interface Product {
  id: string;
  name_uz: string;
  name_ru: string;
  slug: string | null;
  description_uz: string | null;
  description_ru: string | null;
  full_description_uz: string | null;
  full_description_ru: string | null;
  category_id: string | null;
  price: number | null;
  original_price: number | null;
  images: string[];
  materials: string[];
  sizes: string[];
  colors: string[];
  materials_ru: string[];
  sizes_ru: string[];
  colors_ru: string[];
  is_negotiable: boolean;
  in_stock: boolean;
  is_featured: boolean;
  show_in_discount_banner?: boolean | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  meta_title_uz: string | null;
  meta_title_ru: string | null;
  meta_description_uz: string | null;
  meta_description_ru: string | null;
  meta_keywords: string | null;
  is_indexed: boolean;
  is_followed: boolean;
  target_keyword: string | null;
  keyword_variations: string[] | null;
  variants_uz: string[] | null;
  variants_ru: string[] | null;
  promo_tile_ids: string[] | null;
  attributes?: ProductAttribute[] | null;
}

interface FormData {
  name_uz: string;
  name_ru: string;
  slug: string;
  description_uz: string;
  description_ru: string;
  full_description_uz: string;
  full_description_ru: string;
  category_id: string;
  price: string;
  original_price: string;
  images: string[];
  materials: string;
  sizes: string;
  colors: string;
  materials_ru: string;
  sizes_ru: string;
  colors_ru: string;
  is_negotiable: boolean;
  in_stock: boolean;
  is_featured: boolean;
  show_in_discount_banner: boolean;
  is_active: boolean;
  meta_title_uz: string;
  meta_title_ru: string;
  meta_description_uz: string;
  meta_description_ru: string;
  meta_keywords: string;
  is_indexed: boolean;
  is_followed: boolean;
  target_keyword: string;
  keyword_variations: string[];
  keyword_uz: string;
  keyword_ru: string;
  variants_uz: string[];
  variants_ru: string[];
  promo_tile_ids: string[];
  attributes: ProductAttribute[];
}

const emptyForm: FormData = {
  name_uz: '',
  name_ru: '',
  slug: '',
  description_uz: '',
  description_ru: '',
  full_description_uz: '',
  full_description_ru: '',
  category_id: '',
  price: '',
  original_price: '',
  images: [],
  materials: '',
  sizes: '',
  colors: '',
  materials_ru: '',
  sizes_ru: '',
  colors_ru: '',
  is_negotiable: false,
  in_stock: true,
  is_featured: false,
  show_in_discount_banner: false,
  is_active: true,
  meta_title_uz: '',
  meta_title_ru: '',
  meta_description_uz: '',
  meta_description_ru: '',
  meta_keywords: '',
  is_indexed: true,
  is_followed: true,
  target_keyword: '',
  keyword_variations: [],
  keyword_uz: '',
  keyword_ru: '',
  variants_uz: [],
  variants_ru: [],
  promo_tile_ids: [],
  attributes: [],
};

const ADMIN_PAGE_SIZE = 20;

export default function ProductsNew() {
  const [products, setProducts] = useState<Product[]>([]);
  const { data: promoTilesList = [] } = useAllPromoTiles();
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [slugError, setSlugError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = useAdminT();

  // Modal-specific bilingual labels
  const L = language === 'ru' ? {
    editTitle: 'Редактировать товар',
    newTitle: 'Новый товар',
    tabBasic: 'Основное',
    tabDescription: 'Описание',
    tabImages: 'Изображения',
    tabAttributes: 'Характеристики',
    nameUz: 'Название (UZ) *',
    nameRu: 'Название (RU) *',
    phUz: "На узбекском",
    phRu: 'На русском',
    slug: 'Slug (URL)',
    slugAuto: 'создаётся автоматически',
    slugTaken: 'Этот slug уже занят',
    category: 'Категория',
    pickCategory: 'Выберите категорию',
    promoTiles: 'Промо-карточки',
    promoHint: 'Выберите, под фильтром какой промо-карточки будет показан товар (можно несколько).',
    noPromo: 'Промо-карточек нет.',
    inactive: '(неактивна)',
    price: 'Цена',
    oldPrice: 'Старая цена',
    negotiable: 'Договорная',
    inStock: 'В наличии',
    featured: 'Избранный',
    discountBanner: 'Показывать в баннере скидок',
    active: 'Активный',
    shortDescUz: 'Краткое описание (UZ)',
    shortDescRu: 'Краткое описание (RU)',
    shortDescPhUz: 'Кратко о товаре...',
    shortDescPhRu: 'Краткое описание...',
    fullDescUz: 'Полное описание (UZ)',
    fullDescRu: 'Полное описание (RU)',
    fullDescPhUz: 'Подробное описание...',
    fullDescPhRu: 'Подробное описание...',
    mediaFiles: 'Медиафайлы',
    mediaHint: 'Добавьте изображения и видео',
    addMedia: 'Добавить медиа',
    uploadingImages: 'Загрузка изображений...',
    total: 'Всего:',
    mediaCount: (n: number) => `${n} медиа`,
    imagesLabel: (n: number) => `${n} изображений`,
    videosLabel: (n: number) => `${n} видео`,
    firstIsMain: 'Первое медиа используется как главное изображение',
    seoHint: '💡 На основе основного ключевого слова автоматически создаются SEO Title, H1 и Slug. Для каждого языка укажите отдельное ключевое слово и его варианты.',
    mainKeyword: '🎯 Основное ключевое слово',
    mainKeywordHint: 'Это слово используется для SEO Title, H1 и URL slug',
    keywordLabelUz: 'Ключевое слово',
    keywordLabelRu: 'Основное ключевое слово',
    keywordPhUz: 'Например: шкаф на заказ',
    keywordPhRu: 'Например: шкаф на заказ',
    variantsTitle: '🔄 Варианты ключевого слова',
    variantsHint: 'Варианты естественно используются в описании и alt-тегах изображений',
    variantsUz: 'Варианты',
    variantsRu: 'Варианты',
    addBtn: 'Добавить',
    noVariantsUz: 'Вариантов пока нет',
    noVariantsRu: 'Вариантов пока нет',
    metaTitle: '📝 Meta Title',
    metaTitlePh: 'Название товара',
    charsUz: (n: number) => `${n}/60 символов`,
    charsRu: (n: number) => `${n}/60 символов`,
    metaDesc: '📄 Meta Description',
    metaDescPh: 'Краткое описание товара...',
    charsDescUz: (n: number) => `${n}/160 символов`,
    charsDescRu: (n: number) => `${n}/160 символов`,
    googlePreview: '📋 Вид в поиске Google',
    metaFallback: 'Мета описание...',
    indexing: 'Индексация',
    indexOn: 'В индексе Google',
    indexOff: 'Noindex',
    follow: 'Follow',
    followOn: 'Ссылки отслеживаются',
    followOff: 'Nofollow',
    cancel: 'Отмена',
    save: 'Сохранить',
    create: 'Создать',
  } : {
    editTitle: 'Mahsulotni tahrirlash',
    newTitle: 'Yangi mahsulot',
    tabBasic: 'Asosiy',
    tabDescription: 'Tavsif',
    tabImages: 'Rasmlar',
    tabAttributes: 'Xususiyatlar',
    nameUz: 'Nomi (UZ) *',
    nameRu: 'Nomi (RU) *',
    phUz: "O'zbek tilida",
    phRu: 'На русском',
    slug: 'Slug (URL)',
    slugAuto: 'avtomatik yaratiladi',
    slugTaken: 'Bu slug allaqachon mavjud',
    category: 'Toifa',
    pickCategory: 'Toifani tanlang',
    promoTiles: 'Promo kartochkalar',
    promoHint: "Mahsulot qaysi promo kartochka filtri ostida ko'rinishini tanlang (bir nechta tanlash mumkin).",
    noPromo: 'Promo kartochkalar mavjud emas.',
    inactive: '(nofaol)',
    price: 'Narxi',
    oldPrice: 'Eski narxi',
    negotiable: 'Kelishiladi',
    inStock: 'Mavjud',
    featured: 'Tanlangan',
    discountBanner: "Chegirma bannerida ko'rsatish",
    active: 'Faol',
    shortDescUz: 'Qisqa tavsif (UZ)',
    shortDescRu: 'Qisqa tavsif (RU)',
    shortDescPhUz: 'Mahsulot haqida qisqacha...',
    shortDescPhRu: 'Краткое описание...',
    fullDescUz: "To'liq tavsif (UZ)",
    fullDescRu: "To'liq tavsif (RU)",
    fullDescPhUz: 'Batafsil tavsif...',
    fullDescPhRu: 'Подробное описание...',
    mediaFiles: 'Media fayllari',
    mediaHint: "Rasmlar va videolarni qo'shing",
    addMedia: "Media qo'shish",
    uploadingImages: 'Rasmlar yuklanmoqda...',
    total: 'Jami:',
    mediaCount: (n: number) => `${n} ta media`,
    imagesLabel: (n: number) => `${n} rasm`,
    videosLabel: (n: number) => `${n} video`,
    firstIsMain: "Birinchi media asosiy rasm sifatida ko'rsatiladi",
    seoHint: "💡 Asosiy kalit so'z asosida SEO Title, H1 va Slug avtomatik yaratiladi. Har bir til uchun alohida kalit so'z va variantlarini kiriting.",
    mainKeyword: "🎯 Asosiy kalit so'z",
    mainKeywordHint: "Bu so'z SEO Title, H1 sarlavha va URL slug uchun ishlatiladi",
    keywordLabelUz: "Asosiy kalit so'z",
    keywordLabelRu: 'Основное ключевое слово',
    keywordPhUz: 'Masalan: shkaf buyurtma asosida',
    keywordPhRu: 'Например: шкаф на заказ',
    variantsTitle: "🔄 Kalit so'z variantlari",
    variantsHint: 'Variantlar tavsif va rasm alt teglarida tabiiy ravishda ishlatiladi',
    variantsUz: 'Variantlar',
    variantsRu: 'Варианты',
    addBtn: "Qo'shish",
    noVariantsUz: "Hali variant qo'shilmagan",
    noVariantsRu: 'Вариантов пока нет',
    metaTitle: '📝 Meta Title',
    metaTitlePh: 'Mahsulot nomi',
    charsUz: (n: number) => `${n}/60 belgi`,
    charsRu: (n: number) => `${n}/60 символов`,
    metaDesc: '📄 Meta Description',
    metaDescPh: 'Mahsulot haqida qisqa tavsif...',
    charsDescUz: (n: number) => `${n}/160 belgi`,
    charsDescRu: (n: number) => `${n}/160 символов`,
    googlePreview: "📋 Google qidiruv ko'rinishi",
    metaFallback: 'Meta tavsif...',
    indexing: 'Indexlash',
    indexOn: 'Google indeksida',
    indexOff: 'Noindex',
    follow: 'Follow',
    followOn: 'Havolalar kuzatiladi',
    followOff: 'Nofollow',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    create: 'Yaratish',
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Categories ordered hierarchically: parents then children indented
  const orderedCategories = (() => {
    const parents = categories.filter(c => !c.parent_id);
    const orphans = categories.filter(c => c.parent_id && !categories.some(p => p.id === c.parent_id));
    const result: Array<Category & { _depth: number }> = [];
    parents.forEach(p => {
      result.push({ ...p, _depth: 0 });
      categories.filter(c => c.parent_id === p.id).forEach(child => {
        result.push({ ...child, _depth: 1 });
      });
    });
    orphans.forEach(o => result.push({ ...o, _depth: 1 }));
    return result;
  })();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearch, categoryFilter, statusFilter]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_uz, name_ru, parent_id')
        .order('sort_order');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Apply filters
      if (debouncedSearch) {
        query = query.or(`name_uz.ilike.%${debouncedSearch}%,name_ru.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      } else if (statusFilter === 'featured') {
        query = query.eq('is_featured', true);
      } else if (statusFilter === 'out_of_stock') {
        query = query.eq('in_stock', false);
      }

      // Pagination
      const from = (currentPage - 1) * ADMIN_PAGE_SIZE;
      const to = from + ADMIN_PAGE_SIZE - 1;

      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      setProducts((data as any) || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: "Ma'lumotlarni yuklashda xatolik" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h'
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
    const query = supabase.from('products').select('id').eq('slug', slug);
    if (excludeId) query.neq('id', excludeId);
    const { data } = await query;
    return !data || data.length === 0;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'uz-UZ').format(price) + ' ' + t.products.currency;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '—';
    const category = categories.find(c => c.id === categoryId);
    return category ? (language === 'uz' ? category.name_uz : category.name_ru) : '—';
  };

  // Convert images array to MediaItem array
  const parseImagesForEdit = (images: string[]): MediaItem[] => {
    return images.map(url => {
      // Check if it's a video URL (JSON format stored as string)
      try {
        const parsed = JSON.parse(url);
        if (parsed.type && parsed.url) {
          return parsed as MediaItem;
        }
      } catch {
        // Not JSON, treat as regular image URL
      }
      
      // Check for YouTube embed URL
      if (url.includes('youtube.com/embed')) {
        const videoId = url.split('/embed/')[1]?.split('?')[0];
        return {
          type: 'video' as const,
          url,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          platform: 'youtube' as const
        };
      }
      
      // Check for Instagram embed URL
      if (url.includes('instagram.com')) {
        return {
          type: 'video' as const,
          url,
          platform: 'instagram' as const
        };
      }
      
      return { type: 'image' as const, url };
    });
  };

  // Convert MediaItem array to images array for storage
  const serializeMediaItems = (items: MediaItem[]): string[] => {
    return items.map(item => {
      if (item.type === 'video') {
        return JSON.stringify(item);
      }
      return item.url;
    });
  };

  const openCreateDialog = () => {
    setSelectedProduct(null);
    setFormData(emptyForm);
    setMediaItems([]);
    setSlugError('');
    setActiveTab('basic');
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    const parsedMedia = parseImagesForEdit(product.images || []);
    setMediaItems(parsedMedia);
    setFormData({
      name_uz: product.name_uz,
      name_ru: product.name_ru,
      slug: product.slug || '',
      description_uz: product.description_uz || '',
      description_ru: product.description_ru || '',
      full_description_uz: product.full_description_uz || '',
      full_description_ru: product.full_description_ru || '',
      category_id: product.category_id || '',
      price: product.price?.toString() || '',
      original_price: product.original_price?.toString() || '',
      images: product.images || [],
      materials: (product.materials || []).join(', '),
      sizes: (product.sizes || []).join(', '),
      colors: (product.colors || []).join(', '),
      materials_ru: ((product as any).materials_ru || []).join(', '),
      sizes_ru: ((product as any).sizes_ru || []).join(', '),
      colors_ru: ((product as any).colors_ru || []).join(', '),
      is_negotiable: product.is_negotiable,
      in_stock: product.in_stock,
      is_featured: product.is_featured,
      show_in_discount_banner: product.show_in_discount_banner ?? false,
      is_active: product.is_active,
      meta_title_uz: product.meta_title_uz || '',
      meta_title_ru: product.meta_title_ru || '',
      meta_description_uz: product.meta_description_uz || '',
      meta_description_ru: product.meta_description_ru || '',
      meta_keywords: product.meta_keywords || '',
      is_indexed: product.is_indexed ?? true,
      is_followed: product.is_followed ?? true,
      target_keyword: product.target_keyword || '',
      keyword_variations: product.keyword_variations || [],
      keyword_uz: (product as any).keyword_uz || product.target_keyword || '',
      keyword_ru: (product as any).keyword_ru || '',
      variants_uz: (product as any).variants_uz || product.keyword_variations || [],
      variants_ru: (product as any).variants_ru || [],
      promo_tile_ids: (product as any).promo_tile_ids || [],
      attributes: Array.isArray((product as any).attributes) ? (product as any).attributes : [],
    });
    setSlugError('');
    setActiveTab('basic');
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
      const isUnique = await checkSlugUnique(cleanSlug, selectedProduct?.id);
      setSlugError(isUnique ? '' : 'Bu slug allaqachon mavjud');
    } else {
      setSlugError('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedMedia: MediaItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const originalFile = files[i];
        const file = originalFile.type.startsWith('image/')
          ? await convertImageToWebP(originalFile)
          : originalFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            upsert: true,
            cacheControl: '31536000',
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedMedia.push({ type: 'image', url: publicUrl });
      }

      const newMediaItems = [...mediaItems, ...uploadedMedia];
      setMediaItems(newMediaItems);
      setFormData({ ...formData, images: serializeMediaItems(newMediaItems) });
      toast({ title: 'Muvaffaqiyat', description: `${uploadedMedia.length} ta rasm yuklandi` });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Rasmni yuklashda xatolik: ' + error.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddMedia = (media: MediaItem) => {
    const newMediaItems = [...mediaItems, media];
    setMediaItems(newMediaItems);
    setFormData({ ...formData, images: serializeMediaItems(newMediaItems) });
  };

  const removeMedia = (index: number) => {
    const newMediaItems = mediaItems.filter((_, i) => i !== index);
    setMediaItems(newMediaItems);
    setFormData({ ...formData, images: serializeMediaItems(newMediaItems) });
  };

  const moveMedia = (fromIndex: number, toIndex: number) => {
    const newMediaItems = [...mediaItems];
    const [movedItem] = newMediaItems.splice(fromIndex, 1);
    newMediaItems.splice(toIndex, 0, movedItem);
    setMediaItems(newMediaItems);
    setFormData({ ...formData, images: serializeMediaItems(newMediaItems) });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name_uz || !formData.name_ru) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Mahsulot nomini kiriting' });
      setActiveTab('basic');
      return;
    }

    // Validate category is required
    if (!formData.category_id) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Kategoriyani tanlash majburiy!' });
      setActiveTab('basic');
      return;
    }

    const slug = formData.slug || generateSlug(formData.name_uz);

    const isUnique = await checkSlugUnique(slug, selectedProduct?.id);
    if (!isUnique) {
      setSlugError('Bu slug allaqachon mavjud');
      return;
    }

    const productData = {
      name_uz: formData.name_uz.trim(),
      name_ru: formData.name_ru.trim(),
      slug,
      description_uz: formData.description_uz || null,
      description_ru: formData.description_ru || null,
      full_description_uz: formData.full_description_uz || null,
      full_description_ru: formData.full_description_ru || null,
      category_id: formData.category_id || null,
      price: formData.price ? parseFloat(formData.price) : null,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      images: formData.images,
      materials: formData.materials.split(',').map(s => s.trim()).filter(Boolean),
      sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: formData.colors.split(',').map(s => s.trim()).filter(Boolean),
      materials_ru: formData.materials_ru.split(',').map(s => s.trim()).filter(Boolean),
      sizes_ru: formData.sizes_ru.split(',').map(s => s.trim()).filter(Boolean),
      colors_ru: formData.colors_ru.split(',').map(s => s.trim()).filter(Boolean),
      is_negotiable: formData.is_negotiable,
      in_stock: formData.in_stock,
      is_featured: formData.is_featured,
      show_in_discount_banner: formData.show_in_discount_banner,
      is_active: formData.is_active,
      meta_title_uz: formData.meta_title_uz || null,
      meta_title_ru: formData.meta_title_ru || null,
      meta_description_uz: formData.meta_description_uz || null,
      meta_description_ru: formData.meta_description_ru || null,
      meta_keywords: formData.meta_keywords || null,
      is_indexed: formData.is_indexed,
      is_followed: formData.is_followed,
      target_keyword: formData.keyword_uz || formData.target_keyword || null,
      keyword_variations: (formData.variants_uz || []).length > 0 ? formData.variants_uz : (formData.keyword_variations || []).length > 0 ? formData.keyword_variations : [],
      keyword_uz: formData.keyword_uz || null,
      keyword_ru: formData.keyword_ru || null,
      variants_uz: (formData.variants_uz || []).length > 0 ? formData.variants_uz : [],
      variants_ru: (formData.variants_ru || []).length > 0 ? formData.variants_ru : [],
      promo_tile_ids: formData.promo_tile_ids || [],
      attributes: formData.attributes || [],
    };

    try {
      if (selectedProduct) {
        const { error } = await supabase.from('products').update(productData as any).eq('id', selectedProduct.id);
        if (error) throw error;
        toast({ title: 'Muvaffaqiyat', description: 'Mahsulot yangilandi' });
      } else {
        const { error } = await supabase.from('products').insert([productData as any]);
        if (error) throw error;
        toast({ title: 'Muvaffaqiyat', description: 'Mahsulot yaratildi' });
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        setSlugError('Bu slug allaqachon mavjud');
      } else {
        toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', selectedProduct.id);
      if (error) throw error;
      toast({ title: 'Muvaffaqiyat', description: "Mahsulot o'chirildi" });
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !product.is_featured })
        .eq('id', product.id);

      if (error) throw error;
      fetchProducts();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
    }
  };

  const EXPORT_HEADERS = ['ID', 'Nomi (UZ)', 'Nomi (RU)', 'Slug', 'Toifa', 'Narxi', 'Eski narxi', 'Mavjud', 'Faol'] as const;

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      let query = supabase
        .from('products')
        .select('id, name_uz, name_ru, slug, category_id, price, original_price, in_stock, is_active');

      if (debouncedSearch) {
        query = query.or(`name_uz.ilike.%${debouncedSearch}%,name_ru.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      } else if (statusFilter === 'featured') {
        query = query.eq('is_featured', true);
      } else if (statusFilter === 'out_of_stock') {
        query = query.eq('in_stock', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data || []).map((p: any) => [
        p.id,
        p.name_uz,
        p.name_ru,
        p.slug || '',
        getCategoryName(p.category_id),
        p.price ?? '',
        p.original_price ?? '',
        p.in_stock ? 'TRUE' : 'FALSE',
        p.is_active ? 'TRUE' : 'FALSE',
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([[...EXPORT_HEADERS], ...rows]);
      worksheet['!cols'] = [
        { wch: 38 }, { wch: 30 }, { wch: 30 }, { wch: 28 }, { wch: 20 },
        { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Mahsulotlar');

      const fileName = `mahsulotlar-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({ title: 'Muvaffaqiyat', description: `${rows.length} ta mahsulot Excel faylga eksport qilindi` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
    } finally {
      setExporting(false);
    }
  };

  const parsePriceCell = (value: unknown): number | null | undefined => {
    if (value === undefined) return undefined; // column missing entirely -> don't touch
    if (value === null || value === '') return null;
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    if (cleaned === '') return null;
    const num = parseFloat(cleaned);
    return Number.isNaN(num) ? undefined : num;
  };

  const parseBoolCell = (value: unknown): boolean | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const str = String(value).trim().toLowerCase();
    if (['true', '1', 'ha', 'да', 'да ', 'mavjud', 'faol'].includes(str)) return true;
    if (['false', '0', "yo'q", 'yoq', 'нет'].includes(str)) return false;
    return undefined;
  };

  const handleImportClick = () => importInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: undefined });

      if (rows.length === 0) {
        toast({ variant: 'destructive', title: 'Xatolik', description: "Fayl bo'sh yoki noto'g'ri formatda" });
        return;
      }

      let updated = 0;
      let skipped = 0;
      let failed = 0;

      const CHUNK_SIZE = 10;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const results = await Promise.allSettled(
          chunk.map(async (row) => {
            const id = String(row['ID'] ?? '').trim();
            if (!id) {
              skipped++;
              return;
            }

            const payload: Record<string, unknown> = {};

            const price = parsePriceCell(row['Narxi']);
            if (price !== undefined) payload.price = price;

            const originalPrice = parsePriceCell(row['Eski narxi']);
            if (originalPrice !== undefined) payload.original_price = originalPrice;

            const inStock = parseBoolCell(row['Mavjud']);
            if (inStock !== undefined) payload.in_stock = inStock;

            const isActive = parseBoolCell(row['Faol']);
            if (isActive !== undefined) payload.is_active = isActive;

            if (Object.keys(payload).length === 0) {
              skipped++;
              return;
            }

            const { data, error } = await supabase
              .from('products')
              .update(payload)
              .eq('id', id)
              .select('id');

            if (error || !data || data.length === 0) {
              failed++;
            } else {
              updated++;
            }
          })
        );
        // Propagate unexpected exceptions as failures without stopping the loop
        results.forEach((r) => {
          if (r.status === 'rejected') failed++;
        });
      }

      toast({
        title: 'Import yakunlandi',
        description: `${updated} ta yangilandi, ${skipped} ta o'tkazib yuborildi, ${failed} ta xatolik`,
      });
      fetchProducts();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: "Faylni o'qishda xatolik: " + error.message });
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const getSeoStatus = (product: Product) => {
    const hasTitle = product.meta_title_uz || product.meta_title_ru;
    const hasDescription = product.meta_description_uz || product.meta_description_ru;
    
    if (hasTitle && hasDescription) return { status: 'complete', label: t.products.seoComplete };
    if (hasTitle || hasDescription) return { status: 'partial', label: t.products.seoPartial };
    return { status: 'missing', label: t.products.seoMissing };
  };

  // Pagination helpers
  const totalPages = Math.ceil(totalCount / ADMIN_PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <h1 className="text-2xl font-bold">{t.products.title}</h1>
          <p className="text-muted-foreground">{t.products.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
          <Button variant="outline" onClick={handleImportClick} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" />
            {importing ? t.products.importing : t.products.importExcel}
          </Button>
          <Button variant="outline" onClick={handleExportExcel} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? t.products.exporting : t.products.exportExcel}
          </Button>
          <Button variant="outline" onClick={fetchProducts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t.products.refresh}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t.products.newProduct}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.products.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.products.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.products.allCategories}</SelectItem>
                {orderedCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat._depth > 0 ? '— ' : ''}{language === 'uz' ? cat.name_uz : cat.name_ru}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.products.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.products.statusAll}</SelectItem>
                <SelectItem value="active">{t.products.statusActive}</SelectItem>
                <SelectItem value="inactive">{t.products.statusInactive}</SelectItem>
                <SelectItem value="featured">{t.products.statusFeatured}</SelectItem>
                <SelectItem value="out_of_stock">{t.products.statusOutOfStock}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>{t.products.allProducts(totalCount)}</span>
            <div className="flex gap-2">
              <Badge variant="outline">{t.products.activeCount(products.filter(p => p.is_active).length)}</Badge>
              <Badge variant="secondary">{t.products.featuredCount(products.filter(p => p.is_featured).length)}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t.products.colImage}</TableHead>
                <TableHead>{t.products.colName}</TableHead>
                <TableHead>{t.products.colCategory}</TableHead>
                <TableHead>{t.products.colPrice}</TableHead>
                <TableHead>{t.products.colStatus}</TableHead>
                <TableHead>{t.products.colSeo}</TableHead>
                <TableHead className="text-right">{t.products.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const seoStatus = getSeoStatus(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name_uz} width={48} height={48} loading="lazy" decoding="async" className="h-12 w-12 object-cover rounded-lg border" />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{language === 'uz' ? product.name_uz : product.name_ru}</p>
                        {product.slug && (
                          <code className="text-xs text-muted-foreground">/{product.slug}</code>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryName(product.category_id)}</TableCell>
                    <TableCell>
                      {product.is_negotiable ? (
                        <Badge variant="outline">{t.products.negotiable}</Badge>
                      ) : (
                        <div>
                          <p className="font-medium">{formatPrice(product.price)}</p>
                          {product.original_price && product.original_price > (product.price || 0) && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.original_price)}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? t.products.active : t.products.inactive}
                        </Badge>
                        {product.in_stock ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">{t.products.inStock}</Badge>
                        ) : (
                          <Badge variant="destructive">{t.products.outOfStock}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={seoStatus.status === 'complete' ? 'default' : seoStatus.status === 'partial' ? 'secondary' : 'outline'}
                        className={seoStatus.status === 'missing' ? 'text-muted-foreground' : ''}
                      >
                        {seoStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleFeatured(product)}
                          title={product.is_featured ? t.products.removeFromFeatured : t.products.addToFeatured}
                        >
                          <Star className={`h-4 w-4 ${product.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedProduct(product); setPreviewDialogOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">{t.products.notFound}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {t.products.previous}
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {t.products.next}
            </Button>
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? L.editTitle : L.newTitle}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">{L.tabBasic}</TabsTrigger>
              <TabsTrigger value="description">{L.tabDescription}</TabsTrigger>
              <TabsTrigger value="images">{L.tabImages}</TabsTrigger>
              <TabsTrigger value="attributes">{L.tabAttributes}</TabsTrigger>
              <TabsTrigger value="seo" className="gap-1">
                <Globe className="h-3 w-3" />
                SEO
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{L.nameUz}</Label>
                  <Input
                    value={formData.name_uz}
                    onChange={(e) => handleNameChange(e.target.value, 'name_uz')}
                    placeholder={L.phUz}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{L.nameRu}</Label>
                  <Input
                    value={formData.name_ru}
                    onChange={(e) => handleNameChange(e.target.value, 'name_ru')}
                    placeholder={L.phRu}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{L.slug}</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder={L.slugAuto}
                  className={slugError ? 'border-destructive' : ''}
                />
                {slugError ? (
                  <p className="text-sm text-destructive">{slugError}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    URL: /product/{formData.slug || 'slug'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{L.category}</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={L.pickCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    {orderedCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat._depth > 0 ? '— ' : ''}{language === 'uz' ? cat.name_uz : cat.name_ru}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{L.promoTiles}</Label>
                <p className="text-xs text-muted-foreground">
                  {L.promoHint}
                </p>
                {promoTilesList.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">{L.noPromo}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                    {promoTilesList.map((tile) => {
                      const Icon = PROMO_ICONS[tile.icon] || PROMO_ICONS.Sparkles;
                      const checked = formData.promo_tile_ids.includes(tile.id);
                      return (
                        <label
                          key={tile.id}
                          className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-accent"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const next = v
                                ? [...formData.promo_tile_ids, tile.id]
                                : formData.promo_tile_ids.filter((id) => id !== tile.id);
                              setFormData({ ...formData, promo_tile_ids: next });
                            }}
                          />
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="text-sm truncate">
                            {language === 'uz' ? tile.title_uz : tile.title_ru}
                            {!tile.is_active && (
                              <span className="ml-1 text-xs text-muted-foreground">{L.inactive}</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{L.price}</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{L.oldPrice}</Label>
                  <Input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_negotiable}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_negotiable: checked })}
                  />
                  <Label>{L.negotiable}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.in_stock}
                    onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                  />
                  <Label>{L.inStock}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>{L.featured}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.show_in_discount_banner}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_in_discount_banner: checked })}
                  />
                  <Label>{L.discountBanner}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>{L.active}</Label>
                </div>
              </div>
            </TabsContent>

            {/* Description Tab */}
            <TabsContent value="description" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{L.shortDescUz}</Label>
                  <Textarea
                    value={formData.description_uz}
                    onChange={(e) => setFormData({ ...formData, description_uz: e.target.value })}
                    rows={3}
                    placeholder={L.shortDescPhUz}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{L.shortDescRu}</Label>
                  <Textarea
                    value={formData.description_ru}
                    onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                    rows={3}
                    placeholder={L.shortDescPhRu}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{L.fullDescUz}</Label>
                  <Textarea
                    value={formData.full_description_uz}
                    onChange={(e) => setFormData({ ...formData, full_description_uz: e.target.value })}
                    rows={6}
                    placeholder={L.fullDescPhUz}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{L.fullDescRu}</Label>
                  <Textarea
                    value={formData.full_description_ru}
                    onChange={(e) => setFormData({ ...formData, full_description_ru: e.target.value })}
                    rows={6}
                    placeholder={L.fullDescPhRu}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="images" className="space-y-4 mt-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Add Media Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    {L.mediaFiles}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {L.mediaHint}
                  </p>
                </div>
                <Button onClick={() => setMediaModalOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {L.addMedia}
                </Button>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span>{L.uploadingImages}</span>
                  </div>
                </div>
              )}

              {/* Media Grid */}
              <MediaGrid 
                items={mediaItems}
                onRemove={removeMedia}
                onMove={moveMedia}
              />

              {/* Media count */}
              {mediaItems.length > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {L.total} {L.mediaCount(mediaItems.length)}
                    {' '}({L.imagesLabel(mediaItems.filter(m => m.type === 'image').length)}, {L.videosLabel(mediaItems.filter(m => m.type === 'video').length)})
                  </span>
                  <span>{L.firstIsMain}</span>
                </div>
              )}
            </TabsContent>

            {/* Attributes Tab */}
            <TabsContent value="attributes" className="space-y-4 mt-4">
              <AttributesEditor
                value={formData.attributes}
                onChange={(v) => setFormData({ ...formData, attributes: v })}
                language={language as 'uz' | 'ru'}
              />
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6 mt-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {L.seoHint}
                </p>
              </div>

              {/* Target Keywords - Bilingual */}
              <div className="space-y-3">
                <h3 className="font-medium text-base">{L.mainKeyword}</h3>
                <p className="text-xs text-muted-foreground">
                  {L.mainKeywordHint}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">UZ</Badge>
                      {L.keywordLabelUz}
                    </Label>
                    <Input
                      value={formData.keyword_uz}
                      onChange={(e) => {
                        const keyword = e.target.value;
                        const newFormData = { ...formData, keyword_uz: keyword };
                        if (keyword && (!formData.slug || formData.slug === generateSlug(formData.keyword_uz))) {
                          newFormData.slug = generateSlug(keyword);
                        }
                        if (keyword && !formData.meta_title_uz) {
                          const autoTitle = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                          if (autoTitle.length <= 60) {
                            newFormData.meta_title_uz = autoTitle + (formData.name_uz ? ` | ${formData.name_uz}` : '');
                            if (newFormData.meta_title_uz.length > 60) {
                              newFormData.meta_title_uz = autoTitle;
                            }
                          }
                        }
                        setFormData(newFormData);
                      }}
                      placeholder={L.keywordPhUz}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">RU</Badge>
                      {L.keywordLabelRu}
                    </Label>
                    <Input
                      value={formData.keyword_ru}
                      onChange={(e) => {
                        const keyword = e.target.value;
                        const newFormData = { ...formData, keyword_ru: keyword };
                        if (keyword && !formData.meta_title_ru) {
                          const autoTitle = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                          if (autoTitle.length <= 60) {
                            newFormData.meta_title_ru = autoTitle + (formData.name_ru ? ` | ${formData.name_ru}` : '');
                            if (newFormData.meta_title_ru.length > 60) {
                              newFormData.meta_title_ru = autoTitle;
                            }
                          }
                        }
                        setFormData(newFormData);
                      }}
                      placeholder={L.keywordPhRu}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Keyword Variants - Bilingual */}
              <div className="space-y-3">
                <h3 className="font-medium text-base">{L.variantsTitle}</h3>
                <p className="text-xs text-muted-foreground">
                  {L.variantsHint}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* UZ Variants */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">UZ</Badge>
                        {L.variantsUz}
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, variants_uz: [...formData.variants_uz, ''] })}
                        className="gap-1 h-7 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        {L.addBtn}
                      </Button>
                    </div>
                    {(formData.variants_uz || []).map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={v}
                          onChange={(e) => {
                            const arr = [...formData.variants_uz];
                            arr[i] = e.target.value;
                            setFormData({ ...formData, variants_uz: arr });
                          }}
                          placeholder={`Variant ${i + 1}: masalan, mebel buyurtma`}
                          className="text-sm"
                        />
                        <Button
                          type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                          onClick={() => setFormData({ ...formData, variants_uz: (formData.variants_uz || []).filter((_, idx) => idx !== i) })}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {(formData.variants_uz || []).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">{L.noVariantsUz}</p>
                    )}
                  </div>

                  {/* RU Variants */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">RU</Badge>
                        {L.variantsRu}
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, variants_ru: [...formData.variants_ru, ''] })}
                        className="gap-1 h-7 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        {L.addBtn}
                      </Button>
                    </div>
                    {(formData.variants_ru || []).map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={v}
                          onChange={(e) => {
                            const arr = [...formData.variants_ru];
                            arr[i] = e.target.value;
                            setFormData({ ...formData, variants_ru: arr });
                          }}
                          placeholder={`Вариант ${i + 1}: например, мебель на заказ`}
                          className="text-sm"
                        />
                        <Button
                          type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                          onClick={() => setFormData({ ...formData, variants_ru: (formData.variants_ru || []).filter((_, idx) => idx !== i) })}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {(formData.variants_ru || []).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">{L.noVariantsRu}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Meta Title */}
              <div className="space-y-3">
                <h3 className="font-medium text-base">{L.metaTitle}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">UZ</Badge>
                      Meta Title
                    </Label>
                    <Input
                      value={formData.meta_title_uz}
                      onChange={(e) => setFormData({ ...formData, meta_title_uz: e.target.value.slice(0, 60) })}
                      placeholder={formData.keyword_uz || formData.name_uz || L.metaTitlePh}
                      maxLength={60}
                    />
                    <p className={`text-xs ${formData.meta_title_uz.length > 55 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {L.charsUz(formData.meta_title_uz.length)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">RU</Badge>
                      Meta Title
                    </Label>
                    <Input
                      value={formData.meta_title_ru}
                      onChange={(e) => setFormData({ ...formData, meta_title_ru: e.target.value.slice(0, 60) })}
                      placeholder={formData.keyword_ru || formData.name_ru || 'Название товара'}
                      maxLength={60}
                    />
                    <p className={`text-xs ${formData.meta_title_ru.length > 55 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {L.charsRu(formData.meta_title_ru.length)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Meta Description */}
              <div className="space-y-3">
                <h3 className="font-medium text-base">{L.metaDesc}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">UZ</Badge>
                      Meta Description
                    </Label>
                    <Textarea
                      value={formData.meta_description_uz}
                      onChange={(e) => setFormData({ ...formData, meta_description_uz: e.target.value.slice(0, 160) })}
                      placeholder={L.metaDescPh}
                      maxLength={160}
                      rows={3}
                    />
                    <p className={`text-xs ${formData.meta_description_uz.length > 150 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {L.charsDescUz(formData.meta_description_uz.length)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">RU</Badge>
                      Meta Description
                    </Label>
                    <Textarea
                      value={formData.meta_description_ru}
                      onChange={(e) => setFormData({ ...formData, meta_description_ru: e.target.value.slice(0, 160) })}
                      placeholder="Краткое описание товара..."
                      maxLength={160}
                      rows={3}
                    />
                    <p className={`text-xs ${formData.meta_description_ru.length > 150 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {L.charsDescRu(formData.meta_description_ru.length)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* SEO Preview - Both languages */}
              {(formData.keyword_uz || formData.meta_title_uz || formData.keyword_ru || formData.meta_title_ru) && (
                <div className="space-y-4">
                  <h3 className="font-medium text-base">{L.googlePreview}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* UZ Preview */}
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs mb-2">UZ</Badge>
                      <div className="bg-card border rounded-lg p-4 space-y-1">
                        <p className="text-primary text-lg truncate">
                          {formData.meta_title_uz || formData.keyword_uz || formData.name_uz}
                        </p>
                        <p className="text-emerald-600 text-sm">
                          mirmexa.com.uz/product/{formData.slug || 'slug'}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {formData.meta_description_uz || formData.description_uz || L.metaFallback}
                        </p>
                      </div>
                    </div>
                    {/* RU Preview */}
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs mb-2">RU</Badge>
                      <div className="bg-card border rounded-lg p-4 space-y-1">
                        <p className="text-primary text-lg truncate">
                          {formData.meta_title_ru || formData.keyword_ru || formData.name_ru}
                        </p>
                        <p className="text-emerald-600 text-sm">
                          mirmexa.com.uz/ru/product/{formData.slug || 'slug'}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {formData.meta_description_ru || formData.description_ru || 'Мета описание...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Index/Follow Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_indexed}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_indexed: checked })}
                  />
                  <div>
                    <Label>{L.indexing}</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_indexed ? L.indexOn : L.indexOff}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_followed}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_followed: checked })}
                  />
                  <div>
                    <Label>{L.follow}</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_followed ? L.followOn : L.followOff}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{L.cancel}</Button>
            <Button onClick={handleSubmit} disabled={!!slugError}>
              {selectedProduct ? L.save : L.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mahsulot ko'rinishi</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {selectedProduct.images?.[0] && (
                <img 
                  src={selectedProduct.images[0]} 
                  alt={selectedProduct.name_uz} 
                  width={768}
                  height={256}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <div>
                <h2 className="text-xl font-bold">{selectedProduct.name_uz}</h2>
                <p className="text-muted-foreground">{selectedProduct.name_ru}</p>
              </div>
              {selectedProduct.description_uz && (
                <p>{selectedProduct.description_uz}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                {selectedProduct.sizes?.map((size, i) => (
                  <Badge key={i} variant="outline">{size}</Badge>
                ))}
                {selectedProduct.colors?.map((color, i) => (
                  <Badge key={i} variant="secondary">{color}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">{formatPrice(selectedProduct.price)}</span>
                {selectedProduct.is_negotiable && (
                  <Badge>Kelishiladi</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mahsulotni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham "{selectedProduct?.name_uz}" mahsulotini o'chirmoqchimisiz?
              Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Media Modal */}
      <AddMediaModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onAddMedia={handleAddMedia}
        onUploadImages={() => fileInputRef.current?.click()}
        uploading={uploading}
      />
    </div>
  );
}
