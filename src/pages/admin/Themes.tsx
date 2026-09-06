import { useState, useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Theme, ThemeColors, ThemeTypography, ThemeComponentStyles, ThemeLayoutSettings } from '@/lib/themes';
import { 
  Check, Eye, EyeOff, Palette, Moon, Sun, RefreshCw, Plus, Copy, 
  Lock, Trash2, Settings2, Monitor, Smartphone, Type, Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminT } from '@/hooks/useAdminT';

const FONT_OPTIONS = [
  { value: "'Inter', system-ui, sans-serif", label: "Inter" },
  { value: "'Playfair Display', Georgia, serif", label: "Playfair Display" },
  { value: "'Roboto', system-ui, sans-serif", label: "Roboto" },
  { value: "'Montserrat', system-ui, sans-serif", label: "Montserrat" },
  { value: "'Lora', Georgia, serif", label: "Lora" },
  { value: "'Nunito Sans', system-ui, sans-serif", label: "Nunito Sans" },
  { value: "'Work Sans', system-ui, sans-serif", label: "Work Sans" },
  { value: "'Bebas Neue', sans-serif", label: "Bebas Neue" },
  { value: "'Rubik', system-ui, sans-serif", label: "Rubik" },
  { value: "'Oswald', sans-serif", label: "Oswald" },
];

const RADIUS_OPTIONS = [
  { value: "0", label: "0 (Sharp)" },
  { value: "0.25rem", label: "0.25rem" },
  { value: "0.5rem", label: "0.5rem" },
  { value: "0.75rem", label: "0.75rem" },
  { value: "1rem", label: "1rem" },
  { value: "1.5rem", label: "1.5rem (Rounded)" },
];

