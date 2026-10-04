import React from 'react';
import { Shirt, Flame, Layers, ArrowRight } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/data';

interface FeaturedShowcaseBoxesProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export const FeaturedShowcaseBoxes: React.FC<FeaturedShowcaseBoxesProps> = ({
  products,
  onProductClick,
}) => {
  // Filter or slice products for each specific showcase
  const pureCottonProducts = React.useMemo(() => {
    const matched = products.filter(
      (p) =>
        p.fabric?.toLowerCase().includes('cotton') ||
        p.title?.toLowerCase().includes('cotton') ||
        p.description?.toLowerCase().includes('180')
    );
    return (matched.length >= 2 ? matched : products).slice(0, 4);
  }, [products]);

  const streetwearProducts = React.useMemo(() => {
    const matched = products.filter(
      (p) =>
        p.title?.toLowerCase().includes('oversized') ||
        p.title?.toLowerCase().includes('heavy') ||
        p.fitType?.toLowerCase().includes('oversized') ||
        p.fabric?.toLowerCase().includes('240')
    );
    return (matched.length >= 2 ? matched : products.slice(1)).slice(0, 4);
  }, [products]);

  const customPrintProducts = React.useMemo(() => {
    const matched = products.filter(
      (p) =>
        p.printDesign ||
        p.title?.toLowerCase().includes('print') ||
        p.title?.toLowerCase().includes('graphic')
    );
    return (matched.length >= 2 ? matched : products.slice(2)).slice(0, 4);
  }, [products]);

  return (
    <div className="space-y-4 mt-4 px-3" id="featured-showcase-boxes">
      {/* ------------------------------------------------------------- */}
      {/* BOX 1: Factory Direct Pure 180 GSM Bio-Wash Cotton */}
      {/* ------------------------------------------------------------- */}
      {pureCottonProducts.length > 0 && (
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#1b365d] text-white rounded-2xl p-4 shadow-xl border border-blue-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between gap-2 relative z-10 mb-3 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                <Shirt size={18} className="fill-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                    Pure 180 GSM Bio-Wash Cotton
                  </h3>
                  <span className="bg-blue-600/80 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-blue-400/30">
                    PRE-SHRUNK
                  </span>
                </div>
                <p className="text-[11px] text-amber-300 font-medium">
                  100% Combed Cotton • Zero shrinkage & long-lasting color fastness
                </p>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-lg shrink-0">
              Direct Factory
            </span>
          </div>

          {/* Product Cards Shelf */}
          <div className="grid grid-cols-2 gap-2.5 relative z-10">
            {pureCottonProducts.map((p) => (
              <div
                key={`box1-${p.id}`}
                onClick={() => onProductClick(p)}
                className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-2 border border-white/10 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 mb-1.5">
                  <img
                    src={p.image || p.imageUrl || (Array.isArray(p.images) ? p.images[0] : '')}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-1 left-1 bg-blue-700/90 text-white text-[9px] font-black px-1.5 py-0.2 rounded shadow-xs">
                    180 GSM
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                  {p.title}
                </h4>

                <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-black text-amber-300">
                      {formatPrice(p.price)}
                    </span>
                    {p.mrp && p.mrp > p.price && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatPrice(p.mrp)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-white/90 bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <span>Buy</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BOX 2: Streetwear Luxe • 240+ GSM Heavy Drop Shoulder */}
      {/* ------------------------------------------------------------- */}
      {streetwearProducts.length > 0 && (
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-4 shadow-xl border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between gap-2 relative z-10 mb-3 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                <Flame size={18} className="fill-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                    Streetwear Luxe • Heavy 240+ GSM
                  </h3>
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-400/30">
                    DROP SHOULDER
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300 font-medium">
                  Heavy luxury drape • Reinforced 1.25" rib collar & trending oversized fit
                </p>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase text-emerald-300 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-lg shrink-0">
              Luxe Fit
            </span>
          </div>

          {/* Product Cards Shelf */}
          <div className="grid grid-cols-2 gap-2.5 relative z-10">
            {streetwearProducts.map((p) => (
              <div
                key={`box2-${p.id}`}
                onClick={() => onProductClick(p)}
                className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-2 border border-white/10 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 mb-1.5">
                  <img
                    src={p.image || p.imageUrl || (Array.isArray(p.images) ? p.images[0] : '')}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-1 left-1 bg-emerald-700/90 text-white text-[9px] font-black px-1.5 py-0.2 rounded shadow-xs">
                    Heavy Drop
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                  {p.title}
                </h4>

                <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-black text-emerald-300">
                      {formatPrice(p.price)}
                    </span>
                    {p.mrp && p.mrp > p.price && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatPrice(p.mrp)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-white/90 bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <span>Buy</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BOX 3: Indore Manufacturing Hub • Custom HD Prints */}
      {/* ------------------------------------------------------------- */}
      {customPrintProducts.length > 0 && (
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white rounded-2xl p-4 shadow-xl border border-purple-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between gap-2 relative z-10 mb-3 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-400 to-pink-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                <Layers size={18} className="fill-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                    Factory DTF & Screen Printing Hub
                  </h3>
                  <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-purple-400/30">
                    50+ WASH FAST
                  </span>
                </div>
                <p className="text-[11px] text-purple-300 font-medium">
                  Direct manufacturing from Indore • Zero cracking, razor-sharp graphics
                </p>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-400/10 border border-purple-400/30 px-2 py-0.5 rounded-lg shrink-0">
              HD Prints
            </span>
          </div>

          {/* Product Cards Shelf */}
          <div className="grid grid-cols-2 gap-2.5 relative z-10">
            {customPrintProducts.map((p) => (
              <div
                key={`box3-${p.id}`}
                onClick={() => onProductClick(p)}
                className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-2 border border-white/10 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 mb-1.5">
                  <img
                    src={p.image || p.imageUrl || (Array.isArray(p.images) ? p.images[0] : '')}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-1 left-1 bg-purple-700/90 text-white text-[9px] font-black px-1.5 py-0.2 rounded shadow-xs">
                    HD Graphics
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                  {p.title}
                </h4>

                <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-black text-purple-300">
                      {formatPrice(p.price)}
                    </span>
                    {p.mrp && p.mrp > p.price && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatPrice(p.mrp)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-white/90 bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <span>Buy</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FeaturedShowcaseBoxes;
