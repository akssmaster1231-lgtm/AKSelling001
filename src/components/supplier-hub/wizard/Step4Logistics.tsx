import React, { useState } from 'react';
import {
  Building2,
  Shirt,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Info,
  Hash,
  Copy,
  Check,
  RefreshCw,
  MapPin,
  Globe,
} from 'lucide-react';
import { INDIAN_STATES_AND_UTS } from '@/shiprocket-api';
import { lookupPincode } from '@/utils/pincode';
import type { WizardStepProps } from './types';

const SLEEVE_TYPES = [
  'Half Sleeve',
  'Short Sleeve',
  'Full Sleeve',
  'Sleeveless / Cut-Sleeve',
  'Raglan Sleeve',
  '3/4th Sleeve',
];

const NECK_TYPES = [
  'Round Neck / Crew Neck',
  'Polo Collar',
  'V-Neck',
  'Henley Neck',
  'Hooded Neck',
  'High Neck / Turtle Neck',
  'Mandarin Collar',
];

const FIT_TYPES = [
  'Regular Fit',
  'Oversized Fit / Drop Shoulder',
  'Slim Fit',
  'Boxy Fit',
  'Relaxed Fit',
  'Comfort Fit',
  'Athletic Fit',
];

const COUNTRY_OPTIONS = ['India'];

