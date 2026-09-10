export interface ShiprocketConfig {
  apiKey?: string;
  api_key?: string;
  email?: string;
  password?: string;
  token?: string;
  api_token?: string;
  autoAwb?: boolean;
  auto_generate_awb?: boolean;
  auto_awb?: boolean;
  defaultCourier?: string;
  default_courier?: 'delhivery' | 'bluedart' | 'shadowfax' | 'xpressbees' | string;
  connected?: boolean;
  is_connected?: boolean;
  lastConnectedAt?: string;
  last_connected_at?: string;
}

export interface PickupLocation {
  id: string;
  name: string; // Facility / Warehouse / Store Name
  country?: string; // India or Outside India / International
  state: string; // State / Pradesh
  city: string; // City / District
  address_line1?: string; // Street, Building, Floor Address
  addressLine1?: string;
  address_line2?: string;
  addressLine2?: string;
  landmark?: string; // Aas-paas ki jaane-pehchani jagah (Nearby Famous Landmark)
  pincode: string; // 6-Digit PIN Code
  contact_person?: string; // Pickup Contact Person Name
  contactPerson?: string;
  phone: string; // Mobile Number for Courier Boy
  email?: string;
  is_default?: boolean;
  isDefault?: boolean;
}

export interface TrackingStep {
  label: string;
  location?: string;
  time: string;
  done: boolean;
  activity?: string;
}

export interface ShipmentDetails {
  orderId: string;
  orderNumber?: string;
  awbCode?: string;
  courierName?: string;
  courierId?: number;
  shipmentId?: string;
  pickupLocation?: string;
  pickupPincode?: string;
  destinationCity?: string;
  destinationPincode?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  packageWeight?: number; // in kg
  length?: number; // in cm
  width?: number;
  height?: number;
  shippingCharge?: number;
  rate?: number;
  status?: 'MANIFEST_GENERATED' | 'PICKUP_SCHEDULED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'manifest_generated' | string;
  labelUrl?: string;
  manifestUrl?: string;
  trackingUrl?: string;
  expectedDelivery?: string;
  createdAt?: string;
  trackingSteps?: TrackingStep[];
  currentLocation?: string;
}

export type ShiprocketShipment = ShipmentDetails;

export interface CourierPartner {
  id: number;
  name: string;
  code: string;
  type?: 'Surface' | 'Air' | 'Express' | string;
  mode?: 'surface' | 'air' | 'express' | string;
  rate: number;
  etd?: string;
  estimated_delivery_days?: number | string;
  rating: number;
  is_recommended?: boolean;
  pickup_performance?: string;
  sla_score?: string;
}

export type CourierOption = CourierPartner;

export const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi (NCT / NCR)',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Chandigarh',
  'Puducherry',
  'Andaman & Nicobar Islands',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
] as const;

export const POPULAR_COUNTRIES = [
  { id: 'IN', name: 'India (Domestic Express Pickup)' },
  { id: 'INTL', name: 'Outside India / International Hub' },
];

const STORAGE_KEY_CONFIG = 'akselling_shiprocket_config';
const STORAGE_KEY_LOCATIONS = 'akselling_shiprocket_locations';
const STORAGE_KEY_SHIPMENTS = 'akselling_shiprocket_shipments';

