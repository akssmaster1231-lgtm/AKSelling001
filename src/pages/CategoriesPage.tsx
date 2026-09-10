import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { categories, products as fallbackProducts, fetchProductsByCategory } from '@/data';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';

interface CategoriesPageProps {
  onProductClick: (product: Product) => void;
  initialCategory?: string;
}

export default function CategoriesPage({ onProductClick, initialCategory }: CategoriesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || categories[0].id);
  const [search, setSearch] = useState('');
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

    const handleUpdate = () => {
      loadCategoryProducts();
    };

    window.addEventListener('akselling_products_updated', handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('akselling_products_updated', handleUpdate);
    };
  }, [selectedCategory]);

  const allProducts = dbProducts.length > 0 ? dbProducts : fallbackProducts.filter(p => p.category === selectedCategory);

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

  const currentCategory = categories.find(c => c.id === selectedCategory);

  return (
    <div className="pb-4">
      <div className="px-3 pt-3">
        <div className="flex items-center bg-white rounded-lg shadow-sm px-3 py-2.5">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search in ${currentCategory?.name || 'categories'}`}
            className="flex-1 px-2 text-sm outline-none text-gray-700"
          />
        </div>
      </div>

      <div className="mt-3 px-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-flipkart-500 text-white shadow-md'
                  : 'bg-white text-gray-600 shadow-sm'
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
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-flipkart-500" />
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
            {categories.map(cat => (
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

function CategoryIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    Shirt: <span className="text-lg">👕</span>,
    Smartphone: <span className="text-lg">📱</span>,
    Headphones: <span className="text-lg">🎧</span>,
    Sofa: <span className="text-lg">🛋️</span>,
    Sparkles: <span className="text-lg">✨</span>,
    Footprints: <span className="text-lg">👟</span>,
    Watch: <span className="text-lg">⌚</span>,
    Refrigerator: <span className="text-lg">🔌</span>,
  };
  return <>{icons[name] || <span className="text-lg">📦</span>}</>;
}