export default function Step4Logistics({
  formData,
  setFormData,
  onNext,
  onBack,
}: WizardStepProps) {
  const [validationError, setValidationError] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState<string | null>(null);
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);

  // Copy Product ID to clipboard
  const handleCopyId = () => {
    const idToCopy = formData.id || formData.catalogId || '';
    if (idToCopy && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Generate a fresh unique Product ID
  const handleRegenerateId = () => {
    const freshId = `PROD-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData(prev => ({
      ...prev,
      id: freshId,
      catalogId: prev.catalogId || freshId,
    }));
  };

  // Autofill registered warehouse address (defaulting to Madhya Pradesh)
  const handleAutofillWarehouse = () => {
    setFormData(prev => ({
      ...prev,
      brand: prev.brand || 'AK Yadav Print',
      pickupAddress: {
        businessName: 'AK Yadav Print Dispatch Hub',
        street: 'Shop 14, Ground Floor, Textile Market, Ring Road',
        city: 'Indore',
        state: 'Madhya Pradesh',
        country: 'India',
        pincode: '452001',
        phone: '+91 98765 43210',
      },
    }));
    setAutofillSuccess('Auto-filled: Indore, Madhya Pradesh (452001)');
    setTimeout(() => setAutofillSuccess(null), 4000);
  };

  // Pincode change handler with auto-fill logic
  const handlePincodeChange = async (rawPin: string) => {
    const pin = rawPin.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({
      ...prev,
      pickupAddress: { ...prev.pickupAddress, pincode: pin },
    }));

    if (pin.length === 6) {
      setIsLookingUpPin(true);
      try {
        const info = await lookupPincode(pin);
        if (info && info.city && info.state) {
          setFormData(prev => ({
            ...prev,
            pickupAddress: {
              ...prev.pickupAddress,
              city: info.city,
              state: info.state,
              country: info.country || 'India',
            },
          }));
          setAutofillSuccess(`✓ Auto-filled: ${info.city}, ${info.state} (${info.district || pin})`);
          setTimeout(() => setAutofillSuccess(null), 5000);
        }
      } catch (err) {
        console.warn('Pincode lookup error:', err);
      } finally {
        setIsLookingUpPin(false);
      }
    }
  };

  const handleProceed = () => {
    const addr = formData.pickupAddress;
    if (!formData.id?.trim()) {
      setValidationError('Please specify or generate a valid Product ID / Dispatch Linkage SKU.');
      return;
    }
    if (!formData.brand.trim()) {
      setValidationError('Please enter Brand Name (defaults to AK Yadav Print).');
      return;
    }
    if (!addr.businessName.trim() || !addr.street.trim() || !addr.city.trim() || !addr.pincode.trim()) {
      setValidationError('Please complete all Dispatch & Pickup address fields for courier pickup.');
      return;
    }
    if (!/^\d{6}$/.test(addr.pincode.trim())) {
      setValidationError('Please enter a valid 6-digit Indian PIN code.');
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
          Step 4 of 5 • Logistics & Tailoring Identity
        </span>
        <h2 className="text-lg font-extrabold text-gray-900">
          Product Linkage, Logistics & Dispatch Warehouse
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">
          Map your unique Product ID to Shiprocket manifests, specify garment styling, and configure courier pickup warehouse details.
        </p>
      </div>

      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
          <Info size={16} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* 1. DEDICATED PRODUCT ID INPUT BOX AT THE TOP */}
      <div className="bg-white border-2 border-blue-100 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-flipkart-600 flex items-center justify-center">
              <Hash size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Product ID / Dispatch Linkage SKU</h3>
              <p className="text-[11px] text-gray-500">
                Unique identifier linked with Shiprocket airway bills, barcode labels & warehouse inventory
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            Courier Linkage Active
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              id="wizard-product-id-input"
              value={formData.id || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  id: e.target.value.trim(),
                  catalogId: prev.catalogId || e.target.value.trim(),
                }))
              }
              placeholder="e.g., PROD-AKY-82910"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-flipkart-500"
              required
            />
            <Hash size={14} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          <button
            type="button"
            onClick={handleCopyId}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Copy Product ID"
          >
            {copiedId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span className="hidden xs:inline">{copiedId ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleRegenerateId}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Generate new unique Product ID"
          >
            <RefreshCw size={14} />
            <span className="hidden xs:inline">Regenerate</span>
          </button>
        </div>
      </div>

      {/* Brand Name & Style Specs Grid */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
          <Shirt size={15} className="text-flipkart-600" />
          <span>Garment Tailoring & Brand Identity</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Brand Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              placeholder="AK Yadav Print"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-bold text-gray-900"
              required
            />
            <p className="text-[10px] text-gray-500 mt-1">Default: AK Yadav Print</p>
          </div>

          {/* Sleeve Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Sleeve Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.sleeveType}
              onChange={e => setFormData(prev => ({ ...prev, sleeveType: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-semibold text-gray-800"
            >
              {SLEEVE_TYPES.map(sleeve => (
                <option key={sleeve} value={sleeve}>
                  {sleeve}
                </option>
              ))}
            </select>
          </div>

          {/* Neck Style */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Neck Style <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.neckType}
              onChange={e => setFormData(prev => ({ ...prev, neckType: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-semibold text-gray-800"
            >
              {NECK_TYPES.map(neck => (
                <option key={neck} value={neck}>
                  {neck}
                </option>
              ))}
            </select>
          </div>

          {/* Fit Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Fit Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.fitType}
              onChange={e => setFormData(prev => ({ ...prev, fitType: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-semibold text-gray-800"
            >
              {FIT_TYPES.map(fit => (
                <option key={fit} value={fit}>
                  {fit}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Business & Pickup Dispatch Address */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Building2 size={15} className="text-flipkart-600" />
              <span>Business & Pickup Dispatch Address</span>
              <span className="text-red-500">*</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Enter 6-digit Pincode to auto-fill City and State for courier partners (Delhivery / Shadowfax / Ecom Express).
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutofillWarehouse}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-flipkart-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Sparkles size={13} />
            <span>⚡ Autofill Registered Warehouse</span>
          </button>
        </div>

        {autofillSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
            <Check size={16} className="shrink-0" />
            <span>{autofillSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Business / Warehouse Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Warehouse / Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.pickupAddress.businessName}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, businessName: e.target.value },
                }))
              }
              placeholder="e.g., AK Yadav Print Dispatch Hub"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-medium"
              required
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Dispatch Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.pickupAddress.phone}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, phone: e.target.value },
                }))
              }
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-medium"
              required
            />
          </div>

          {/* Street Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Complete Street & Building Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.pickupAddress.street}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, street: e.target.value },
                }))
              }
              placeholder="e.g., Shop 14, Ground Floor, Textile Market, Ring Road"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-medium"
              required
            />
          </div>

          {/* Pincode with Auto-fill */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                PIN Code (6 digits) <span className="text-red-500">*</span>
              </label>
              {isLookingUpPin && (
                <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> Auto-detecting...
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={formData.pickupAddress.pincode}
                onChange={e => handlePincodeChange(e.target.value)}
                placeholder="452001"
                className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-flipkart-500 font-bold text-gray-900"
                required
              />
              <MapPin size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Entering 6-digit Pincode automatically populates City & State
            </p>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              City / Town <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.pickupAddress.city}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, city: e.target.value },
                }))
              }
              placeholder="e.g., Indore"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-medium"
              required
            />
          </div>

          {/* State / UT Dropdown (default "Madhya Pradesh") */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              State / UT <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.pickupAddress.state || 'Madhya Pradesh'}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, state: e.target.value },
                }))
              }
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-semibold text-gray-800"
            >
              {INDIAN_STATES_AND_UTS.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-1">Default: Madhya Pradesh</p>
          </div>

          {/* Country Dropdown (default "India") */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.pickupAddress.country || 'India'}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    pickupAddress: { ...prev.pickupAddress, country: e.target.value },
                  }))
                }
                className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500 font-semibold text-gray-800"
              >
                {COUNTRY_OPTIONS.map(cntry => (
                  <option key={cntry} value={cntry}>
                    {cntry}
                  </option>
                ))}
              </select>
              <Globe size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Default: India</p>
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
          <span>Back to Specs</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold text-white bg-flipkart-600 hover:bg-flipkart-700 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer"
          id="step4-next-btn"
        >
          <span>Next: Variant Inventory & Publish</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
