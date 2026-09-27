import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  Search,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { Product } from '@/types';
import { saveProductToFirestore } from '@/firebase';

interface AdminPriceListManagerProps {
  products: Product[];
  categories: { id: string; name: string }[];
  onProductUpdated?: () => void;
  onOpenDirectUpi?: () => void;
}

interface PriceDraft {
  price: number;
  mrp: number;
  discount: number;
  isModified: boolean;
}

export const AdminPriceListManager: React.FC<AdminPriceListManagerProps> = ({
  products,
  categories,
  onProductUpdated,
  onOpenDirectUpi,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceDrafts, setPriceDrafts] = useState<Record<string, PriceDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Bulk tool state
  const [showBulkTool, setShowBulkTool] = useState(false);
  const [bulkMode, setBulkMode] = useState<'increase_flat' | 'increase_percent' | 'decrease_flat' | 'set_margin'>('increase_percent');
  const [bulkValue, setBulkValue] = useState<number>(10);
  const [bulkTargetCat, setBulkTargetCat] = useState<string>('all');

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat =
        selectedCategory === 'all' ||
        (prod.category && prod.category.toLowerCase() === selectedCategory.toLowerCase());
      const matchSearch =
        !search.trim() ||
        prod.title.toLowerCase().includes(search.toLowerCase()) ||
        (prod.brand && prod.brand.toLowerCase().includes(search.toLowerCase())) ||
        prod.id.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, search, selectedCategory]);

  // Helper to get or initialize draft values for a product
  const getDraft = (prod: Product): PriceDraft => {
    if (priceDrafts[prod.id]) {
      return priceDrafts[prod.id];
    }
    const price = Number(prod.price) || 0;
    const mrp = Number(prod.mrp) || price;
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    return { price, mrp, discount, isModified: false };
  };

  const handlePriceChange = (prodId: string, currentDraft: PriceDraft, newPriceVal: number) => {
    const validPrice = Math.max(1, newPriceVal || 0);
    const mrp = Math.max(validPrice, currentDraft.mrp);
    const discount = mrp > validPrice ? Math.round(((mrp - validPrice) / mrp) * 100) : 0;
    setPriceDrafts((prev) => ({
      ...prev,
      [prodId]: {
        price: validPrice,
        mrp,
        discount,
        isModified: true,
      },
    }));
  };

  const handleMrpChange = (prodId: string, currentDraft: PriceDraft, newMrpVal: number) => {
    const validMrp = Math.max(1, newMrpVal || 0);
    const price = currentDraft.price;
    const discount = validMrp > price ? Math.round(((validMrp - price) / validMrp) * 100) : 0;
    setPriceDrafts((prev) => ({
      ...prev,
      [prodId]: {
        price,
        mrp: validMrp,
        discount,
        isModified: true,
      },
    }));
  };

  // Save single product price
  const handleApplySinglePrice = async (prod: Product) => {
    const draft = getDraft(prod);
    setSavingId(prod.id);
    setStatusMessage(null);

    try {
      const updatedProduct: Product = {
        ...prod,
        price: draft.price,
        mrp: draft.mrp,
        discount: draft.discount,
      };

      await saveProductToFirestore(updatedProduct);

      setPriceDrafts((prev) => ({
        ...prev,
        [prod.id]: {
          ...draft,
          isModified: false,
        },
      }));

      setSavedSuccessId(prod.id);
      setStatusMessage({
        text: `₹${draft.price} रुपया सफलतापूर्वक लागू हो गया: ${prod.title.slice(0, 30)}...`,
        type: 'success',
      });

      if (onProductUpdated) onProductUpdated();
      setTimeout(() => setSavedSuccessId(null), 3000);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.warn('Failed to update price:', err);
      setStatusMessage({
        text: 'रुपया अपडेट करने में समस्या आई। कृपया पुनः प्रयास करें।',
        type: 'error',
      });
    } finally {
      setSavingId(null);
    }
  };

  // Count modified items
  const modifiedCount = useMemo(() => {
    return Object.values(priceDrafts).filter((d) => d.isModified).length;
  }, [priceDrafts]);

  // Bulk Apply changes to all modified
  const handleSaveAllModified = async () => {
    if (modifiedCount === 0) return;
    setIsBulkSaving(true);
    setStatusMessage(null);

    let updatedCount = 0;
    try {
      for (const prod of products) {
        const draft = priceDrafts[prod.id];
        if (draft && draft.isModified) {
          const updated: Product = {
            ...prod,
            price: draft.price,
            mrp: draft.mrp,
            discount: draft.discount,
          };
          await saveProductToFirestore(updated);
          updatedCount++;
        }
      }

      // Mark all as unmodified
      setPriceDrafts((prev) => {
        const next: Record<string, PriceDraft> = {};
        for (const [id, d] of Object.entries(prev)) {
          next[id] = { ...d, isModified: false };
        }
        return next;
      });

      setStatusMessage({
        text: `कुल ${updatedCount} प्रोडक्ट्स का रुपया सफलतापूर्वक अपडेट और लाइव कर दिया गया!`,
        type: 'success',
      });

      if (onProductUpdated) onProductUpdated();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.warn('Bulk save error:', err);
      setStatusMessage({
        text: 'कुछ प्रोडक्ट्स को सेव करने में समस्या हुई।',
        type: 'error',
      });
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Apply bulk calculation to drafts
  const handleCalculateBulkAdjustment = () => {
    const newDrafts: Record<string, PriceDraft> = { ...priceDrafts };
    let affected = 0;

    for (const prod of products) {
      const matchCat =
        bulkTargetCat === 'all' ||
        (prod.category && prod.category.toLowerCase() === bulkTargetCat.toLowerCase());

      if (!matchCat) continue;

      const currentDraft = getDraft(prod);
      let newPrice = currentDraft.price;
      let newMrp = currentDraft.mrp;

      if (bulkMode === 'increase_percent') {
        const factor = 1 + bulkValue / 100;
        newPrice = Math.round(currentDraft.price * factor);
        newMrp = Math.round(currentDraft.mrp * factor);
      } else if (bulkMode === 'increase_flat') {
        newPrice = Math.max(1, currentDraft.price + bulkValue);
        newMrp = Math.max(newPrice, currentDraft.mrp + bulkValue);
      } else if (bulkMode === 'decrease_flat') {
        newPrice = Math.max(1, currentDraft.price - bulkValue);
        newMrp = Math.max(newPrice, currentDraft.mrp);
      } else if (bulkMode === 'set_margin') {
        // e.g. 20% discount on MRP
        const discountPct = Math.min(90, Math.max(5, bulkValue));
        newPrice = Math.round(newMrp * (1 - discountPct / 100));
      }

      const discount = newMrp > newPrice ? Math.round(((newMrp - newPrice) / newMrp) * 100) : 0;

      newDrafts[prod.id] = {
        price: newPrice,
        mrp: newMrp,
        discount,
        isModified: true,
      };
      affected++;
    }

    setPriceDrafts(newDrafts);
    setStatusMessage({
      text: `${affected} प्रोडक्ट्स के लिए नया रुपया कैलकुलेट हो गया। नीचे समीक्षा करें और 'सभी रुपया सेव करें' पर क्लिक करें।`,
      type: 'success',
    });
    setShowBulkTool(false);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Top Notification */}
      {statusMessage && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Main Header Card with Hindi explanation */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-stone-900 text-[10px] font-black uppercase tracking-wider">
              मूल्य व रुपया नियंत्रक
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
              0% Gateway Cut
            </span>
          </div>

          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <IndianRupee size={22} className="text-yellow-300" />
            <span>रुपया लगाने की सूची (Price & Rate Card)</span>
          </h2>

          <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
            यहाँ आप अपने सभी प्रोडक्ट्स का खुद का सेलिंग रुपया (Selling Price ₹) और MRP (₹) आसानी से लगा और बदल सकते हैं। 
            बदलाव करते ही नया रुपया तुरंत ग्राहकों के ऐप पर लाइव दिखने लगेगा।
          </p>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15">
            <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-xs">
              <span className="text-[10px] text-blue-200 block">कुल प्रोडक्ट्स</span>
              <span className="text-base font-black text-white">{products.length}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-xs">
              <span className="text-[10px] text-blue-200 block">बदले गए रुपया</span>
              <span className="text-base font-black text-yellow-300">{modifiedCount}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-xs">
              <span className="text-[10px] text-blue-200 block">कस्टमर डिस्काउंट</span>
              <span className="text-base font-black text-emerald-300">लाइव ऑटो-डिस्काउंट</span>
            </div>
          </div>
        </div>

        {/* Decorative backdrop */}
        <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
      </div>

      {/* Action Toolbar */}
      <div className="bg-white rounded-2xl p-3.5 shadow-card border border-gray-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Quick Bulk Tool Toggle */}
          <button
            type="button"
            onClick={() => setShowBulkTool((prev) => !prev)}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
          >
            <Sliders size={14} />
            <span>एक साथ रुपया बदलें (Bulk Price Tool)</span>
            {showBulkTool ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Save All Modified Button */}
          {modifiedCount > 0 && (
            <button
              type="button"
              onClick={handleSaveAllModified}
              disabled={isBulkSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer animate-pulse disabled:opacity-50"
            >
              {isBulkSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>सभी {modifiedCount} बदले हुए रुपया सेव करें</span>
            </button>
          )}

          {/* Shortcut to Direct UPI settings */}
          {onOpenDirectUpi && (
            <button
              type="button"
              onClick={onOpenDirectUpi}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200 ml-auto"
            >
              <span>💳 अपना UPI व QR सेट करें</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Bulk Tool Dropdown Panel */}
        {showBulkTool && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-scale-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-600" />
                <span>एक साथ रुपया (Bulk Price) कैलकुलेट करें</span>
              </span>
              <span className="text-[10px] text-slate-500">
                फॉर्मूला लगाने के बाद नीचे समीक्षा करें
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  ऑप्शन चुनें
                </label>
                <select
                  value={bulkMode}
                  onChange={(e) =>
                    setBulkMode(
                      e.target.value as
                        | 'increase_flat'
                        | 'increase_percent'
                        | 'decrease_flat'
                        | 'set_margin'
                    )
                  }
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="increase_percent">प्रतिशत बढ़ाएँ (+% Price)</option>
                  <option value="increase_flat">फिक्स रुपया बढ़ाएँ (+₹ Amount)</option>
                  <option value="decrease_flat">फिक्स रुपया घटाएँ (-₹ Amount)</option>
                  <option value="set_margin">MRP पर डिस्काउंट % सेट करें</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  मान (Value: % या ₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(Number(e.target.value) || 0)}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none"
                  placeholder="e.g. 10 या 50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  किस कैटेगरी पर लागू करें?
                </label>
                <select
                  value={bulkTargetCat}
                  onChange={(e) => setBulkTargetCat(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="all">सभी कैटेगरीज (All Products)</option>
                  {categories.map((c) => (
                    <option key={`bulk-cat-${c.id}`} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBulkTool(false)}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleCalculateBulkAdjustment}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
              >
                सूची में नया रुपया भरें
              </button>
            </div>
          </div>
        )}

        {/* Search bar & Category filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="नाम या ब्रांड से प्रोडक्ट खोजें..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              सभी ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter(
                (p) => p.category?.toLowerCase() === cat.id.toLowerCase()
              ).length;
              return (
                <button
                  key={`rate-cat-${cat.id}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.id.toLowerCase()
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Helper Guideline Box */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5">
        <span className="text-base leading-none">💡</span>
        <div className="text-[11px] text-amber-900 leading-relaxed">
          <p className="font-bold mb-0.5">रुपया लगाने का आसान तरीका:</p>
          <p>
            1. नीचे दी गई सूची में से किसी भी प्रोडक्ट का <strong>&quot;सेलिंग रुपया (₹)&quot;</strong> या <strong>&quot;MRP (₹)&quot;</strong> बॉक्स में अपनी नई कीमत टाइप करें।
            <br />
            2. दाईं तरफ दिए गए हरे बटन <strong>&quot;रुपया लागू करें&quot;</strong> पर क्लिक करें।
            <br />
            3. आपकी नई कीमत तुरंत स्टोर पर एक्टिव हो जाएगी और ग्राहकों को वही रुपया दिखेगा।
          </p>
        </div>
      </div>

      {/* Rate List Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
          <span>रुपया सूची ({filteredProducts.length} आइटम्स)</span>
          {modifiedCount > 0 && (
            <span className="text-amber-600 font-black flex items-center gap-1">
              ⚠️ {modifiedCount} प्रोडक्ट्स में बदलाव बाकी हैं
            </span>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-card">
            <Package size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-bold text-gray-700">कोई प्रोडक्ट नहीं मिला</p>
            <p className="text-[11px] text-gray-500 mt-1">
              कृपया सर्च बदलें या दूसरी श्रेणी चुनें।
            </p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const draft = getDraft(prod);
            const isSaving = savingId === prod.id;
            const isSavedSuccess = savedSuccessId === prod.id;

            return (
              <div
                key={`price-card-${prod.id}`}
                className={`bg-white rounded-2xl p-3.5 shadow-card border transition-all ${
                  draft.isModified
                    ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-200'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <img
                    src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                    alt={prod.title}
                    className="w-16 h-16 rounded-xl object-cover bg-gray-50 shrink-0 border border-gray-200"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
                    }}
                  />

                  {/* Title & Category Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase truncate max-w-[100px]">
                        {prod.brand || 'AKSelling'}
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                        {prod.category}
                      </span>
                      {draft.isModified && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-stone-900 shrink-0 animate-pulse">
                          बदलाव हुआ
                        </span>
                      )}
                    </div>

                    <h4
                      className="text-xs font-bold text-gray-900 truncate mt-0.5"
                      title={prod.title}
                    >
                      {prod.title}
                    </h4>

                    {/* Current Live Price tag */}
                    <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>
                        वर्तमान मूल्य: <strong className="text-gray-800">₹{prod.price}</strong>
                      </span>
                      {prod.mrp && prod.mrp > prod.price && (
                        <span className="line-through text-gray-400">₹{prod.mrp}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Setting Inputs Row */}
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  {/* Selling Price Input */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-black text-gray-700 mb-1 flex items-center gap-1">
                      <IndianRupee size={12} className="text-emerald-600" />
                      <span>सेलिंग रुपया (Selling Price ₹) *</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={draft.price}
                        onChange={(e) =>
                          handlePriceChange(prod.id, draft, Number(e.target.value))
                        }
                        className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-black text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* MRP Input */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      MRP (अधिकतम खुदरा मूल्य ₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={draft.mrp}
                        onChange={(e) =>
                          handleMrpChange(prod.id, draft, Number(e.target.value))
                        }
                        className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Discount Indicator Badge */}
                  <div className="sm:col-span-2 flex flex-col justify-end">
                    <div className="px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <span className="text-[10px] font-black text-emerald-700 flex items-center justify-center gap-0.5">
                        <Tag size={10} />
                        {draft.discount}% OFF
                      </span>
                    </div>
                  </div>

                  {/* Apply Price Button */}
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={() => handleApplySinglePrice(prod)}
                      disabled={isSaving}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 ${
                        isSavedSuccess
                          ? 'bg-emerald-600 text-white'
                          : draft.isModified
                          ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black'
                          : 'bg-stone-900 hover:bg-stone-800 text-white'
                      }`}
                    >
                      {isSaving ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : isSavedSuccess ? (
                        <CheckCircle2 size={13} className="text-white" />
                      ) : (
                        <Save size={13} />
                      )}
                      <span>
                        {isSaving
                          ? 'सेव हो रहा है...'
                          : isSavedSuccess
                          ? 'रुपया लग गया!'
                          : 'रुपया लागू करें'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default AdminPriceListManager;
