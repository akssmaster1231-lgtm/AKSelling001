import { useState, useEffect } from 'react';
import { CartProvider, useCart } from '@/cart-context';
import { AuthProvider, useAuth } from '@/auth-context';
import { I18nProvider } from '@/i18n';
import Header from '@/components/Header';
import BottomNav, { type TabId } from '@/components/BottomNav';
import HomePage from '@/pages/HomePage';
import ProductDetail from '@/pages/ProductDetail';
import PlayPage from '@/pages/PlayPage';
import CategoriesPage from '@/pages/CategoriesPage';
import AccountPage from '@/pages/AccountPage';
import CartPage from '@/pages/CartPage';
import AuthPage from '@/pages/AuthPage';
import SellerRegistration from '@/pages/SellerRegistration';
import SellerDashboard from '@/pages/SellerDashboard';
import BuyNowCheckout from '@/pages/BuyNowCheckout';
import OrdersPage from '@/pages/OrdersPage';
import AdminPanel from '@/pages/AdminPanel';
import type { Product } from '@/types';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { authInitialized } = useAuth();
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
  const [showOrders, setShowOrders] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const { cartCount } = useCart();

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
    try {
      const isSeller = localStorage.getItem('akselling_is_seller');
      const active = localStorage.getItem('akselling_active_seller');
      // If user has completed GST/Aadhaar registration
      if (isSeller === 'true' && active) {
        handleSwitchMode('selling');
      } else {
        // Must complete Flipkart-style registration and document verification first!
        setShowSellerReg(true);
      }
    } catch {
      setShowSellerReg(true);
    }
  };

  const handleProductClick = (product: Product) => {
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
  };

  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  // 1. Initializing authentication state check
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2874f0] to-blue-600 shadow-lg shadow-blue-500/25 flex items-center justify-center mb-4 animate-pulse">
          <span className="text-3xl font-black text-white tracking-wider">AK</span>
        </div>
        <div className="flex items-center gap-2 text-flipkart-600 font-bold text-base mb-1">
          <Loader2 size={20} className="animate-spin" />
          <span>Verifying Secure Session...</span>
        </div>
        <p className="text-xs text-gray-400 font-medium max-w-xs">Connecting to AKSelling Identity Cloud</p>
      </div>
    );
  }

  // 2. Strict Route Protection removed for preview experience:
  // Visitors can view the entire store immediately. If they click Account or Checkout without logging in,
  // they can log in via AuthPage.
  if (appMode === 'selling') {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center overflow-x-hidden w-full">
        <div className="min-h-screen bg-white max-w-md w-full relative sm:shadow-2xl sm:border-x sm:border-gray-200 overflow-x-hidden">
          <SellerDashboard onBack={() => handleSwitchMode('buying')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center overflow-x-hidden w-full">
      <div className="min-h-screen bg-white max-w-md w-full relative sm:shadow-2xl sm:border-x sm:border-gray-200 flex flex-col overflow-x-hidden">
        <Header
          onSearch={handleSearch}
        onCartClick={() => setActiveTab('cart')}
        onAccountClick={() => setActiveTab('account')}
        onSwitchToSeller={handleOpenSellerMode}
        onNavigateHome={() => {
          setActiveTab('home');
          setSearchQuery('');
          setSelectedProduct(null);
        }}
      />

      <main className="pb-16 min-h-[calc(100vh-60px)]">
        {activeTab === 'home' && (
          <HomePage
            searchQuery={searchQuery}
            onProductClick={handleProductClick}
            onCategoryClick={handleCategoryClick}
            onBecomeSeller={() => setShowSellerReg(true)}
          />
        )}
        {activeTab === 'play' && <PlayPage onProductClick={handleProductClick} />}
        {activeTab === 'categories' && (
          <CategoriesPage
            onProductClick={handleProductClick}
            initialCategory={initialCategory}
          />
        )}
        {activeTab === 'account' && (
          <AccountPage
            onLogout={() => setActiveTab('home')}
            onLogin={() => setShowAuth(true)}
            onSwitchToSeller={handleOpenSellerMode}
            onSellOnAKSelling={() => setShowSellerReg(true)}
            onSellerDashboard={handleOpenSellerMode}
            onOrders={() => setShowOrders(true)}
            onAdminPanel={() => setShowAdmin(true)}
          />
        )}
        {activeTab === 'cart' && (
          <CartPage
            onProductClick={handleProductClick}
            onContinueShopping={() => setActiveTab('home')}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} cartCount={cartCount} />

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          onBuyNow={() => {
            setBuyNowProduct(selectedProduct);
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
          onBack={() => setBuyNowProduct(null)}
          onSuccess={() => {
            setBuyNowProduct(null);
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

      {showOrders && (
        <OrdersPage onBack={() => setShowOrders(false)} />
      )}

      {showAdmin && (
        <AdminPanel onBack={() => setShowAdmin(false)} />
      )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
