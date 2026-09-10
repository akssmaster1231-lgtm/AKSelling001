import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  Plus,
  Link,
  Check,
  Sparkles,
  Layers,
  Building2,
  ChevronRight,
  ChevronLeft,
  Tag,
  Boxes,
  MapPin,
  Palette,
  CheckCircle2,
  Scale,
  Shirt,
  Percent,
  Barcode,
  ArrowRight,
  Info,
  Phone,
  User,
  Globe,
  Navigation,
} from 'lucide-react';
import type { SellerProduct } from '@/types/supplier';
import { compressImageFile } from '@/utils/imageCompressor';
import { saveProductToFirestore } from '@/firebase';
import {
  INDIAN_STATES_AND_UTS,
  POPULAR_COUNTRIES,
  getPickupLocations,
  formatPickupAddressString,
  type PickupLocation,
} from '@/shiprocket-api';

interface AddEditCatalogModalProps {
  product: SellerProduct | null;
  onClose: () => void;
  onSave: (prod: SellerProduct) => void;
}

// Preset samples for fast 1-tap testing
const SAMPLE_PRESETS = [
  {
    name: 'Cotton T-Shirt',
    category: 'fashion',
    subCategory: "Men's Round Neck T-Shirts",
    fabric: '100% Combed Cotton',
    pattern: 'Solid Plain',
    fitType: 'Oversized / Drop Shoulder',
    weight: '220',
    color: 'Black',
    price: 399,
    mrp: 999,
    images: [
      'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/1232459/pexels-photo-1232459.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/2294342/pexels-photo-2294342.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
  },
  {
    name: 'Silk Saree',
    category: 'fashion',
    subCategory: 'Kanjivaram Silk Sarees',
    fabric: 'Banarasi Soft Silk',
    pattern: 'Zari Woven Border',
    fitType: 'Free Size',
    weight: '450',
    color: 'Maroon',
    price: 899,
    mrp: 2499,
    images: [
      'https://images.pexels.com/photos/1572878/pexels-photo-1572878.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
  },
  {
    name: 'Casual Shoes',
    category: 'footwear',
    subCategory: 'Sneakers & Running Shoes',
    fabric: 'Breathable Mesh & EVA Sole',
    pattern: 'Athletic Sport Print',
    fitType: 'Standard UK Fit',
    weight: '650',
    color: 'White',
    price: 699,
    mrp: 1999,
    images: [
      'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
  },
  {
    name: 'Polo T-Shirt',
    category: 'fashion',
    subCategory: 'Classic Collar Polo',
    fabric: 'Pique Cotton 240 GSM',
    pattern: 'Solid with Tipped Collar',
    fitType: 'Polo Collar',
    weight: '240',
    color: 'Navy Blue',
    price: 549,
    mrp: 1299,
    images: [
      'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
  },
];

const AVAILABLE_SIZES = [
  'Free Size',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '4XL',
  'UK 6',
  'UK 7',
  'UK 8',
  'UK 9',
  'UK 10',
  'UK 11',
];

const AVAILABLE_COLORS = [
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#F9FAFB' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Maroon', hex: '#881337' },
  { name: 'Olive Green', hex: '#3F6212' },
  { name: 'Mustard Yellow', hex: '#D97706' },
  { name: 'Beige', hex: '#D7C4B7' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Pink', hex: '#DB2777' },
  { name: 'Grey / Charcoal', hex: '#4B5563' },
  { name: 'Sky Blue', hex: '#38BDF8' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Lavender', hex: '#A855F7' },
  { name: 'Brown', hex: '#78350F' },
];

const POPULAR_PATTERNS = [
  'Solid Plain',
  'Graphic Printed',
  'Typography / Quotes',
  'Striped',
  'Checked',
  'Floral Print',
  'Abstract Art',
  'Embroidered',
  'Tie-Dye / Acid Wash',
  'Camouflage',
  'Self-Design / Textured',
  'Zari Woven',
];

const POPULAR_FABRICS = [
  '100% Combed Cotton',
  'Cotton Blend',
  'French Terry (240+ GSM)',
  'Poly-Cotton (Dri-Fit)',
  'Denim',
  'Banarasi Soft Silk',
  'Pure Rayon',
  'Polyester Mesh',
  'Fleece Winter Wear',
  'Lycra / Spandex Stretch',
  'Pure Linen',
];

const POPULAR_FIT_TYPES = [
  'Regular Fit',
  'Oversized / Drop Shoulder',
  'Polo Collar',
  'Slim Fit',
  'Boxy Fit',
  'Relaxed Fit',
  'Sleeveless / Tank',
  'Hooded Fit',
  'Free Size',
  'Tailored Fit',
];

const CATEGORY_OPTIONS = [
  { id: 'fashion', label: 'Fashion & Clothing' },
  { id: 'footwear', label: 'Footwear & Shoes' },
  { id: 'electronics', label: 'Electronics & Gadgets' },
  { id: 'mobiles', label: 'Mobiles & Accessories' },
  { id: 'watches', label: 'Watches & Wearables' },
  { id: 'beauty', label: 'Beauty & Personal Care' },
  { id: 'home', label: 'Home & Kitchen' },
  { id: 'bags', label: 'Bags, Luggage & Wallets' },
  { id: 'jewellery', label: 'Jewellery & Accessories' },
  { id: 'sports', label: 'Sports & Fitness' },
];

export default function AddEditCatalogModal({
  product,
  onClose,
  onSave,
}: AddEditCatalogModalProps) {
  // Current Form Step (1 to 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Read registered seller default store name & address
  const activeSellerObj = (() => {
    try {
      const raw = localStorage.getItem('akselling_active_seller');
      if (raw && raw.startsWith('{')) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  })();

  // ==========================================
  // STEP 1 STATE: Images, Title, Description
  // ==========================================
  const [images, setImages] = useState<string[]>(() => {
    if (product && product.images && product.images.length > 0) {
      return [...product.images].slice(0, 5);
    }
    return [
      'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ];
  });
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(product?.title || '');
  const [description, setDescription] = useState(
    product?.description ||
      'Premium quality fabric with regular comfortable fit. Easy machine wash and soft skin-friendly texture.'
  );

  // ==========================================
  // STEP 2 STATE: Gram, Colors, Prints, Fabric, Pickup Address
  // ==========================================
  const [weight, setWeight] = useState(product?.weight?.toString() || '220');
  const [selectedColors, setSelectedColors] = useState<string[]>(
    product?.colors && product.colors.length > 0 ? product.colors : ['Black']
  );
  const [customColor, setCustomColor] = useState('');
  const [pattern, setPattern] = useState(product?.pattern || 'Solid Plain');
  const [fabric, setFabric] = useState(product?.fabric || '100% Combed Cotton');

  // Comprehensive Pickup Address Fields (For 100% Courier Clarity)
  const [savedPickupList] = useState<PickupLocation[]>(() => getPickupLocations());
  const [selectedSavedHubId, setSelectedSavedHubId] = useState<string>('custom');

  const defaultLoc = savedPickupList[0];
  const [pickupCountry, setPickupCountry] = useState(
    'India (Domestic Express Pickup)'
  );
  const [pickupState, setPickupState] = useState(
    activeSellerObj?.state || defaultLoc?.state || 'Haryana'
  );
  const [pickupCity, setPickupCity] = useState(
    activeSellerObj?.city || defaultLoc?.city || 'Gurugram'
  );
  const [pickupFacilityName, setPickupFacilityName] = useState(
    activeSellerObj?.business_name || defaultLoc?.name || 'Primary Central Logistics Hub'
  );
  const [pickupStreetAddress, setPickupStreetAddress] = useState(
    defaultLoc?.address_line1 || 'Plot No. 42, 2nd Floor, Udyog Vihar Phase 4'
  );
  const [pickupPincode, setPickupPincode] = useState(
    activeSellerObj?.pincode || defaultLoc?.pincode || '122015'
  );
  const [pickupLandmark, setPickupLandmark] = useState(
    defaultLoc?.landmark || 'Near Cyber City Express Highway & Metro Gate 2'
  );
  const [pickupContactPerson, setPickupContactPerson] = useState(
    activeSellerObj?.full_name || defaultLoc?.contact_person || 'Anoj Kumar (Logistics Head)'
  );
  const [pickupPhone, setPickupPhone] = useState(
    activeSellerObj?.phone || defaultLoc?.phone || '+91 98765 43210'
  );

  const [pickupLocation, setPickupLocation] = useState(
    product?.pickupLocation ||
      formatPickupAddressString({
        name: pickupFacilityName,
        address_line1: pickupStreetAddress,
        landmark: pickupLandmark,
        city: pickupCity,
        state: pickupState,
        pincode: pickupPincode,
        country: pickupCountry,
        contact_person: pickupContactPerson,
        phone: pickupPhone,
      })
  );

  const handleSelectSavedHub = (hubId: string) => {
    setSelectedSavedHubId(hubId);
    if (hubId === 'custom') return;
    const found = savedPickupList.find(h => h.id === hubId);
    if (found) {
      setPickupFacilityName(found.name);
      setPickupStreetAddress(found.address_line1 || found.addressLine1 || '');
      setPickupLandmark(found.landmark || '');
      setPickupCity(found.city);
      setPickupState(found.state);
      setPickupPincode(found.pincode);
      setPickupCountry(found.country || 'India (Domestic Express Pickup)');
      setPickupContactPerson(found.contact_person || found.contactPerson || 'Logistics Incharge');
      setPickupPhone(found.phone);
      setPickupLocation(formatPickupAddressString(found));
    }
  };

  // ==========================================
  // STEP 3 STATE: Product ID, Brand Name (with Generic Option), Category & Fit/Subcategory
  // ==========================================
  const [productId, setProductId] = useState(
    product?.id || `PRD-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [brand, setBrand] = useState(
    product?.brand || activeSellerObj?.business_name || 'Generic'
  );
  const [category, setCategory] = useState(product?.category || 'fashion');
  const [fitType, setFitType] = useState(product?.fitType || 'Regular Fit');
  const [subCategory, setSubCategory] = useState(
    product?.subCategory || "Men's Round Neck T-Shirts"
  );

  // ==========================================
  // STEP 4 STATE: Pricing, Master SKU, Sizes & Size-wise Quantity & SKU Box
  // ==========================================
  const [price, setPrice] = useState(product?.price?.toString() || '499');
  const [mrp, setMrp] = useState(product?.mrp?.toString() || '999');
  const [gstRate, setGstRate] = useState<number>(product?.gstRate ?? 5);

  const [masterSku, setMasterSku] = useState(
    product?.sku ||
      `AK-${(product?.category || 'FASH').toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`
  );

  const [selectedSizes, setSelectedSizes] = useState<string[]>(() => {
    return product?.sizes && product.sizes.length > 0
      ? product.sizes
      : ['S', 'M', 'L', 'XL'];
  });

  // Size -> Stock quantity
  const [sizeStockMap, setSizeStockMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (product?.sizeStock && product.sizeStock.length > 0) {
      product.sizeStock.forEach(item => {
        map[item.size] = item.stock;
      });
    } else {
      const initialTotal = product?.stock || 40;
      const initialSizes =
        product?.sizes && product.sizes.length > 0
          ? product.sizes
          : ['S', 'M', 'L', 'XL'];
      const perSize = Math.max(1, Math.floor(initialTotal / initialSizes.length));
      initialSizes.forEach(s => {
        map[s] = perSize;
      });
    }
    return map;
  });

  // Size -> SKU ID dabba map
  const [sizeSkuMap, setSizeSkuMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    const base = product?.sku || `TSH-${Math.floor(100 + Math.random() * 900)}`;
    if (product?.sizeStock && product.sizeStock.length > 0) {
      product.sizeStock.forEach(item => {
        map[item.size] = item.sku || `${base}-${item.size}`;
      });
    } else {
      const initialSizes =
        product?.sizes && product.sizes.length > 0
          ? product.sizes
          : ['S', 'M', 'L', 'XL'];
      initialSizes.forEach(s => {
        map[s] = `${base}-${s}`;
      });
    }
    return map;
  });

  // Math calculations
  const numPrice = parseInt(price) || 0;
  const numMrp = parseInt(mrp) || (numPrice ? numPrice * 2 : 0);
  const discountPercent =
    numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;

  // Calculated total stock across all selected size boxes
  const calculatedTotalStock = selectedSizes.reduce(
    (acc, sz) => acc + (sizeStockMap[sz] || 0),
    0
  );

  // ------------------------------------------
  // Image Upload Handlers
  // ------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      alert('Maximum 5 images allowed. Delete an existing image first.');
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);
    for (const file of filesToRead) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.75);
        if (compressed) {
          setImages(prev => {
            if (prev.length < 5) return [...prev, compressed];
            return prev;
          });
        }
      } catch (err) {
        console.error('Image compression error:', err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    if (images.length >= 5) {
      alert('Maximum 5 images allowed.');
      return;
    }
    setImages(prev => [...prev, urlInput.trim()]);
    setUrlInput('');
    setShowUrlField(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  };

  // ------------------------------------------
  // Preset Quick-Fill
  // ------------------------------------------
  const handleApplyPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setTitle(`${brand === 'Generic' ? '' : brand + ' '}Premium ${preset.name} (${preset.fabric})`);
    setCategory(preset.category);
    setSubCategory(preset.subCategory);
    setFabric(preset.fabric);
    setPattern(preset.pattern);
    setFitType(preset.fitType);
    setWeight(preset.weight);
    if (!selectedColors.includes(preset.color)) {
      setSelectedColors([preset.color]);
    }
    setPrice(preset.price.toString());
    setMrp(preset.mrp.toString());
    setImages(preset.images);
    const newSku = `AK-${preset.category.toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;
    setMasterSku(newSku);
    // update size sku map
    const newMap: Record<string, string> = {};
    selectedSizes.forEach(s => {
      newMap[s] = `${newSku}-${s}`;
    });
    setSizeSkuMap(newMap);
  };

  // ------------------------------------------
  // Color & Size Handlers
  // ------------------------------------------
  const handleToggleColor = (colorName: string) => {
    if (selectedColors.includes(colorName)) {
      if (selectedColors.length === 1) {
        alert('At least 1 color must be selected.');
        return;
      }
      setSelectedColors(prev => prev.filter(c => c !== colorName));
    } else {
      setSelectedColors(prev => [...prev, colorName]);
    }
  };

  const handleAddCustomColor = () => {
    const trimmed = customColor.trim();
    if (!trimmed) return;
    if (!selectedColors.includes(trimmed)) {
      setSelectedColors(prev => [...prev, trimmed]);
    }
    setCustomColor('');
  };

  const handleToggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length === 1) {
        alert('At least 1 size must be selected.');
        return;
      }
      setSelectedSizes(prev => prev.filter(s => s !== size));
    } else {
      setSelectedSizes(prev => [...prev, size]);
      if (!sizeStockMap[size]) {
        setSizeStockMap(prev => ({ ...prev, [size]: 10 }));
      }
      if (!sizeSkuMap[size]) {
        setSizeSkuMap(prev => ({
          ...prev,
          [size]: `${masterSku || 'SKU'}-${size}`,
        }));
      }
    }
  };

  const handleSizeStockChange = (size: string, qty: number) => {
    setSizeStockMap(prev => ({
      ...prev,
      [size]: Math.max(0, qty),
    }));
  };

  const handleSizeSkuChange = (size: string, skuVal: string) => {
    setSizeSkuMap(prev => ({
      ...prev,
      [size]: skuVal,
    }));
  };

  // ------------------------------------------
  // Step Navigation & Validation
  // ------------------------------------------
  const handleNextFromStep1 = () => {
    if (images.length === 0) {
      alert('Kripya kam se kam 1 product photo upload ya add karein.');
      return;
    }
    if (!title.trim()) {
      alert('Kripya product ka Title / Naam darj karein.');
      return;
    }
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    if (selectedColors.length === 0) {
      alert('Kripya kam se kam 1 color chunein.');
      return;
    }
    if (!pickupPincode || pickupPincode.trim().length < 6) {
      alert('Kripya 6-digit Pickup PIN Code darj karein.');
      return;
    }
    if (!pickupCity.trim()) {
      alert('Kripya Pickup City / Jila darj karein.');
      return;
    }

    // Auto sync formatted pickup string
    const formatted = formatPickupAddressString({
      name: pickupFacilityName.trim() || 'Seller Pickup Hub',
      address_line1: pickupStreetAddress.trim(),
      landmark: pickupLandmark.trim(),
      city: pickupCity.trim(),
      state: pickupState.trim(),
      pincode: pickupPincode.trim(),
      country: pickupCountry.trim(),
      contact_person: pickupContactPerson.trim(),
      phone: pickupPhone.trim(),
    });
    setPickupLocation(formatted);
    setCurrentStep(3);
  };

  const handleNextFromStep3 = () => {
    if (!brand.trim()) {
      setBrand('Generic');
    }
    setCurrentStep(4);
  };

  // ------------------------------------------
  // Final Form Submit & Publish
  // ------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      alert('Kripya product image add karein.');
      setCurrentStep(1);
      return;
    }

    if (!title.trim()) {
      alert('Kripya product title darj karein.');
      setCurrentStep(1);
      return;
    }

    const finalStock = calculatedTotalStock > 0 ? calculatedTotalStock : 25;
    const finalMasterSku = masterSku.trim() || `AK-CAT-${Math.floor(100 + Math.random() * 900)}`;

    const sizeStockArray = selectedSizes.map(sz => ({
      size: sz,
      stock: sizeStockMap[sz] ?? 10,
      sku: sizeSkuMap[sz] || `${finalMasterSku}-${sz}`,
    }));

    const finalPickupLocation =
      pickupLocation.trim() ||
      formatPickupAddressString({
        name: pickupFacilityName.trim() || 'Seller Pickup Hub',
        address_line1: pickupStreetAddress.trim(),
        landmark: pickupLandmark.trim(),
        city: pickupCity.trim(),
        state: pickupState.trim(),
        pincode: pickupPincode.trim(),
        country: pickupCountry.trim(),
        contact_person: pickupContactPerson.trim(),
        phone: pickupPhone.trim(),
      });

    const finalProduct: SellerProduct = {
      id: product?.id || productId || `sp_${Date.now()}`,
      catalogId:
        product?.catalogId || `CAT-${Math.floor(10000 + Math.random() * 90000)}`,
      sku: finalMasterSku.toUpperCase(),
      title: title.trim(),
      description: description.trim(),
      price: numPrice || 499,
      mrp: numMrp || 999,
      discount: discountPercent,
      category,
      subCategory: subCategory.trim() || fitType,
      images,
      stock: finalStock,
      brand: brand.trim() || 'Generic',
      status: finalStock > 0 ? 'live' : 'out_of_stock',
      fabric: fabric.trim(),
      pattern: pattern.trim(),
      fitType: fitType.trim(),
      sizes: selectedSizes,
      colors: selectedColors,
      gstRate,
      pickupLocation: finalPickupLocation,
      weight: parseInt(weight) || 220,
      sizeStock: sizeStockArray,
      salesCount: product?.salesCount || 0,
      views: product?.views || 0,
      rating: product?.rating ?? 0.0,
    };

    saveProductToFirestore(finalProduct).catch(() => {});
    onSave(finalProduct);
  };

  return (
    <div
      id="add-edit-catalog-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh] my-auto animate-scale-up border border-gray-100">
        
        {/* Header with Flipkart Blue styling & Step Badges */}
        <div className="bg-[#2874f0] text-white p-4 shrink-0 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black">
                <Sparkles size={18} className="text-yellow-300" />
              </div>
              <div>
                <h2 className="font-black text-sm sm:text-base leading-tight">
                  {product ? 'Edit Product Catalog' : 'Add New Product (AKSelling Seller Hub)'}
                </h2>
                <p className="text-[11px] text-blue-100 mt-0.5">
                  Mobile Form Flow • 0% Commission • Instant Live
                </p>
              </div>
            </div>
            <button
              id="close-catalog-modal-btn"
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white"
            >
              <X size={19} />
            </button>
          </div>

          {/* 4-Step Progress Indicator */}
          <div className="grid grid-cols-4 gap-1.5 mt-3.5 pt-2.5 border-t border-blue-400/40 text-[10px] sm:text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-all ${
                currentStep === 1
                  ? 'bg-white text-[#2874f0] shadow-xs'
                  : currentStep > 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500/40 text-blue-200'
              }`}
            >
              <span>1. Photos & Info</span>
              {currentStep > 1 && <Check size={11} />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (images.length > 0 && title.trim()) setCurrentStep(2);
                else alert('Pehle Step 1 complete karein (Photos & Title)');
              }}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-all ${
                currentStep === 2
                  ? 'bg-white text-[#2874f0] shadow-xs'
                  : currentStep > 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500/40 text-blue-200'
              }`}
            >
              <span>2. Specs & Pickup</span>
              {currentStep > 2 && <Check size={11} />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (images.length > 0 && title.trim()) setCurrentStep(3);
                else alert('Pehle Step 1 complete karein');
              }}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-all ${
                currentStep === 3
                  ? 'bg-white text-[#2874f0] shadow-xs'
                  : currentStep > 3
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500/40 text-blue-200'
              }`}
            >
              <span>3. Brand & Style</span>
              {currentStep > 3 && <Check size={11} />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (images.length > 0 && title.trim()) setCurrentStep(4);
                else alert('Pehle basic steps complete karein');
              }}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-all ${
                currentStep === 4
                  ? 'bg-white text-[#2874f0] shadow-xs'
                  : 'bg-blue-500/40 text-blue-200'
              }`}
            >
              <span>4. Price & SKUs</span>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs space-y-4">
          
          {/* Quick Presets Bar (Always Accessible) */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#2874f0]" />
              <span className="font-bold text-[#2874f0] text-[11px]">
                1-Tap Quick Fill Presets:
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SAMPLE_PRESETS.map((pst, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(pst)}
                  className="bg-white hover:bg-[#2874f0] hover:text-white text-gray-700 font-bold px-2 py-1 rounded-lg border border-blue-200 text-[10px] shadow-2xs transition-all"
                >
                  {pst.name}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 1: ONLY PRODUCT IMAGE, TITLE & DESCRIPTION */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
                <Info size={16} className="text-[#2874f0] shrink-0 mt-0.5" />
                <p className="text-gray-700 text-[11px] leading-relaxed">
                  <strong>Step 1:</strong> Yahan product ki photos upload karein, Title aur Description likhein. Agle steps me Specs, Brand, Fit type aur Size-wise SKU ID bharein.
                </p>
              </div>

              {/* Photos Upload & Preview Grid */}
              <div className="space-y-2 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="font-black text-gray-900 text-xs flex items-center gap-1.5">
                      <ImageIcon size={16} className="text-[#2874f0]" />
                      <span>Product Photos ({images.length}/5 uploaded) *</span>
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Pehli photo main <strong>Cover Photo</strong> banegi.
                    </p>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 shadow-2xs transition-all"
                    >
                      <Upload size={13} />
                      <span>Upload Files</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlField(!showUrlField)}
                      className="bg-white hover:bg-gray-100 text-gray-700 font-bold px-2.5 py-1.5 rounded-xl text-[11px] border border-gray-300 flex items-center gap-1 transition-all"
                    >
                      <Link size={13} />
                      <span>Photo URL</span>
                    </button>
                  </div>
                </div>

                {/* URL Input Dropdown */}
                {showUrlField && (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...)"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs focus:border-[#2874f0] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrlImage}
                      className="bg-gray-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-black transition-colors"
                    >
                      Add Photo
                    </button>
                  </div>
                )}

                {/* 5-Photo Slots Grid */}
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {[0, 1, 2, 3, 4].map(idx => {
                    const imgUrl = images[idx];
                    return (
                      <div
                        key={idx}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center ${
                          imgUrl
                            ? idx === 0
                              ? 'border-[#2874f0] bg-blue-50 ring-2 ring-blue-400/40 shadow-xs'
                              : 'border-gray-200 bg-white shadow-2xs'
                            : 'border-dashed border-gray-300 bg-gray-100/60 hover:bg-gray-100'
                        }`}
                      >
                        {imgUrl ? (
                          <>
                            <img
                              src={imgUrl}
                              alt={`Slot ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {idx === 0 && (
                              <div className="absolute top-1 left-1 bg-[#2874f0] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                <Star size={8} className="fill-current" /> Cover
                              </div>
                            )}

                            {/* Action Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              {idx !== 0 && (
                                <button
                                  type="button"
                                  title="Make Cover Image"
                                  onClick={() => handleSetCover(idx)}
                                  className="p-1 bg-white text-gray-900 rounded-md hover:bg-yellow-400 transition-colors"
                                >
                                  <Star size={12} />
                                </button>
                              )}
                              <button
                                type="button"
                                title="Delete Image"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-[#2874f0]"
                          >
                            <Plus size={16} />
                            <span className="text-[9px] font-bold mt-0.5">Slot {idx + 1}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product Title Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 text-xs">
                    Product Title / Name *
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {title.length}/120 characters
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Men Oversized Graphic Print Pure Cotton T-Shirt (Drop Shoulder)"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#2874f0] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <p className="text-[10px] text-gray-500">
                  Tip: Title me Brand, Fabric, Pattern aur Fit type mention karein jisse customer ko search me asani ho.
                </p>
              </div>

              {/* Product Description */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 text-xs">
                  Product Description / Vivaran *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Fabric quality, wash care instructions, stitching details, and styling advice..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white focus:border-[#2874f0] focus:ring-2 focus:ring-blue-100 outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Step 1 Navigation Button */}
              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md hover:shadow-lg flex items-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span>Aage Badhein (Step 2: Specs & Pickup)</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: GRAM, COLOR, PRINT, FABRIC & PICKUP ADDRESS */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
                <Scale size={16} className="text-[#2874f0] shrink-0 mt-0.5" />
                <p className="text-gray-700 text-[11px] leading-relaxed">
                  <strong>Step 2 (Specifications & Logistics):</strong> Yahan product ka gram/weight, colors, fabric, print design aur pickup warehouse address darj karein.
                </p>
              </div>

              {/* Product Weight / Gram */}
              <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                    <Scale size={15} className="text-[#2874f0]" />
                    <span>Product Gram / Weight (GSM or grams) *</span>
                  </label>
                  <span className="text-[10px] text-gray-500">Shipping courier calculation</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['180', '220', '240', '350'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setWeight(g)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        weight === g
                          ? 'bg-[#2874f0] text-white border-[#2874f0] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {g} grams / GSM
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="Custom weight in grams"
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:border-[#2874f0] outline-none"
                  />
                  <span className="text-xs font-bold text-gray-500 shrink-0">grams</span>
                </div>
              </div>

              {/* Color Selection */}
              <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                    <Palette size={15} className="text-[#2874f0]" />
                    <span>Product Color(s) * ({selectedColors.join(', ')})</span>
                  </label>
                  <span className="text-[10px] text-gray-500">Select multiple if multi-pack</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {AVAILABLE_COLORS.map(c => {
                    const isSelected = selectedColors.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleToggleColor(c.name)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-blue-50 text-[#2874f0] border-[#2874f0] ring-1 ring-blue-400/30'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                        {isSelected && <Check size={11} className="text-[#2874f0]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Adder */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom color (e.g. Teal, Mint Green)"
                    value={customColor}
                    onChange={e => setCustomColor(e.target.value)}
                    className="flex-1 px-3 py-1 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:border-[#2874f0]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="bg-gray-800 hover:bg-black text-white text-xs font-bold px-3 py-1 rounded-xl transition-colors"
                  >
                    + Add Color
                  </button>
                </div>
              </div>

              {/* Print / Pattern & Fabric Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Print / Pattern */}
                <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200 space-y-1.5">
                  <label className="font-bold text-gray-800 text-xs">
                    Print / Pattern Type *
                  </label>
                  <select
                    value={pattern}
                    onChange={e => setPattern(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:border-[#2874f0] outline-none"
                  >
                    {POPULAR_PATTERNS.map(pat => (
                      <option key={pat} value={pat}>
                        {pat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fabric / Material */}
                <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200 space-y-1.5">
                  <label className="font-bold text-gray-800 text-xs">
                    Fabric / Material *
                  </label>
                  <select
                    value={fabric}
                    onChange={e => setFabric(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:border-[#2874f0] outline-none"
                  >
                    {POPULAR_FABRICS.map(fab => (
                      <option key={fab} value={fab}>
                        {fab}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comprehensive Shiprocket Courier Pickup Address Form */}
              <div className="bg-gradient-to-br from-blue-50/70 via-gray-50 to-emerald-50/40 p-3.5 sm:p-4 rounded-2xl border-2 border-blue-200/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#2874f0] text-white flex items-center justify-center shadow-xs">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-xs sm:text-sm">
                        Courier Pickup Address & Landmark (Shiprocket Hub)
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        Courier boy is location par aakar parcel load karega.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Shiprocket Active
                  </span>
                </div>

                {/* Quick select saved hub */}
                {savedPickupList.length > 0 && (
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Quick Select Saved Hub / Custom Fill:
                    </label>
                    <select
                      value={selectedSavedHubId}
                      onChange={e => handleSelectSavedHub(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:border-[#2874f0] outline-none"
                    >
                      <option value="custom">✏️ Enter Custom Address Below</option>
                      {savedPickupList.map(hub => (
                        <option key={hub.id} value={hub.id}>
                          🏬 {hub.name} ({hub.city}, {hub.state} - {hub.pincode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Row 1: Country & State Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Country Selection */}
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                    <label className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                      <Globe size={13} className="text-[#2874f0]" />
                      <span>Country / Desh *</span>
                    </label>
                    <select
                      value={pickupCountry}
                      onChange={e => setPickupCountry(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:border-[#2874f0] outline-none"
                    >
                      {POPULAR_COUNTRIES.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* State / Pradesh Selection */}
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                    <label className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                      <Navigation size={13} className="text-orange-500" />
                      <span>State / Pradesh (Rajya) *</span>
                    </label>
                    <select
                      value={pickupState}
                      onChange={e => setPickupState(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:border-[#2874f0] outline-none"
                    >
                      {INDIAN_STATES_AND_UTS.map(st => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: City & 6-Digit PIN Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* City / District */}
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                    <label className="font-bold text-gray-800 text-[11px]">
                      City / District (Shahar / Jila) *
                    </label>
                    <input
                      type="text"
                      required
                      value={pickupCity}
                      onChange={e => setPickupCity(e.target.value)}
                      placeholder="e.g. Gurugram / Surat / New Delhi"
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:border-[#2874f0] outline-none"
                    />
                  </div>

                  {/* Pickup PIN Code */}
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                    <label className="font-bold text-gray-800 text-[11px]">
                      Pickup PIN Code (6-Digits) *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={pickupPincode}
                      onChange={e => setPickupPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 122015 or 110020"
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-[#2874f0] tracking-wider focus:border-[#2874f0] outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Row 3: Facility / Warehouse / Store Name */}
                <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                  <label className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                    <Building2 size={13} className="text-gray-600" />
                    <span>Pickup Warehouse / Store / Facility Name *</span>
                  </label>
                  <input
                    type="text"
                    value={pickupFacilityName}
                    onChange={e => setPickupFacilityName(e.target.value)}
                    placeholder="e.g. Primary Central Warehouse / AK Yadav Apparel Studio"
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:border-[#2874f0] outline-none"
                  />
                </div>

                {/* Row 4: Detailed Street / Building / Floor Address */}
                <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                  <label className="font-bold text-gray-800 text-[11px]">
                    Detailed Building / Plot / Floor / Gali Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupStreetAddress}
                    onChange={e => setPickupStreetAddress(e.target.value)}
                    placeholder="e.g. Plot No. 42, 2nd Floor, Udyog Vihar Phase 4"
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:border-[#2874f0] outline-none"
                  />
                </div>

                {/* Row 5: Famous Landmark (Aaspaas ki jaane-pehchani jagah) */}
                <div className="bg-white p-2.5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-1">
                  <label className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                    <Navigation size={13} className="text-amber-600" />
                    <span>Nearby Famous Landmark (Aas-Paas Ki Jaane-Pehchani Jagah) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupLandmark}
                    onChange={e => setPickupLandmark(e.target.value)}
                    placeholder="e.g. Near Cyber City Express Highway & Metro Gate 2 / Opp. Hanuman Mandir"
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-gray-800 focus:border-amber-500 outline-none"
                  />
                  <p className="text-[9.5px] text-amber-700 font-medium">
                    ⚠️ Landmark se pickup rider bina kisi pareshani ke seedhe aapke godam par pahunchega.
                  </p>
                </div>

                {/* Row 6: Contact Person & Mobile Phone for Courier Boy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                    <label className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                      <User size={13} className="text-gray-600" />
                      <span>Pickup Contact Person *</span>
                    </label>
                    <input
                      type="text"
                      value={pickupContactPerson}
                      onChange={e => setPickupContactPerson(e.target.value)}
                      placeholder="e.g. Anoj Kumar (Manager)"
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:border-[#2874f0] outline-none"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                    <label className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                      <Phone size={13} className="text-emerald-600" />
                      <span>Courier Calling Mobile Number *</span>
                    </label>
                    <input
                      type="text"
                      value={pickupPhone}
                      onChange={e => setPickupPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:border-[#2874f0] outline-none"
                    />
                  </div>
                </div>

                {/* Live Courier Rider Preview Banner */}
                <div className="bg-blue-900 text-white p-3 rounded-xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-blue-200 font-bold">
                    <span>COURIER MANIFEST ADDRESS PREVIEW</span>
                    <span className="bg-yellow-400 text-black px-1.5 py-0.2 rounded font-black">
                      Live Shiprocket Sync
                    </span>
                  </div>
                  <p className="text-xs font-medium text-blue-50 leading-relaxed">
                    📍 <span className="font-bold text-white">{pickupFacilityName || 'Hub'}</span>,{' '}
                    {pickupStreetAddress || 'Address'}, Near {pickupLandmark || 'Landmark'},{' '}
                    {pickupCity || 'City'}, {pickupState || 'State'} -{' '}
                    <span className="font-bold text-yellow-300">{pickupPincode || 'Pincode'}</span>,{' '}
                    {pickupCountry}. <br />
                    📞 Contact: <span className="font-bold">{pickupContactPerson}</span> (
                    {pickupPhone})
                  </p>
                </div>
              </div>

              {/* Step 2 Navigation Buttons */}
              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <ChevronLeft size={16} />
                  <span>Peeche (Step 1)</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md hover:shadow-lg flex items-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span>Aage Badhein (Step 3: Brand & Category)</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PRODUCT ID, BRAND NAME (WITH GENERIC OPTION) & CATEGORY FIT */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
                <Tag size={16} className="text-[#2874f0] shrink-0 mt-0.5" />
                <p className="text-gray-700 text-[11px] leading-relaxed">
                  <strong>Step 3 (Brand, Category & Style):</strong> Apna Product ID, Brand Name (ya Generic/No-Brand chunein) aur category chunne ke baad Fit type (Regular, Oversized, Polo) select karein.
                </p>
              </div>

              {/* Product ID & Auto-generator */}
              <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 text-xs">
                    Product ID / Style Code *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setProductId(`PRD-${Math.floor(100000 + Math.random() * 900000)}`)
                    }
                    className="text-[10px] text-[#2874f0] font-bold hover:underline"
                  >
                    Regenerate ID
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  placeholder="e.g. PRD-948201 or STYLE-01"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold focus:border-[#2874f0] outline-none"
                />
              </div>

              {/* Brand Name & New Generic / No-Brand Button */}
              <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                    <Building2 size={15} className="text-[#2874f0]" />
                    <span>Brand Name *</span>
                  </label>

                  {/* 1-Tap Generic / No Brand Button */}
                  <button
                    type="button"
                    onClick={() => setBrand('Generic')}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all ${
                      brand === 'Generic' || brand === 'Non-Branded'
                        ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-amber-50'
                    }`}
                  >
                    {brand === 'Generic' ? '✓ Generic (No Brand Selected)' : '+ Use Generic / No Brand'}
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="Brand name darj karein (e.g. AK Yadav Prints ya Generic)"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:border-[#2874f0] outline-none"
                />
                <p className="text-[10px] text-gray-500">
                  Agar aapka registered brand nahi hai, to <strong>"Generic"</strong> button par click karein.
                </p>
              </div>

              {/* Category Selection */}
              <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200 space-y-2">
                <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                  <Layers size={15} className="text-[#2874f0]" />
                  <span>Category (Konsi Category me daal rahe hain) *</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2 rounded-xl text-left text-xs font-bold border transition-all ${
                        category === cat.id
                          ? 'bg-blue-50 border-[#2874f0] text-[#2874f0] ring-1 ring-blue-300'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{cat.label}</span>
                        {category === cat.id && <Check size={12} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fit Type & Style: Regular, Oversized, Polo, etc. */}
              <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                    <Shirt size={15} className="text-[#2874f0]" />
                    <span>Fit Type & Style (Regular, Oversized, Polo, etc.) *</span>
                  </label>
                  <span className="text-[10px] text-gray-500">{fitType}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POPULAR_FIT_TYPES.map(fit => {
                    const isSelected = fitType === fit;
                    return (
                      <button
                        key={fit}
                        type="button"
                        onClick={() => {
                          setFitType(fit);
                          setSubCategory(fit);
                        }}
                        className={`p-2 rounded-xl text-left text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-[#2874f0] text-white border-[#2874f0] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{fit}</span>
                          {isSelected && <Check size={12} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3 Navigation Buttons */}
              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <ChevronLeft size={16} />
                  <span>Peeche (Step 2)</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextFromStep3}
                  className="bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md hover:shadow-lg flex items-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span>Aage Badhein (Step 4: Price & SKUs)</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: PRICING, SIZES, SIZE-WISE QUANTITY & SKU ID BOXES, AND PUBLISH */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
                <Boxes size={16} className="text-[#2874f0] shrink-0 mt-0.5" />
                <p className="text-gray-700 text-[11px] leading-relaxed">
                  <strong>Step 4 (Price & Size SKU Matrix):</strong> Yahan price daalein, sizes chunein aur har size ke liye quantity aur SKU ID dabba bharein. Niche diye button se product turant live publish ho jayega!
                </p>
              </div>

              {/* Pricing Grid */}
              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200 space-y-3">
                <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <Percent size={15} className="text-[#2874f0]" />
                  <span>Pricing & 0% Commission Payout</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-600 text-[11px] font-bold mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={49}
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="e.g. 499"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-black text-sm text-[#2874f0] focus:border-[#2874f0] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 text-[11px] font-bold mb-1">
                      MRP / Cut Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={numPrice || 99}
                      value={mrp}
                      onChange={e => setMrp(e.target.value)}
                      placeholder="e.g. 999"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-bold text-sm text-gray-700 focus:border-[#2874f0] outline-none"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex flex-col justify-center bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-emerald-800 font-extrabold uppercase">
                      Customer Discount
                    </span>
                    <span className="text-sm font-black text-emerald-700">
                      {discountPercent}% OFF
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-white p-2.5 rounded-xl border border-gray-200">
                  <span className="text-gray-600">GST Tax Rate:</span>
                  <div className="flex gap-1.5">
                    {[0, 5, 12, 18].map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setGstRate(rate)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          gstRate === rate
                            ? 'bg-[#2874f0] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Master Catalog SKU ID */}
              <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                    <Barcode size={15} className="text-[#2874f0]" />
                    <span>Catalog SKU Code (Master SKU) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newSku = `AK-${category.toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;
                      setMasterSku(newSku);
                      const newMap: Record<string, string> = {};
                      selectedSizes.forEach(s => {
                        newMap[s] = `${newSku}-${s}`;
                      });
                      setSizeSkuMap(newMap);
                    }}
                    className="text-[10px] text-[#2874f0] font-bold hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={masterSku}
                  onChange={e => setMasterSku(e.target.value)}
                  placeholder="e.g. AK-FASH-TSH-102"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold uppercase focus:border-[#2874f0] outline-none"
                />
              </div>

              {/* Available Sizes Chip Selector */}
              <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 text-xs">
                    Select Available Sizes *
                  </label>
                  <span className="text-[10px] text-gray-500">
                    {selectedSizes.length} sizes active
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {AVAILABLE_SIZES.map(sz => {
                    const isSelected = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-[#2874f0] text-white border-[#2874f0] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ================================================================= */}
              {/* SIZE-WISE DEDICATED DABBA / BOX LIST WITH QUANTITY & SKU ID INPUT */}
              {/* ================================================================= */}
              <div className="space-y-2.5 bg-blue-50/40 p-3.5 rounded-2xl border border-blue-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-gray-900 text-xs">
                      Size-Wise Stock & SKU Boxes
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Har size ke liye Quantity aur uske bagal me SKU ID ka dabba
                    </p>
                  </div>
                  <div className="bg-white px-2.5 py-1 rounded-xl border border-blue-200 text-[11px] font-black text-[#2874f0]">
                    Total Stock: {calculatedTotalStock} units
                  </div>
                </div>

                {/* Individual Size Box List */}
                <div className="space-y-2 pt-1">
                  {selectedSizes.map(sz => {
                    const currentQty = sizeStockMap[sz] ?? 10;
                    const currentSku = sizeSkuMap[sz] ?? `${masterSku}-${sz}`;

                    return (
                      <div
                        key={sz}
                        className="bg-white rounded-xl p-2.5 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                      >
                        {/* Size Badge */}
                        <div className="w-16 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-black text-xs text-[#2874f0] shrink-0">
                          {sz}
                        </div>

                        {/* Quantity Dabba */}
                        <div className="flex-1 min-w-[140px]">
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                            Quantity (Stock)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSizeStockChange(sz, Math.max(0, currentQty - 1))}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm flex items-center justify-center"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={currentQty}
                              onChange={e => handleSizeStockChange(sz, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-center focus:bg-white focus:border-[#2874f0] outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSizeStockChange(sz, currentQty + 1)}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm flex items-center justify-center"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-gray-400">units</span>
                          </div>
                        </div>

                        {/* SKU ID Dabba */}
                        <div className="flex-1 min-w-[170px]">
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                            Size SKU ID
                          </label>
                          <input
                            type="text"
                            value={currentSku}
                            onChange={e => handleSizeSkuChange(sz, e.target.value)}
                            placeholder={`e.g. ${masterSku}-${sz}`}
                            className="w-full px-2.5 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:bg-white focus:border-[#2874f0] outline-none uppercase"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Final Publish / Update Buttons */}
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <ChevronLeft size={16} />
                    <span>Peeche (Step 3)</span>
                  </button>

                  <button
                    type="submit"
                    id="publish-catalog-submit-btn"
                    className="bg-gradient-to-r from-[#2874f0] to-[#124ebb] hover:opacity-95 text-white font-black px-6 sm:px-8 py-3 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg flex items-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <CheckCircle2 size={18} className="text-yellow-300" />
                    <span>
                      {product ? 'Update & Save Product' : '✓ Publish Product to Live Store'}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-center text-[11px] text-emerald-800 font-semibold">
                  🚀 Publish hote hi product aapke app ke Home Page aur Search me instantly active dikhne lagega!
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
