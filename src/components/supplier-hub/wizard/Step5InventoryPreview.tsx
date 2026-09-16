import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Eye,
  CheckCircle2,
  ArrowLeft,
  UploadCloud,
  MapPin,
} from 'lucide-react';
import type { SellerProduct } from '@/types/supplier';
import { saveProductToFirestore } from '@/firebase';
import { DEFAULT_PRODUCT_PLACEHOLDER } from '@/data';
import type { WizardStepProps, WizardVariantItem } from './types';

interface Step5Props extends WizardStepProps {
  onPublishSuccess: (product: SellerProduct) => void;
}

export default function Step5InventoryPreview({
  formData,
  setFormData,
  onBack,
  onPublishSuccess,
}: Step5Props) {
  const [bulkStockInput, setBulkStockInput] = useState<number>(25);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedProduct, setPublishedProduct] = useState<SellerProduct | null>(null);

  // Initialize or reconcile variants based on current selected colors & sizes
  useEffect(() => {
    setFormData(prev => {
      const currentVariants = prev.variants || [];
      const neededVariants: WizardVariantItem[] = [];

      const prefix = (prev.brand || 'AK')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4) || 'AK';

      const typeCode = (prev.productType || 'TEE')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4);

      prev.colors.forEach(col => {
        const colCode = col.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
        prev.sizes.forEach(sz => {
          const id = `${col}-${sz}`;
          const existing = currentVariants.find(v => v.color === col && v.size === sz);
          if (existing) {
            neededVariants.push(existing);
          } else {
            neededVariants.push({
              id,
              color: col,
              size: sz,
              sku: `${prefix}-${typeCode}-${colCode}-${sz}`,
              stock: 20,
              price: prev.price,
            });
          }
        });
      });

      const hasChanged =
        neededVariants.length !== currentVariants.length ||
        neededVariants.some((nv, i) => nv.id !== currentVariants[i]?.id);

      if (hasChanged) {
        return { ...prev, variants: neededVariants };
      }
      return prev;
    });
  }, [formData.colors, formData.sizes, formData.brand, formData.productType, formData.price, setFormData]);

  // Handle individual variant stock/sku edit
  const handleUpdateVariant = (
    index: number,
    field: 'stock' | 'sku',
    value: string | number
  ) => {
    setFormData(prev => {
      const next = [...prev.variants];
      if (next[index]) {
        next[index] = {
          ...next[index],
          [field]: field === 'stock' ? Math.max(0, Number(value) || 0) : value,
        };
      }
      return { ...prev, variants: next };
    });
  };

  // Bulk set stock
  const handleApplyBulkStock = () => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => ({
        ...v,
        stock: Math.max(0, bulkStockInput || 0),
      })),
    }));
  };

  // Calculate total stock
  const totalStock = (formData.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);

  // Discount calculation
  const discountPercent =
    formData.mrp > 0 && formData.price > 0 && formData.mrp >= formData.price
      ? Math.round(((formData.mrp - formData.price) / formData.mrp) * 100)
      : 0;

  // Final Publish Handler
  const handlePublishNow = async () => {
    setIsPublishing(true);
    try {
      const prodId = formData.id || `prod_${Date.now()}`;
      const catalogId = formData.catalogId || `CAT-${Math.floor(10000 + Math.random() * 90000)}`;

      const sellerProductData: SellerProduct = {
        id: prodId,
        catalogId,
        sku: formData.variants[0]?.sku || `AK-${prodId.slice(-6).toUpperCase()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price) || 0,
        mrp: Number(formData.mrp) || Number(formData.price) || 0,
        discount: discountPercent,
        category: formData.category || 'fashion',
        images: formData.images.length > 0 ? formData.images : [DEFAULT_PRODUCT_PLACEHOLDER],
        stock: totalStock,
        brand: formData.brand.trim() || 'AK Yadav Print',
        status: totalStock > 0 ? 'live' : 'out_of_stock',
        tags: formData.tags || [],
        keywords: formData.keywords || formData.tags || [],
        sizes: formData.sizes,
        colors: formData.colors,
        fabric: formData.fabric,
        productType: formData.productType,
        printDesign: formData.printDesign,
        weightGsm: formData.weightGsm,
        sleeveType: formData.sleeveType,
        neckType: formData.neckType,
        fitType: formData.fitType,
        isFreeShipping: formData.isFreeShipping,
        shippingCharge: formData.shippingCharge,
        pickupAddress: formData.pickupAddress,
        pickupLocation: `${formData.pickupAddress.city}, ${formData.pickupAddress.state}`,
        variants: formData.variants,
        storefrontPlacement: formData.storefrontPlacement,
        sizeStock: formData.variants.map(v => ({
          size: `${v.size} (${v.color})`,
          stock: v.stock,
          sku: v.sku,
        })),
      };

      // 1. Permanent Firestore Persistence
      await saveProductToFirestore(sellerProductData);

      setPublishedProduct(sellerProductData);
      setPublishSuccess(true);
      onPublishSuccess(sellerProductData);
    } catch (err) {
      console.error('Failed to publish product to Firestore:', err);
      alert('Error saving to cloud. Please check network connection and try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (publishSuccess && publishedProduct) {
    return (
      <div className="text-center py-8 px-4 space-y-5 animate-scale-up">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>

        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-1">
            Status: Live & Verified On Storefront
          </span>
          <h2 className="text-xl font-black text-gray-900">
            Product Successfully Published!
          </h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto mt-1">
            "{publishedProduct.title}" is now active with {totalStock} total units across {formData.variants.length} variant combinations.
          </p>
        </div>

        {/* Product Snapshot Card */}
        <div className="max-w-md mx-auto bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left flex gap-3.5 items-center">
          <img
            src={publishedProduct.images[0]}
            alt={publishedProduct.title}
            className="w-16 h-16 rounded-xl object-cover border border-gray-200"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-flipkart-600">{publishedProduct.brand}</p>
            <p className="text-xs font-bold text-gray-900 truncate">{publishedProduct.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-extrabold text-gray-900">₹{publishedProduct.price}</span>
              <span className="text-xs text-gray-400 line-through">₹{publishedProduct.mrp}</span>
              <span className="text-xs text-emerald-600 font-bold">{publishedProduct.discount}% OFF</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 text-xs font-extrabold text-white bg-flipkart-600 hover:bg-flipkart-700 rounded-xl shadow-md cursor-pointer"
          >
            Done / Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full mb-1">
          Step 5 of 5 • Inventory Matrix & Launch
        </span>
        <h2 className="text-lg font-extrabold text-gray-900">
          Variant Inventory (SKU/Quantity), Final Preview & Storefront Placement
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">
          Review your live SKU matrix, check the buyer presentation preview, and publish permanently to Firebase.
        </p>
      </div>

      {/* 1. Variant Stock Grid (Inventory Matrix) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Boxes size={15} className="text-flipkart-600" />
              <span>Variant Inventory Matrix ({formData.variants.length} Combinations)</span>
            </h3>
            <p className="text-[11px] text-gray-500">
              Total Live Inventory: <strong className="text-emerald-700 font-bold">{totalStock} Units</strong>
            </p>
          </div>

          {/* 1-Tap Bulk Stock Setter */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 self-start sm:self-auto">
            <span className="text-[11px] font-bold text-gray-600 pl-1">Set All Stock:</span>
            <input
              type="number"
              min={0}
              value={bulkStockInput}
              onChange={e => setBulkStockInput(Number(e.target.value) || 0)}
              className="w-16 px-2 py-1 text-xs bg-white border border-gray-300 rounded-lg text-center font-bold"
            />
            <button
              type="button"
              onClick={handleApplyBulkStock}
              className="px-2.5 py-1 text-[11px] font-bold text-white bg-flipkart-600 hover:bg-flipkart-700 rounded-lg transition-colors cursor-pointer"
            >
              Apply to All
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0 border-b border-gray-200">
              <tr>
                <th className="p-2.5">Variant</th>
                <th className="p-2.5">SKU Code</th>
                <th className="p-2.5 text-center">In Stock Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {formData.variants.map((variant, idx) => (
                <tr key={variant.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-flipkart-700 font-extrabold rounded-md text-[11px] border border-blue-200">
                        {variant.size}
                      </span>
                      <span className="font-semibold text-gray-800">{variant.color}</span>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={e => handleUpdateVariant(idx, 'sku', e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      min={0}
                      value={variant.stock}
                      onChange={e => handleUpdateVariant(idx, 'stock', e.target.value)}
                      className="w-20 px-2 py-1 text-xs font-bold text-center bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Comprehensive Final Preview */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
          <Eye size={15} className="text-flipkart-600" />
          <span>Customer Storefront Preview</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
          {/* Visual Product Card */}
          <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2.5 border border-gray-100">
                <img
                  src={formData.images[0] || DEFAULT_PRODUCT_PLACEHOLDER}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {formData.isFreeShipping && (
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                    Free Delivery
                  </span>
                )}
                <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {formData.images.length} photos
                </span>
              </div>

              <span className="text-[10px] font-extrabold uppercase tracking-wider text-flipkart-600">
                {formData.brand || 'AK Yadav Print'}
              </span>
              <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mt-0.5">
                {formData.title || 'Product Title'}
              </h4>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-base font-extrabold text-gray-900">₹{formData.price}</span>
                <span className="text-xs text-gray-400 line-through">₹{formData.mrp}</span>
                <span className="text-xs text-emerald-600 font-extrabold">{discountPercent}% OFF</span>
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
              <span>Delivery by Tomorrow</span>
              <span className="font-semibold text-emerald-600">In Stock ({totalStock})</span>
            </div>
          </div>

          {/* Specifications Breakdown */}
          <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-800">Garment & Logistics Highlights</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-400 block font-medium">Fabric Weight / GSM</span>
                  <span className="text-xs font-bold text-gray-900">{formData.weightGsm || '240 GSM'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-400 block font-medium">Fabric Material</span>
                  <span className="text-xs font-bold text-gray-900">{formData.fabric || '100% Cotton'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-400 block font-medium">Product Type</span>
                  <span className="text-xs font-bold text-gray-900">{formData.productType || 'T-Shirt'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-400 block font-medium">Print Design</span>
                  <span className="text-xs font-bold text-gray-900">{formData.printDesign}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-400 block font-medium">Sleeve & Neck</span>
                  <span className="text-xs font-bold text-gray-900">
                    {formData.sleeveType} • {formData.neckType.split('/')[0]}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-400 block font-medium">Fit Profile</span>
                  <span className="text-xs font-bold text-gray-900">{formData.fitType}</span>
                </div>
              </div>

              {/* Pickup Address badge */}
              <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2">
                <MapPin size={15} className="text-flipkart-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-gray-700">
                  <strong className="text-gray-900 font-bold">{formData.pickupAddress.businessName}</strong>
                  <p className="text-gray-500">
                    {formData.pickupAddress.street}, {formData.pickupAddress.city}, {formData.pickupAddress.state} - {formData.pickupAddress.pincode}
                  </p>
                </div>
              </div>
            </div>

            {/* Colors & Sizes Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-gray-600 mr-1">Available:</span>
              {formData.colors.map(col => (
                <span key={col} className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[11px] font-medium text-gray-800">
                  {col}
                </span>
              ))}
              <span className="text-gray-300">|</span>
              {formData.sizes.map(sz => (
                <span key={sz} className="px-2 py-0.5 bg-blue-50 text-flipkart-700 border border-blue-200 rounded-md text-[11px] font-extrabold">
                  {sz}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Storefront Placement Checkboxes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          Storefront Placement & Live Visibility
        </h3>
        <p className="text-[11px] text-gray-500">
          Select where this product will appear upon publishing:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.storefrontPlacement.homepage}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  storefrontPlacement: { ...prev.storefrontPlacement, homepage: e.target.checked },
                }))
              }
              className="w-4 h-4 text-flipkart-600 rounded-sm mt-0.5 focus:ring-flipkart-500"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">Homepage Feature</p>
              <p className="text-[10px] text-gray-500">Featured in home carousel and top recommended products.</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.storefrontPlacement.categoryPages}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  storefrontPlacement: { ...prev.storefrontPlacement, categoryPages: e.target.checked },
                }))
              }
              className="w-4 h-4 text-flipkart-600 rounded-sm mt-0.5 focus:ring-flipkart-500"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">Category Catalog</p>
              <p className="text-[10px] text-gray-500">Live under category circular badges and search filters.</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.storefrontPlacement.bestDeals}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  storefrontPlacement: { ...prev.storefrontPlacement, bestDeals: e.target.checked },
                }))
              }
              className="w-4 h-4 text-flipkart-600 rounded-sm mt-0.5 focus:ring-flipkart-500"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">Best Deals & Offers</p>
              <p className="text-[10px] text-gray-500">Highlighted in discount offers section with special tag.</p>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Final Action: Publish Now Button */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={isPublishing}
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Logistics</span>
        </button>

        <button
          type="button"
          disabled={isPublishing || totalStock === 0}
          onClick={handlePublishNow}
          className="inline-flex items-center gap-2 px-8 py-3 text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
          id="publish-now-btn"
        >
          {isPublishing ? (
            <span>Publishing to Cloud Database...</span>
          ) : (
            <>
              <UploadCloud size={18} />
              <span>Publish Now to Storefront</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
