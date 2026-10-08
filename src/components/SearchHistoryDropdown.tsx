import { useEffect, useState, useMemo } from 'react';
import {
  History,
  X,
  TrendingUp,
  Search,
  Eye,
  ArrowUpLeft,
  Trash2,
  Package,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  getSearchHistory,
  removeSearchQuery,
  clearSearchHistory,
  getRecentlyViewedProducts,
  clearRecentlyViewedProducts,
  removeRecentlyViewedProduct,
  POPULAR_SEARCH_TAGS,
  type SearchHistoryItem,
  type RecentlyViewedProduct,
} from '@/utils/searchHistory';
import { getCachedProducts, type FirestoreProduct } from '@/firebase';
import { formatPrice, fetchProducts } from '@/data';
import type { Product } from '@/types';

interface SearchHistoryDropdownProps {
  isOpen: boolean;
  query: string;
  onSelectQuery: (selectedQuery: string) => void;
  onSelectProduct?: (productId: string) => void;
  onClose: () => void;
}

// Pre-curated apparel suggestions dictionary for instant Amazon/Flipkart autocomplete
const APPAREL_KEYWORD_POOL = [
  'oversized t-shirt',
  'oversized drop shoulder t-shirt',
  'oversized 240 gsm streetwear',
  'oversized cotton tee',
  'oversized black t-shirt',
  'oversized white t-shirt',
  '180 gsm bio-wash cotton',
  '180 gsm pure combed cotton',
  'drop shoulder streetwear',
  'drop shoulder oversized',
  'short sleeve bio-wash tee',
  'trust the process t-shirt',
  'heavyweight 240 gsm tee',
  'pure combed cotton indore',
  'graphic print oversized',
  'round neck bio-wash tee',
  'pre-shrunk cotton t-shirt',
  'factory direct apparel',
  'men loose fit streetwear',
];

