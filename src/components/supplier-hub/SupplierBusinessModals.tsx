import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Star,
  Building2,
  BarChart3,
  Settings,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Award,
  Save,
  Plus,
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  Check,
  Edit2,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  MasterBanner,
  fetchAllMasterBanners,
  addMasterBanner,
  updateMasterBanner,
  deleteMasterBanner,
} from '@/banner-api';
import { compressImageFile } from '@/utils/imageCompressor';

// =========================================================================
// 1. Quality & Rating Dashboard Modal
// =========================================================================
export function QualityRatingModal({ onClose }: { onClose: () => void }) {
  // Dynamically calculate store performance based on orders
  const storeMetrics = (() => {
    let orderCount = 0;
    try {
      const rawOrders = localStorage.getItem('akselling_supplier_orders') || localStorage.getItem('akselling_local_orders');
      if (rawOrders) {
        const parsed = JSON.parse(rawOrders);
        if (Array.isArray(parsed)) orderCount = parsed.length;
      }
    } catch {
      // ignore
    }

    if (orderCount === 0) {
      return {
        score: '0.00',
        stars: '☆☆☆☆☆',
        ratingLabel: 'New Seller (0.00 Star Base)',
        verifiedCount: 0,
        tier: 'FRESH LAUNCH',
        commission: '0% Active',
      };
    }

    const calculated = Math.min(5.0, 4.0 + Math.min(0.95, orderCount * 0.12)).toFixed(2);
    return {
      score: calculated,
      stars: '★★★★★',
      ratingLabel: `Based on ${orderCount} verified order transactions`,
      verifiedCount: orderCount,
      tier: 'DIAMOND PRO',
      commission: '0% Active',
    };
  })();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[88vh] animate-scale-up">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={20} fill="currentColor" />
            <div>
              <h3 className="font-bold text-sm">Quality & Performance Scorecard</h3>
              <p className="text-[10px] text-amber-100">00 Diamond Store Rating & Performance Tier</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Main Score Hero */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-amber-800 font-bold uppercase">Store Rating</div>
              <div className="text-3xl font-black text-amber-700 mt-0.5 flex items-center gap-1.5">
                <span>{storeMetrics.score}</span>
                <span className="text-base text-amber-400">{storeMetrics.stars}</span>
              </div>
              <p className="text-[10px] text-amber-700 mt-1">{storeMetrics.ratingLabel}</p>
            </div>
            <div className="text-right">
              <span className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                <Award size={12} /> {storeMetrics.tier}
              </span>
              <p className="text-[10px] text-gray-500 mt-1">{storeMetrics.commission}</p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
              <span className="text-gray-500 text-[11px]">Customer Return Defect Rate</span>
              <div className="text-lg font-black text-emerald-700">0.8%</div>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                ✓ Benchmark &lt; 2.5%
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
              <span className="text-gray-500 text-[11px]">Next Day Dispatch (NDD)</span>
              <div className="text-lg font-black text-[#2874f0]">98.2%</div>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-bold">
                ✓ Ultra Fast Dispatch
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
              <span className="text-gray-500 text-[11px]">Seller Cancellation Rate</span>
              <div className="text-lg font-black text-emerald-700">0.1%</div>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                ✓ Excellent Inventory
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
              <span className="text-gray-500 text-[11px]">RTO (Courier Return) Rate</span>
              <div className="text-lg font-black text-amber-600">6.4%</div>
              <span className="text-[10px] text-gray-500 font-medium">Industry avg ~8%</span>
            </div>
          </div>

          {/* Recent Reviews Summary */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900">Recent Customer Feedback</h4>
            <div className="space-y-1.5">
              {[
                { name: 'Pooja S. (Lucknow)', stars: '5★', comment: 'Kapda bahut accha hai, pure cotton fitting ekdum perfect!', time: 'Yesterday' },
                { name: 'Rahul K. (Pune)', stars: '5★', comment: 'Fast delivery and premium packaging with sealed polybag.', time: '2 days ago' },
                { name: 'Aman V. (Jaipur)', stars: '4★', comment: 'Nice color, value for money at this price.', time: '3 days ago' },
              ].map((rev, idx) => (
                <div key={idx} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{rev.name}</span>
                    <span className="text-amber-600 font-black text-[11px]">{rev.stars}</span>
                  </div>
                  <p className="text-gray-600 text-[11px] mt-0.5">"{rev.comment}"</p>
                  <span className="text-[9px] text-gray-400">{rev.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100">
            Close Scorecard
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 2. Warehouse & Pickup Locations Modal
// =========================================================================
export function WarehouseLocationsModal({ onClose }: { onClose: () => void }) {
  const [hubs, setHubs] = useState([
    {
      id: 'wh_1',
      name: 'Delhi Logistics Hub (Primary)',
      address: 'Khasra 42, Okhla Industrial Area Phase 3',
      city: 'New Delhi',
      pincode: '110020',
      contact: '+91 98112 34567',
      isPrimary: true,
      couriers: ['Shadowfax Express', 'Delhivery Surface', 'XpressBees'],
    },
    {
      id: 'wh_2',
      name: 'Surat Textile Mega Hub',
      address: 'Plot 108, Ring Road Textile Market',
      city: 'Surat',
      pincode: '395002',
      contact: '+91 98251 98765',
      isPrimary: false,
      couriers: ['Shadowfax Express', 'Ecom Express'],
    },
    {
      id: 'wh_3',
      name: 'Bengaluru Fulfillment Center',
      address: 'Industrial Suburb, Stage 2, Peenya',
      city: 'Bengaluru',
      pincode: '560058',
      contact: '+91 98450 11223',
      isPrimary: false,
      couriers: ['Shadowfax Express', 'Delhivery Surface'],
    },
  ]);

  const [showAddHub, setShowAddHub] = useState(false);
  const [newHubName, setNewHubName] = useState('');
  const [newHubAddress, setNewHubAddress] = useState('');
  const [newHubPincode, setNewHubPincode] = useState('');

  const handleSetPrimary = (id: string) => {
    setHubs(prev =>
      prev.map(h => ({
        ...h,
        isPrimary: h.id === id,
      }))
    );
    alert('Primary dispatch location updated! Couriers will now collect parcels from this hub.');
  };

  const handleAddNewHub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHubName.trim() || !newHubPincode.trim()) return;

    const newHub = {
      id: `wh_${Date.now()}`,
      name: newHubName.trim(),
      address: newHubAddress.trim() || 'Industrial Area Warehouse Complex',
      city: 'Hub Center',
      pincode: newHubPincode.trim(),
      contact: '+91 98112 34567',
      isPrimary: false,
      couriers: ['Shadowfax Express', 'Delhivery Surface'],
    };

    setHubs(prev => [...prev, newHub]);
    setNewHubName('');
    setNewHubAddress('');
    setNewHubPincode('');
    setShowAddHub(false);
    alert('New pickup warehouse added successfully!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={20} />
            <div>
              <h3 className="font-bold text-sm">Warehouse & Pickup Locations</h3>
              <p className="text-[10px] text-indigo-200">Manage dispatch addresses & courier pick-up slots</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3.5 overflow-y-auto text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900">Configured Hubs ({hubs.length})</span>
            <button
              onClick={() => setShowAddHub(!showAddHub)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 text-[11px]"
            >
              <Plus size={13} /> Add New Warehouse
            </button>
          </div>

          {/* Add Hub Form */}
          {showAddHub && (
            <form onSubmit={handleAddNewHub} className="bg-gray-50 p-3 rounded-xl border border-indigo-200 space-y-2">
              <h4 className="font-bold text-indigo-900">Add New Pickup Location</h4>
              <input
                type="text"
                value={newHubName}
                onChange={e => setNewHubName(e.target.value)}
                placeholder="Hub Name (e.g. Mumbai Logistics Center)"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                required
              />
              <input
                type="text"
                value={newHubAddress}
                onChange={e => setNewHubAddress(e.target.value)}
                placeholder="Full Street Address"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
              />
              <input
                type="text"
                value={newHubPincode}
                onChange={e => setNewHubPincode(e.target.value)}
                placeholder="6-Digit PIN Code (e.g. 400001)"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                required
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddHub(false)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold"
                >
                  Save Hub
                </button>
              </div>
            </form>
          )}

          {/* Hubs List */}
          <div className="space-y-2.5">
            {hubs.map(hub => (
              <div
                key={hub.id}
                className={`p-3 rounded-xl border transition-all ${
                  hub.isPrimary
                    ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} className={hub.isPrimary ? 'text-indigo-600' : 'text-gray-400'} />
                    <h4 className="font-bold text-gray-900">{hub.name}</h4>
                  </div>
                  {hub.isPrimary ? (
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={11} /> PRIMARY PICKUP
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetPrimary(hub.id)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] hover:underline"
                    >
                      Set as Primary
                    </button>
                  )}
                </div>

                <p className="text-gray-600 text-[11px] mt-1 pl-5">
                  {hub.address}, {hub.city} - PIN: <strong>{hub.pincode}</strong>
                </p>
                <div className="text-gray-500 text-[10px] mt-1.5 pl-5 flex items-center gap-2 flex-wrap">
                  <span>Phone: {hub.contact}</span>
                  <span>•</span>
                  <span>Daily Courier Pickups: <strong>11:30 AM & 04:30 PM</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 3. Business Analytics & Funnel Modal
// =========================================================================
export function BusinessAnalyticsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
        <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} />
            <div>
              <h3 className="font-bold text-sm">Business Analytics & Growth</h3>
              <p className="text-[10px] text-purple-200">Sales funnel, geographic breakdown & top SKUs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Funnel Card */}
          <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 space-y-2.5">
            <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
              <TrendingUp size={15} /> Customer Conversion Funnel (Last 30 Days)
            </h4>

            <div className="space-y-1.5">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-700">
                  <span>Catalog Views</span>
                  <span>14,250 views</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-0.5">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-700">
                  <span>Added to Cart / Wishlist</span>
                  <span>2,850 clicks (20%)</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-0.5">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-emerald-800">
                  <span>Completed Orders</span>
                  <span>842 orders (5.9% conversion)</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-0.5">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '22%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Top States */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900">Top Ordering States & Demand Heatmap</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { state: 'Uttar Pradesh', orders: '284 orders (34%)', growth: '+18%' },
                { state: 'Maharashtra', orders: '192 orders (23%)', growth: '+12%' },
                { state: 'Delhi NCR', orders: '148 orders (17%)', growth: '+25%' },
                { state: 'Karnataka & South', orders: '112 orders (13%)', growth: '+9%' },
              ].map((st, idx) => (
                <div key={idx} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <div className="font-bold text-gray-900">{st.state}</div>
                  <div className="text-[11px] text-gray-600 mt-0.5">{st.orders}</div>
                  <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                    {st.growth} this week
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 4. Supplier Profile & Banner Studio Settings Modal
// =========================================================================
export function SupplierSettingsModal({
  storeName,
  onSaveStoreName,
  onClose,
}: {
  storeName: string;
  onSaveStoreName: (newName: string) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'banners' | 'profile'>('banners');

  // Store Profile State
  const [name, setName] = useState(() => {
    try {
      const raw = localStorage.getItem('akselling_active_seller');
      if (raw && raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        return parsed.business_name || parsed.businessName || storeName || 'AK Yadav Prints';
      }
    } catch {
      // ignore
    }
    return storeName || 'AK Yadav Prints';
  });

  const [gstin, setGstin] = useState(() => {
    try {
      const raw = localStorage.getItem('akselling_active_seller');
      if (raw && raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        return parsed.gst_number || parsed.gstNumber || '';
      }
    } catch {
      // ignore
    }
    return '07AAACA1234F1Z5';
  });

  const [phone, setPhone] = useState(() => {
    try {
      const raw = localStorage.getItem('akselling_active_seller');
      if (raw && raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        return parsed.mobile_number || parsed.mobileNumber || '+91 98112 34567';
      }
    } catch {
      // ignore
    }
    return '+91 98112 34567';
  });

  const [email, setEmail] = useState(() => {
    try {
      const raw = localStorage.getItem('akselling_active_seller');
      if (raw && raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        return parsed.email || 'supplier.akyadav@akselling.in';
      }
    } catch {
      // ignore
    }
    return 'supplier.akyadav@akselling.in';
  });

  const [stateHub, setStateHub] = useState(() => {
    try {
      const raw = localStorage.getItem('akselling_active_seller');
      if (raw && raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        return parsed.state || 'Delhi NCR Hub';
      }
    } catch {
      // ignore
    }
    return 'Delhi NCR Hub';
  });

  const [whatsappAlerts, setWhatsappAlerts] = useState(true);

  // Banner Studio State
  const [banners, setBanners] = useState<MasterBanner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Banner Form State
  const [bannerTitle, setBannerTitle] = useState('Festive Mega Dhamaka 70% Off');
  const [bannerSubtitle, setBannerSubtitle] = useState('Latest Pure Cotton Kurtis, Sarees & Men Shirts');
  const [bannerCta, setBannerCta] = useState('Shop Now');
  const [bannerImage, setBannerImage] = useState(
    'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
  );
  const [bannerGradient, setBannerGradient] = useState('from-blue-600 to-indigo-800');
  const [bannerCategory, setBannerCategory] = useState('fashion');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Gradient Presets
  const GRADIENT_PRESETS = [
    { label: 'Royal Blue (Flipkart)', value: 'from-blue-600 to-indigo-800' },
    { label: 'Festive Sunset Gold', value: 'from-amber-600 to-orange-700' },
    { label: 'Glamour Rose Pink', value: 'from-rose-600 to-pink-700' },
    { label: 'Emerald Deals Green', value: 'from-emerald-600 to-teal-800' },
    { label: 'Midnight Mega Blast', value: 'from-purple-700 to-indigo-900' },
    { label: 'Diamond Luxe Dark', value: 'from-gray-900 to-slate-800' },
  ];

  // Stock Banner Image Presets for Instant 1-Click Setup
  const IMAGE_PRESETS = [
    {
      title: 'Festive Clothing',
      url: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    },
    {
      title: 'Men Casual Shirts',
      url: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    },
    {
      title: 'Wireless Audio Earbuds',
      url: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    },
    {
      title: 'Smartwatches',
      url: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    },
    {
      title: 'Sport Shoes & Sneakers',
      url: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    },
  ];

  // Load master banners on mount
  useEffect(() => {
    async function load() {
      setLoadingBanners(true);
      const data = await fetchAllMasterBanners();
      setBanners(data);
      setLoadingBanners(false);
    }
    load();
  }, []);

  // Handle phone image selection & compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      // Auto compress phone photo to lightweight data URL (<50KB)
      const compressedDataUrl = await compressImageFile(file, 1200, 600, 0.8);
      if (compressedDataUrl) {
        setBannerImage(compressedDataUrl);
      }
    } catch (err) {
      console.error('Failed to process phone image:', err);
      alert('Could not process selected image. Please try another image.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save or Add Banner
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerImage.trim()) {
      alert('Please provide banner headline and image');
      return;
    }

    if (editingBannerId) {
      // Update existing banner
      await updateMasterBanner(editingBannerId, {
        title: bannerTitle.trim(),
        subtitle: bannerSubtitle.trim(),
        cta: bannerCta.trim() || 'Shop Now',
        image: bannerImage,
        gradient: bannerGradient,
        category: bannerCategory,
      });
      alert('Banner updated successfully!');
      setEditingBannerId(null);
    } else {
      // Add new banner
      await addMasterBanner({
        title: bannerTitle.trim(),
        subtitle: bannerSubtitle.trim(),
        cta: bannerCta.trim() || 'Shop Now',
        image: bannerImage,
        gradient: bannerGradient,
        category: bannerCategory,
        active: true,
      });
      alert('New banner added to store carousel!');
    }

    // Refresh banner list
    const refreshed = await fetchAllMasterBanners();
    setBanners(refreshed);

    // Reset editor
    setBannerTitle('Big Savings Dhamaka');
    setBannerSubtitle('Trending Styles & Daily Fresh Discounts');
    setBannerCta('Shop Now');
  };

  // Select banner for editing
  const handleStartEdit = (b: MasterBanner) => {
    setEditingBannerId(b.id);
    setBannerTitle(b.title);
    setBannerSubtitle(b.subtitle);
    setBannerCta(b.cta);
    setBannerImage(b.image);
    setBannerGradient(b.gradient || 'from-blue-600 to-indigo-800');
    setBannerCategory(b.category || 'fashion');
    // Scroll to top of modal for editing
  };

  const handleCancelEdit = () => {
    setEditingBannerId(null);
    setBannerTitle('Festive Mega Dhamaka 70% Off');
    setBannerSubtitle('Latest Pure Cotton Kurtis, Sarees & Men Shirts');
    setBannerCta('Shop Now');
    setBannerImage(
      'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
    );
  };

  // Toggle active status
  const handleToggleActive = async (b: MasterBanner) => {
    const nextState = b.active === false ? true : false;
    await updateMasterBanner(b.id, { active: nextState });
    const refreshed = await fetchAllMasterBanners();
    setBanners(refreshed);
  };

  // Delete banner
  const handleDeleteBanner = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this banner from store carousel?')) {
      await deleteMasterBanner(id);
      const refreshed = await fetchAllMasterBanners();
      setBanners(refreshed);
      if (editingBannerId === id) {
        handleCancelEdit();
      }
    }
  };

  // Save Store Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSaveStoreName(name.trim());
    }
    try {
      const raw = localStorage.getItem('akselling_active_seller');
      let currentObj = {};
      if (raw && raw.startsWith('{')) {
        currentObj = JSON.parse(raw);
      }
      const updated = {
        ...currentObj,
        business_name: name.trim(),
        gst_number: gstin.trim(),
        mobile_number: phone.trim(),
        email: email.trim(),
        state: stateHub.trim(),
      };
      localStorage.setItem('akselling_active_seller', JSON.stringify(updated));
    } catch {
      // ignore
    }
    alert('Store Profile & Contact details updated successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-up">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-gray-950 via-slate-900 to-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Store Settings & Hero Banner Studio</h3>
              <p className="text-[10px] text-gray-300">Upload phone banners, manage promotions & store profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-gray-100/80 p-1.5 flex gap-1 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'banners'
                ? 'bg-white text-[#2874f0] shadow-2xs border border-gray-200/80'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ImageIcon size={14} />
            <span>Store Banners Studio ({banners.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-[#2874f0] shadow-2xs border border-gray-200/80'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings size={14} />
            <span>Store Info & Contact</span>
          </button>
        </div>

        {/* Tab 1: Store Banners Studio */}
        {activeTab === 'banners' && (
          <div className="p-4 space-y-4 overflow-y-auto text-xs flex-1">
            {/* Live Real-time Carousel Mockup Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <Eye size={13} className="text-[#2874f0]" /> Live Banner Preview (How Customers See It)
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Carousel Frame
                </span>
              </div>

              <div
                className={`relative overflow-hidden rounded-2xl p-4 text-white bg-gradient-to-r ${bannerGradient} shadow-md min-h-[140px] flex items-center justify-between gap-3 border border-white/10`}
              >
                <div className="space-y-1 max-w-[65%] z-10">
                  <span className="bg-yellow-400 text-gray-950 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs inline-block">
                    PROMO OFFER
                  </span>
                  <h4 className="text-base font-black leading-tight line-clamp-2 drop-shadow-xs">
                    {bannerTitle || 'Mega Festive Offer'}
                  </h4>
                  <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed drop-shadow-xs">
                    {bannerSubtitle || 'Best deals on trending collections'}
                  </p>
                  <div className="pt-1">
                    <span className="bg-white text-gray-900 font-extrabold text-[10px] px-3 py-1 rounded-lg shadow-sm inline-flex items-center gap-1">
                      {bannerCta || 'Shop Now'} <ArrowRight size={10} />
                    </span>
                  </div>
                </div>

                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black/20 border border-white/20 shrink-0 shadow-inner flex items-center justify-center">
                  {bannerImage ? (
                    <img
                      src={bannerImage}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageIcon size={28} className="text-white/40" />
                  )}
                </div>
              </div>
            </div>

            {/* Banner Editor Form */}
            <form onSubmit={handleSaveBanner} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-gray-900 flex items-center gap-1.5 text-xs">
                  {editingBannerId ? (
                    <>
                      <Edit2 size={13} className="text-amber-600" /> Editing Live Banner #{editingBannerId}
                    </>
                  ) : (
                    <>
                      <Plus size={14} className="text-blue-600" /> Create / Upload New Store Banner
                    </>
                  )}
                </span>
                {editingBannerId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-[10px] text-gray-500 hover:text-gray-800 underline font-bold"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Banner Headline / Big Title *</label>
                  <input
                    type="text"
                    value={bannerTitle}
                    onChange={e => setBannerTitle(e.target.value)}
                    placeholder="e.g. 70% Off Festive Dhamaka"
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Subtitle / Offer Description</label>
                  <input
                    type="text"
                    value={bannerSubtitle}
                    onChange={e => setBannerSubtitle(e.target.value)}
                    placeholder="e.g. Premium Cotton Kurtis & Shirts"
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* CTA & Target Category */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={bannerCta}
                    onChange={e => setBannerCta(e.target.value)}
                    placeholder="Shop Now"
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Link to Category</label>
                  <select
                    value={bannerCategory}
                    onChange={e => setBannerCategory(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold"
                  >
                    <option value="fashion">Fashion & Clothing</option>
                    <option value="electronics">Electronics & Audio</option>
                    <option value="watches">Smartwatches & Accessories</option>
                    <option value="footwear">Shoes & Footwear</option>
                    <option value="mobiles">Mobiles & Gadgets</option>
                    <option value="all">All Store Products</option>
                  </select>
                </div>
              </div>

              {/* Gradient Theme Selection */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Background Gradient Theme</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {GRADIENT_PRESETS.map((preset, idx) => {
                    const isSelected = bannerGradient === preset.value;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setBannerGradient(preset.value)}
                        className={`h-8 rounded-lg bg-gradient-to-r ${preset.value} border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-gray-900 scale-105 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        title={preset.label}
                      >
                        {isSelected && <Check size={14} className="text-white drop-shadow-sm font-black" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo Upload from Phone */}
              <div className="space-y-2 pt-1">
                <label className="block font-bold text-gray-700">Banner Photo / Image (Mobile Upload or URL)</label>

                {/* Hidden File Input for Phone Camera & Gallery */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all text-xs"
                  >
                    {isUploadingImage ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Processing Photo...
                      </>
                    ) : (
                      <>
                        <Upload size={13} /> Select Photo from Phone / Camera
                      </>
                    )}
                  </button>

                  <span className="text-gray-400 font-bold text-[11px]">— or paste URL —</span>

                  <input
                    type="text"
                    value={bannerImage}
                    onChange={e => setBannerImage(e.target.value)}
                    placeholder="https://image-url..."
                    className="flex-1 min-w-[200px] px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                {/* Stock Presets */}
                <div className="pt-1">
                  <span className="text-[10px] text-gray-500 font-bold block mb-1">Quick Presets:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {IMAGE_PRESETS.map((pst, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setBannerImage(pst.url)}
                        className="bg-white hover:bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-700 px-2 py-1 rounded-lg shrink-0 transition-colors"
                      >
                        {pst.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Banner Button */}
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                {editingBannerId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <Save size={13} />
                  <span>{editingBannerId ? 'Update Live Banner' : 'Add Banner to Store Carousel'}</span>
                </button>
              </div>
            </form>

            {/* List of Live Active & Configured Banners */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-gray-900 flex items-center gap-1.5">
                  <Layers size={14} className="text-gray-600" /> Active Store Banners ({banners.length})
                </span>
                <span className="text-[10px] text-gray-500">Live on Home & Product Pages</span>
              </div>

              {loadingBanners ? (
                <div className="p-4 text-center text-gray-400 font-bold">Loading banners...</div>
              ) : banners.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-xl text-center text-gray-500 font-bold border border-gray-200">
                  No custom banners created yet. Create one above!
                </div>
              ) : (
                <div className="space-y-2">
                  {banners.map((b, idx) => {
                    const isActive = b.active !== false;
                    return (
                      <div
                        key={b.id || idx}
                        className={`bg-white p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isActive ? 'border-gray-200 shadow-2xs' : 'border-gray-200/60 opacity-60 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={b.image || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'}
                            alt={b.title}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-gray-900 text-xs truncate">{b.title}</h5>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                  isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {isActive ? 'LIVE' : 'HIDDEN'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{b.subtitle || b.cta}</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(b)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                              isActive
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isActive ? 'Hide' : 'Show'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(b)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg border border-blue-200 transition-colors"
                            title="Edit banner details"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg border border-rose-200 transition-colors"
                            title="Delete banner"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Store Info & Contact (No PAN or Bank details) */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-4 space-y-4 overflow-y-auto text-xs flex-1">
            {/* Store Name */}
            <div className="space-y-1">
              <label className="font-bold text-gray-900">Supplier Store Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. AK Yadav Prints & Textiles"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 text-sm focus:ring-1 focus:ring-[#2874f0]"
                required
              />
            </div>

            {/* GSTIN & State Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700">Business GSTIN (Optional)</label>
                  <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">VERIFIED</span>
                </div>
                <input
                  type="text"
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  placeholder="07AAACA1234F1Z5"
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl font-mono uppercase font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Dispatch State / Region</label>
                <input
                  type="text"
                  value={stateHub}
                  onChange={e => setStateHub(e.target.value)}
                  placeholder="e.g. Delhi NCR / Gujarat Hub"
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-xs"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Registered Phone / Mobile *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Official Support Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  required
                />
              </div>
            </div>

            {/* Instant WhatsApp Alerts */}
            <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-xl border border-blue-200">
              <div>
                <div className="font-bold text-gray-900">Instant WhatsApp Dispatch Alerts</div>
                <div className="text-[10px] text-gray-600 mt-0.5">Receive real-time notifications on mobile for every new customer order</div>
              </div>
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={e => setWhatsappAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#2874f0]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-[#2874f0] hover:bg-[#1a65dc] rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Save size={14} /> Save Store Profile
              </button>
            </div>
          </form>
        )}

        {/* Footer for Banners tab */}
        {activeTab === 'banners' && (
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 shadow-2xs"
            >
              Done & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
