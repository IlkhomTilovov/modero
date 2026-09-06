import {
  Zap, Star, Flame, Briefcase, Sofa, Sparkles, Heart, Award, Tag,
  Gift, Crown, Truck, ShieldCheck, Percent, Bed, Armchair, Lamp,
  UtensilsCrossed, Package, ShoppingBag, type LucideIcon,
} from 'lucide-react';

export const PROMO_ICONS: Record<string, LucideIcon> = {
  Zap, Star, Flame, Briefcase, Sofa, Sparkles, Heart, Award, Tag,
  Gift, Crown, Truck, ShieldCheck, Percent, Bed, Armchair, Lamp,
  UtensilsCrossed, Package, ShoppingBag,
};

export const PROMO_ICON_NAMES = Object.keys(PROMO_ICONS);

// Barcha fonlar mavzu tokenlaridan olinadi — mavzu o'zgarsa kartochkalar ham o'zgaradi.
export const BG_PRESETS: { key: string; bg: string; text: string }[] = [
  { key: 'colorMintGreen', bg: 'bg-accent/15', text: 'text-foreground' },
  { key: 'colorCreamBeige', bg: 'bg-secondary', text: 'text-secondary-foreground' },
  { key: 'colorPink', bg: 'bg-destructive/15', text: 'text-foreground' },
  { key: 'colorDarkGreen', bg: 'bg-primary', text: 'text-primary-foreground' },
  { key: 'colorLightBeige', bg: 'bg-warm-beige', text: 'text-foreground' },
  { key: 'colorBlue', bg: 'bg-primary/10', text: 'text-foreground' },
  { key: 'colorLavender', bg: 'bg-accent/25', text: 'text-foreground' },
  { key: 'colorDarkGray', bg: 'bg-foreground', text: 'text-background' },
];

