import React, { useState } from 'react';
import {
  Search,
  Plus,
  Upload,
  Boxes,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { SellerProduct } from '@/types/supplier';

interface SupplierInventoryTabProps {
  products: SellerProduct[];
  initialSubFilter?: string;
  onAddProduct: () => void;
  onBulkUpload: () => void;
  onEditProduct: (product: SellerProduct) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onToggleStatus: (productId: string) => void;
  onDeleteProduct: (productId: string) => void;
}

type StockFilter = 'all' | 'live' | 'low_stock' | 'out_of_stock';

export default function SupplierInventoryTab({
  products,
  initialSubFilter,
  onAddProduct,
  onBulkUpload,
  onEditProduct,
  onUpdateStock,
  onToggleStatus,
  onDeleteProduct,
}: SupplierInventoryTabProps) {
  const [activeFilter, setActiveFilter] = useState<StockFilter>(
    (initialSubFilter as StockFilter) || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const liveCount = products.filter(p => p.status === 'live' && p.stock > 5).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock === 0 || p.status === 'out_of_stock').length;

  const filteredProducts = products.filter(p => {
    if (activeFilter === 'live' && (p.status !== 'live' || p.stock <= 0)) return false;
    if (activeFilter === 'low_stock' && (p.stock <= 0 || p.stock > 5)) return false;
    if (activeFilter === 'out_of_stock' && p.stock > 0 && p.status !== 'out_of_stock') return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.catalogId && p.catalogId.toLowerCase().includes(query)) ||
      p.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-3.5 pb-20">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-base font-bold text-gray-900">Inventory & Catalogs</h1>
            <p className="text-xs text-gray-500">Manage catalog stock, pricing & SKU variants</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBulkUpload}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-gray-300/80 flex items-center gap-1 transition-all"
            >
              <Upload size={14} />
              <span className="hidden xs:inline">Bulk Upload</span>
            </button>

            <button
              onClick={onAddProduct}
              className="bg-[#2874f0] hover:bg-[#1a65dc] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1 transition-all"
            >
              <Plus size={14} />
              <span>Add Catalog</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Title, SKU (e.g. AK-TSHIRT), Catalog ID..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2874f0] focus:bg-white transition-all"
          />
        </div>

        {/* Sub-Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          {[
            { id: 'all', label: 'All Catalogs', count: products.length },
            { id: 'live', label: 'Active (Live)', count: liveCount },
            { id: 'low_stock', label: 'Low Stock (≤5)', count: lowStockCount },
            { id: 'out_of_stock', label: 'Out of Stock', count: outOfStockCount },
          ].map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as StockFilter)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? 'bg-[#2874f0] text-white border-[#2874f0] shadow-2xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200/80 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#2874f0]">
            <Boxes size={24} />
          </div>
          <h3 className="text-sm font-bold text-gray-900">No catalogs found</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {searchQuery
              ? `No catalogs matched "${searchQuery}".`
              : 'Add your first catalog to start selling on AKSelling Seller Hub.'}
          </p>
          <button
            onClick={onAddProduct}
            className="mt-2 bg-[#2874f0] hover:bg-[#1a65dc] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
          >
            + Add New Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock === 0 || product.status === 'out_of_stock';
            const isLowStock = product.stock > 0 && product.stock <= 5;
            const catId = product.catalogId || `CAT-${product.id.slice(-5).toUpperCase()}`;
            const skuId = product.sku || `SKU-${product.category.slice(0, 3).toUpperCase()}-${product.id.slice(-4)}`;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3 hover:border-blue-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={product.images[0] || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-xl border border-gray-200 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                        {catId}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${product.stock})` : 'Live / Active'}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1 mt-1">{product.title}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                      <span className="font-mono">SKU: {skuId}</span>
                      <span>•</span>
                      <span className="capitalize">{product.category}</span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-black text-[#2874f0]">₹{product.price}</span>
                      <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {product.discount || Math.round(((product.mrp - product.price) / product.mrp) * 100)}% Off
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock updater and Action bar */}
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Available Units:</span>
                    <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-2xs">
                      <button
                        onClick={() => onUpdateStock(product.id, Math.max(0, product.stock - 1))}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={product.stock}
                        onChange={e => onUpdateStock(product.id, Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-12 text-center text-xs font-bold text-gray-900 focus:outline-none py-1"
                      />
                      <button
                        onClick={() => onUpdateStock(product.id, product.stock + 1)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => onToggleStatus(product.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all border ${
                        product.status === 'live'
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {product.status === 'live' ? 'Deactivate' : 'Go Live'}
                    </button>

                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-1.5 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                      title="Edit Catalog"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-lg border border-rose-100 transition-colors"
                      title="Delete Catalog"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
