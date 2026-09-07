import { lazy, Suspense, useEffect, useState } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import { CartProvider } from "@/hooks/useCart";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { EditModeProvider } from "@/hooks/useEditMode";
import { useEditMode } from "@/hooks/useEditMode";
import { SiteContentProvider } from "@/hooks/useSiteContent";
import { SystemSettingsProvider } from "@/hooks/useSystemSettings";
import { TelegramProvider } from "@/hooks/useTelegram";
import { TelegramShell } from "@/components/telegram/TelegramShell";
import { ThemeLoader } from "@/components/ThemeLoader";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

import { ScrollToTop } from "@/components/ScrollToTop";

// Eager: home page (LCP critical)
import Index from "./pages/Index";

// Lazy: all other public routes
const Catalog = lazyWithRetry(() => import("./pages/Catalog"));
const ProductDetails = lazyWithRetry(() => import("./pages/ProductDetails"));
const About = lazyWithRetry(() => import("./pages/About"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const FAQ = lazyWithRetry(() => import("./pages/FAQ"));
const Cart = lazyWithRetry(() => import("./pages/Cart"));
const Checkout = lazyWithRetry(() => import("./pages/Checkout"));
const ThankYou = lazyWithRetry(() => import("./pages/ThankYou"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

// Below-the-fold/admin-only UI is split out of the mobile homepage bundle.
const Footer = lazyWithRetry(() => import("@/components/layout/Footer").then((m) => ({ default: m.Footer })));
const EditModeToggle = lazyWithRetry(() => import("@/components/EditModeToggle").then((m) => ({ default: m.EditModeToggle })));
const EditorPanel = lazyWithRetry(() => import("@/components/editor/EditorPanel").then((m) => ({ default: m.EditorPanel })));
const ProtectedRoute = lazyWithRetry(() => import("@/components/admin/ProtectedRoute").then((m) => ({ default: m.ProtectedRoute })));

// Lazy: admin pages (only loaded for admins)
const AdminLayout = lazyWithRetry(() => import("./pages/admin/AdminLayout"));
const AdminAuth = lazyWithRetry(() => import("./pages/admin/Auth"));
const Dashboard = lazyWithRetry(() => import("./pages/admin/Dashboard"));
const Orders = lazyWithRetry(() => import("./pages/admin/Orders"));
const Categories = lazyWithRetry(() => import("./pages/admin/Categories"));
const Sections = lazyWithRetry(() => import("./pages/admin/Sections"));
const ProductsNew = lazyWithRetry(() => import("./pages/admin/ProductsNew"));
const Customers = lazyWithRetry(() => import("./pages/admin/Customers"));
const SiteContent = lazyWithRetry(() => import("./pages/admin/SiteContent"));
const Messages = lazyWithRetry(() => import("./pages/admin/Messages"));
const Admins = lazyWithRetry(() => import("./pages/admin/Admins"));
const Settings = lazyWithRetry(() => import("./pages/admin/Settings"));
const SystemSettings = lazyWithRetry(() => import("./pages/admin/SystemSettings"));
const Themes = lazyWithRetry(() => import("./pages/admin/Themes"));
const CheckoutFormSettings = lazyWithRetry(() => import("./pages/admin/CheckoutFormSettings"));
const PromoTilesAdmin = lazyWithRetry(() => import("./pages/admin/PromoTiles"));
const SetsAdmin = lazyWithRetry(() => import("./pages/admin/Sets"));
const BranchesAdmin = lazyWithRetry(() => import("./pages/admin/Branches"));
const HeroSlidesAdmin = lazyWithRetry(() => import("./pages/admin/HeroSlides"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 daqiqa cache — sahifa o'tganda qayta yuklamaydi
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const DeferredFooter = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;
    let idleId: number | undefined;
    const reveal = () => setShow(true);
    const schedule = () => {
      const requestIdle = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: { timeout: number }) => number);
      if (requestIdle) idleId = requestIdle(reveal, { timeout: 2500 });
      else timeoutId = window.setTimeout(reveal, 1200);
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      window.removeEventListener("load", schedule);
      if (timeoutId) window.clearTimeout(timeoutId);
      const cancelIdle = (window as any).cancelIdleCallback as undefined | ((id: number) => void);
      if (idleId && cancelIdle) cancelIdle(idleId);
    };
  }, []);

  if (!show) return null;
  return (
    <Suspense fallback={null}>
      <Footer />
    </Suspense>
  );
};

const AdminEditorTools = () => {
  const { canEdit } = useEditMode();
  if (!canEdit) return null;

  return (
    <Suspense fallback={null}>
      <EditModeToggle />
      <EditorPanel />
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ThemeLoader>
        <SystemSettingsProvider>
          <LanguageProvider>
            <CartProvider>
              <AuthProvider>
                <SiteContentProvider>
                  <EditModeProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <TelegramProvider>
                      <ScrollToTop />
                      <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        {/* Admin Auth */}
                        <Route path="/admin/auth" element={<AdminAuth />} />
                        
                        {/* Admin Routes */}
                        <Route path="/admin" element={<AdminLayout />}>
                          <Route index element={
                            <ProtectedRoute module="dashboard">
                              <Dashboard />
                            </ProtectedRoute>
                          } />
                          <Route path="orders" element={
                            <ProtectedRoute module="orders">
                              <Orders />
                            </ProtectedRoute>
                          } />
                          <Route path="categories" element={
                            <ProtectedRoute module="categories">
                              <Categories />
                            </ProtectedRoute>
                          } />
                          <Route path="sections" element={
                            <ProtectedRoute module="categories">
                              <Sections />
                            </ProtectedRoute>
                          } />
                          <Route path="products" element={
                            <ProtectedRoute module="products">
                              <ProductsNew />
                            </ProtectedRoute>
                          } />
                          <Route path="customers" element={
                            <ProtectedRoute module="customers">
                              <Customers />
                            </ProtectedRoute>
                          } />
                          <Route path="settings" element={
                            <ProtectedRoute module="telegram">
                              <Settings />
                            </ProtectedRoute>
                          } />
                          <Route path="checkout-form" element={
                            <ProtectedRoute module="siteContent">
                              <CheckoutFormSettings />
                            </ProtectedRoute>
                          } />
                          <Route path="promo-tiles" element={
                            <ProtectedRoute module="siteContent">
                              <PromoTilesAdmin />
                            </ProtectedRoute>
                          } />
                          <Route path="sets" element={
                            <ProtectedRoute module="siteContent">
                              <SetsAdmin />
                            </ProtectedRoute>
                          } />
                          <Route path="hero-slides" element={
                            <ProtectedRoute module="siteContent">
                              <HeroSlidesAdmin />
                            </ProtectedRoute>
                          } />
                          <Route path="branches" element={
                            <ProtectedRoute module="siteContent">
                              <BranchesAdmin />
                            </ProtectedRoute>
                          } />
                          <Route path="system" element={
                            <ProtectedRoute module="systemSettings">
                              <SystemSettings />
                            </ProtectedRoute>
                          } />
                          <Route path="themes" element={
                            <ProtectedRoute module="siteContent">
                              <Themes />
                            </ProtectedRoute>
                          } />
                          <Route path="site-content" element={
                            <ProtectedRoute module="siteContent">
                              <SiteContent />
                            </ProtectedRoute>
                          } />
                          <Route path="messages" element={
                            <ProtectedRoute module="siteContent">
                              <Messages />
                            </ProtectedRoute>
                          } />
                          <Route path="admins" element={
                            <ProtectedRoute module="admins">
                              <Admins />
                            </ProtectedRoute>
                          } />
                        </Route>
                      
                      {/* Public Routes */}
                      {/* Public Routes */}
                      <Route path="*" element={
                        <TelegramShell>
                        <div className="flex flex-col min-h-screen pb-20 md:pb-0">
                          <Header />
                          <main className="flex-1">
                            <Suspense fallback={<RouteFallback />}>
                              <Routes>
                                <Route path="/" element={<Index />} />
                                <Route path="/catalog" element={<Catalog />} />
                                <Route path="/product/:id" element={<ProductDetails />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/faq" element={<FAQ />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/checkout" element={<Checkout />} />
                                <Route path="/thank-you" element={<ThankYou />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </Suspense>
                          </main>
                          <DeferredFooter />
                          <MobileBottomNav />
                          <AdminEditorTools />
                        </div>
                        </TelegramShell>
                        } />
                      </Routes>
                      </Suspense>
                      </TelegramProvider>
                    </BrowserRouter>
                  </TooltipProvider>
                  </EditModeProvider>
                </SiteContentProvider>
              </AuthProvider>
            </CartProvider>
          </LanguageProvider>
        </SystemSettingsProvider>
      </ThemeLoader>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
