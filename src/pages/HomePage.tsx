import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Gift, Calendar, Trophy, Clapperboard } from 'lucide-react';
import { products as fallbackProducts, banners as fallbackBanners, getAllCategories, fetchProducts, formatPrice, deduplicateProducts, DisplayDeduplicator } from '@/data';
import { fetchBanners } from '@/banner-api';
import { subscribeProducts, subscribeBanners, getCachedProducts, subscribeCategories } from '@/firebase';
import { useI18n } from '@/i18n';
import type { Product, Banner, Category } from '@/types';
import BannerCarousel from '@/components/BannerCarousel';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import CategoryIcon from '@/components/CategoryIcon';
import FlashDropSection from '@/components/flash-drop/FlashDropSection';

interface HomePageProps {
  searchQuery: string;
  onProductClick: (product: Product) => void;
  onCategoryClick: (categoryId: string) => void;
  onNavigateDeals?: () => void;
  onBecomeSeller?: () => void;
  onOpenStreak?: () => void;
  onOpenSpinWheel?: () => void;
  onNavigateReels?: () => void;
}

export default function HomePage({
  searchQuery,
  onProductClick,
  onCategoryClick,
  onNavigateDeals,
  onBecomeSeller,
  onOpenStreak,
  onOpenSpinWheel,
  onNavigateReels,
}: HomePageProps) {
  const { t } = useI18n();
  const [dbProducts, setDbProducts] = useState<Product[]>(() => getCachedProducts());
  const [dbBanners, setDbBanners] = useState<Banner[]>(() => {
    try {
      const raw = localStorage.getItem('akselling_master_banners');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const active = parsed.filter((b: { active?: boolean; isActive?: boolean }) => b.active !== false && b.isActive !== false);
          if (active.length > 0) {
            return active.sort((a: { display_order?: number }, b: { display_order?: number }) => (a.display_order || 0) - (b.display_order || 0));
          }
        }
      }
    } catch {
      // fallback to default
    }
    return fallbackBanners;
  });
  const [activeCategories, setActiveCategories] = useState<Category[]>(() => getAllCategories());
  const [loading, setLoading] = useState(() => getCachedProducts().length === 0);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial async fetch
    fetchProducts().then(prods => {
      if (isMounted) {
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
      if (isMounted) {
        setDbProducts(remoteProducts);
        setLoading(false);
      }
    });

    const unsubBanners = subscribeBanners((remoteBanners) => {
      if (isMounted) {
        setDbBanners(remoteBanners.length > 0 ? remoteBanners : fallbackBanners);
      }
    });

    const unsubCategories = subscribeCategories(() => {
      if (isMounted) {
        setActiveCategories(getAllCategories());
      }
    });

    // 3. Local events fallback for immediate 0ms local reflection
    const handleUpdate = () => {
      fetchProducts().then(p => isMounted && setDbProducts(p));
      fetchBanners().then(b => isMounted && setDbBanners(b.length > 0 ? b : fallbackBanners));
      setActiveCategories(getAllCategories());
    };

    window.addEventListener('akselling_banners_updated', handleUpdate);
    window.addEventListener('akselling_products_updated', handleUpdate);
    window.addEventListener('akselling_categories_updated', handleUpdate);

    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubProducts();
      unsubBanners();
      unsubCategories();
      window.removeEventListener('akselling_banners_updated', handleUpdate);
      window.removeEventListener('akselling_products_updated', handleUpdate);
      window.removeEventListener('akselling_categories_updated', handleUpdate);
    };
  }, []);

  const rawProducts = dbProducts.length > 0 ? dbProducts : fallbackProducts;
  const allProducts = useMemo(() => deduplicateProducts(rawProducts), [rawProducts]);
  const displayBanners = dbBanners.length > 0 ? dbBanners : fallbackBanners;

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const q = searchQuery.toLowerCase();
    return allProducts.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q))) ||
        (Array.isArray(p.keywords) && p.keywords.some(k => k.toLowerCase().includes(q)))
    );
  }, [searchQuery, allProducts]);

  // Non-repeating product allocation across sections
  // Guarantees each product design is displayed at most once on the entire Home Page
  const {
    trendingProducts,
    categoryShelves,
    exploreCatalogProducts,
  } = useMemo(() => {
    const dedup = new DisplayDeduplicator();

    // 1. Trending Products (top rating/popular items)
    const trendingCandidates = [...allProducts]
      .filter(p => !dedup.isDisplayed(p))
      .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));

    const maxTrending = allProducts.length <= 6 ? Math.max(1, Math.floor(allProducts.length / 2)) : 8;
    const trending = dedup.filterAndMark(trendingCandidates, maxTrending);

    // 2. Category Shelves (unique un-displayed items per category)
    const shelves: { category: Category; products: Product[] }[] = [];
    for (const cat of activeCategories) {
      if (cat.id === 'all') continue;
      const catRemaining = allProducts.filter(
        p =>
          !dedup.isDisplayed(p) &&
          (p.category?.toLowerCase() === cat.id.toLowerCase() ||
            p.category?.toLowerCase() === cat.name.toLowerCase())
      );

      if (catRemaining.length > 0) {
        const shelfItems = dedup.filterAndMark(catRemaining, 8);
        if (shelfItems.length > 0) {
          shelves.push({
            category: cat,
            products: shelfItems,
          });
        }
      }
    }

    // 3. Explore Catalog / Best of AKSelling (any remaining un-displayed products)
    const remainingCatalog = allProducts.filter(p => !dedup.isDisplayed(p));
    const exploreItems = dedup.filterAndMark(remainingCatalog, 12);

    return {
      trendingProducts: trending,
      categoryShelves: shelves,
      exploreCatalogProducts: exploreItems,
    };
  }, [allProducts, activeCategories]);

  const minPrice = useMemo(() => {
    return allProducts.length > 0 ? Math.min(...allProducts.map(p => p.price)) : 0;
  }, [allProducts]);

  if (loading) {
    return (
      <div className="pb-4 w-full overflow-x-hidden">
        {/* Banner Skeleton */}
        <div className="px-3 pt-3">
          <div className="w-full aspect-[21/9] sm:aspect-[3/1] bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Categories Skeleton */}
        <div className="mt-4 px-3">
          <div className="bg-white rounded-xl p-3 flex gap-3 overflow-hidden shadow-card">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 w-16 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-gray-200" />
                <div className="w-10 h-2 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="mt-4 px-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-36 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4 w-full overflow-x-hidden touch-scroll-container">
      <div className="px-3 pt-3">
        <BannerCarousel banners={displayBanners} />
      </div>

      {/* Gen-Z Interactive Quick Rewards & Reels Hub */}
      <div className="mt-2.5 px-3">
        <div className="grid grid-cols-3 gap-2">
          {/* Roz Check-In */}
          <button
            type="button"
            onClick={onOpenStreak}
            className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/20 border border-amber-400/40 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-2xs hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center mb-1 shadow-xs">
              <Calendar size={15} />
            </div>
            <span className="text-[11px] font-black text-slate-900 leading-tight">Roz Check-In</span>
            <span className="text-[9px] font-bold text-amber-700 mt-0.5">₹5+ Daily Coins</span>
          </button>

          {/* Spin & Win */}
          <button
            type="button"
            onClick={onOpenSpinWheel}
            className="bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-indigo-500/20 border border-purple-400/40 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-2xs hover:bg-purple-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-1 shadow-xs">
              <Trophy size={15} />
            </div>
            <span className="text-[11px] font-black text-slate-900 leading-tight">Spin & Win</span>
            <span className="text-[9px] font-bold text-purple-700 mt-0.5">Win Up to ₹200</span>
          </button>

          {/* Video Reels Shopping */}
          <button
            type="button"
            onClick={onNavigateReels}
            className="bg-gradient-to-r from-red-500/15 via-rose-500/10 to-amber-500/20 border border-red-400/40 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-2xs hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer relative"
          >
            <span className="absolute -top-1.5 -right-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-xs">
              LIVE
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center mb-1 shadow-xs">
              <Clapperboard size={15} />
            </div>
            <span className="text-[11px] font-black text-slate-900 leading-tight">Watch Reels</span>
            <span className="text-[9px] font-bold text-red-700 mt-0.5">Shop by Video</span>
          </button>
        </div>
      </div>

      <div className="mt-3 px-3">
        <div className="bg-white rounded-xl shadow-card p-3">
          <div className="flex gap-3 overflow-x-auto no-scrollbar horizontal-shelf-row">
            {activeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onCategoryClick(cat.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16 group cursor-pointer"
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

      {/* Limited Midnight 1-Hour Flash Drop Shelf */}
      {!searchQuery.trim() && allProducts.length > 0 && (
        <FlashDropSection
          products={allProducts}
          onProductClick={onProductClick}
          onNavigateDeals={onNavigateDeals || (() => onCategoryClick('all'))}
        />
      )}

      {searchQuery.trim() ? (
        <section className="mt-4 px-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm sm:text-base font-bold text-gray-800 truncate">
              Results for "<span className="text-[#1b365d]">{searchQuery}</span>" ({filteredProducts.length})
            </h2>
          </div>
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
      ) : allProducts.length === 0 ? (
        <div className="mt-4 px-3 space-y-4">
          <div className="bg-white rounded-xl shadow-card p-6 text-center">
            <div className="w-14 h-14 bg-flipkart-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift size={26} className="text-flipkart-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Welcome to AKSelling</h3>
            <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
              India's trusted marketplace. Real verified sellers are onboarding! Are you a manufacturer, distributor, or artisan?
            </p>
            <button
              onClick={onBecomeSeller}
              className="mt-4 inline-flex items-center gap-2 bg-flipkart-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-flipkart-600 transition-colors shadow-xs cursor-pointer"
            >
              Start Selling Today →
            </button>
          </div>

          <div
            onClick={onBecomeSeller}
            className="bg-gradient-to-r from-accent-400 to-accent-600 rounded-xl p-4 flex items-center gap-3 shadow-card cursor-pointer hover:opacity-95 transition-opacity"
          >
            <div className="bg-white/20 rounded-full p-2 shrink-0">
              <Gift size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{t('becomeSeller')}</p>
              <p className="text-white/80 text-xs truncate">Instant GST & Bank verified seller onboarding</p>
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
      ) : (
        <>
          {/* Trending Products Carousel */}
          {trendingProducts.length > 0 && (
            <section className="mt-4 px-3" id="home-trending-now">
              <div className="bg-white rounded-xl shadow-card overflow-hidden border border-slate-200/80">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
                      <Gift size={18} />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">{t('trendingNow')}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => (onNavigateDeals ? onNavigateDeals() : onCategoryClick('all'))}
                    className="flex items-center text-xs font-bold text-[#1b365d] hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    See all <ChevronRight size={14} />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar horizontal-shelf-row p-3">
                  {trendingProducts.map(p => (
                    <div key={`trending-${p.id}`} className="shrink-0 w-36 sm:w-44">
                      <ProductCard product={p} onClick={() => onProductClick(p)} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Full Catalog / Best of AKSelling - only shows remaining distinct designs */}
          {exploreCatalogProducts.length > 0 && (
            <section className="mt-4 px-3" id="home-explore-all">
              <div className="bg-white rounded-xl shadow-card overflow-hidden border border-slate-200/80">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1b365d] to-slate-800 text-amber-400 font-black text-xs flex items-center justify-center shadow-xs border border-amber-500/30">
                      AK
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                          {t('bestOf')} AKSelling
                        </h2>
                        <span className="bg-[#1b365d]/10 text-[#1b365d] text-[10px] font-black px-1.5 py-0.5 rounded border border-[#1b365d]/20">
                          CATALOGUE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">More unique designs ({exploreCatalogProducts.length} items)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCategoryClick('all')}
                    className="flex items-center text-xs font-bold text-[#1b365d] hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar horizontal-shelf-row p-3">
                  {exploreCatalogProducts.map(p => (
                    <div key={`all-${p.id}`} className="shrink-0 w-36 sm:w-44">
                      <ProductCard product={p} onClick={() => onProductClick(p)} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Dynamic Category & Catalogue Shelves (Smooth Horizontal Feeds) */}
          {categoryShelves.map(shelf => (
            <section key={`shelf-${shelf.category.id}`} className="mt-4 px-3" id={`home-shelf-${shelf.category.id}`}>
              <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-slate-50/60">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: shelf.category.color || '#2874f0' }}
                    >
                      <CategoryIcon name={shelf.category.icon} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-gray-800 leading-tight">
                          {shelf.category.name}
                        </h2>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                          {shelf.products.length} {shelf.products.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">Popular picks in {shelf.category.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCategoryClick(shelf.category.id)}
                    className="flex items-center text-xs font-bold text-[#1b365d] hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    See all <ChevronRight size={14} />
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto no-scrollbar horizontal-shelf-row p-3">
                  {shelf.products.slice(0, 8).map(p => (
                    <div key={`shelf-${shelf.category.id}-${p.id}`} className="shrink-0 w-36 sm:w-44">
                      <ProductCard product={p} onClick={() => onProductClick(p)} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}

          {/* Become a Seller Card */}
          <div className="mt-4 px-3">
            <div
              onClick={onBecomeSeller}
              className="bg-gradient-to-r from-slate-900 via-[#1b365d] to-amber-600 rounded-xl p-4 flex items-center gap-3 shadow-card cursor-pointer hover:opacity-95 transition-opacity border border-slate-700/60"
            >
              <div className="bg-amber-400/20 border border-amber-400/30 rounded-full p-2 shrink-0">
                <Gift size={24} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{t('becomeSeller')}</p>
                <p className="text-amber-100/80 text-xs truncate">Start selling on AKSelling with auto-verified KYC</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBecomeSeller?.();
                }}
                className="bg-amber-400 text-slate-950 text-xs font-black px-4 py-2 rounded-full shadow-md hover:bg-amber-300 active:scale-95 transition-all shrink-0 cursor-pointer"
                id="home-join-seller-btn"
              >
                Join Now
              </button>
            </div>
          </div>

          {minPrice > 0 && (
            <div className="mt-4 px-3">
              <div className="bg-white rounded-xl shadow-card border border-slate-200/80 p-4 text-center">
                <p className="text-xs text-slate-400 font-medium mb-1">Top deals starting from</p>
                <p className="text-2xl font-black text-[#1b365d]">
                  {formatPrice(minPrice)}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Shop verified collections on AKSelling</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