const THEME_PRESETS = [
  {
    name: 'OrsiHome Premium',
    tagline: 'Dark Green + Beige',
    values: {
      isDark: false,
      primaryColor: '150 32% 17%',
      secondaryColor: '35 38% 75%',
      accentColor: '35 38% 75%',
      backgroundColor: '43 30% 95%',
      foregroundColor: '0 0% 13%',
      fontFamily: "'Playfair Display', Georgia, serif",
      borderRadius: '1.5rem',
      shadowLevel: 'medium',
    },
  },
  {
    name: 'Modern Luxury',
    tagline: 'Black + Gold',
    values: {
      isDark: false,
      primaryColor: '0 0% 8%',
      secondaryColor: '45 30% 92%',
      accentColor: '45 93% 47%',
      backgroundColor: '0 0% 100%',
      foregroundColor: '0 0% 10%',
      fontFamily: "'Playfair Display', Georgia, serif",
      borderRadius: '0.25rem',
      shadowLevel: 'medium',
    },
  },
  {
    name: 'Scandinavian',
    tagline: 'White + Gray',
    values: {
      isDark: false,
      primaryColor: '210 20% 20%',
      secondaryColor: '210 16% 93%',
      accentColor: '215 25% 35%',
      backgroundColor: '0 0% 98%',
      foregroundColor: '210 20% 15%',
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: '0.5rem',
      shadowLevel: 'light',
    },
  },
  {
    name: 'Elegant Beige',
    tagline: 'Cream + Brown',
    values: {
      isDark: false,
      primaryColor: '25 35% 28%',
      secondaryColor: '35 40% 88%',
      accentColor: '30 50% 50%',
      backgroundColor: '40 35% 96%',
      foregroundColor: '25 30% 18%',
      fontFamily: "'Lora', Georgia, serif",
      borderRadius: '0.75rem',
      shadowLevel: 'medium',
    },
  },
  {
    name: 'Midnight',
    tagline: 'Dark Theme',
    values: {
      isDark: true,
      primaryColor: '210 100% 60%',
      secondaryColor: '220 15% 18%',
      accentColor: '270 70% 65%',
      backgroundColor: '222 20% 10%',
      foregroundColor: '210 20% 95%',
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: '0.75rem',
      shadowLevel: 'heavy',
    },
  },
  {
    name: 'Forest',
    tagline: 'Green + Earth',
    values: {
      isDark: false,
      primaryColor: '142 40% 25%',
      secondaryColor: '85 25% 88%',
      accentColor: '35 70% 50%',
      backgroundColor: '60 20% 97%',
      foregroundColor: '142 30% 12%',
      fontFamily: "'Montserrat', system-ui, sans-serif",
      borderRadius: '1rem',
      shadowLevel: 'medium',
    },
  },
  {
    name: 'Pure Minimal',
    tagline: 'Oq + Grafit',
    values: {
      isDark: false,
      primaryColor: '0 0% 12%',
      secondaryColor: '0 0% 96%',
      accentColor: '0 0% 30%',
      backgroundColor: '0 0% 100%',
      foregroundColor: '0 0% 10%',
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: '0',
      shadowLevel: 'light',
    },
  },
  {
    name: 'Paper & Ink',
    tagline: 'Suyak + Siyoh',
    values: {
      isDark: false,
      primaryColor: '0 0% 8%',
      secondaryColor: '40 15% 92%',
      accentColor: '20 10% 35%',
      backgroundColor: '40 20% 97%',
      foregroundColor: '0 0% 12%',
      fontFamily: "'Lora', Georgia, serif",
      borderRadius: '0.25rem',
      shadowLevel: 'light',
    },
  },
  {
    name: 'Soft Stone',
    tagline: 'Toshrang + Bej',
    values: {
      isDark: false,
      primaryColor: '25 8% 25%',
      secondaryColor: '30 12% 92%',
      accentColor: '28 20% 45%',
      backgroundColor: '30 14% 96%',
      foregroundColor: '25 10% 15%',
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: '0.5rem',
      shadowLevel: 'light',
    },
  },
  {
    name: 'Nordic Fog',
    tagline: 'Och kulrang + Ko\'k',
    values: {
      isDark: false,
      primaryColor: '215 25% 27%',
      secondaryColor: '210 20% 95%',
      accentColor: '205 30% 45%',
      backgroundColor: '210 25% 98%',
      foregroundColor: '215 25% 14%',
      fontFamily: "'Montserrat', system-ui, sans-serif",
      borderRadius: '0.75rem',
      shadowLevel: 'light',
    },
  },
  {
    name: 'Warm Linen',
    tagline: 'Zig\'ir + Jigarrang',
    values: {
      isDark: false,
      primaryColor: '28 22% 26%',
      secondaryColor: '35 30% 91%',
      accentColor: '30 35% 48%',
      backgroundColor: '38 32% 97%',
      foregroundColor: '28 25% 16%',
      fontFamily: "'Lora', Georgia, serif",
      borderRadius: '0.5rem',
      shadowLevel: 'light',
    },
  },
  {
    name: 'Sage Minimal',
    tagline: 'Sage + Krem',
    values: {
      isDark: false,
      primaryColor: '150 18% 24%',
      secondaryColor: '140 18% 92%',
      accentColor: '150 22% 40%',
      backgroundColor: '60 18% 98%',
      foregroundColor: '150 18% 13%',
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: '0.75rem',
      shadowLevel: 'light',
    },
  },
  {
    name: 'Clay Minimal',
    tagline: 'Terrakota + Oq',
    values: {
      isDark: false,
      primaryColor: '15 25% 28%',
      secondaryColor: '18 30% 93%',
      accentColor: '14 45% 50%',
      backgroundColor: '20 25% 98%',
      foregroundColor: '15 25% 15%',
      fontFamily: "'Montserrat', system-ui, sans-serif",
      borderRadius: '1rem',
      shadowLevel: 'light',
    },
  },
  {
    name: 'Mono Editorial',
    tagline: 'Serif + Sof oq',
    values: {
      isDark: false,
      primaryColor: '0 0% 15%',
      secondaryColor: '0 0% 94%',
      accentColor: '0 0% 40%',
      backgroundColor: '0 0% 99%',
      foregroundColor: '0 0% 8%',
      fontFamily: "'Playfair Display', Georgia, serif",
      borderRadius: '0',
      shadowLevel: 'light',
    },
  },
  {
    name: 'Graphite Dark',
    tagline: 'Qora minimal',
    values: {
      isDark: true,
      primaryColor: '0 0% 92%',
      secondaryColor: '0 0% 16%',
      accentColor: '0 0% 65%',
      backgroundColor: '0 0% 8%',
      foregroundColor: '0 0% 95%',
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: '0.25rem',
      shadowLevel: 'medium',
    },
  },
  {
    name: 'Slate Night',
    tagline: 'Tungi slate',
    values: {
      isDark: true,
      primaryColor: '210 30% 88%',
      secondaryColor: '215 20% 18%',
      accentColor: '200 35% 60%',
      backgroundColor: '215 25% 11%',
      foregroundColor: '210 25% 94%',
      fontFamily: "'Montserrat', system-ui, sans-serif",
      borderRadius: '0.75rem',
      shadowLevel: 'medium',
    },
  },
] as const;

