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
      className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow overflow-hidden text-left flex flex-col group cursor-pointer w-full select-none"
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden w-full">
        <img
          src={imageUrl}
          alt={product.title}
          loading="lazy"
          decoding="async"
          width="240"
          height="240"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== DEFAULT_PRODUCT_PLACEHOLDER) {
              target.src = DEFAULT_PRODUCT_PLACEHOLDER;
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />

        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-flipkart-500 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-xs z-10">
            {product.discount}% Off
          </span>
        )}
      </div>

      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide truncate">{product.brand}</p>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.title}
        </h3>
        {/* Star Rating above price - starts at 0.00 and increases with sales/orders */}
        <div className="flex items-center gap-1.5">
          <span
            className={`flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
              dynamicRating.rating > 0
                ? 'bg-success-500 text-white'
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
          <span className="text-xs text-gray-400">({formatCount(dynamicRating.ratingCount)})</span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
          <span className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</span>
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
