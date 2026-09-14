import React, { useState } from 'react';
import {
  Tag,
  Scale,
  Palette,
  Layers,
  Shirt,
  Percent,
  Truck,
  Check,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import type { WizardStepProps } from './types';

const POPULAR_COLORS = [
  { name: 'Black', hex: '#111827', border: false },
  { name: 'White', hex: '#FFFFFF', border: true },
  { name: 'Navy Blue', hex: '#1E3A8A', border: false },
  { name: 'Maroon', hex: '#881337', border: false },
  { name: 'Olive Green', hex: '#3F6212', border: false },
  { name: 'Mustard Yellow', hex: '#D97706', border: false },
  { name: 'Beige', hex: '#D7C4B7', border: false },
  { name: 'Crimson Red', hex: '#DC2626', border: false },
  { name: 'Charcoal Grey', hex: '#4B5563', border: false },
  { name: 'Royal Blue', hex: '#2563EB', border: false },
  { name: 'Lavender', hex: '#A855F7', border: false },
  { name: 'Brown', hex: '#78350F', border: false },
  { name: 'Sage Green', hex: '#84A98C', border: false },
  { name: 'Coral', hex: '#F87171', border: false },
];

const FABRIC_MATERIALS = [
  '100% Cotton',
  '100% Combed Cotton',
  'Cotton Blend (80/20)',
  'French Terry (240+ GSM)',
  'Polyester / Dri-Fit',
  'Fleece Cotton (Winter Wear)',
  'Pure Rayon',
  'Denim',
  'Lycra / Spandex Stretch',
  'Pure Linen',
];

const PRODUCT_TYPES = [
  'T-Shirt',
  'Oversized T-Shirt',
  'Polo T-Shirt',
  'Hoodie',
  'Sweatshirt',
  'Casual Shirt',
  'Trackpants / Joggers',
  'Shorts',
  'Ethnic Kurta',
  'Denim Jacket',
  'Other Apparel',
];

const PRINT_DESIGNS = [
  'Graphic Print',
  'Typography / Quotes',
  'Hero / Character Print',
  'Minimalist Chest Logo',
  'Back Big Print',
  'All-Over Print (AOP)',
  'Solid Plain (No Print)',
  'Embroidered Badge',
];

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

const GSM_PRESETS = [
  { label: '180 GSM (Lightweight)', value: '180 GSM' },
  { label: '210 GSM (Classic Combed)', value: '210 GSM' },
  { label: '240 GSM (Heavyweight Oversized)', value: '240 GSM' },
  { label: '280 GSM (French Terry)', value: '280 GSM' },
  { label: '320 GSM (Fleece / Winter)', value: '320 GSM' },
];

export default function Step3Specs({
  formData,
  setFormData,
  onNext,
  onBack,
}: WizardStepProps) {
  const [customColorName, setCustomColorName] = useState('');
  const [validationError, setValidationError] = useState('');

  // Color selection
  const handleToggleColor = (colorName: string) => {
    setFormData(prev => {
      const exists = prev.colors.includes(colorName);
      const nextColors = exists
        ? prev.colors.filter(c => c !== colorName)
        : [...prev.colors, colorName];
      return { ...prev, colors: nextColors.length > 0 ? nextColors : ['Black'] };
    });
  };

  const handleAddCustomColor = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customColorName.trim();
    if (!clean) return;
    if (!formData.colors.includes(clean)) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, clean],
      }));
    }
    setCustomColorName('');
  };

  // Size selection
  const handleToggleSize = (size: string) => {
    setFormData(prev => {
      const exists = prev.sizes.includes(size);
      const nextSizes = exists
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes: nextSizes.length > 0 ? nextSizes : ['M'] };
    });
  };

  // Discount computation
  const discountPercent =
    formData.mrp > 0 && formData.price > 0 && formData.mrp >= formData.price
      ? Math.round(((formData.mrp - formData.price) / formData.mrp) * 100)
      : 0;

  const handleProceed = () => {
    if (formData.colors.length === 0) {
      setValidationError('Please select at least 1 color.');
      return;
    }
    if (formData.sizes.length === 0) {
      setValidationError('Please select at least 1 size.');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setValidationError('Please enter a valid Selling Price.');
      return;
    }
    if (!formData.mrp || formData.mrp < formData.price) {
      setValidationError('Original MRP must be greater than or equal to Selling Price.');
      return;
    }
    setValidationError('');
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full mb-1">
          Step 3 of 5 • Specifications & Pricing
        </span>
        <h2 className="text-lg font-extrabold text-gray-900">
          Core Apparel Specs, Variants, Pricing & Shipping
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">
          Define fabric material, GSM weight, print placement, available sizes/colors, and automated discount pricing.
        </p>
      </div>

      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
          <Info size={16} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Grid of Core Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Type & Print Design */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4.5 space-y-4">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
            <Shirt size={15} className="text-flipkart-600" />
            <span>Product Type & Print Design</span>
          </h3>

          {/* Product Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Product Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.productType}
              onChange={e => setFormData(prev => ({ ...prev, productType: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-semibold text-gray-800"
            >
              {PRODUCT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Print Design / Placement */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Print Design & Artwork Placement <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.printDesign}
              onChange={e => setFormData(prev => ({ ...prev, printDesign: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-semibold text-gray-800"
            >
              {PRINT_DESIGNS.map(design => (
                <option key={design} value={design}>
                  {design}
                </option>
              ))}
            </select>
          </div>

          {/* Fabric Material */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Fabric Material Choice <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.fabric}
              onChange={e => setFormData(prev => ({ ...prev, fabric: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-semibold text-gray-800"
            >
              {FABRIC_MATERIALS.map(fab => (
                <option key={fab} value={fab}>
                  {fab}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Weight & Fabric GSM */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4.5 space-y-4">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
            <Scale size={15} className="text-flipkart-600" />
            <span>Fabric Weight & GSM</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Select or Type GSM Fabric Weight <span className="text-red-500">*</span>
            </label>

            {/* Quick GSM Presets */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {GSM_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, weightGsm: preset.value }))}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    formData.weightGsm === preset.value
                      ? 'bg-flipkart-600 text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Exact Input */}
            <input
              type="text"
              value={formData.weightGsm}
              onChange={e => setFormData(prev => ({ ...prev, weightGsm: e.target.value }))}
              placeholder="e.g., 240 GSM or 250 grams"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-medium"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Used for courier volumetric calculation and customer premium feel assurance.
            </p>
          </div>
        </div>
      </div>

      {/* Colors & Sizes Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Colors Multi-Select */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Palette size={15} className="text-flipkart-600" />
              <span>Available Colors ({formData.colors.length} Selected)</span>
              <span className="text-red-500">*</span>
            </label>
          </div>

          {/* Color Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {POPULAR_COLORS.map(c => {
              const isSelected = formData.colors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleToggleColor(c.name)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-2 border-flipkart-500 text-flipkart-900 shadow-xs'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full shrink-0 shadow-xs ${
                      c.border ? 'border border-gray-300' : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="truncate flex-1">{c.name}</span>
                  {isSelected && <Check size={13} className="text-flipkart-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Custom color input */}
          <form onSubmit={handleAddCustomColor} className="flex gap-2 pt-1 border-t border-gray-100">
            <input
              type="text"
              value={customColorName}
              onChange={e => setCustomColorName(e.target.value)}
              placeholder="Or type custom color (e.g., Mint Green)"
              className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-flipkart-500"
            />
            <button
              type="submit"
              disabled={!customColorName.trim()}
              className="px-3 py-1.5 text-xs font-bold text-white bg-flipkart-600 hover:bg-flipkart-700 disabled:opacity-50 rounded-xl cursor-pointer"
            >
              + Add
            </button>
          </form>
        </div>

        {/* Sizes Multi-Select */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4.5 space-y-3">
          <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
            <Layers size={15} className="text-flipkart-600" />
            <span>Available Sizes ({formData.sizes.length} Selected)</span>
            <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-gray-500">
            Select sizes for this product. You will configure SKUs & stock for each in Step 5.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {AVAILABLE_SIZES.map(s => {
              const isSelected = formData.sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleToggleSize(s)}
                  className={`p-2.5 rounded-xl text-center text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-flipkart-600 text-white shadow-sm ring-2 ring-flipkart-400/40 scale-105'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing & Shipping Charges */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
          <Tag size={15} className="text-flipkart-600" />
          <span>Pricing & Delivery Model</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Selling Price */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Selling Price (₹ Buyer Pays) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-extrabold text-gray-500">₹</span>
              <input
                type="number"
                min={1}
                value={formData.price || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    price: Number(e.target.value) || 0,
                  }))
                }
                placeholder="499"
                className="w-full pl-7 pr-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl font-extrabold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-flipkart-500"
                required
              />
            </div>
          </div>

          {/* Original MRP */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Original Price (MRP ₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-extrabold text-gray-500">₹</span>
              <input
                type="number"
                min={1}
                value={formData.mrp || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    mrp: Number(e.target.value) || 0,
                  }))
                }
                placeholder="999"
                className="w-full pl-7 pr-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-flipkart-500"
                required
              />
            </div>
          </div>

          {/* Calculated Discount Pill */}
          <div className="flex flex-col justify-center">
            <label className="block text-xs font-bold text-gray-500 mb-1">
              Automated Customer Discount
            </label>
            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-sm">
                <Percent size={16} />
                <span>{discountPercent}% OFF</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">
                Save ₹{Math.max(0, formData.mrp - formData.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping / Delivery Option */}
        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-flipkart-600">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Delivery & Shipping Charge</p>
              <p className="text-[11px] text-gray-500">
                {formData.isFreeShipping
                  ? 'Free Shipping enabled across India (Boosts conversion by 40%)'
                  : `Custom delivery charge of ₹${formData.shippingCharge} applied at checkout`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFreeShipping}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    isFreeShipping: e.target.checked,
                    shippingCharge: e.target.checked ? 0 : 49,
                  }))
                }
                className="w-4 h-4 text-flipkart-600 rounded-sm focus:ring-flipkart-500"
              />
              <span className="text-xs font-bold text-gray-800">Offer Free Shipping</span>
            </label>

            {!formData.isFreeShipping && (
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-gray-600">₹</span>
                <input
                  type="number"
                  min={0}
                  value={formData.shippingCharge}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      shippingCharge: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-16 px-2 py-1 text-xs bg-gray-50 border border-gray-300 rounded-lg text-center font-bold"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Media</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold text-white bg-flipkart-600 hover:bg-flipkart-700 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer"
          id="step3-next-btn"
        >
          <span>Next: Logistics & Neck/Sleeve Specs</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
