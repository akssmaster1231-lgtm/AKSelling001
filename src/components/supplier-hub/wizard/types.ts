export interface WizardVariantItem {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price?: number;
}

export interface WizardPickupAddress {
  businessName: string;
  street: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  phone: string;
}

export interface WizardStorefrontPlacement {
  homepage: boolean;
  categoryPages: boolean;
  bestDeals: boolean;
}

export interface WizardFormData {
  id: string;
  catalogId?: string;
  
  // Step 1
  category: string;
  categoryName?: string;

  // Step 2
  images: string[];
  title: string;
  description: string;

  // Step 3
  weightGsm: string;
  colors: string[];
  fabric: string;
  productType: string;
  printDesign: string;
  sizes: string[];
  price: number;
  mrp: number;
  isFreeShipping: boolean;
  shippingCharge: number;
  deliveryEstimate: string;

  // Step 4
  pickupAddress: WizardPickupAddress;
  sleeveType: string;
  neckType: string;
  fitType: string;
  brand: string;

  // Step 5
  variants: WizardVariantItem[];
  storefrontPlacement: WizardStorefrontPlacement;
}

export interface WizardStepProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  onNext: () => void;
  onBack: () => void;
}