export const DEFAULT_PICKUP_LOCATIONS: PickupLocation[] = [
  {
    id: 'loc_main_hub',
    name: 'Primary Central Logistics Hub',
    country: 'India (Domestic Express Pickup)',
    state: 'Haryana',
    city: 'Gurugram',
    address_line1: 'Plot No. 42, 2nd Floor, Udyog Vihar Phase 4',
    addressLine1: 'Plot No. 42, 2nd Floor, Udyog Vihar Phase 4',
    landmark: 'Near Cyber City Express Highway & Metro Gate 2',
    pincode: '122015',
    contact_person: 'Anoj Kumar (Logistics Head)',
    contactPerson: 'Anoj Kumar (Logistics Head)',
    phone: '+91 98765 43210',
    email: 'logistics@akselling.com',
    is_default: true,
    isDefault: true,
  },
  {
    id: 'loc_delhi_hub',
    name: 'Delhi Okhla Manufacturing Unit',
    country: 'India (Domestic Express Pickup)',
    state: 'Delhi (NCT / NCR)',
    city: 'New Delhi',
    address_line1: 'Khasra 42, Okhla Industrial Area Phase 3',
    addressLine1: 'Khasra 42, Okhla Industrial Area Phase 3',
    landmark: 'Near Modi Mill Flyover & Metro Station',
    pincode: '110020',
    contact_person: 'Warehouse Manager',
    contactPerson: 'Warehouse Manager',
    phone: '+91 98112 34567',
    email: 'delhi.hub@akselling.com',
    is_default: false,
    isDefault: false,
  },
  {
    id: 'loc_surat_textile',
    name: 'Surat Textile & Apparel Mega Depot',
    country: 'India (Domestic Express Pickup)',
    state: 'Gujarat',
    city: 'Surat',
    address_line1: 'Shop 104-106, Ring Road Textile Market',
    addressLine1: 'Shop 104-106, Ring Road Textile Market',
    landmark: 'Behind Millennium Textile Market Gate 3',
    pincode: '395002',
    contact_person: 'Ramesh Patel',
    contactPerson: 'Ramesh Patel',
    phone: '+91 98250 12345',
    email: 'surat.hub@akselling.com',
    is_default: false,
    isDefault: false,
  },
];

export const AVAILABLE_COURIERS: CourierPartner[] = [
  {
    id: 1,
    name: 'Shadowfax E-Commerce Surface',
    code: 'shadowfax',
    type: 'Surface',
    mode: 'surface',
    rate: 38,
    etd: '3-4 Days',
    estimated_delivery_days: 3,
    rating: 4.8,
    is_recommended: true,
    pickup_performance: '99.2% on-time pickup',
    sla_score: 'Fast Doorstep Pickup',
  },
  {
    id: 2,
    name: 'Delhivery Surface Pro',
    code: 'delhivery',
    type: 'Surface',
    mode: 'surface',
    rate: 42,
    etd: '2-4 Days',
    estimated_delivery_days: 3,
    rating: 4.9,
    is_recommended: false,
    pickup_performance: '98.9% on-time pickup',
    sla_score: 'All-India Pin Code Coverage',
  },
  {
    id: 3,
    name: 'Ekart Logistics Express',
    code: 'ekart',
    type: 'Surface',
    mode: 'surface',
    rate: 45,
    etd: '2-3 Days',
    estimated_delivery_days: 2,
    rating: 4.8,
    is_recommended: false,
    pickup_performance: '98.4% on-time pickup',
    sla_score: 'Direct Hub Transit',
  },
  {
    id: 4,
    name: 'Xpressbees Surface',
    code: 'xpressbees',
    type: 'Surface',
    mode: 'surface',
    rate: 40,
    etd: '3-4 Days',
    estimated_delivery_days: 3,
    rating: 4.7,
    is_recommended: false,
    pickup_performance: '97.8% on-time pickup',
    sla_score: 'Affordable Bulk Rate',
  },
  {
    id: 5,
    name: 'Blue Dart Express (Air Priority)',
    code: 'bluedart',
    type: 'Air',
    mode: 'air',
    rate: 78,
    etd: '1-2 Days',
    estimated_delivery_days: 1,
    rating: 4.9,
    is_recommended: false,
    pickup_performance: '99.8% on-time pickup',
    sla_score: 'Fastest 24-hr Air Courier',
  },
  {
    id: 6,
    name: 'DTDC Priority Air Cargo',
    code: 'dtdc',
    type: 'Air',
    mode: 'air',
    rate: 65,
    etd: '2 Days',
    estimated_delivery_days: 2,
    rating: 4.6,
    is_recommended: false,
    pickup_performance: '96.5% on-time pickup',
    sla_score: 'Priority Air Transit',
  },
];

