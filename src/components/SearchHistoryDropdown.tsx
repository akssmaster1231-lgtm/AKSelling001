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
import { formatPrice } from '@/data';
import type { Product } from '@/types';

interface SearchHistoryDropdownProps {
  isOpen: boolean;
  query: string;
  onSelectQuery: (selectedQuery: string) => void;
  onSelectProduct?: (productId: string) => void;
  onClose: () => void;
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
    setCachedCatalog(getCachedProducts());

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

  // Filtered queries when user is typing
  const filteredHistory = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return history;
    return history.filter((item) => item.query.toLowerCase().includes(trimmed));
  }, [history, query]);

  // Real-time catalog product matches when user types
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

      if (titleMatch || catMatch || brandMatch) {
        matches.push(p);
        seen.add(p.id);
        if (matches.length >= 4) break;
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
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown Container */}
      <div
        id="search-history-dropdown"
        className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-[80vh] overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150"
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
                    className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95"
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
        {/* CASE 2: User is TYPING a query - Show Matches & Direct Search Prompt     */}
        {/* ========================================================================= */}
        {!isQueryEmpty && (
          <div className="p-2 space-y-1">
            {/* Direct query submit row */}
            <div
              onClick={() => handleQueryClick(query)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 hover:bg-amber-100/70 text-[#1b365d] cursor-pointer transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                <Search size={14} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-amber-900 font-medium">Search for</div>
                <div className="text-sm font-bold text-slate-900 truncate">
                  "{query.trim()}"
                </div>
              </div>
              <ArrowUpLeft size={16} className="text-amber-700" />
            </div>

            {/* Matching Previous Searches */}
            {filteredHistory.length > 0 && (
              <div className="pt-2">
                <div className="px-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <History size={11} />
                  From your search history
                </div>
                {filteredHistory.slice(0, 3).map((item) => (
                  <div
                    key={`match_hist_${item.id}`}
                    onClick={() => handleQueryClick(item.query)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <History size={14} className="text-slate-400 group-hover:text-[#1b365d]" />
                      <span className="text-sm font-medium text-slate-800 group-hover:text-[#1b365d] truncate">
                        {item.query}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveHistoryItem(e, item.query)}
                      className="text-slate-300 hover:text-rose-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Instant Catalog Matching Products */}
            {catalogMatches.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" />
                  Matching Products
                </div>
                {catalogMatches.map((prod) => {
                  const img =
                    Array.isArray(prod.images) && prod.images[0]
                      ? prod.images[0]
                      : (prod as { image?: string }).image || '';
                  return (
                    <div
                      key={`match_prod_${prod.id}`}
                      onClick={() => handleProductClick(prod.id)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="text-slate-400 m-auto mt-2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#1b365d]">
                          {prod.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-bold text-[#1b365d]">
                            {formatPrice(prod.price)}
                          </span>
                          {prod.category && (
                            <span className="text-slate-400 capitalize">
                              in {prod.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowUpLeft size={14} className="text-slate-300 group-hover:text-amber-600" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
