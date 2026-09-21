import { memo } from 'react';
import { Star } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, formatCount, DEFAULT_PRODUCT_PLACEHOLDER } from '@/data';
import { calculateProductDynamicRating } from '@/utils/orderSync';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard = memo(function ProductCard({ product, onClick }: ProductCardProps) {
  const dynamicRating = calculateProductDynamicRating(product);

  // Safe image determination
  const rawImage = product.images && product.images[0] ? product.images[0] : '';
  const isBrokenUrl = typeof rawImage === 'string' && rawImage.includes('8532616');
  const imageUrl = isBrokenUrl || !rawImage ? DEFAULT_PRODUCT_PLACEHOLDER : rawImage;

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden text-left flex flex-col group cursor-pointer w-full select-none"
    >
      <div className="relative aspect-square bg-slate-50 overflow-hidden w-full">
        <img
          src={imageUrl}
          alt={product.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== DEFAULT_PRODUCT_PLACEHOLDER) {
              target.src = DEFAULT_PRODUCT_PLACEHOLDER;
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 subpixel-antialiased"
          style={{ imageRendering: 'auto' }}
        />

        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-[#1b365d] to-slate-900 text-amber-300 text-xs font-black px-2 py-0.5 rounded-md shadow-md z-10 border border-amber-400/40">
            {product.discount}% Off
          </span>
        )}
      </div>

      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{product.brand}</p>
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.title}
        </h3>
        {/* Star Rating above price - starts at 0.00 and increases with sales/orders */}
        <div className="flex items-center gap-1.5">
          <span
            className={`flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
              dynamicRating.rating > 0
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            {dynamicRating.formattedRating}
            <Star
              size={10}
              className={
                dynamicRating.rating > 0 ? 'fill-white text-white' : 'text-amber-500 fill-amber-400'
              }
            />
          </span>
          <span className="text-xs text-slate-400">({formatCount(dynamicRating.ratingCount)})</span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-base font-extrabold text-slate-950">{formatPrice(product.price)}</span>
          <span className="text-xs text-slate-400 line-through">{formatPrice(product.mrp)}</span>
        </div>
      </div>
    </button>
  );
});

export default ProductCard;

// Exported ProductCardSkeleton for hydration/refresh states
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden flex flex-col animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-2.5 flex flex-col gap-2 flex-1">
        <div className="h-3 bg-gray-200 rounded-sm w-1/3" />
        <div className="h-4 bg-gray-200 rounded-sm w-full" />
        <div className="h-4 bg-gray-200 rounded-sm w-2/3" />
        <div className="h-4 bg-gray-200 rounded-sm w-1/4 mt-1" />
        <div className="h-5 bg-gray-200 rounded-sm w-1/2 mt-1" />
      </div>
    </div>
  );
}