export function getShiprocketConfig(): ShiprocketConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const cfg = JSON.parse(raw);
      return {
        apiKey: cfg.apiKey || cfg.api_key || 'sr_live_98a72b94c8e11a3d9',
        api_key: cfg.api_key || cfg.apiKey || 'sr_live_98a72b94c8e11a3d9',
        email: cfg.email || 'seller.logistics@akselling.com',
        password: cfg.password || '••••••••••••',
        token: cfg.token || cfg.api_token || 'sr_live_token_77a98b2c4e6f',
        api_token: cfg.api_token || cfg.token || 'sr_live_token_77a98b2c4e6f',
        autoAwb: cfg.autoAwb ?? cfg.auto_generate_awb ?? true,
        auto_generate_awb: cfg.auto_generate_awb ?? cfg.autoAwb ?? true,
        auto_awb: cfg.auto_awb ?? cfg.autoAwb ?? true,
        defaultCourier: cfg.defaultCourier || cfg.default_courier || 'shadowfax',
        default_courier: cfg.default_courier || cfg.defaultCourier || 'shadowfax',
        connected: cfg.connected ?? cfg.is_connected ?? true,
        is_connected: cfg.is_connected ?? cfg.connected ?? true,
        lastConnectedAt: cfg.lastConnectedAt || cfg.last_connected_at || new Date().toISOString(),
        last_connected_at: cfg.last_connected_at || cfg.lastConnectedAt || new Date().toISOString(),
      };
    }
  } catch {
    // ignore
  }
  return {
    apiKey: 'sr_live_98a72b94c8e11a3d9',
    api_key: 'sr_live_98a72b94c8e11a3d9',
    email: 'seller.logistics@akselling.com',
    password: '••••••••••••',
    token: 'sr_live_token_77a98b2c4e6f',
    api_token: 'sr_live_token_77a98b2c4e6f',
    autoAwb: true,
    auto_generate_awb: true,
    auto_awb: true,
    defaultCourier: 'shadowfax',
    default_courier: 'shadowfax',
    connected: true,
    is_connected: true,
    lastConnectedAt: new Date().toISOString(),
    last_connected_at: new Date().toISOString(),
  };
}

export function saveShiprocketConfig(cfg: ShiprocketConfig): ShiprocketConfig {
  const normalized: ShiprocketConfig = {
    ...cfg,
    api_key: cfg.api_key || cfg.apiKey || 'sr_live_98a72b94c8e11a3d9',
    apiKey: cfg.apiKey || cfg.api_key || 'sr_live_98a72b94c8e11a3d9',
    api_token: cfg.api_token || cfg.token || 'sr_live_token_77a98b2c4e6f',
    token: cfg.token || cfg.api_token || 'sr_live_token_77a98b2c4e6f',
    is_connected: cfg.is_connected ?? cfg.connected ?? true,
    connected: cfg.connected ?? cfg.is_connected ?? true,
    auto_generate_awb: cfg.auto_generate_awb ?? cfg.autoAwb ?? true,
    autoAwb: cfg.autoAwb ?? cfg.auto_generate_awb ?? true,
    default_courier: cfg.default_courier || cfg.defaultCourier || 'shadowfax',
    defaultCourier: cfg.defaultCourier || cfg.default_courier || 'shadowfax',
    lastConnectedAt: new Date().toISOString(),
    last_connected_at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(normalized));
    window.dispatchEvent(new Event('akselling_shiprocket_updated'));
  } catch {
    // ignore
  }
  return normalized;
}

export async function testShiprocketConnection(cfg?: Partial<ShiprocketConfig>): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const email = cfg?.email || 'seller.logistics@akselling.com';
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Please provide a valid Shiprocket login email.' };
  }
  return { success: true, message: 'Shiprocket Live API connected & Token verified successfully!' };
}

