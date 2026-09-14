import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  FolderTree,
  Image as ImageIcon,
  Sliders,
  Truck,
  Boxes,
} from 'lucide-react';
import type { SellerProduct } from '@/types/supplier';
import type { WizardFormData } from './wizard/types';
import Step1Category from './wizard/Step1Category';
import Step2Media from './wizard/Step2Media';
import Step3Specs from './wizard/Step3Specs';
import Step4Logistics from './wizard/Step4Logistics';
import Step5InventoryPreview from './wizard/Step5InventoryPreview';

interface AddEditCatalogModalProps {
  product: SellerProduct | null;
  onClose: () => void;
  onSave: (prod: SellerProduct) => void;
}

const WIZARD_STEPS = [
  { step: 1, title: 'Category', label: 'Category & Icon', icon: FolderTree },
  { step: 2, title: 'Media', label: 'Photos & Details', icon: ImageIcon },
  { step: 3, title: 'Specs & Price', label: 'GSM, Colors, Pricing', icon: Sliders },
  { step: 4, title: 'Logistics', label: 'Pickup & Garment', icon: Truck },
  { step: 5, title: 'Inventory & Launch', label: 'SKUs, Stock & Publish', icon: Boxes },
];

export default function AddEditCatalogModal({
  product,
  onClose,
  onSave,
}: AddEditCatalogModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Initialize form data from existing product (if editing) or clean defaults
  const [formData, setFormData] = useState<WizardFormData>(() => {
    if (product) {
      return {
        id: product.id,
        catalogId: product.catalogId,
        category: product.category || 'fashion',
        categoryName: product.category,
        images: product.images || [],
        title: product.title || '',
        description: product.description || '',
        weightGsm: product.weightGsm || '240 GSM',
        colors: product.colors && product.colors.length > 0 ? product.colors : ['Black'],
        fabric: product.fabric || '100% Combed Cotton',
        productType: product.productType || 'T-Shirt',
        printDesign: product.printDesign || 'Graphic Print',
        sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['M', 'L', 'XL'],
        price: product.price || 499,
        mrp: product.mrp || 999,
        isFreeShipping: product.isFreeShipping ?? true,
        shippingCharge: product.shippingCharge ?? 0,
        deliveryEstimate: 'Free delivery in 2-3 days',
        pickupAddress: product.pickupAddress || {
          businessName: 'AK Yadav Print Dispatch Hub',
          street: 'Shop 14, Ground Floor, Textile Market, Ring Road',
          city: 'Indore',
          state: 'Madhya Pradesh',
          country: 'India',
          pincode: '452001',
          phone: '+91 98765 43210',
        },
        sleeveType: product.sleeveType || 'Half Sleeve',
        neckType: product.neckType || 'Round Neck / Crew Neck',
        fitType: product.fitType || 'Oversized Fit / Drop Shoulder',
        brand: product.brand || 'AK Yadav Print',
        variants: (product.variants || []).map(v => ({
          id: v.id || `${v.color}-${v.size}`,
          color: v.color,
          size: v.size,
          sku: v.sku,
          stock: v.stock,
          price: v.price || product.price,
        })),
        storefrontPlacement: product.storefrontPlacement || {
          homepage: true,
          categoryPages: true,
          bestDeals: true,
        },
      };
    }

    // Default clean state
    return {
      id: `prod_${Date.now()}`,
      catalogId: `CAT-${Math.floor(10000 + Math.random() * 90000)}`,
      category: 'fashion',
      categoryName: 'Fashion',
      images: [],
      title: '',
      description: '',
      weightGsm: '240 GSM',
      colors: ['Black', 'Navy Blue'],
      fabric: '100% Combed Cotton',
      productType: 'Oversized T-Shirt',
      printDesign: 'Graphic Print',
      sizes: ['M', 'L', 'XL'],
      price: 499,
      mrp: 999,
      isFreeShipping: true,
      shippingCharge: 0,
      deliveryEstimate: 'Free delivery in 2-3 days',
      pickupAddress: {
        businessName: 'AK Yadav Print Dispatch Hub',
        street: 'Shop 14, Ground Floor, Textile Market, Ring Road',
        city: 'Indore',
        state: 'Madhya Pradesh',
        country: 'India',
        pincode: '452001',
        phone: '+91 98765 43210',
      },
      sleeveType: 'Half Sleeve',
      neckType: 'Round Neck / Crew Neck',
      fitType: 'Oversized Fit / Drop Shoulder',
      brand: 'AK Yadav Print',
      variants: [],
      storefrontPlacement: {
        homepage: true,
        categoryPages: true,
        bestDeals: true,
      },
    };
  });

  const progressPercent = Math.round((currentStep / 5) * 100);

  const handleNext = () => {
    setCurrentStep(prev => Math.min(5, prev + 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleStepClick = (stepNumber: number) => {
    // Sellers can navigate back to any previous step or the immediate next
    if (stepNumber <= currentStep || stepNumber === currentStep + 1) {
      setCurrentStep(stepNumber);
    }
  };

  const handlePublishComplete = (savedProduct: SellerProduct) => {
    onSave(savedProduct);
  };

  const handleSafeClose = () => {
    if (formData.title.trim() || formData.images.length > 0) {
      if (window.confirm('Do you want to close? Any unsaved changes will be lost.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto animate-scale-up border border-gray-100">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-flipkart-600 to-indigo-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Sparkles size={20} className="text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-yellow-400 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  5-Step Seller Wizard
                </span>
                <span className="text-xs text-blue-100 font-medium">
                  {product ? 'Editing Catalog' : 'New Product Creation'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                {product ? `Edit: ${product.title}` : 'Add New Product to AKSelling Catalog'}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Close Wizard"
            id="wizard-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progression Bar & Breadcrumb Tabs */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-6 py-3 shrink-0">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-3">
            <div
              className="bg-gradient-to-r from-flipkart-500 to-emerald-500 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {WIZARD_STEPS.map(item => {
              const IconComp = item.icon;
              const isCurrent = currentStep === item.step;
              const isCompleted = currentStep > item.step;
              const isAccessible = item.step <= currentStep;

              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => handleStepClick(item.step)}
                  disabled={!isAccessible}
                  className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-xl text-left transition-all ${
                    isCurrent
                      ? 'bg-white shadow-sm border border-flipkart-400/80 text-flipkart-600'
                      : isCompleted
                      ? 'text-emerald-700 hover:bg-white/60 cursor-pointer'
                      : 'text-gray-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : isCurrent
                        ? 'bg-flipkart-600 text-white shadow-xs'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? <Check size={13} strokeWidth={3} /> : item.step}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className="text-[11px] font-extrabold truncate leading-tight flex items-center gap-1">
                      <IconComp size={11} className="shrink-0" />
                      <span>{item.title}</span>
                    </p>
                    <p className="text-[9px] text-gray-500 truncate leading-tight">
                      {item.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Wizard Step Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {currentStep === 1 && (
            <Step1Category
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 2 && (
            <Step2Media
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <Step3Specs
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <Step4Logistics
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 5 && (
            <Step5InventoryPreview
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onPublishSuccess={handlePublishComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
