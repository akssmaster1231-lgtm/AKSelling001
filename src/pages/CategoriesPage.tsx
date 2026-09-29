import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { getAllCategories, products as fallbackProducts, fetchProductsByCategory, deduplicateProducts, categories as defaultCategories } from '@/data';
import { subscribeCategories, subscribeProducts } from '@/firebase';
import type { Product, Category } from '@/types';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import CategoryIcon from '@/components/CategoryIcon';

interface CategoriesPageProps {
  onProductClick: (product: Product) => void;
  initialCategory?: string;
}

export default function CategoriesPage({ onProductClick, initialCategory }: CategoriesPageProps) {
  const [allCategories, setAllCategories] = useState<Category[]>(() => {
    const list = getAllCategories();
    return list.length > 0 ? list : defaultCategories;
  });
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || allCategories[0]?.id || 'apparel-manufacturing'
  );
  const [search, setSearch] = useState('');
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeCategories(() => {
      const list = getAllCategories();
      setAllCategories(list.length > 0 ? list : defaultCategories);
    });
    const handleUpdate = () => {
      const list = getAllCategories();
      setAllCategories(list.length > 0 ? list : defaultCategories);
    };
    window.addEventListener('akselling_categories_updated', handleUpdate);
    return () => {
      unsub();
      window.removeEventListener('akselling_categories_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCategoryProducts = async () => {
      setLoading(true);
      const data = await fetchProductsByCategory(selectedCategory);
      if (!cancelled) {
        setDbProducts(data);
        setLoading(false);
      }
    };

    loadCategoryProducts();

    // 100% Real-time Firestore subscription for selected category
    const unsub = subscribeProducts((remoteProds) => {
      if (!cancelled) {
        setDbProducts(remoteProds);
        setLoading(false);
      }
    }, selectedCategory);

    const handleUpdate = (e: Event) => {
      if (cancelled) return;
      const custom = e as CustomEvent<{ products?: Product[] }>;
      if (custom.detail?.products && custom.detail.products.length > 0) {
        const catProds = custom.detail.products.filter(p => {
          const pCat = (p.category || '').toLowerCase();
          const sCat = selectedCategory.toLowerCase();
          return sCat === 'all' || pCat === sCat || (sCat === 'fashion' && (pCat === 'apparel-manufacturing' || pCat === 'fashion')) || (sCat === 'apparel-manufacturing' && (pCat === 'fashion' || pCat === 'apparel-manufacturing'));
        });
        setDbProducts(catProds);
      } else {
        loadCategoryProducts();
      }
    };

    window.addEventListener('akselling_products_updated', handleUpdate);
    return () => {
      cancelled = true;
      unsub();
      window.removeEventListener('akselling_products_updated', handleUpdate);
    };
  }, [selectedCategory]);

  const allProducts = useMemo(() => {
    const raw = dbProducts.length > 0 ? dbProducts : fallbackProducts.filter(p => p.category === selectedCategory);
    return deduplicateProducts(raw);
  }, [dbProducts, selectedCategory]);

  const filteredProducts = useMemo(() => {
    let result = allProducts;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        p => p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allProducts, search]);

  const currentCategory = allCategories.find(c => c.id === selectedCategory) || allCategories[0];

  return (
    <div className="pb-4 w-full overflow-x-hidden">
      <div className="px-3 pt-3">
        <div className="flex items-center bg-white rounded-2xl shadow-md border-2 border-amber-400/60 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-300/40 px-3.5 py-2.5 h-12 transition-all">
          <Search size={20} className="text-[#1b365d] stroke-[2.5] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search in ${currentCategory?.name || 'categories'}...`}
            className="flex-1 px-2.5 text-sm sm:text-[15px] font-medium outline-none text-slate-900 placeholder-slate-400 bg-transparent"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1 text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 px-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar horizontal-shelf-row pb-1">
          {allCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-[#1b365d] to-slate-900 text-amber-300 shadow-md border border-amber-400/40'
                  : 'bg-white text-slate-700 shadow-xs border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 px-3">
        <div className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: currentCategory?.color }}
          >
            <CategoryIcon name={currentCategory?.icon || ''} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">{currentCategory?.name}</h2>
            <p className="text-xs text-gray-500">{filteredProducts.length} products available</p>
          </div>
        </div>
      </div>

      <div className="mt-3 px-3">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card p-8 text-center">
            <p className="text-gray-500 text-sm">No products found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 px-3">
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">All Categories</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3">
            {allCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: cat.color + '15' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