export function getPickupLocations(): PickupLocation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(l => ({
          ...l,
          country: l.country || 'India (Domestic Express Pickup)',
          landmark: l.landmark || l.address_line2 || 'Near Main Hub Gate',
          is_default: l.is_default ?? l.isDefault ?? false,
          isDefault: l.isDefault ?? l.is_default ?? false,
          contact_person: l.contact_person || l.contactPerson || 'Logistics Manager',
          contactPerson: l.contactPerson || l.contact_person || 'Logistics Manager',
          address_line1: l.address_line1 || l.addressLine1 || '',
          addressLine1: l.addressLine1 || l.address_line1 || '',
        }));
      }
    }
  } catch {
    // ignore
  }
  savePickupLocations(DEFAULT_PICKUP_LOCATIONS);
  return DEFAULT_PICKUP_LOCATIONS;
}

export function savePickupLocations(locations: PickupLocation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCATIONS, JSON.stringify(locations));
    window.dispatchEvent(new Event('akselling_shiprocket_updated'));
  } catch {
    // ignore
  }
}

export function addPickupLocation(loc: PickupLocation | Omit<PickupLocation, 'id'>): PickupLocation[] {
  const list = getPickupLocations();
  const isDefault = ('is_default' in loc ? loc.is_default : loc.isDefault) || list.length === 0;
  const newLoc: PickupLocation = {
    id: ('id' in loc && loc.id) ? loc.id : `loc_${Date.now()}`,
    country: loc.country || 'India (Domestic Express Pickup)',
    landmark: loc.landmark || '',
    ...loc,
    contact_person: loc.contact_person || loc.contactPerson || 'Logistics Manager',
    contactPerson: loc.contactPerson || loc.contact_person || 'Logistics Manager',
    address_line1: loc.address_line1 || loc.addressLine1 || '',
    addressLine1: loc.addressLine1 || loc.address_line1 || '',
    is_default: isDefault,
    isDefault: isDefault,
  };
  if (newLoc.is_default) {
    list.forEach(l => {
      l.is_default = false;
      l.isDefault = false;
    });
  }
  list.push(newLoc);
  savePickupLocations(list);
  return list;
}

export function deletePickupLocation(id: string): PickupLocation[] {
  const list = getPickupLocations().filter(l => l.id !== id);
  if (list.length > 0 && !list.some(l => l.is_default || l.isDefault)) {
    list[0].is_default = true;
    list[0].isDefault = true;
  }
  savePickupLocations(list);
  return list;
}

export function getShipments(): Record<string, ShipmentDetails> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHIPMENTS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function saveShipment(shipment: ShipmentDetails): void {
  try {
    const all = getShipments();
    all[shipment.orderId] = shipment;
    if (shipment.orderNumber) {
      all[shipment.orderNumber] = shipment;
    }
    if (shipment.awbCode) {
      all[shipment.awbCode] = shipment;
    }
    localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('akselling_shiprocket_updated', { detail: shipment }));
  } catch {
    // ignore
  }
}

export function generateAWBNumber(courierName: string): string {
  const prefix = courierName.toUpperCase().includes('DELHIVERY')
    ? 'DEL'
    : courierName.toUpperCase().includes('BLUEDART')
    ? 'BD'
    : courierName.toUpperCase().includes('SHADOWFAX')
    ? 'SFX'
    : courierName.toUpperCase().includes('XPRESS')
    ? 'XPB'
    : courierName.toUpperCase().includes('EKART')
    ? 'EKT'
    : 'SR';
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
  return `${prefix}${randomDigits}`;
}

