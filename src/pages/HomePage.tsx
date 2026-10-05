import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Gift, Calendar, Trophy } from 'lucide-react';
import { products as fallbackProducts, getAllCategories, fetchProducts, formatPrice, deduplicateProducts, DisplayDeduplicator, banners as defaultBanners } from '@/data';
import { subscribeProducts, getCachedProducts, subscribeCategories } from '@/firebase';
import { fetchBanners } from '@/banner-api';
import { useI18n } from '@/i18n';
import type { Product, Category, Banner } from '@/types';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import CategoryIcon from '@/components/CategoryIcon';
import FlashDropSection from '@/components/flash-drop/FlashDropSection';
import { CottonShowcaseBox, StreetwearShowcaseBox, PrintingShowcaseBox } from '@/components/FeaturedShowcaseBoxes';
import BannerCarousel from '@/components/BannerCarousel';

interface HomePageProps {
  searchQuery: string;
  onProductClick: (product: Product) => void;
  onCategoryClick: (categoryId: string) => void;
  onNavigateDeals?: () => void;
  onBecomeSeller?: () => void;
  onOpenStreak?: () => void;
  onOpenSpinWheel?: () => void;
}

export default function HomePage({
  searchQuery,
  onProductClick,
  onCategoryClick,
  onNavigateDeals,
  onBecomeSeller,
  onOpenStreak,
  onOpenSpinWheel,
}: HomePageProps) {
  const { t } = useI18n();
  const [dbProducts, setDbProducts] = useState<Product[]>(() => getCachedProducts());
  const [activeCategories, setActiveCategories] = useState<Category[]>(() => getAllCategories());
  const [loading, setLoading] = useState(() => getCachedProducts().length === 0);
  const [bannersList, setBannersList] = useState<Banner[]>(() => defaultBanners);

  useEffect(() => {
    let isMounted = true;

    // 0. Fetch high-quality promotional banners & posters
    fetchBanners().then((res) => {
      if (isMounted && res.length > 0) setBannersList(res);
    });
    const handleBannersUpdate = () => {
      fetchBanners().then((res) => {
        if (isMounted && res.length > 0) setBannersList(res);
      });
    };
    window.addEventListener('akselling_banners_updated', handleBannersUpdate);

    // 1. Initial async fetch
    fetchProducts().then(prods => {
      if (isMounted) {
        setDbProducts(prods);
        setLoading(false);
      }
    });

    // 2. Real-time Firestore subscriptions
    const unsubProducts = subscribeProducts((remoteProducts) => {
      if (isMounted) {
        setDbProducts(remoteProducts);
        setLoading(false);
      }
    });

    const unsubCategories = subscribeCategories(() => {
      if (isMounted) {
        setActiveCategories(getAllCategories());
      }
    });

    // 3. Local events fallback for immediate 0ms local reflection
    const handleProductsUpdate = (e: Event) => {
      if (!isMounted) return;
      const custom = e as CustomEvent<{ products?: Product[] }>;
      if (custom.detail?.products && custom.detail.products.length > 0) {
        setDbProducts(custom.detail.products);
      } else {
        const cached = getCachedProducts();
        if (cached.length > 0) setDbProducts(cached);
      }
    };

    const handleUpdate = () => {
      setActiveCategories(getAllCategories());
    };

    window.addEventListener('akselling_products_updated', handleProductsUpdate);
    window.addEventListener('akselling_categories_updated', handleUpdate);

    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubProducts();
      unsubCategories();
      window.removeEventListener('akselling_products_updated', handleProductsUpdate);
      window.removeEventListener('akselling_categories_updated', handleUpdate);
      window.removeEventListener('akselling_banners_updated', handleBannersUpdate);
    };
  }, []);

  const rawProducts = dbProducts.length > 0 ? dbProducts : getCachedProducts();
  const allProducts = useMemo(() => deduplicateProducts(rawProducts.length > 0 ? rawProducts : fallbackProducts), [rawProducts]);

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

  const {
    freshDropsProducts,
    trendingProducts,
    categoryShelves,
    exploreCatalogProducts,
  } = useMemo(() => {
    const dedup = new DisplayDeduplicator();

    // 1. Fresh Drops & New Arrivals (First slice of newest unique products)
    const fresh = dedup.filterAndMark(allProducts, 6);

    // 2. Trending Products (Sorted by rating/sales, strictly excluding anything already in Fresh Drops)
    const sortedPool = [...allProducts].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
    const trending = dedup.filterAndMark(sortedPool, 6);

    // 3. Category Shelves (Matching activeCategories, strictly distinct unshown products)
    const shelves: { category: Category; products: Product[] }[] = [];
    for (const cat of activeCategories) {
      if (cat.id === 'all') continue;
      const catRemaining = allProducts.filter(p => {
        const pCat = (p.category || '').toLowerCase().trim();
        const cId = cat.id.toLowerCase().trim();
        const cName = cat.name.toLowerCase().trim();
        return (
          pCat === cId ||
          pCat === cName ||
          (cId === 'fashion' && (pCat === 'apparel-manufacturing' || pCat === 'fashion' || pCat.includes('apparel'))) ||
          (cId === 'apparel-manufacturing' && (pCat === 'fashion' || pCat === 'apparel-manufacturing' || pCat.includes('apparel')))
        );
      });

      const shelfProds = dedup.filterAndMark(catRemaining, 6);
      if (shelfProds.length > 0) {
        shelves.push({
          category: cat,
          products: shelfProds,
        });
      }
    }

    // 4. Explore Catalog (All remaining products that haven't appeared in any previous section)
    const remaining = allProducts.filter(p => !dedup.isDisplayed(p));

    return {
      freshDropsProducts: fresh,
      trendingProducts: trending,
      categoryShelves: shelves,
      exploreCatalogProducts: remaining,
    };
  }, [allProducts, activeCategories]);

  const minPrice = useMemo(() => {
    return allProducts.length > 0 ? Math.min(...allProducts.map(p => p.price)) : 0;
  }, [allProducts]);

  if (loading) {
    return (
      <div className="pb-4 w-full overflow-x-hidden">
        {/* AI Sales Master Shopkeeper Counter Skeleton */}
        <div className="px-3 pt-3">
          <div className="w-full aspect-[16/9] sm:aspect-[2.1/1] bg-slate-900 rounded-2xl animate-pulse border border-amber-400/20" />
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
      {/* High-Quality Promotional Banners & Posters (Official AKSelling Carousel) */}
      <div className="px-3 pt-3">
        <BannerCarousel banners={bannersList} />
      </div>

      {/* Interactive Quick Rewards Hub */}
      <div className="mt-2.5 px-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Roz Check-In */}
          <button
            type="button"
            onClick={onOpenStreak}
            className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/20 border border-amber-400/40 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
              <Calendar size={16} />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[11px] font-black text-slate-900 block leading-tight truncate">Roz Check-In</span>
              <span className="text-[10px] font-bold text-amber-700">₹5+ Daily Coins</span>
            </div>
          </button>

          {/* Spin & Win */}
          <button
            type="button"
            onClick={onOpenSpinWheel}
            className="bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-indigo-500/20 border border-purple-400/40 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs hover:bg-purple-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Trophy size={16} />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[11px] font-black text-slate-900 block leading-tight truncate">Spin & Win</span>
              <span className="text-[10px] font-bold text-purple-700">Win Up to ₹200</span>
            </div>
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
        <>
          <FlashDropSection
            products={allProducts}
            onProductClick={onProductClick}
            onNavigateDeals={onNavigateDeals || (() => onCategoryClick('all'))}
          />

          {/* TOP SECTION: Pure 180 GSM Bio-Wash Cotton Collection */}
          <div className="mt-4 px-3">
            <CottonShowcaseBox
              products={allProducts}
              onProductClick={onProductClick}
            />
          </div>
        </>
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
          {/* Fresh Drops & New Arrivals (Latest Uploaded Products from AKSelling) */}
          {freshDropsProducts.length > 0 && (
            <section className="mt-4 px-3" id="home-fresh-drops">
              <div className="bg-white rounded-xl shadow-card overflow-hidden border border-slate-200/80">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                      🔥
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                          Fresh Drops & New Arrivals
                        </h2>
                        <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          NEW
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Direct factory prints & fresh stock ({freshDropsProducts.length} items)</p>
                    </div>
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
                  {freshDropsProducts.map(p => (
                    <div key={`new-drop-${p.id}`} className="shrink-0 w-36 sm:w-44">
                      <ProductCard product={p} onClick={() => onProductClick(p)} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

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

          {/* MIDDLE SECTION: Streetwear Luxe • Heavy 240+ GSM Drop Shoulder */}
          <div className="mt-4 px-3">
            <StreetwearShowcaseBox
              products={allProducts}
              onProductClick={onProductClick}
            />
          </div>

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
                  {shelf.products.map(p => (
                    <div key={`shelf-${shelf.category.id}-${p.id}`} className="shrink-0 w-36 sm:w-44">
                      <ProductCard product={p} onClick={() => onProductClick(p)} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}

          {/* BOTTOM SECTION: Factory DTF & Screen Printing Hub */}
          <div className="mt-4 px-3">
            <PrintingShowcaseBox
              products={allProducts}
              onProductClick={onProductClick}
            />
          </div>

          {/* Full Catalog / Best of AKSelling - Remaining Unshown Products */}
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
                          CATALOG PICKS
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Browse verified catalog ({exploreCatalogProducts.length} items)</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 p-3">
                  {exploreCatalogProducts.map(p => (
                    <ProductCard key={`all-grid-${p.id}`} product={p} onClick={() => onProductClick(p)} />
                  ))}
                </div>
              </div>
            </section>
          )}

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