/**
 * Highlights the matching substring in suggestion text
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <span>{text}</span>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + lowerQuery.length);
  const after = text.substring(index + lowerQuery.length);

  return (
    <span className="inline-block truncate">
      {before}
      <span className="font-black text-[#1b365d] bg-amber-100/70 px-0.5 rounded text-amber-950">
        {match}
      </span>
      <span className="font-semibold text-slate-800">{after}</span>
    </span>
  );
}

export default function SearchHistoryDropdown({
  isOpen,
  query,
  onSelectQuery,
  onSelectProduct,
  onClose,
}: SearchHistoryDropdownProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => getSearchHistory());
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>(() =>
    getRecentlyViewedProducts()
  );
  const [cachedCatalog, setCachedCatalog] = useState<(Product | FirestoreProduct)[]>(() =>
    getCachedProducts()
  );

  // Synchronize state when custom events fire or dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    setHistory(getSearchHistory());
    setRecentlyViewed(getRecentlyViewedProducts());
    const existing = getCachedProducts();
    if (existing.length > 0) {
      setCachedCatalog(existing);
    } else {
      fetchProducts()
        .then((prods) => {
          if (prods && prods.length > 0) {
            setCachedCatalog(prods);
          }
        })
        .catch(() => {});
    }

    const handleHistoryUpdate = (e: Event) => {
      const custom = e as CustomEvent<SearchHistoryItem[]>;
      if (custom.detail) {
        setHistory(custom.detail);
      } else {
        setHistory(getSearchHistory());
      }
    };

    const handleRecentUpdate = (e: Event) => {
      const custom = e as CustomEvent<RecentlyViewedProduct[]>;
      if (custom.detail) {
        setRecentlyViewed(custom.detail);
      } else {
        setRecentlyViewed(getRecentlyViewedProducts());
      }
    };

    window.addEventListener('akselling_search_history_updated', handleHistoryUpdate);
    window.addEventListener('akselling_recently_viewed_updated', handleRecentUpdate);

    return () => {
      window.removeEventListener('akselling_search_history_updated', handleHistoryUpdate);
      window.removeEventListener('akselling_recently_viewed_updated', handleRecentUpdate);
    };
  }, [isOpen]);

  // Predictive Auto-suggestions: dynamically extracted from catalog + curated apparel terms
  const predictiveSuggestions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];

    const pool = new Set<string>();

    // 1. Curated apparel phrases matching query
    for (const phrase of APPAREL_KEYWORD_POOL) {
      if (phrase.includes(trimmed)) {
        pool.add(phrase);
      }
    }

    // 2. Extract keywords, titles and features from live catalog products
    for (const p of cachedCatalog) {
      if (!p) continue;
      const titleLower = p.title?.toLowerCase() || '';

      if (titleLower.includes(trimmed)) {
        // Add full title or relevant slice
        pool.add(p.title);
      }

      if (p.fabric && p.fabric.toLowerCase().includes(trimmed)) {
        pool.add(p.fabric);
      }

      if (p.fitType && p.fitType.toLowerCase().includes(trimmed)) {
        pool.add(p.fitType);
      }

      if (Array.isArray(p.tags)) {
        for (const tag of p.tags) {
          if (typeof tag === 'string' && tag.toLowerCase().includes(trimmed)) {
            pool.add(tag);
          }
        }
      }
    }

    // Return top 6 distinct suggestions
    return Array.from(pool).slice(0, 6);
  }, [cachedCatalog, query]);

  // Filtered queries from personal search history
  const filteredHistory = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return history;
    return history.filter((item) => item.query.toLowerCase().includes(trimmed));
  }, [history, query]);

  // Real-time catalog product matches with full details
  const catalogMatches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];

    const matches: (Product | FirestoreProduct)[] = [];
    const seen = new Set<string>();

    for (const p of cachedCatalog) {
      if (!p || seen.has(p.id)) continue;
      const titleMatch = p.title?.toLowerCase().includes(trimmed);
      const catMatch = p.category?.toLowerCase().includes(trimmed);
      const brandMatch = p.brand?.toLowerCase().includes(trimmed);
      const descMatch = p.description?.toLowerCase().includes(trimmed);

      if (titleMatch || catMatch || brandMatch || descMatch) {
        matches.push(p);
        seen.add(p.id);
        if (matches.length >= 5) break;
      }
    }
    return matches;
  }, [cachedCatalog, query]);

  if (!isOpen) return null;

  const isQueryEmpty = !query.trim();

  const handleQueryClick = (q: string) => {
    onSelectQuery(q);
    onClose();
  };

  const handleRemoveHistoryItem = (e: React.MouseEvent, idOrQuery: string) => {
    e.stopPropagation();
    removeSearchQuery(idOrQuery);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearchHistory();
  };

  const handleProductClick = (productId: string) => {
    if (onSelectProduct) {
      onSelectProduct(productId);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('akselling_open_product_id', { detail: productId })
      );
    }
    onClose();
  };

  const handleRemoveRecentProduct = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    removeRecentlyViewedProduct(productId);
  };

  return (
    <>
      {/* Invisible backdrop to dismiss when clicking outside */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown Container */}
      <div
        id="search-history-dropdown"
        className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/95 overflow-hidden max-h-[85vh] overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-slate-900/5"
      >
        {/* ========================================================================= */}
        {/* CASE 1: Query is EMPTY - Show Recent Searches & Recently Viewed Items   */}
        {/* ========================================================================= */}
        {isQueryEmpty && (
          <>
            {/* Section 1: Recent Searches */}
            {history.length > 0 ? (
              <div className="p-3 bg-white">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <History size={14} className="text-[#1b365d]" />
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Clear All
                  </button>
                </div>

                {/* Quick History Chip Pills for 1-tap re-searching */}
                <div className="flex flex-wrap gap-1.5 mb-2 px-0.5">
                  {history.slice(0, 6).map((item) => (
                    <span
                      key={`chip_${item.id}`}
                      onClick={() => handleQueryClick(item.query)}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-900 border border-slate-200/80 hover:border-amber-300 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95"
                    >
                      <History size={11} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[130px]">{item.query}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveHistoryItem(e, item.query)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 -mr-1 rounded-full cursor-pointer"
                        title="Remove"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Vertical Search History List */}
                <div className="space-y-0.5">
                  {history.slice(0, 5).map((item) => (
                    <div
                      key={`row_${item.id}`}
                      onClick={() => handleQueryClick(item.query)}
                      className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-800 flex items-center justify-center shrink-0 transition-colors">
                          <History size={13} />
                        </div>
                        <span className="text-sm font-medium text-slate-800 group-hover:text-[#1b365d] truncate">
                          {item.query}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => handleRemoveHistoryItem(e, item.query)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove from history"
                        >
                          <X size={14} />
                        </button>
                        <ArrowUpLeft
                          size={14}
                          className="text-slate-300 group-hover:text-[#1b365d] transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Section 2: Recently Viewed Items */}
            {recentlyViewed.length > 0 && (
              <div className="p-3 bg-slate-50/70">
                <div className="flex items-center justify-between px-1 mb-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Eye size={14} className="text-amber-600" />
                    Recently Viewed Items
                  </span>
                  <button
                    type="button"
                    onClick={() => clearRecentlyViewedProducts()}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                {/* Horizontal Scroll of recently viewed products */}
                <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none snap-x">
                  {recentlyViewed.map((item) => (
                    <div
                      key={`recent_prod_${item.id}`}
                      onClick={() => handleProductClick(item.id)}
                      className="shrink-0 w-28 bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-2xs hover:shadow-sm hover:border-amber-300 transition-all cursor-pointer group snap-start relative flex flex-col"
                    >
                      {/* Thumbnail */}
                      <div className="w-full aspect-square rounded-lg bg-slate-100 overflow-hidden relative mb-1.5">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package size={20} />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecentProduct(e, item.id)}
                          className="absolute top-1 right-1 w-4 h-4 bg-black/50 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <X size={10} />
                        </button>
                      </div>

                      {/* Info */}
                      <p className="text-[11px] font-semibold text-slate-800 truncate group-hover:text-[#1b365d]">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs font-black text-[#1b365d]">
                          {formatPrice(item.price)}
                        </span>
                        {item.mrp && item.mrp > item.price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{item.mrp}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Trending / Popular Searches */}
            <div className="p-3 bg-white">
              <div className="flex items-center gap-1.5 px-1 mb-2">
                <TrendingUp size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Trending on AKSelling
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 px-0.5">
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <button
                    key={`pop_${tag}`}
                    type="button"
                    onClick={() => handleQueryClick(tag)}
                    className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-300 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95"
                  >
                    <Search size={11} className="text-slate-400" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* CASE 2: User is TYPING (2+ chars) - PREDICTIVE AUTO-SUGGESTIONS          */}
        {/* ========================================================================= */}
        {!isQueryEmpty && (
          <div className="p-2 space-y-2">
            {/* 1. Direct Search Query row with clean enter prompt */}
            <div
              onClick={() => handleQueryClick(query)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-300/80 hover:bg-amber-500/20 text-[#1b365d] cursor-pointer transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <Search size={14} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-amber-900 font-medium">Search complete catalog for:</div>
                <div className="text-sm font-bold text-slate-900 truncate">
                  &ldquo;{query.trim()}&rdquo;
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                <span>Search</span>
                <ArrowRight size={12} />
              </div>
            </div>

            {/* 2. Amazon/Flipkart Style Live Autocomplete Suggestions */}
            {predictiveSuggestions.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-2 pt-1 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-500" />
                    Auto Suggestions
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Tap to search</span>
                </div>

                {predictiveSuggestions.map((suggestion, idx) => (
                  <div
                    key={`sug_${idx}_${suggestion}`}
                    onClick={() => handleQueryClick(suggestion)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-amber-50/50 cursor-pointer group transition-colors border border-transparent hover:border-amber-200/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Search size={14} className="text-slate-400 group-hover:text-amber-600 shrink-0" />
                      <div className="text-sm text-slate-700 group-hover:text-slate-900 truncate">
                        <HighlightMatch text={suggestion} query={query} />
                      </div>
                    </div>
                    <ArrowUpLeft
                      size={15}
                      className="text-slate-300 group-hover:text-amber-600 shrink-0 ml-2 transition-transform group-hover:translate-x-[-2px] group-hover:translate-y-[2px]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 3. Matching History Queries */}
            {filteredHistory.length > 0 && (
              <div className="pt-1 border-t border-slate-100">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <History size={11} />
                  From Your Search History
                </div>
                {filteredHistory.slice(0, 2).map((item) => (
                  <div
                    key={`match_hist_${item.id}`}
                    onClick={() => handleQueryClick(item.query)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <History size={13} className="text-slate-400 group-hover:text-[#1b365d]" />
                      <span className="text-xs font-medium text-slate-700 group-hover:text-[#1b365d] truncate">
                        {item.query}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveHistoryItem(e, item.query)}
                      className="text-slate-300 hover:text-rose-600 p-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Instant Matching Products with Thumbnail, Price, and 1-Tap Direct Jump */}
            {catalogMatches.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Package size={12} className="text-[#1b365d]" />
                    Matching Products (1-Tap Open)
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Direct Jump
                  </span>
                </div>

                <div className="space-y-1">
                  {catalogMatches.map((prod) => {
                    const img =
                      Array.isArray(prod.images) && prod.images[0]
                        ? prod.images[0]
                        : (prod as { image?: string }).image || '';
                    return (
                      <div
                        key={`match_prod_${prod.id}`}
                        onClick={() => handleProductClick(prod.id)}
                        className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/60 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 cursor-pointer group transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                          {img ? (
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={18} className="text-slate-400 m-auto mt-2.5" />
                          )}
                        </div>

                        {/* Title & Price */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#1b365d]">
                            <HighlightMatch text={prod.title} query={query} />
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-black text-[#1b365d]">
                              {formatPrice(prod.price)}
                            </span>
                            {prod.mrp && prod.mrp > prod.price && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{prod.mrp}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                              Free Delivery
                            </span>
                          </div>
                        </div>

                        {/* Open Arrow */}
                        <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 group-hover:bg-amber-400 group-hover:border-amber-500 group-hover:text-slate-950 transition-colors shadow-2xs">
                          <ArrowRight size={13} className="text-slate-500 group-hover:text-slate-950" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
