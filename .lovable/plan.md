# OrisHome Premium Transformatsiya — To'liq Roadmap

Loyiha nomi: **Mirmexa → OrisHome** (rebrand)
Asos: hozirgi React + Vite + TS + Tailwind + Supabase stack saqlanadi, qaytadan qurilmaydi.
Falsafa: *"interior emotion sotish"* — Apple minimalism + Zara Home + West Elm.

---

## SPRINT 1 — Brand & Design System (poydevor)
**Maqsad:** Butun saytning vizual DNK'sini o'rnatish.

- OrisHome logo (yangi yaratish yoki yuklash)
- Yangi rang palitrasi `index.css` da semantic tokenlar sifatida:
  - Primary `#1F3A2E` (deep green)
  - Secondary `#D6C2A8` (warm sand)
  - Background `#F5F3EE` (cream)
  - Foreground `#222222`
- Tipografiya: **Cormorant Garamond** (headings) + **Inter** (body)
- Tailwind config: yangi shadowlar (soft, premium), border-radius scale (16/24/32px)
- Supabase `themes` jadvaliga "OrisHome Premium" temasini qo'shish va active qilish
- Dark mode varianti

## SPRINT 2 — Header & Navigation
- Yangi header: Logo (left) | Catalog, Collections, Rooms, About, Blog, Contact (center) | Search, Wishlist, Profile, Cart (right)
- Sticky behavior + scroll-da kichrayuvchi header
- Mega-menu (Catalog hover)
- Mobile: bottom navigation bar (Home/Catalog/Wishlist/Cart/Profile)
- Til switcher redesign (rounded pill)

## SPRINT 3 — Hero Section (Apple-style)
- Katta typography (Cormorant 72-96px)
- Markaziy product render (transparent PNG, soft shadow)
- Thumbnail slider pastida (3-5 ta mahsulot)
- O'ng tomonda mini banner / promotion / support card
- Framer Motion: smooth image transitions, parallax

## SPRINT 4 — Category & Product Cards
- Category cards: rounded 32px, hover zoom, lazy loading, animated gradient overlay
- Product card upgrade:
  - Hover gallery (rasm aylanishi)
  - Wishlist heart icon
  - Quick view modal
  - Material badge + Stock badge
  - Smooth transitions

## SPRINT 5 — Catalog Page redesign
- Yangi filter sidebar (collapsible sections, range sliders, color swatches)
- Sort dropdown premium ko'rinish
- Grid/List view toggle
- Skeleton loaders
- Infinite scroll yoki pagination

## SPRINT 6 — Product Details Page (eng muhim)
- Left: vertical thumbnail gallery + zoom + lightbox (4K rasmlar)
- Right: title, price, material, dimensions, color/size options, CTA, delivery info, Telegram consultation tugmasi
- Tabs: Description / Specifications / Reviews
- Below: similar products + "room inspiration" (mahsulot interyer ichida)

## SPRINT 7 — Interior / Lifestyle Section
- Bosh sahifada "Inspired Living" Pinterest-style masonry grid
- Yangi `interior_inspirations` jadvali (rasm + bog'langan mahsulotlar)
- Har image click → modal: shu interyerda ishlatilgan mahsulotlar ro'yxati
- Admin paneldan boshqarish

## SPRINT 8 — Cart, Checkout & Mobile UX
- Cart drawer redesign (premium spacing)
- Checkout: 3-step wizard (Address → Delivery → Confirm)
- Mobile: sticky "Add to Cart", swipe galleries, thumb-friendly buttons
- Order confirmation page yangilash

## SPRINT 9 — Animation & Performance
- Framer Motion: fade reveal (scroll-da), smooth hover, page transitions
- Loading skeletons hamma joyda
- Image optimization audit (WebP, lazy, srcset)
- Code splitting, route-based chunks
- Target: Lighthouse 95+ performance, <2s load

## SPRINT 10 — SEO, Admin & Extras
- SEO sahifalar: /sofa, /divan, /kreslo, /dining-table, /modern-furniture
- JSON-LD Product schema yaxshilash
- Sitemap automation tekshirish
- Admin panel: yangi temalar editor, banner manager, inspirations manager
- **Bonus features:**
  - Wishlist (Supabase sync)
  - Recently viewed (localStorage)
  - Smart recommendations ("siz ko'rgan mahsulotlarga o'xshash")
  - WhatsApp/Telegram tezkor konsultatsiya widget

---

## Texnik qarorlar

```text
Stack: React 18 + Vite 5 + TS 5 + Tailwind 3 + Supabase + Framer Motion
Yangi paketlar: framer-motion (allaqachon bor), react-intersection-observer
Database: hozirgi schema saqlanadi, faqat qo'shamiz:
  - wishlists (user_id, product_id)
  - interior_inspirations (image, title, product_ids[])
  - product_views (analytics uchun)
Edge functions: hozirgilar saqlanadi
```

## Tartib bo'yicha ustuvorlik

Vizual ta'sir tezroq ko'rinishi uchun: **Sprint 1 → 2 → 3 → 4** birinchi to'rttasi eng muhim. Shulardan keyin sayt allaqachon "boshqa platforma"ga aylanadi.

---

## Qaror

Bu rejani tasdiqlasangiz, **Sprint 1 (Brand & Design System)** dan boshlayman — bu butun loyihaning poydevori. Bir sprint odatda 1-2 ta xabarda yakunlanadi.

Agar biror sprintni o'zgartirish, olib tashlash yoki qo'shimcha narsa kerak bo'lsa — ayting, rejani yangilayman.