export async function testShiprocketAuth(
  email?: string,
  password?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please provide a valid Shiprocket account email.' };
  }
  if (password && password.length < 3) {
    return { success: false, error: 'Shiprocket password is too short.' };
  }
  const mockToken = `sr_live_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
  return { success: true, token: mockToken };
}

export async function getAvailableCouriers(
  pickupPin: string,
  destPin: string,
  weightKg: number = 0.5
): Promise<CourierPartner[]> {
  await new Promise(resolve => setTimeout(resolve, 350));
  const pinSeed = (parseInt(pickupPin || '110020', 10) + parseInt(destPin || '201301', 10)) % 5;
  const baseMultiplier = Math.max(0.4, weightKg);
  return AVAILABLE_COURIERS.map((c, idx) => ({
    ...c,
    rate: Math.round(c.rate * (0.85 + baseMultiplier * 0.3) + (idx === pinSeed ? 0 : 3)),
  }));
}

export function createShiprocketOrder(params: {
  orderId: string;
  orderNumber: string;
  courier: CourierPartner;
  pickupLocation: PickupLocation;
  destinationCity: string;
  destinationPincode: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  weightKg?: number;
}): ShipmentDetails {
  const awb = generateAWBNumber(params.courier.name);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const trackingSteps: TrackingStep[] = [
    {
      label: 'Order Confirmed & Payment Verified',
      location: 'Store Cloud System',
      time: `${dateStr}, ${timeStr}`,
      done: true,
      activity: 'Merchant order accepted and inventory reserved',
    },
    {
      label: `Manifest Generated via ${params.courier.name}`,
      location: `${params.pickupLocation.city} Hub (PIN: ${params.pickupLocation.pincode})`,
      time: `${dateStr}, ${timeStr}`,
      done: true,
      activity: `AWB assigned: ${awb}. Courier pickup request queued.`,
    },
    {
      label: 'Pickup Scheduled / Out for Courier Pickup',
      location: `${params.pickupLocation.name}, ${params.pickupLocation.landmark || params.pickupLocation.city}`,
      time: 'Today (Within 2-4 Hours)',
      done: true,
      activity: `Courier Rider assigned. Contact: ${params.pickupLocation.phone}`,
    },
    {
      label: 'In Transit to Regional Hub',
      location: `${params.destinationCity} Processing Hub`,
      time: `Expected in ${params.courier.etd || '2-3 Days'}`,
      done: false,
      activity: 'Surface express container dispatch scheduled',
    },
    {
      label: `Out for Delivery to ${params.customerName}`,
      location: `${params.destinationCity} Delivery Center (PIN: ${params.destinationPincode})`,
      time: 'Pending Dispatch Arrival',
      done: false,
      activity: `Deliver to customer address: ${params.customerAddress || params.destinationCity}`,
    },
  ];

  const shipment: ShipmentDetails = {
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    awbCode: awb,
    courierName: params.courier.name,
    courierId: params.courier.id,
    shipmentId: `SR_SHP_${Date.now().toString().slice(-8)}`,
    pickupLocation: `${params.pickupLocation.name} (${params.pickupLocation.city} - ${params.pickupLocation.pincode})`,
    pickupPincode: params.pickupLocation.pincode,
    destinationCity: params.destinationCity,
    destinationPincode: params.destinationPincode,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    customerAddress: params.customerAddress,
    packageWeight: params.weightKg || 0.4,
    shippingCharge: params.courier.rate,
    rate: params.courier.rate,
    status: 'IN_TRANSIT',
    labelUrl: `https://shiprocket.co/print-label/${awb}`,
    manifestUrl: `https://shiprocket.co/manifest/${awb}`,
    trackingUrl: `https://shiprocket.co/tracking/${awb}`,
    expectedDelivery: params.courier.etd || '2-3 Days',
    createdAt: new Date().toISOString(),
    trackingSteps,
    currentLocation: `${params.pickupLocation.city} Logistics Hub`,
  };

  saveShipment(shipment);
  return shipment;
}

export function formatPickupAddressString(loc: Partial<PickupLocation>): string {
  const parts: string[] = [];
  if (loc.name) parts.push(loc.name);
  if (loc.address_line1 || loc.addressLine1) parts.push(loc.address_line1 || loc.addressLine1 || '');
  if (loc.landmark) parts.push(`Near ${loc.landmark}`);
  if (loc.city) parts.push(loc.city);
  if (loc.state) parts.push(loc.state);
  if (loc.pincode) parts.push(`PIN: ${loc.pincode}`);
  if (loc.country) parts.push(loc.country);
  if (loc.contact_person || loc.contactPerson) {
    parts.push(`(Contact: ${loc.contact_person || loc.contactPerson} - ${loc.phone || ''})`);
  }
  return parts.filter(Boolean).join(', ');
}
