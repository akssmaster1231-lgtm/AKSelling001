import React, { useState } from 'react';
import { Sparkles, Plus, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/data';
import { useCart } from '@/cart-context';

interface CompleteTheLookProps {
  currentProduct: Product;
  onBuyCombo: (comboProducts: Product[]) => void;
}

interface ComboPairItem {
  id: string;
  title: string;
  category: string;
  price: number;
  mrp: number;
  image: string;
  size?: string;
}

export default function CompleteTheLook({ currentProduct, onBuyCombo }: CompleteTheLookProps) {
  const { addToCart } = useCart();
  const [selectedPairIds, setSelectedPairIds] = useState<string[]>(['pair_bottom']);
  const [addedToast, setAddedToast] = useState(false);

  // Determine complementary outfit items based on current item category / title
  const isEthnic = currentProduct.category?.includes('ethnic') || currentProduct.title?.toLowerCase().includes('kurta') || currentProduct.title?.toLowerCase().includes('saree');
  const isFootwear = currentProduct.category?.includes('footwear') || currentProduct.title?.toLowerCase().includes('sneaker') || currentProduct.title?.toLowerCase().includes('shoes');

  const complementaryItems: ComboPairItem[] = isEthnic
    ? [
        {
          id: 'pair_bottom',
          title: 'Cotton Flared Palazzo with Golden Zari Border',
          category: 'Bottomwear',
          price: 499,
          mrp: 1299,
          image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=600',
          size: 'Free Size',
        },
        {
          id: 'pair_acc',
          title: 'Handcrafted Oxidized Silver Jhumka Earrings',
          category: 'Jewellery',
          price: 199,
          mrp: 599,
          image: 'https://images.pexels.com/photos/1458867/pexels-photo-1458867.jpeg?auto=compress&cs=tinysrgb&w=600',
        },
      ]
    : isFootwear
    ? [
        {
          id: 'pair_bottom',
          title: 'Men Relaxed Fit Tactical Cargo Joggers',
          category: 'Bottomwear',
          price: 699,
          mrp: 1999,
          image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600',
          size: '32',
        },
        {
          id: 'pair_acc',
          title: 'Cushioned Athletic Ankle Socks (Pack of 3)',
          category: 'Accessories',
          price: 249,
          mrp: 699,
          image: 'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&w=600',
        },
      ]
    : [
        {
          id: 'pair_bottom',
          title: 'Streetwear 6-Pocket Olive Cargo Trousers',
          category: 'Bottomwear',
          price: 749,
          mrp: 2199,
          image: 'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&w=600',
          size: '32',
        },
        {
          id: 'pair_acc',
          title: 'Classic Low-Top Vulcanized Canvas Sneakers',
          category: 'Footwear',
          price: 799,
          mrp: 2499,
          image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600',
          size: 'UK 8',
        },
      ];

  const toggleItem = (id: string) => {
    setSelectedPairIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Calculate Combo Pricing
  const activeItems = complementaryItems.filter((i) => selectedPairIds.includes(i.id));
  const basePrice = currentProduct.price;
  const baseMrp = currentProduct.mrp;

  const pairPriceSum = activeItems.reduce((acc, i) => acc + i.price, 0);
  const pairMrpSum = activeItems.reduce((acc, i) => acc + i.mrp, 0);

  const individualTotal = basePrice + pairPriceSum;
  const mrpTotal = baseMrp + pairMrpSum;

  // 10% Extra Combo Discount on bundled total
  const comboDiscountAmount = activeItems.length > 0 ? Math.round(individualTotal * 0.1) : 0;
  const finalComboPrice = individualTotal - comboDiscountAmount;
  const totalSavings = mrpTotal - finalComboPrice;

  const handleAddComboToCart = () => {
    // Add current product
    addToCart(currentProduct, 1, currentProduct.sizes?.[0]);

    // Add selected pair products
    activeItems.forEach((pair) => {
      addToCart(
        {
          id: `combo_${pair.id}_${Date.now()}`,
          title: pair.title,
          brand: 'AKSelling Studio',
          price: pair.price - Math.round(pair.price * 0.1),
          mrp: pair.mrp,
          discount: Math.round(((pair.mrp - pair.price) / pair.mrp) * 100),
          rating: 4.8,
          ratingCount: 86,
          image: pair.image,
          images: [pair.image],
          category: pair.category,
          delivery: 'Free delivery by tomorrow',
          description: `Part of ${currentProduct.title} complete look set.`,
          inStock: true,
          sizes: pair.size ? [pair.size] : undefined,
        },
        1,
        pair.size
      );
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNowCombo = () => {
    const allInCombo: Product[] = [
      currentProduct,
      ...activeItems.map(
        (pair): Product => ({
          id: `combo_${pair.id}`,
          title: pair.title,
          brand: 'AKSelling Studio',
          price: pair.price - Math.round(pair.price * 0.1),
          mrp: pair.mrp,
          discount: Math.round(((pair.mrp - pair.price) / pair.mrp) * 100),
          rating: 4.8,
          ratingCount: 92,
          image: pair.image,
          images: [pair.image],
          category: pair.category,
          delivery: 'Free delivery by tomorrow',
          description: `Complete Look Combo item.`,
          inStock: true,
          sizes: pair.size ? [pair.size] : undefined,
        })
      ),
    ];
    onBuyCombo(allInCombo);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/5 via-slate-50 to-amber-500/5 rounded-2xl p-3.5 border border-indigo-200/80 shadow-xs space-y-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Sparkles size={15} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>Complete The Look</span>
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded">
                AI MATCH
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">Stylist-recommended outfit bundle</p>
          </div>
        </div>

        {comboDiscountAmount > 0 && (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
            Save Extra ₹{comboDiscountAmount}
          </span>
        )}
      </div>

      {/* Outfit Visual Grid */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {/* Current Item */}
        <div className="relative w-24 shrink-0 bg-white rounded-xl p-1.5 border-2 border-indigo-500 shadow-xs">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 mb-1">
            <img
              src={currentProduct.image}
              alt={currentProduct.title}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[8px] font-black px-1 rounded">
              This Item
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-900 truncate">{currentProduct.title}</p>
          <span className="text-[11px] font-black text-slate-950">
            {formatPrice(currentProduct.price)}
          </span>
        </div>

        {/* Plus Divider */}
        <div className="text-slate-400 font-bold">
          <Plus size={16} />
        </div>

        {/* Suggested Pair Items */}
        {complementaryItems.map((item, idx) => {
          const isSelected = selectedPairIds.includes(item.id);
          return (
            <React.Fragment key={item.id}>
              <div
                onClick={() => toggleItem(item.id)}
                className={`relative w-24 shrink-0 bg-white rounded-xl p-1.5 border-2 transition-all cursor-pointer select-none shadow-xs ${
                  isSelected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 opacity-60'
                }`}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 mb-1">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <div
                    className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-white/80 border border-slate-300'
                    }`}
                  >
                    {isSelected && <Check size={10} strokeWidth={3} />}
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-900 truncate">{item.title}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[11px] font-black text-slate-950">
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-[9px] text-slate-400 line-through">
                    {formatPrice(item.mrp)}
                  </span>
                </div>
              </div>

              {idx < complementaryItems.length - 1 && (
                <div className="text-slate-400 font-bold">
                  <Plus size={16} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Pricing Summary & 1-Click Buy / Add */}
      <div className="bg-white rounded-xl p-2.5 border border-slate-200 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-slate-950">
              {formatPrice(finalComboPrice)}
            </span>
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(mrpTotal)}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              Save {formatPrice(totalSavings)}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            For {1 + activeItems.length} items set (Includes 10% bundle saving)
          </p>
        </div>

        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleAddComboToCart}
            className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 p-2 rounded-xl text-xs font-bold transition-colors"
            title="Add Set to Cart"
          >
            <ShoppingBag size={16} />
          </button>

          <button
            type="button"
            onClick={handleBuyNowCombo}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 active:scale-95 text-white font-black text-xs px-3 py-2 rounded-xl shadow-md flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>Buy Set</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {addedToast && (
        <p className="text-xs font-bold text-emerald-600 text-center animate-fade-in">
          ✓ Complete look added to your cart!
        </p>
      )}
    </div>
  );
}
