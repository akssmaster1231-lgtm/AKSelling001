import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Zap, TrendingUp, Gift, Loader2 } from 'lucide-react';
import { products as fallbackProducts, banners as fallbackBanners, categories, fetchProducts, formatPrice } from '@/data';
import { fetchBanners } from '@/banner-api';
import { subscribeProducts, subscribeBanners } from '@/firebase';
import { useI18n } from '@/i18n';
import type { Product, Banner } from '@/types';
import BannerCarousel from '@/components/BannerCarousel';
import ProductCard from '@/components/ProductCard';

interface HomePageProps {
  searchQuery: string;
  onProductClick: (product: Product) => void;
  onCategoryClick: (categoryId: string) => void;
  onBecomeSeller?: () => void;
}

export default function HomePage({ searchQuery, onProductClick, onCategoryClick, onBecomeSeller }: HomePageProps) {
  const { t } = useI18n();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbBanners, setDbBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial async fetch
    fetchProducts().then(prods => {
      if (isMounted && prods.length > 0) {
        setDbProducts(prods);
        setLoading(false);
      }
    });
    fetchBanners().then(bans => {
      if (isMounted && bans.length > 0) {
        setDbBanners(bans);
      }
    });

    // 2. Real-time Firestore subscriptions
    const unsubProducts = subscribeProducts((remoteProducts) => {
      if (isMounted && remoteProducts.length > 0) {
        setDbProducts(remoteProducts);
        setLoading(false);
      }
    });

    const unsubBanners = subscribeBanners((remoteBanners) => {
      if (isMounted && remoteBanners.length > 0) {
        setDbBanners(remoteBanners);
      }
    });

    // 3. Local events fallback
    const handleUpdate = () => {
      fetchProducts().then(p => isMounted && p.length > 0 && setDbProducts(p));
      fetchBanners().then(b => isMounted && b.length > 0 && setDbBanners(b));
    };

    window.addEventListener('akselling_banners_updated', handleUpdate);
    window.addEventListener('akselling_products_updated', handleUpdate);

    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubProducts();
      unsubBanners();
      window.removeEventListener('akselling_banners_updated', handleUpdate);
      window.removeEventListener('akselling_products_updated', handleUpdate);
    };
  }, []);

  const allProducts = dbProducts.length > 0 ? dbProducts : fallbackProducts;
  const displayBanners = dbBanners.length > 0 ? dbBanners : fallbackBanners;

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const q = searchQuery.toLowerCase();
    return allProducts.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [searchQuery, allProducts]);

  const trendingProducts = [...allProducts].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 6);
  const topDeals = [...allProducts].sort((a, b) => b.discount - a.discount).slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-flipkart-500" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-3 pt-3">
        <BannerCarousel banners={displayBanners} />
      </div>

      <div className="mt-4 px-3">
        <div className="bg-white rounded-xl shadow-card p-3">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onCategoryClick(cat.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16 group"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: cat.color + '15' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {searchQuery.trim() ? (
        <section className="mt-4 px-3">
          <h2 className="text-base font-bold text-gray-800 mb-3">
            {t('searchPlaceholder').split(',')[0]} ({filteredProducts.length})
          </h2>
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-card p-8 text-center">
              <p className="text-gray-500 text-sm">No products found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <div className="mt-4 px-3">
            <div className="bg-gradient-to-r from-flipkart-500 to-flipkart-600 rounded-xl p-4 flex items-center gap-3 shadow-card">
              <div className="bg-white/20 rounded-full p-2">
                <Zap size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{t('lightningDeals')}</p>
                <p className="text-white/80 text-xs">Limited time offers - grab them fast!</p>
              </div>
            </div>
          </div>

          <section className="mt-4 px-3">
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-flipkart-500" />
                  <h2 className="text-base font-bold text-gray-800">{t('topDeals')}</h2>
                </div>
                <button className="flex items-center text-sm text-flipkart-500 font-medium">
                  See all <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar p-3">
                {topDeals.map(p => (
                  <div key={p.id} className="shrink-0 w-36">
                    <ProductCard product={p} onClick={() => onProductClick(p)} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-4 px-3">
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-800">{t('bestOf')}</h2>
                <button className="flex items-center text-sm text-flipkart-500 font-medium">
                  See all <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3">
                {allProducts.map(p => (
                  <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />
                ))}
              </div>
            </div>
          </section>

          <section className="mt-4 px-3">
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Gift size={18} className="text-flipkart-500" />
                  <h2 className="text-base font-bold text-gray-800">{t('trendingNow')}</h2>
                </div>
                <button className="flex items-center text-sm text-flipkart-500 font-medium">
                  See all <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar p-3">
                {trendingProducts.map(p => (
                  <div key={p.id} className="shrink-0 w-36">
                    <ProductCard product={p} onClick={() => onProductClick(p)} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-4 px-3">
            <div
              onClick={onBecomeSeller}
              className="bg-gradient-to-r from-accent-400 to-accent-600 rounded-xl p-4 flex items-center gap-3 shadow-card cursor-pointer hover:opacity-95 transition-opacity"
            >
              <div className="bg-white/20 rounded-full p-2 shrink-0">
                <Gift size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{t('becomeSeller')}</p>
                <p className="text-white/80 text-xs truncate">Start selling on AKSelling with auto-verified KYC</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBecomeSeller?.();
                }}
                className="bg-white text-flipkart-700 text-xs font-bold px-4 py-2 rounded-full shadow-xs hover:bg-slate-50 active:scale-95 transition-all shrink-0 cursor-pointer"
                id="home-join-seller-btn"
              >
                Join Now
              </button>
            </div>
          </div>

          <div className="mt-4 px-3">
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Top deals starting from</p>
              <p className="text-2xl font-extrabold text-flipkart-600">
                {formatPrice(Math.min(...allProducts.map(p => p.price)))}
              </p>
              <p className="text-xs text-gray-500 mt-1">Shop from our widest collection</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CategoryIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    Shirt: <span className="text-base">👕</span>,
    Smartphone: <span className="text-base">📱</span>,
    Headphones: <span className="text-base">🎧</span>,
    Sofa: <span className="text-base">🛋️</span>,
    Sparkles: <span className="text-base">✨</span>,
    Footprints: <span className="text-base">👟</span>,
    Watch: <span className="text-base">⌚</span>,
    Refrigerator: <span className="text-base">🔌</span>,
  };
  return <>{icons[name] || <span className="text-base">📦</span>}</>;
}
