import { useState } from 'react';
import {
  ChevronLeft,
  Star,
  ShoppingCart,
  Zap,
  Truck,
  Shield,
  RotateCcw,
  Heart,
  Share2,
  Check,
  Ruler,
  X,
} from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, formatCount, DEFAULT_PRODUCT_PLACEHOLDER } from '@/data';
import { useCart } from '@/cart-context';
import { calculateProductDynamicRating } from '@/utils/orderSync';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onBuyNow: (product: Product, size?: string, color?: string) => void;
  onGoToCart: () => void;
}

export default function ProductDetail({ product, onBack, onBuyNow, onGoToCart }: ProductDetailProps) {
  const dynamicRating = calculateProductDynamicRating(product);
  const [selectedImage, setSelectedImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : ''
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors && product.colors.length > 0 ? product.colors[0] : ''
  );
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [sizeAlert, setSizeAlert] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setSizeAlert(true);
      setTimeout(() => setSizeAlert(false), 2500);
      return;
    }
    addToCart(product, 1, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setSizeAlert(true);
      setTimeout(() => setSizeAlert(false), 2500);
      return;
    }
    onBuyNow(product, selectedSize, selectedColor);
  };

  return (
    <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[60] bg-gray-50 overflow-y-auto animate-fade-in sm:shadow-2xl sm:border-x sm:border-gray-200">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white shadow-sm px-3 py-2.5 flex items-center gap-3">
        <button onClick={onBack} className="p-1 text-gray-700 hover:text-flipkart-500">
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 text-sm font-medium text-gray-700 truncate">Product Details</h1>
        <button
          onClick={() => setWishlisted(!wishlisted)}
          className="p-1 text-gray-700 hover:text-error-500"
        >
          <Heart size={22} className={wishlisted ? 'fill-error-500 text-error-500' : ''} />
        </button>
        <button className="p-1 text-gray-700 hover:text-flipkart-500">
          <Share2 size={20} />
        </button>
      </div>

      {/* Image Gallery */}
      <div className="bg-white">
        <div className="relative aspect-square bg-gray-50">
          <img
            src={(product.images && product.images[selectedImage] && !product.images[selectedImage].includes('8532616')) ? product.images[selectedImage] : DEFAULT_PRODUCT_PLACEHOLDER}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          {product.discount > 0 && (
            <span className="absolute top-3 left-3 bg-flipkart-500 text-white text-sm font-bold px-2.5 py-1 rounded shadow-sm">
              {product.discount}% Off
            </span>
          )}
          {product.neckType && (
            <span className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              {product.neckType}
            </span>
          )}
        </div>
        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === i ? 'border-flipkart-500' : 'border-gray-200'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mt-2 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-flipkart-600 font-bold uppercase tracking-wide">
            {product.brand}
          </p>
          {product.fitType && (
            <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              {product.fitType}
            </span>
          )}
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mt-1 leading-snug">{product.title}</h1>

        {/* Star Rating above price - starts at 0.00 and increases dynamically with sales */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded ${
              dynamicRating.rating > 0
                ? 'bg-success-500 text-white'
                : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            {dynamicRating.formattedRating}
            <Star
              size={12}
              className={
                dynamicRating.rating > 0 ? 'fill-white text-white' : 'text-amber-500 fill-amber-400'
              }
            />
          </span>
          <span className="text-sm text-gray-500">
            {dynamicRating.ratingCount > 0
              ? `${formatCount(dynamicRating.ratingCount)} Ratings & Reviews`
              : '0 Ratings • Fresh Launch 0.00★ (Grows with Orders)'}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-3xl font-extrabold text-gray-900">{formatPrice(product.price)}</span>
          <span className="text-base text-gray-400 line-through">{formatPrice(product.mrp)}</span>
          <span className="text-base font-bold text-success-500">{product.discount}% off</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{product.delivery}</p>
      </div>

      {/* Key Features & Style Highlights (Neck Type, Sleeve, Fit, Fabric) */}
      {(product.neckType || product.sleeveType || product.fitType || product.fabric) && (
        <div className="mt-2 bg-white px-4 py-3.5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
            Key Style Highlights
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {product.neckType && (
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5">
                <span className="text-[10px] font-semibold text-blue-600 uppercase block">Neck / Collar</span>
                <span className="text-xs font-bold text-gray-900">{product.neckType}</span>
              </div>
            )}
            {product.sleeveType && (
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5">
                <span className="text-[10px] font-semibold text-emerald-600 uppercase block">Sleeve</span>
                <span className="text-xs font-bold text-gray-900">{product.sleeveType}</span>
              </div>
            )}
            {product.fitType && (
              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2.5">
                <span className="text-[10px] font-semibold text-amber-600 uppercase block">Fit</span>
                <span className="text-xs font-bold text-gray-900">{product.fitType}</span>
              </div>
            )}
            {product.fabric && (
              <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-2.5">
                <span className="text-[10px] font-semibold text-purple-600 uppercase block">Fabric</span>
                <span className="text-xs font-bold text-gray-900">{product.fabric}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="mt-2 bg-white px-4 py-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900">Select Size:</span>
              <span className="text-sm font-bold text-flipkart-600">{selectedSize || 'Select one'}</span>
            </div>
            <button
              onClick={() => setShowSizeChart(true)}
              className="text-xs font-bold text-flipkart-600 hover:text-flipkart-700 flex items-center gap-1 bg-flipkart-50 px-2 py-1 rounded-lg"
            >
              <Ruler size={13} /> Size Chart
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.sizes.map(size => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[48px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-flipkart-600 text-white border-flipkart-600 shadow-sm scale-105'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-flipkart-400'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {sizeAlert && (
            <p className="text-xs text-rose-600 font-semibold mt-2 animate-bounce">
              ⚠️ Please select a size before proceeding!
            </p>
          )}
        </div>
      )}

      {/* Color Selection */}
      {product.colors && product.colors.length > 0 && (
        <div className="mt-2 bg-white px-4 py-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-sm font-bold text-gray-900">Color:</span>
            <span className="text-sm font-bold text-gray-700">{selectedColor || 'Default'}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.colors.map(color => {
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                    isSelected
                      ? 'bg-flipkart-50 text-flipkart-700 border-flipkart-500 ring-1 ring-flipkart-500 font-bold'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                    style={{ backgroundColor: getColorHex(color) }}
                  />
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Offers */}
      <div className="mt-2 bg-white px-4 py-4">
        <h2 className="text-base font-bold text-gray-800 mb-3">Available Offers</h2>
        <div className="space-y-3">
          <OfferItem
            title="Bank Offer"
            desc="10% off on AKSelling Axis Bank Credit Card up to ₹2,000"
          />
          <OfferItem
            title="Special Price"
            desc={`Get extra ${product.discount}% off (Price inclusive of discount)`}
          />
          <OfferItem
            title="No Cost EMI"
            desc={`Avail No Cost EMI on select cards for orders above ₹3,000`}
          />
          <OfferItem
            title="Partner Offer"
            desc="Sign up for AKSelling Plus and get additional 5% off"
          />
        </div>
      </div>

      {/* Delivery & Warranty */}
      <div className="mt-2 bg-white px-4 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <Truck size={20} className="text-flipkart-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-800">Free Delivery</p>
            <p className="text-xs text-gray-500">{product.delivery}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-flipkart-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-800">1 Year Warranty</p>
            <p className="text-xs text-gray-500">Manufacturer warranty on this product</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <RotateCcw size={20} className="text-flipkart-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-800">7-Day Returns</p>
            <p className="text-xs text-gray-500">Easy returns and replacements</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-2 bg-white px-4 py-4">
        <h2 className="text-base font-bold text-gray-800 mb-2">Product Description</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
      </div>

      {/* Specifications */}
      <div className="mt-2 bg-white px-4 py-4">
        <h2 className="text-base font-bold text-gray-800 mb-3">Specifications</h2>
        <div className="space-y-2">
          <SpecRow label="Brand" value={product.brand} />
          <SpecRow label="Category" value={product.category} />
          {product.neckType && <SpecRow label="Neck / Collar" value={product.neckType} />}
          {product.sleeveType && <SpecRow label="Sleeve Length" value={product.sleeveType} />}
          {product.fitType && <SpecRow label="Fit Type" value={product.fitType} />}
          {product.fabric && <SpecRow label="Fabric / Material" value={product.fabric} />}
          {product.sizes && product.sizes.length > 0 && (
            <SpecRow label="Available Sizes" value={product.sizes.join(', ')} />
          )}
          {product.colors && product.colors.length > 0 && (
            <SpecRow label="Colors" value={product.colors.join(', ')} />
          )}
          <SpecRow label="In Stock" value={product.inStock ? 'Yes' : 'No'} />
          <SpecRow
            label="Rating"
            value={`${dynamicRating.formattedRating} / 5 (${dynamicRating.ratingCount} reviews)`}
          />
          <SpecRow label="Delivery" value={product.delivery} />
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        <button
          onClick={handleAddToCart}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
            added
              ? 'bg-success-500 text-white'
              : 'bg-flipkart-50 text-flipkart-700 hover:bg-flipkart-100'
          }`}
        >
          {added ? (
            <>
              <Check size={18} /> Added
            </>
          ) : (
            <>
              <ShoppingCart size={18} /> Add to Cart
            </>
          )}
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-accent-400 text-white hover:bg-accent-600 transition-colors"
        >
          <Zap size={18} /> Buy Now
        </button>
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Ruler size={20} className="text-flipkart-600" />
                <h3 className="font-bold text-gray-900 text-sm">Size Chart (Inches)</h3>
              </div>
              <button onClick={() => setShowSizeChart(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                    <th className="py-2 px-3 font-bold">Size</th>
                    <th className="py-2 px-3 font-bold">Chest</th>
                    <th className="py-2 px-3 font-bold">Length</th>
                    <th className="py-2 px-3 font-bold">Shoulder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  <tr><td className="py-2 px-3 font-bold">S</td><td className="py-2 px-3">38"</td><td className="py-2 px-3">27"</td><td className="py-2 px-3">16.5"</td></tr>
                  <tr><td className="py-2 px-3 font-bold">M</td><td className="py-2 px-3">40"</td><td className="py-2 px-3">28"</td><td className="py-2 px-3">17.5"</td></tr>
                  <tr><td className="py-2 px-3 font-bold">L</td><td className="py-2 px-3">42"</td><td className="py-2 px-3">29"</td><td className="py-2 px-3">18.5"</td></tr>
                  <tr><td className="py-2 px-3 font-bold">XL</td><td className="py-2 px-3">44"</td><td className="py-2 px-3">30"</td><td className="py-2 px-3">19.5"</td></tr>
                  <tr><td className="py-2 px-3 font-bold">XXL</td><td className="py-2 px-3">46"</td><td className="py-2 px-3">31"</td><td className="py-2 px-3">20.5"</td></tr>
                  <tr><td className="py-2 px-3 font-bold">3XL</td><td className="py-2 px-3">48"</td><td className="py-2 px-3">32"</td><td className="py-2 px-3">21.5"</td></tr>
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowSizeChart(false)}
              className="mt-5 w-full bg-flipkart-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-flipkart-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* View Cart hint */}
      {added && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-flipkart-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg z-[70]">
          <button onClick={onGoToCart} className="flex items-center gap-2">
            <ShoppingCart size={16} /> Go to Cart →
          </button>
        </div>
      )}
    </div>
  );
}

function getColorHex(colorName: string): string {
  const lower = colorName.toLowerCase();
  if (lower.includes('black')) return '#000000';
  if (lower.includes('white')) return '#FFFFFF';
  if (lower.includes('navy')) return '#001f3f';
  if (lower.includes('blue')) return '#2563eb';
  if (lower.includes('red')) return '#dc2626';
  if (lower.includes('maroon')) return '#800000';
  if (lower.includes('olive')) return '#556b2f';
  if (lower.includes('green')) return '#16a34a';
  if (lower.includes('yellow') || lower.includes('mustard')) return '#eab308';
  if (lower.includes('orange')) return '#f97316';
  if (lower.includes('grey') || lower.includes('gray')) return '#6b7280';
  if (lower.includes('pink')) return '#ec4899';
  if (lower.includes('beige') || lower.includes('cream')) return '#f5f5dc';
  if (lower.includes('brown')) return '#78350f';
  if (lower.includes('purple') || lower.includes('lavender')) return '#a855f7';
  return '#94a3b8';
}

function OfferItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-bold text-success-500 bg-success-500/10 px-2 py-0.5 rounded shrink-0">
        {title}
      </span>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 capitalize">{label}</span>
      <span className="text-sm text-gray-700 font-medium capitalize">{value}</span>
    </div>
  );
}