const Themes = () => {
  const t = useAdminT().themes;
  const { 
    themes, 
    currentTheme, 
    isLoading, 
    setActiveTheme, 
    previewTheme, 
    resetPreview, 
    isPreviewMode,
    refreshThemes 
  } = useTheme();
  
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'light' | 'dark'>('all');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [builderMode, setBuilderMode] = useState<'create' | 'edit' | 'clone'>('create');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    isDark: false,
    primaryColor: '222 47% 11%',
    secondaryColor: '210 40% 96%',
    accentColor: '142 76% 36%',
    backgroundColor: '0 0% 100%',
    foregroundColor: '222 47% 11%',
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: '0.5rem',
    shadowLevel: 'medium',
  });

  const filteredThemes = useMemo(() => {
    let result = themes.filter(theme => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'light') return !theme.isDark;
      if (selectedCategory === 'dark') return theme.isDark;
      return true;
    });

    // Sort: active theme first
    result.sort((a, b) => {
      if (a.isActive) return -1;
      if (b.isActive) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [themes, selectedCategory]);

  const handlePreview = (theme: Theme) => {
    if (previewingId === theme.id) {
      resetPreview();
      setPreviewingId(null);
    } else {
      previewTheme(theme);
      setPreviewingId(theme.id || null);
    }
  };

  const handleApply = async (theme: Theme) => {
    if (!theme.id) return;
    await setActiveTheme(theme.id);
    setPreviewingId(null);
    toast.success(t.appliedToast(theme.name));
  };

  const handleEdit = (theme: Theme) => {
    setBuilderMode('edit');
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      isDark: theme.isDark,
      primaryColor: theme.colorPalette.primary,
      secondaryColor: theme.colorPalette.secondary,
      accentColor: theme.colorPalette.accent,
      backgroundColor: theme.colorPalette.background,
      foregroundColor: theme.colorPalette.foreground,
      fontFamily: theme.typography.fontSans,
      borderRadius: theme.componentStyles.borderRadius,
      shadowLevel: 'medium',
    });
    setShowBuilder(true);
  };

  const handleDelete = async (theme: Theme) => {
    if (!theme.id || theme.isActive) return;
    if (!confirm(t.deleteConfirm(theme.name))) return;
    try {
      const { error } = await supabase.from('themes').delete().eq('id', theme.id);
      if (error) throw error;
      toast.success(t.deletedToast);
      refreshThemes();
    } catch (error: any) {
      toast.error(`${t.errorPrefix}: ${error.message}`);
    }
  };

  const handleClone = (theme: Theme) => {
    setBuilderMode('clone');
    setEditingTheme(theme);
    setFormData({
      name: `${theme.name} (${t.copySuffix})`,
      isDark: theme.isDark,
      primaryColor: theme.colorPalette.primary,
      secondaryColor: theme.colorPalette.secondary,
      accentColor: theme.colorPalette.accent,
      backgroundColor: theme.colorPalette.background,
      foregroundColor: theme.colorPalette.foreground,
      fontFamily: theme.typography.fontSans,
      borderRadius: theme.componentStyles.borderRadius,
      shadowLevel: 'medium',
    });
    setShowBuilder(true);
  };

  const handleCreateNew = () => {
    setBuilderMode('create');
    setEditingTheme(null);
    setFormData({
      name: '',
      isDark: false,
      primaryColor: '222 47% 11%',
      secondaryColor: '210 40% 96%',
      accentColor: '142 76% 36%',
      backgroundColor: '0 0% 100%',
      foregroundColor: '222 47% 11%',
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: '0.5rem',
      shadowLevel: 'medium',
    });
    setShowBuilder(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const getShadowValues = (level: string) => {
    switch (level) {
      case 'none':
        return { sm: 'none', md: 'none', lg: 'none' };
      case 'light':
        return {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
          md: '0 2px 4px -1px rgb(0 0 0 / 0.05)',
          lg: '0 4px 8px -2px rgb(0 0 0 / 0.08)',
        };
      case 'medium':
        return {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        };
      case 'heavy':
        return {
          sm: '0 2px 4px 0 rgb(0 0 0 / 0.1)',
          md: '0 6px 12px -2px rgb(0 0 0 / 0.15)',
          lg: '0 15px 25px -5px rgb(0 0 0 / 0.2)',
        };
      default:
        return {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        };
    }
  };

  const handleSaveTheme = async () => {
    if (!formData.name.trim()) {
      toast.error(t.enterName);
      return;
    }

    const shadows = getShadowValues(formData.shadowLevel);
    const slug = generateSlug(formData.name);

    const colorPalette: ThemeColors = {
      background: formData.backgroundColor,
      foreground: formData.foregroundColor,
      card: formData.backgroundColor,
      cardForeground: formData.foregroundColor,
      popover: formData.backgroundColor,
      popoverForeground: formData.foregroundColor,
      primary: formData.primaryColor,
      primaryForeground: formData.isDark ? formData.foregroundColor : formData.backgroundColor,
      secondary: formData.secondaryColor,
      secondaryForeground: formData.foregroundColor,
      muted: formData.secondaryColor,
      mutedForeground: formData.foregroundColor.replace(/(\d+)%\)$/, (_, p) => `${Math.max(40, parseInt(p) - 20)}%)`),
      accent: formData.accentColor,
      accentForeground: formData.backgroundColor,
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: formData.secondaryColor,
      input: formData.secondaryColor,
      ring: formData.primaryColor,
      warmCream: formData.backgroundColor,
      warmBeige: formData.secondaryColor,
      warmBrown: formData.primaryColor,
      darkWood: formData.foregroundColor,
      // Hosila tokenlar — mavzu ranglaridan kelib chiqadi
      goldAccent: formData.accentColor,
      sageGreen: formData.accentColor,
      mediaForeground: formData.isDark ? formData.foregroundColor : formData.backgroundColor,
      success: formData.accentColor,
      successForeground: formData.backgroundColor,
      whatsapp: formData.accentColor,
      whatsappForeground: formData.backgroundColor,
    };

    const typography: ThemeTypography = {
      fontSans: formData.fontFamily,
      fontSerif: formData.fontFamily,
      fontHeading: formData.fontFamily,
    };


    const componentStyles: ThemeComponentStyles = {
      borderRadius: formData.borderRadius,
      buttonRadius: formData.borderRadius,
      cardRadius: formData.borderRadius,
      shadowSm: shadows.sm,
      shadowMd: shadows.md,
      shadowLg: shadows.lg,
    };

    const layoutSettings: ThemeLayoutSettings = {
      containerMaxWidth: '1280px',
      sectionSpacing: '4rem',
      cardPadding: '1.5rem',
    };

    try {
      const themeData = {
        name: formData.name,
        slug,
        is_dark: formData.isDark,
        color_palette: JSON.parse(JSON.stringify(colorPalette)),
        typography: JSON.parse(JSON.stringify(typography)),
        component_styles: JSON.parse(JSON.stringify(componentStyles)),
        layout_settings: JSON.parse(JSON.stringify(layoutSettings)),
      };

      if (builderMode === 'edit' && editingTheme?.id) {
        const { error } = await supabase.from('themes').update(themeData).eq('id', editingTheme.id);
        if (error) throw error;
        toast.success(t.updatedToast);
      } else {
        const { error } = await supabase.from('themes').insert([{ ...themeData, is_active: false }]);
        if (error) throw error;
        toast.success(t.savedToast);
      }

      setShowBuilder(false);
      refreshThemes();
    } catch (error: any) {
      toast.error(`${t.errorPrefix}: ${error.message}`);
    }
  };

  const getColorSwatches = (theme: Theme) => {
    return [
      { color: theme.colorPalette.primary, label: 'Primary' },
      { color: theme.colorPalette.secondary, label: 'Secondary' },
      { color: theme.colorPalette.accent, label: 'Accent' },
      { color: theme.colorPalette.background, label: 'Background' },
      { color: theme.colorPalette.foreground, label: 'Text' },
    ];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {isPreviewMode && (
            <Button variant="outline" size="sm" onClick={() => { resetPreview(); setPreviewingId(null); }}>
              <EyeOff className="h-4 w-4 mr-2" />
              {t.cancelPreview}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refreshThemes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.refresh}
          </Button>
          <Button size="sm" onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            {t.newTheme}
          </Button>
        </div>
      </div>

      {/* Current Theme Card */}
      {currentTheme && (
        <Card className="bg-muted/30 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{t.currentTheme}</h3>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-medium">{currentTheme.name}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {getColorSwatches(currentTheme).map((swatch, i) => (
                      <div
                        key={i}
                        className="h-5 w-8 rounded border"
                        style={{ backgroundColor: `hsl(${swatch.color})` }}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentTheme.isDark ? <Moon className="h-3 w-3 mr-1" /> : <Sun className="h-3 w-3 mr-1" />}
                  {currentTheme.isDark ? t.dark : t.light}
                </Badge>
                <Badge variant="default" className="bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  {t.active}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
        <TabsList>
          <TabsTrigger value="all">{t.allTab} ({themes.length})</TabsTrigger>
          <TabsTrigger value="light">
            <Sun className="h-3 w-3 mr-1" />
            {t.light} ({themes.filter(t => !t.isDark).length})
          </TabsTrigger>
          <TabsTrigger value="dark">
            <Moon className="h-3 w-3 mr-1" />
            {t.dark} ({themes.filter(t => t.isDark).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredThemes.map((theme) => (
              <CompactThemeCard
                key={theme.id || theme.slug}
                theme={theme}
                isActive={currentTheme?.id === theme.id}
                isPreviewing={previewingId === theme.id}
                onPreview={() => handlePreview(theme)}
                onApply={() => handleApply(theme)}
                onClone={() => handleClone(theme)}
                onEdit={() => handleEdit(theme)}
                onDelete={() => handleDelete(theme)}
                colorSwatches={getColorSwatches(theme)}
                t={t}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredThemes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t.noThemes}
        </div>
      )}

      {/* Theme Builder Dialog */}
      {/* Theme Builder Dialog — Premium 2-column layout */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-[1000px] w-[95vw] p-0 gap-0 max-h-[92vh] overflow-hidden">
          {/* Sticky Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-background sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight">
                  {builderMode === 'create' ? t.createTitle :
                   builderMode === 'clone' ? t.cloneTitle : t.editTitle}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {t.dialogSubtitle}
                </DialogDescription>
              </div>
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {builderMode === 'edit' ? t.editBadge : t.newBadge}
              </Badge>
              {formData.isDark && (
                <Badge variant="outline" className="text-[10px]"><Moon className="h-3 w-3 mr-1" />{t.dark}</Badge>
              )}
            </div>
          </div>

          {/* 2-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] overflow-hidden" style={{ maxHeight: 'calc(92vh - 130px)' }}>
            {/* LEFT — Configuration */}
            <div className="overflow-y-auto p-6 space-y-6 border-r">
              {/* Presets */}
              <SectionCard title={t.presetsTitle} subtitle={t.presetsSubtitle}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, ...preset.values })}
                      className="group text-left rounded-lg border bg-card p-2.5 hover:border-primary hover:shadow-sm transition-all"
                    >
                      <div className="flex gap-0.5 mb-2 h-6 rounded overflow-hidden">
                        {[preset.values.primaryColor, preset.values.secondaryColor, preset.values.accentColor, preset.values.backgroundColor].map((c, i) => (
                          <div key={i} className="flex-1" style={{ backgroundColor: `hsl(${c})` }} />
                        ))}
                      </div>
                      <div className="text-xs font-medium truncate">{preset.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{preset.tagline}</div>
                    </button>
                  ))}
                </div>
              </SectionCard>

              {/* Theme info */}
              <SectionCard title={t.infoTitle} subtitle={t.infoSubtitle}>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t.themeName}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.namePlaceholder}
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {formData.isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <div>
                        <div className="text-xs font-medium">{t.darkMode}</div>
                        <div className="text-[11px] text-muted-foreground">{t.darkModeSub}</div>
                      </div>
                    </div>
                    <Switch
                      checked={formData.isDark}
                      onCheckedChange={(checked) => setFormData({ ...formData, isDark: checked })}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Colors */}
              <SectionCard title={t.colorsTitle} subtitle={t.colorsSubtitle}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <ColorCard label={t.primary} hint={t.primaryHint} value={formData.primaryColor} onChange={(v) => setFormData({ ...formData, primaryColor: v })} copyLabel={t.copyHex} copiedLabel={t.copiedToast} />
                  <ColorCard label={t.secondary} hint={t.secondaryHint} value={formData.secondaryColor} onChange={(v) => setFormData({ ...formData, secondaryColor: v })} copyLabel={t.copyHex} copiedLabel={t.copiedToast} />
                  <ColorCard label={t.accent} hint={t.accentHint} value={formData.accentColor} onChange={(v) => setFormData({ ...formData, accentColor: v })} copyLabel={t.copyHex} copiedLabel={t.copiedToast} />
                  <ColorCard label={t.background} hint={t.backgroundHint} value={formData.backgroundColor} onChange={(v) => setFormData({ ...formData, backgroundColor: v })} copyLabel={t.copyHex} copiedLabel={t.copiedToast} />
                  <ColorCard label={t.textColor} hint={t.textHint} value={formData.foregroundColor} onChange={(v) => setFormData({ ...formData, foregroundColor: v })} copyLabel={t.copyHex} copiedLabel={t.copiedToast} />
                </div>
              </SectionCard>

              {/* Typography */}
              <SectionCard title={t.typographyTitle} subtitle={t.typographySubtitle}>
                <div className="space-y-2">
                  <Select
                    value={formData.fontFamily}
                    onValueChange={(v) => setFormData({ ...formData, fontFamily: v })}
                  >
                    <SelectTrigger className="h-9"><SelectValue placeholder={t.selectFont} /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="rounded-lg border bg-muted/30 p-3" style={{ fontFamily: formData.fontFamily }}>
                    <div className="text-lg font-semibold leading-tight">{t.sampleHeading}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">The quick brown fox jumps over the lazy dog</div>
                  </div>
                </div>
              </SectionCard>

              {/* Radius */}
              <SectionCard title={t.radiusTitle} subtitle={t.radiusSubtitle}>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {RADIUS_OPTIONS.map((opt) => {
                    const active = formData.borderRadius === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, borderRadius: opt.value })}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                          active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/40'
                        }`}
                      >
                        <div
                          className="h-8 w-8 bg-primary/80"
                          style={{ borderRadius: opt.value }}
                        />
                        <span className="text-[10px] text-muted-foreground">{opt.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Shadows */}
              <SectionCard title={t.shadowsTitle} subtitle={t.shadowsSubtitle}>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'none', label: t.shadowNone },
                    { value: 'light', label: t.shadowLight },
                    { value: 'medium', label: t.shadowMedium },
                    { value: 'heavy', label: t.shadowHeavy },
                  ].map((opt) => {
                    const active = formData.shadowLevel === opt.value;
                    const shadow = getShadowValues(opt.value).md;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, shadowLevel: opt.value })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border bg-background transition-all ${
                          active ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/40'
                        }`}
                      >
                        <div className="h-8 w-8 rounded bg-card border" style={{ boxShadow: shadow }} />
                        <span className="text-[10px] text-muted-foreground">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            </div>

            {/* RIGHT — Live Preview */}
            <div className="bg-muted/20 overflow-y-auto">
              <div className="sticky top-0 z-10 px-5 py-3 border-b bg-muted/40 backdrop-blur flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{t.livePreview}</span>
                </div>
                <div className="flex items-center border rounded-md overflow-hidden bg-background">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2 py-1 ${previewDevice === 'desktop' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    <Monitor className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2 py-1 ${previewDevice === 'mobile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    <Smartphone className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="p-5 flex justify-center">
                <LivePreview formData={formData} device={previewDevice} getShadow={getShadowValues} />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t bg-background">
            <div className="text-[11px] text-muted-foreground">
              {t.footerNote}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowBuilder(false)}>
                {t.cancel}
              </Button>
              <Button size="sm" onClick={handleSaveTheme} className="gap-2">
                <Check className="h-4 w-4" />
                {builderMode === 'edit' ? t.update : t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Color Input Component
interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorInput = ({ label, value, onChange }: ColorInputProps) => {
  const hslToHex = (hsl: string): string => {
    try {
      const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
      const sNorm = s / 100;
      const lNorm = l / 100;
      const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = lNorm - c / 2;
      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; }
      else if (h < 120) { r = x; g = c; }
      else if (h < 180) { g = c; b = x; }
      else if (h < 240) { g = x; b = c; }
      else if (h < 300) { r = x; b = c; }
      else { r = c; b = x; }
      const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return '#000000';
    }
  };

  const hexToHsl = (hex: string): string => {
    try {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let h = 0, s = 0;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
          case g: h = ((b - r) / d + 2) * 60; break;
          case b: h = ((r - g) / d + 4) * 60; break;
        }
      }
      return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    } catch {
      return '0 0% 0%';
    }
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={hslToHex(value)}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="w-10 h-8 rounded cursor-pointer border-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs h-8 flex-1"
          placeholder="0 0% 100%"
        />
      </div>
    </div>
  );
};

