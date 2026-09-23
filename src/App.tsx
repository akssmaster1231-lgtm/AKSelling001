import { useState, useEffect } from 'react';
import { CartProvider, useCart } from '@/cart-context';
import { AuthProvider, useAuth } from '@/auth-context';
import { I18nProvider } from '@/i18n';
import Header from '@/components/Header';
import BottomNav, { type TabId } from '@/components/BottomNav';
import HomePage from '@/pages/HomePage';
import ProductDetail from '@/pages/ProductDetail';
import CategoriesPage from '@/pages/CategoriesPage';
import BestDealsPage from '@/pages/BestDealsPage';
import AccountPage from '@/pages/AccountPage';
import CartPage from '@/pages/CartPage';
import AuthPage from '@/pages/AuthPage';
import SellerRegistration from '@/pages/SellerRegistration';
import SellerDashboard from '@/pages/SellerDashboard';
import BuyNowCheckout from '@/pages/BuyNowCheckout';
import OrdersPage from '@/pages/OrdersPage';
import AdminPanel from '@/pages/AdminPanel';
import SellerLockedModal from '@/components/SellerLockedModal';
import { isWhitelistedSellerEmail } from '@/utils/sellerWhitelist';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { Product } from '@/types';
import { fetchProductById } from '@/data';
import { Loader2 } from 'lucide-react';
import { NotificationProvider } from '@/notification-context';
import NotificationToastBanner from '@/components/NotificationToastBanner';
import NotificationCenterModal from '@/components/NotificationCenterModal';
import { addRecentlyViewedProduct } from '@/utils/searchHistory';
import VideoReelsFeed from '@/components/video-shopping/VideoReelsFeed';
import DailyStreakModal from '@/components/gamification/DailyStreakModal';
import SpinWheelModal from '@/components/gamification/SpinWheelModal';
import AiSupportWidget from '@/components/support/AiSupportWidget';

