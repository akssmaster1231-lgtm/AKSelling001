import { Star } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, formatCount } from '@/data';
import { calculateProductDynamicRating } from '@/utils/orderSync';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const dynamicRating = calculateProductDynamicRating(product);

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow overflow-hidden text-left flex flex-col group"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-flipkart-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            {product.discount}% Off
          </span>
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
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
}