// Compact Theme Card Component
interface CompactThemeCardProps {
  theme: Theme;
  isActive: boolean;
  isPreviewing: boolean;
  onPreview: () => void;
  onApply: () => void;
  onClone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  colorSwatches: { color: string; label: string }[];
  t: any;
}

const CompactThemeCard = ({ 
  theme, isActive, isPreviewing, onPreview, onApply, onClone, onEdit, onDelete, colorSwatches, t
}: CompactThemeCardProps) => {
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${
      isActive ? 'ring-2 ring-primary' : ''
    } ${isPreviewing ? 'ring-2 ring-accent' : ''}`}>
      {/* Mini Preview */}
      <div 
        className="h-24 relative p-2"
        style={{ backgroundColor: `hsl(${theme.colorPalette.background})` }}
      >
        <div className="h-full flex flex-col gap-1">
          <div 
            className="h-5 rounded-sm"
            style={{ backgroundColor: `hsl(${theme.colorPalette.primary})` }}
          />
          <div className="flex-1 flex gap-1">
            <div 
              className="w-2/5 rounded-sm"
              style={{ backgroundColor: `hsl(${theme.colorPalette.card})`, border: `1px solid hsl(${theme.colorPalette.border})` }}
            />
            <div 
              className="flex-1 rounded-sm"
              style={{ backgroundColor: `hsl(${theme.colorPalette.secondary})` }}
            />
          </div>
          <div 
            className="h-3 rounded-sm"
            style={{ backgroundColor: `hsl(${theme.colorPalette.accent})` }}
          />
        </div>

        {/* Status Badges */}
        <div className="absolute top-1 right-1 flex gap-0.5">
          {isActive && (
            <Badge className="bg-green-600 text-white h-5 px-1 text-[10px]">
              <Check className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-2.5">
        {/* Theme Name */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm truncate">{theme.name}</h3>
          {theme.isDark ? (
            <Moon className="h-3 w-3 text-muted-foreground" />
          ) : (
            <Sun className="h-3 w-3 text-muted-foreground" />
          )}
        </div>

        {/* Color Blocks */}
        <div className="flex gap-0.5 mb-2">
          {colorSwatches.map((swatch, i) => (
            <div
              key={i}
              className="h-4 flex-1 first:rounded-l last:rounded-r"
              style={{ backgroundColor: `hsl(${swatch.color})` }}
              title={swatch.label}
            />
          ))}
        </div>

        {/* Info */}
        <div className="text-[10px] text-muted-foreground mb-2 space-y-0.5">
          <p className="truncate">{t.fontLabel}: {theme.typography.fontSans.split(',')[0].replace(/'/g, '')}</p>
          <p>{t.borderRadiusLabel}: {theme.componentStyles.borderRadius}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs px-2"
            onClick={onPreview}
          >
            <Eye className="h-3 w-3 mr-1" />
            {t.previewBtn}
          </Button>
          <Button
            size="sm"
            className="flex-1 h-7 text-xs px-2"
            onClick={onApply}
            disabled={isActive}
          >
            {isActive ? (
              <Check className="h-3 w-3" />
            ) : (
              t.applyBtn
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onEdit}
            title={t.editTip}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClone}
            title={t.cloneTip}
          >
            <Copy className="h-3 w-3" />
          </Button>
          {!isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
              title={t.deleteTip}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============= Premium Builder helpers =============

const SectionCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="rounded-xl border bg-card p-4 shadow-sm">
    <div className="mb-3">
      <h3 className="text-sm font-semibold leading-tight">{title}</h3>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const hslToHexUtil = (hsl: string): string => {
  try {
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
    const sNorm = s / 100, lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lNorm - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch { return '#000000'; }
};

const hexToHslUtil = (hex: string): string => {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
        case g: h = ((b - r) / d + 2) * 60; break;
        case b: h = ((r - g) / d + 4) * 60; break;
      }
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch { return '0 0% 0%'; }
};

const ColorCard = ({ label, hint, value, onChange, copyLabel, copiedLabel }: { label: string; hint?: string; value: string; onChange: (v: string) => void; copyLabel?: string; copiedLabel?: string }) => {
  const hex = hslToHexUtil(value);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(hex); toast.success(copiedLabel || 'Copied'); } catch {}
  };
  return (
    <div className="group rounded-lg border bg-background p-2.5 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">{label}</div>
          {hint && <div className="text-[10px] text-muted-foreground truncate">{hint}</div>}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          title={copyLabel || 'Copy HEX'}
        >
          <Copy className="h-3 w-3" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <label className="relative shrink-0 cursor-pointer">
          <div
            className="h-8 w-8 rounded-md border-2 border-background ring-1 ring-border shadow-sm"
            style={{ backgroundColor: `hsl(${value})` }}
          />
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(hexToHslUtil(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <Input
          value={hex}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(hexToHslUtil(v));
          }}
          className="h-8 text-[11px] font-mono uppercase tracking-tight px-2"
        />
      </div>
    </div>
  );
};

const LivePreview = ({
  formData,
  device,
  getShadow,
}: {
  formData: any;
  device: 'desktop' | 'mobile';
  getShadow: (level: string) => { sm: string; md: string; lg: string };
}) => {
  const shadows = getShadow(formData.shadowLevel);
  const isMobile = device === 'mobile';
  return (
    <div
      className="w-full transition-all duration-300"
      style={{
        maxWidth: isMobile ? '280px' : '100%',
        backgroundColor: `hsl(${formData.backgroundColor})`,
        color: `hsl(${formData.foregroundColor})`,
        fontFamily: formData.fontFamily,
        borderRadius: formData.borderRadius,
        boxShadow: shadows.lg,
        border: `1px solid hsl(${formData.secondaryColor})`,
      }}
    >
      {/* Mock Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: `hsl(${formData.secondaryColor})` }}
      >
        <div className="font-semibold text-sm tracking-wide">LOGO</div>
        {!isMobile && (
          <div className="flex gap-3 text-[10px] uppercase tracking-wider opacity-70">
            <span>Bosh</span><span>Katalog</span><span>Aloqa</span>
          </div>
        )}
        <button
          className="px-3 py-1.5 text-[10px] font-medium tracking-wide"
          style={{
            backgroundColor: `hsl(${formData.primaryColor})`,
            color: `hsl(${formData.backgroundColor})`,
            borderRadius: formData.borderRadius,
          }}
        >
          BOG'LANISH
        </button>
      </div>

      {/* Hero */}
      <div className="p-5">
        <div className="text-2xl font-bold leading-tight mb-1.5">Premium mebellar</div>
        <div className="text-xs opacity-70 mb-3">Sizning brendingiz, sizning uslubingiz</div>
        <div className="flex gap-2 mb-4">
          <button
            className="px-3 py-2 text-[11px] font-medium"
            style={{
              backgroundColor: `hsl(${formData.primaryColor})`,
              color: `hsl(${formData.backgroundColor})`,
              borderRadius: formData.borderRadius,
              boxShadow: shadows.sm,
            }}
          >
            Katalogni ko'rish
          </button>
          <button
            className="px-3 py-2 text-[11px] font-medium border"
            style={{
              borderColor: `hsl(${formData.primaryColor})`,
              color: `hsl(${formData.primaryColor})`,
              borderRadius: formData.borderRadius,
            }}
          >
            Batafsil
          </button>
        </div>

        {/* Product cards */}
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {[1, 2, 3].slice(0, isMobile ? 2 : 3).map((i) => (
            <div
              key={i}
              className="overflow-hidden border"
              style={{
                backgroundColor: `hsl(${formData.backgroundColor})`,
                borderColor: `hsl(${formData.secondaryColor})`,
                borderRadius: formData.borderRadius,
                boxShadow: shadows.md,
              }}
            >
              <div
                className="aspect-square relative"
                style={{ backgroundColor: `hsl(${formData.secondaryColor})` }}
              >
                <span
                  className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8px] font-semibold tracking-wider"
                  style={{
                    backgroundColor: `hsl(${formData.accentColor})`,
                    color: `hsl(${formData.foregroundColor})`,
                    borderRadius: formData.borderRadius,
                  }}
                >
                  YANGI
                </span>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-medium truncate">Mahsulot {i}</div>
                <div
                  className="text-[10px] font-semibold mt-0.5"
                  style={{ color: `hsl(${formData.primaryColor})` }}
                >
                  1 250 000 so'm
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input demo */}
        <div className="mt-4">
          <div
            className="text-[10px] mb-1 opacity-70"
          >
            Email
          </div>
          <div
            className="w-full px-3 py-2 text-[11px] border"
            style={{
              borderColor: `hsl(${formData.secondaryColor})`,
              borderRadius: formData.borderRadius,
              backgroundColor: `hsl(${formData.backgroundColor})`,
            }}
          >
            sample@email.com
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {[
            { label: 'Chegirma', bg: formData.accentColor },
            { label: 'Yangi', bg: formData.primaryColor },
            { label: 'Tavsiya', bg: formData.secondaryColor },
          ].map((b) => (
            <span
              key={b.label}
              className="px-2 py-0.5 text-[9px] font-semibold tracking-wider"
              style={{
                backgroundColor: `hsl(${b.bg})`,
                color: b.bg === formData.secondaryColor ? `hsl(${formData.foregroundColor})` : `hsl(${formData.backgroundColor})`,
                borderRadius: formData.borderRadius,
              }}
            >
              {b.label.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Themes;
