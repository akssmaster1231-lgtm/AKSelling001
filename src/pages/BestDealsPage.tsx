import { useState, useEffect, useMemo } from 'react';
import { Flame, ArrowUpDown, Zap, CheckCircle2, ShieldCheck, ChevronLeft } from 'lucide-react';
import { subscribeProducts, getCachedProducts } from '@/firebase';
import { fetchProducts, products as fallbackProducts } from '@/data';
import type { Product } from '@/types';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';

interface BestDealsPageProps {
  onProductClick: (product: Product) => void;
  onNavigateHome?: () => void;
}

type DiscountFilter = 'all' | '50plus' | '40plus' | '30plus' | 'under499' | 'under999' | 'topRated';
type SortOption = 'discount-desc' | 'price-asc' | 'price-desc' | 'rating-desc';

export default function BestDealsPage({ onProductClick, onNavigateHome }: BestDealsPageProps) {
  const [dbProducts, setDbProducts] = useState<Product[]>(() => getCachedProducts());
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DiscountFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('discount-desc');

  // Real-time synchronization
  useEffect(() => {
    let isMounted = true;
    if (dbProducts.length === 0) {
      setLoading(true);
    }

    fetchProducts().then(prods => {
      if (isMounted) {
        setDbProducts(prods);
        setLoading(false);
      }
    });

    const unsub = subscribeProducts((remoteProds) => {
      if (isMounted) {
        setDbProducts(remoteProds);
        setLoading(false);
      }
    });

    const handleUpdate = () => {
      fetchProducts().then(p => isMounted && setDbProducts(p));
    };

    window.addEventListener('akselling_products_updated', handleUpdate);

    return () => {
      isMounted = false;
      unsub();
      window.removeEventListener('akselling_products_updated', handleUpdate);
    };
  }, [dbProducts.length]);

  const allProducts = dbProducts.length > 0 ? dbProducts : fallbackProducts;

  // Filter deals
  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      const discount = Number(p.discount) || 0;
      const price = Number(p.price) || 0;
      const rating = Number(p.rating) || 0;

      switch (activeFilter) {
        case '50plus':
          return discount >= 50;
        case '40plus':
          return discount >= 40;
        case '30plus':
          return discount >= 30;
        case 'under499':
          return price <= 499;
        case 'under999':
          return price <= 999;
        case 'topRated':
          return rating >= 4.0;
        case 'all':
        default:
          return discount > 0 || price < 1000;
      }
    });
  }, [allProducts, activeFilter]);

  // Sort deals
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'discount-desc':
        return list.sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0));
      case 'price-asc':
        return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'price-desc':
        return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case 'rating-desc':
        return list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      default:
        return list;
    }
  }, [filteredProducts, sortBy]);

  const filterButtons: { id: DiscountFilter; label: string; badge?: string }[] = [
    { id: 'all', label: 'All Deals' },
    { id: '50plus', label: '50%+ Off', badge: 'SUPER' },
    { id: '40plus', label: '40%+ Off' },
    { id: '30plus', label: '30%+ Off' },
    { id: 'under499', label: 'Under ₹499' },
    { id: 'under999', label: 'Under ₹999' },
    { id: 'topRated', label: 'Top Rated 4★+' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-fade-in touch-scroll-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white px-4 pt-4 pb-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="p-1.5 -ml-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Back to home"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-yellow-200">
              <Flame size={22} className="fill-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">AKSelling Best Deals</h1>
                <span className="bg-yellow-300 text-red-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                  HOT DEALS
                </span>
              </div>
              <p className="text-[11px] text-white/90">Exclusive discounts from top verified suppliers</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs bg-black/20 px-2.5 py-1 rounded-full border border-white/20">
            <ShieldCheck size={14} className="text-emerald-300" />
            <span className="font-semibold text-white">Verified Offers</span>
          </div>
        </div>

        {/* Live Deal Highlights Bar */}
        <div className="mt-3 flex items-center justify-between text-xs bg-black/20 rounded-xl px-3 py-2 border border-white/15">
          <div className="flex items-center gap-1.5 text-yellow-200 font-bold">
            <Zap size={14} className="fill-yellow-300 animate-pulse" />
            <span>Prices Dropped Today</span>
          </div>
          <div className="text-[11px] text-white/90 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-300" />
            <span>Free Delivery on eligible orders</span>
          </div>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="sticky top-[56px] z-20 bg-white border-b border-gray-200 shadow-xs px-3 py-2">
        {/* Horizontal scrollable discount filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar horizontal-shelf-row py-0.5">
          {filterButtons.map(btn => {
            const isSelected = activeFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setActiveFilter(btn.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{btn.label}</span>
                {btn.badge && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                    isSelected ? 'bg-yellow-300 text-red-950' : 'bg-red-100 text-red-700'
                  }`}>
                    {btn.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort & Count bar */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100 text-xs">
          <div className="text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{sortedProducts.length}</strong> discounted items
          </div>

          <div className="flex items-center gap-1">
            <ArrowUpDown size={13} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="text-xs font-bold text-gray-700 bg-transparent border-none outline-none cursor-pointer pr-1"
            >
              <option value="discount-desc">Highest Discount</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Top Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-3 pt-3">
        {loading && sortedProducts.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[...Array(6)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 mt-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={28} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No deals match this filter</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Try selecting another discount filter or browse all live deals.
            </p>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-95"
            >
              View All Deals
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {sortedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onProductClick(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