function AppContent() {
  const { user, authInitialized } = useAuth();
  const [appMode, setAppMode] = useState<'buying' | 'selling'>(() => {
    try {
      const saved = localStorage.getItem('akselling_app_mode');
      const isSeller = localStorage.getItem('akselling_is_seller');
      const active = localStorage.getItem('akselling_active_seller');
      if (saved === 'selling' && (isSeller === 'true' || active)) {
        return 'selling';
      }
    } catch {
      // ignore
    }
    return 'buying';
  });
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialCategory, setInitialCategory] = useState<string | undefined>(undefined);
  const [showAuth, setShowAuth] = useState(false);
  const [showSellerReg, setShowSellerReg] = useState(false);
  const [showSellerLockedModal, setShowSellerLockedModal] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const [buyNowSize, setBuyNowSize] = useState<string | undefined>(undefined);
  const [buyNowColor, setBuyNowColor] = useState<string | undefined>(undefined);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showSpinWheelModal, setShowSpinWheelModal] = useState(false);
  const { cartCount } = useCart();

  const handleOpenProductById = async (productId: string) => {
    try {
      const prod = await fetchProductById(productId);
      if (prod) {
        addRecentlyViewedProduct(prod);
        setSelectedProduct(prod);
        setShowNotifications(false);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleOpenProdEvent = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        handleOpenProductById(custom.detail);
      }
    };
    window.addEventListener('akselling_open_product_id', handleOpenProdEvent);
    return () => window.removeEventListener('akselling_open_product_id', handleOpenProdEvent);
  }, []);

  const handleSwitchMode = (mode: 'buying' | 'selling') => {
    setAppMode(mode);
    try {
      localStorage.setItem('akselling_app_mode', mode);
    } catch {
      // ignore
    }
    if (mode === 'selling') {
      setSelectedProduct(null);
      setBuyNowProduct(null);
      setShowOrders(false);
      setShowAdmin(false);
    }
  };

  const handleOpenSellerMode = () => {
    const isWhitelisted = isWhitelistedSellerEmail(user?.email);
    if (!isWhitelisted) {
      setShowSellerLockedModal(true);
      return;
    }

    try {
      const isSeller = localStorage.getItem('akselling_is_seller');
      const active = localStorage.getItem('akselling_active_seller');
      // If user has completed GST/Aadhaar registration
      if (isSeller === 'true' && active) {
        handleSwitchMode('selling');
      } else {
        // Must complete registration and document verification first
        setShowSellerReg(true);
      }
    } catch {
      setShowSellerReg(true);
    }
  };

  const handleProductClick = (product: Product) => {
    addRecentlyViewedProduct(product);
    setSelectedProduct(product);
  };

  const handleCategoryClick = (categoryId: string) => {
    setInitialCategory(categoryId);
    setActiveTab('categories');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (activeTab !== 'home') setActiveTab('home');
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSelectedProduct(null);
    if (tab === 'home') setSearchQuery('');
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      if (typeof document !== 'undefined') {
        document.documentElement.scrollLeft = 0;
        document.body.scrollLeft = 0;
      }
    } catch {
      window.scrollTo(0, 0);
    }
  };

  // Deep-linking: Automatically load and open full product page if ?productId=... is in URL
  useEffect(() => {
    let isMounted = true;

    const loadProductFromUrl = async () => {
      try {
        if (typeof window === 'undefined') return;
        const searchParams = new URLSearchParams(window.location.search);
        let targetId = searchParams.get('productId') || searchParams.get('product') || searchParams.get('p');

        // Hash fallback if shared as hash anchor (e.g., #product=123)
        if (!targetId && window.location.hash) {
          const hash = window.location.hash.replace(/^#/, '');
          const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : hash);
          targetId = hashParams.get('productId') || hashParams.get('product') || hashParams.get('p');
          if (!targetId && hash.startsWith('product=')) {
            targetId = hash.split('product=')[1];
          }
        }

        if (targetId && isMounted) {
          const product = await fetchProductById(targetId);
          if (product && isMounted) {
            setSelectedProduct(product);
          }
        }
      } catch (err) {
        console.warn('Error loading product from URL deep link:', err);
      }
    };

    loadProductFromUrl();

    // Listen to browser Back / Forward buttons
    const handlePopState = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const targetId = searchParams.get('productId') || searchParams.get('product') || searchParams.get('p');
        if (targetId) {
          const product = await fetchProductById(targetId);
          if (product && isMounted) {
            setSelectedProduct(product);
          }
        } else if (isMounted) {
          setSelectedProduct(null);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Synchronize browser URL query param whenever product modal opens or closes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isSandboxed = window.self !== window.top;

    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
      if (!isSandboxed) {
        try {
          const currentUrl = new URL(window.location.href);
          if (currentUrl.searchParams.get('productId') !== selectedProduct.id) {
            currentUrl.searchParams.set('productId', selectedProduct.id);
            const targetPath = currentUrl.pathname + (currentUrl.search || '');
            window.history.replaceState({ productId: selectedProduct.id }, '', targetPath);
          }
        } catch {
          // ignore in sandboxed environments
        }
      }
    } else {
      document.body.style.overflow = '';
      if (!isSandboxed) {
        try {
          const currentUrl = new URL(window.location.href);
          if (
            currentUrl.searchParams.has('productId') ||
            currentUrl.searchParams.has('product') ||
            currentUrl.searchParams.has('p')
          ) {
            currentUrl.searchParams.delete('productId');
            currentUrl.searchParams.delete('product');
            currentUrl.searchParams.delete('p');
            const cleanPath = currentUrl.pathname + (currentUrl.search || '');
            window.history.replaceState({}, '', cleanPath);
          }
        } catch {
          // ignore in sandboxed environments
        }
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  // 1. Initializing authentication state check
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1b365d] via-slate-800 to-amber-500 shadow-xl shadow-black/40 flex items-center justify-center mb-4 animate-pulse border border-amber-500/30">
          <span className="text-3xl font-black text-white tracking-wider">AK</span>
        </div>
        <div className="flex items-center gap-2 text-amber-400 font-bold text-base mb-1">
          <Loader2 size={20} className="animate-spin text-amber-400" />
          <span>Verifying Secure Session...</span>
        </div>
        <p className="text-xs text-slate-400 font-medium max-w-xs">Connecting to AKSelling Identity Cloud</p>
      </div>
    );
  }

  // 2. Strict Route Protection removed for preview experience:
  // Visitors can view the entire store immediately. If they click Account or Checkout without logging in,
  // they can log in via AuthPage.
  if (appMode === 'selling') {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center w-full overflow-x-hidden touch-scroll-container">
        <div className="min-h-screen bg-white max-w-md w-full relative sm:shadow-2xl sm:border-x sm:border-slate-800 overflow-x-hidden">
          <SellerDashboard onBack={() => handleSwitchMode('buying')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center w-full overflow-x-hidden touch-scroll-container">
      <div className="min-h-screen bg-slate-50 max-w-md w-full relative sm:shadow-2xl sm:border-x sm:border-slate-800 flex flex-col overflow-x-hidden">
        <Header
          onSearch={handleSearch}
          onCartClick={() => setActiveTab('cart')}
          onAccountClick={() => setActiveTab('account')}
          onNotificationClick={() => setShowNotifications(true)}
          onOpenProduct={handleOpenProductById}
          onNavigateHome={() => {
            setActiveTab('home');
            setSearchQuery('');
            setSelectedProduct(null);
          }}
        />

        <NotificationToastBanner onOpenProduct={handleOpenProductById} />

      <main className="pb-16 min-h-[calc(100vh-60px)] flex-1 w-full">
        {activeTab === 'home' && (
          <ErrorBoundary fallbackTitle="Unable to load Home Page">
            <HomePage
              searchQuery={searchQuery}
              onProductClick={handleProductClick}
              onCategoryClick={handleCategoryClick}
              onNavigateDeals={() => setActiveTab('deals')}
              onBecomeSeller={handleOpenSellerMode}
              onOpenStreak={() => setShowStreakModal(true)}
              onOpenSpinWheel={() => setShowSpinWheelModal(true)}
              onNavigateReels={() => setActiveTab('reels')}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'reels' && (
          <ErrorBoundary fallbackTitle="Unable to load Video Reels">
            <VideoReelsFeed
              onBuyNow={(prod, size, color) => {
                setBuyNowProduct(prod);
                setBuyNowSize(size);
                setBuyNowColor(color);
              }}
              onProductClick={handleProductClick}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'categories' && (
          <ErrorBoundary fallbackTitle="Unable to load Categories">
            <CategoriesPage
              onProductClick={handleProductClick}
              initialCategory={initialCategory}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'deals' && (
          <ErrorBoundary fallbackTitle="Unable to load Best Deals">
            <BestDealsPage
              onProductClick={handleProductClick}
              onNavigateHome={() => setActiveTab('home')}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'cart' && (
          <ErrorBoundary fallbackTitle="Unable to load Cart">
            <CartPage
              onProductClick={handleProductClick}
              onContinueShopping={() => setActiveTab('home')}
              onBuyNow={(prod) => setBuyNowProduct(prod)}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'account' && (
          <ErrorBoundary fallbackTitle="Unable to load Account">
            <AccountPage
              onLogout={() => setActiveTab('home')}
              onLogin={() => setShowAuth(true)}
              onSwitchToSeller={handleOpenSellerMode}
              onSellOnAKSelling={handleOpenSellerMode}
              onSellerDashboard={handleOpenSellerMode}
              onOrders={() => setShowOrders(true)}
              onAdminPanel={() => setShowAdmin(true)}
            />
          </ErrorBoundary>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} cartCount={cartCount} />

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          onBuyNow={(prod, size, color) => {
            setBuyNowProduct(prod);
            setBuyNowSize(size);
            setBuyNowColor(color);
            setSelectedProduct(null);
          }}
          onGoToCart={() => {
            setSelectedProduct(null);
            setActiveTab('cart');
          }}
        />
      )}

      {buyNowProduct && (
        <BuyNowCheckout
          product={buyNowProduct}
          quantity={1}
          selectedSize={buyNowSize}
          selectedColor={buyNowColor}
          onBack={() => {
            setBuyNowProduct(null);
            setBuyNowSize(undefined);
            setBuyNowColor(undefined);
          }}
          onSuccess={() => {
            setBuyNowProduct(null);
            setBuyNowSize(undefined);
            setBuyNowColor(undefined);
            setActiveTab('home');
          }}
        />
      )}

      {showAuth && (
        <AuthPage
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            setActiveTab('home');
          }}
        />
      )}

      {showSellerReg && (
        <SellerRegistration
          onBack={() => setShowSellerReg(false)}
          onOpenDashboard={() => {
            setShowSellerReg(false);
            handleSwitchMode('selling');
          }}
        />
      )}

      <SellerLockedModal
        isOpen={showSellerLockedModal}
        onClose={() => setShowSellerLockedModal(false)}
        currentUserEmail={user?.email}
        onLoginPrompt={() => setShowAuth(true)}
        onSwitchAccount={() => setShowAuth(true)}
      />

      {showOrders && (
        <OrdersPage onBack={() => setShowOrders(false)} />
      )}

      {showAdmin && (
        <AdminPanel onBack={() => setShowAdmin(false)} />
      )}

      <NotificationCenterModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onOpenProduct={handleOpenProductById}
      />

      {/* Gamification Streak & Spin Modals */}
      <DailyStreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        userId={user?.id || 'guest'}
      />

      <SpinWheelModal
        isOpen={showSpinWheelModal}
        onClose={() => setShowSpinWheelModal(false)}
        onShopCoupon={() => {
          setShowSpinWheelModal(false);
          setActiveTab('deals');
        }}
      />

      {/* 24/7 AI Smart Support Assistant & WhatsApp Escalation Bridge */}
      <AiSupportWidget />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
