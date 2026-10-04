import { useState, useEffect, useCallback } from 'react';
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
import { db, resolveProductImages } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { NotificationProvider } from '@/notification-context';
import NotificationToastBanner from '@/components/NotificationToastBanner';
import NotificationCenterModal from '@/components/NotificationCenterModal';
import { addRecentlyViewedProduct } from '@/utils/searchHistory';
import { captureReferralFromUrl } from '@/utils/referralService';
import DailyStreakModal from '@/components/gamification/DailyStreakModal';
import SpinWheelModal from '@/components/gamification/SpinWheelModal';
import EdgeSwipeBackContainer from '@/components/navigation/EdgeSwipeBackContainer';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { WhatsAppFloatingButton } from '@/components/support/WhatsAppFloatingButton';

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
  const [adminInitialTab, setAdminInitialTab] = useState<
    'categories' | 'banners' | 'products' | 'price_list' | 'payouts' | 'direct_upi' | undefined
  >(undefined);
  const [showNotifications, setShowNotifications] = useState(false);
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const [buyNowSize, setBuyNowSize] = useState<string | undefined>(undefined);
  const [buyNowColor, setBuyNowColor] = useState<string | undefined>(undefined);
  const [pendingBuyNow, setPendingBuyNow] = useState<{ prod: Product; size?: string; color?: string } | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showSpinWheelModal, setShowSpinWheelModal] = useState(false);
  const { cartCount } = useCart();

  const handleInitiateBuyNow = (prod: Product, size?: string, color?: string) => {
    if (!user) {
      setPendingBuyNow({ prod, size, color });
      setShowAuth(true);
      return;
    }
    setBuyNowProduct(prod);
    setBuyNowSize(size);
    setBuyNowColor(color);
    setSelectedProduct(null);
  };

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
    captureReferralFromUrl();
    const handleOpenProdEvent = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        handleOpenProductById(custom.detail);
      }
    };
    window.addEventListener('akselling_open_product_id', handleOpenProdEvent);
    return () => window.removeEventListener('akselling_open_product_id', handleOpenProdEvent);
  }, []);

  // 100% Real-Time Live Sync: Instant microsecond reflection for open product details
  useEffect(() => {
    if (!selectedProduct?.id) return;
    try {
      const unsub = onSnapshot(doc(db, 'products', selectedProduct.id), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const resolvedImgs = resolveProductImages({ id: snap.id, ...d });
          setSelectedProduct(prev => {
            if (!prev || prev.id !== snap.id) return prev;
            return {
              ...prev,
              ...d,
              id: snap.id,
              images: resolvedImgs,
              image: resolvedImgs[0],
              imageUrl: resolvedImgs[0],
              price: Number(d.price) || prev.price,
              mrp: Number(d.mrp) || Number(d.price) || prev.mrp,
              discount: Number(d.discount) || prev.discount,
              sizes: d.sizes || prev.sizes,
              stock: typeof d.stock === 'number' ? d.stock : (typeof d.inventoryCount === 'number' ? d.inventoryCount : prev.stock),
              inventoryCount: typeof d.inventoryCount === 'number' ? d.inventoryCount : (typeof d.stock === 'number' ? d.stock : prev.inventoryCount),
              pickupLocation: d.pickupLocation || prev.pickupLocation,
              pickupAddress: d.pickupAddress || prev.pickupAddress,
              delivery: d.delivery || prev.delivery,
              description: d.description || prev.description,
            };
          });
        }
      });
      return () => unsub();
    } catch {
      return () => {};
    }
  }, [selectedProduct?.id]);

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
    if (!product || !product.id) return;
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

  const [hasSubScreen, setHasSubScreen] = useState(false);

  useEffect(() => {
    const handleSubChange = () => {
      setHasSubScreen(Boolean(window.__akselling_has_subscreen));
    };
    window.addEventListener('akselling_subscreen_changed', handleSubChange);
    return () => window.removeEventListener('akselling_subscreen_changed', handleSubChange);
  }, []);

  const canGoBack = Boolean(
    hasSubScreen ||
    appMode === 'selling' ||
    buyNowProduct ||
    selectedProduct ||
    showOrders ||
    showAdmin ||
    showNotifications ||
    showSellerReg ||
    showSellerLockedModal ||
    showStreakModal ||
    showSpinWheelModal ||
    showAuth ||
    searchQuery.trim() ||
    activeTab !== 'home'
  );

  const handleBackGesture = useCallback(() => {
    if (typeof window !== 'undefined' && window.__akselling_has_subscreen) {
      window.dispatchEvent(new CustomEvent('akselling_back_pressed'));
      return;
    }
    if (showStreakModal) {
      setShowStreakModal(false);
    } else if (showSpinWheelModal) {
      setShowSpinWheelModal(false);
    } else if (showNotifications) {
      setShowNotifications(false);
    } else if (showAuth) {
      setShowAuth(false);
    } else if (showSellerLockedModal) {
      setShowSellerLockedModal(false);
    } else if (showSellerReg) {
      setShowSellerReg(false);
    } else if (buyNowProduct) {
      setBuyNowProduct(null);
    } else if (selectedProduct) {
      setSelectedProduct(null);
    } else if (showOrders) {
      setShowOrders(false);
    } else if (showAdmin) {
      setShowAdmin(false);
    } else if (appMode === 'selling') {
      handleSwitchMode('buying');
    } else if (searchQuery.trim()) {
      setSearchQuery('');
    } else if (activeTab !== 'home') {
      setActiveTab('home');
    }
  }, [
    showStreakModal,
    showSpinWheelModal,
    showNotifications,
    showAuth,
    showSellerLockedModal,
    showSellerReg,
    buyNowProduct,
    selectedProduct,
    showOrders,
    showAdmin,
    appMode,
    searchQuery,
    activeTab,
  ]);

  // Maintain browser history state for seamless Android physical/software back button navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (canGoBack) {
      try {
        window.history.pushState({ akselling_view: 'active', ts: Date.now() }, '');
      } catch {
        // ignore
      }
    }
  }, [
    canGoBack,
    selectedProduct?.id,
    buyNowProduct?.id,
    showOrders,
    showAdmin,
    showNotifications,
    showStreakModal,
    showSpinWheelModal,
    showAuth,
    hasSubScreen,
    activeTab,
  ]);

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
      <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-amber-400/30 via-slate-800 to-amber-500/40 shadow-2xl shadow-black/80 flex items-center justify-center animate-pulse border border-amber-400/40 overflow-hidden">
            <img
              src="/ak_brand_logo.jpg"
              alt="AKSelling"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-md">
            ✓
          </div>
        </div>
        <h1 className="text-xl font-black text-white tracking-wide mb-0.5">
          AK<span className="text-amber-400">Selling</span>
        </h1>
        <p className="text-xs text-amber-200/80 font-bold uppercase tracking-widest mb-3">
          Direct Factory Store
        </p>
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1 bg-white/5 border border-amber-400/20 px-3.5 py-1.5 rounded-full">
          <Loader2 size={16} className="animate-spin text-amber-400" />
          <span>Verifying Secure Session...</span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium max-w-xs mt-2">Connecting to AKSelling Identity Cloud</p>
      </div>
    );
  }

  if (appMode === 'selling') {
    return (
      <EdgeSwipeBackContainer canGoBack={canGoBack} onBack={handleBackGesture}>
        <div className="min-h-screen bg-slate-950 flex justify-center w-full overflow-x-hidden touch-scroll-container">
          <div className="min-h-screen bg-white max-w-md w-full relative sm:shadow-2xl sm:border-x sm:border-slate-800 overflow-x-hidden">
            <SellerDashboard onBack={() => handleSwitchMode('buying')} />
          </div>
        </div>
      </EdgeSwipeBackContainer>
    );
  }

  return (
    <EdgeSwipeBackContainer canGoBack={canGoBack} onBack={handleBackGesture}>
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

          <PWAInstallBanner />

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
              onBuyNow={(prod, size, color) => handleInitiateBuyNow(prod, size, color)}
              onRequireLogin={() => setShowAuth(true)}
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
              onAdminPanel={() => {
                setAdminInitialTab(undefined);
                setShowAdmin(true);
              }}
              onOpenAdminWithTab={(tab) => {
                setAdminInitialTab(tab);
                setShowAdmin(true);
              }}
            />
          </ErrorBoundary>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} cartCount={cartCount} />

      {selectedProduct && (
        <ErrorBoundary
          fallbackTitle="Unable to display Product Details"
          onReset={() => setSelectedProduct(null)}
        >
          <ProductDetail
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onBuyNow={(prod, size, color) => {
              handleInitiateBuyNow(prod, size, color);
            }}
            onGoToCart={() => {
              setSelectedProduct(null);
              setActiveTab('cart');
            }}
          />
        </ErrorBoundary>
      )}

      {buyNowProduct && (
        <ErrorBoundary
          fallbackTitle="Unable to load Checkout"
          onReset={() => {
            setBuyNowProduct(null);
            setBuyNowSize(undefined);
            setBuyNowColor(undefined);
          }}
        >
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
        </ErrorBoundary>
      )}

      {showAuth && (
        <AuthPage
          onClose={() => {
            setShowAuth(false);
            setPendingBuyNow(null);
          }}
          onSuccess={() => {
            setShowAuth(false);
            if (pendingBuyNow) {
              setBuyNowProduct(pendingBuyNow.prod);
              setBuyNowSize(pendingBuyNow.size);
              setBuyNowColor(pendingBuyNow.color);
              setSelectedProduct(null);
              setPendingBuyNow(null);
            } else {
              setActiveTab('home');
            }
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
        <ErrorBoundary
          fallbackTitle="Unable to load Orders"
          onReset={() => setShowOrders(false)}
        >
          <OrdersPage onBack={() => setShowOrders(false)} />
        </ErrorBoundary>
      )}

      {showAdmin && (
        <ErrorBoundary
          fallbackTitle="Unable to load Admin Panel"
          onReset={() => {
            setShowAdmin(false);
            setAdminInitialTab(undefined);
          }}
        >
          <AdminPanel
            onBack={() => {
              setShowAdmin(false);
              setAdminInitialTab(undefined);
            }}
            initialTab={adminInitialTab}
          />
        </ErrorBoundary>
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
        onOpenSpinWheel={() => {
          setShowStreakModal(false);
          setShowSpinWheelModal(true);
        }}
      />

      <SpinWheelModal
        isOpen={showSpinWheelModal}
        onClose={() => setShowSpinWheelModal(false)}
        onShopCoupon={() => {
          setShowSpinWheelModal(false);
          setActiveTab('deals');
        }}
      />

      {/* Official WhatsApp Floating Support Button */}
      <WhatsAppFloatingButton />
      </div>
    </div>
    </EdgeSwipeBackContainer>
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
