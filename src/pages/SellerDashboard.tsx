import React, { useState, useEffect } from 'react';
import {
  Home,
  Package,
  RotateCcw,
  Boxes,
  Menu as MenuIcon,
  ChevronLeft,
  ShoppingBag,
} from 'lucide-react';
import type {
  SellerProduct,
  SellerOrder,
  ReturnItem,
  SPFClaim,
  SupplierTab,
} from '@/types/supplier';
import SupplierHomeTab from '@/components/supplier-hub/SupplierHomeTab';
import SupplierOrdersTab from '@/components/supplier-hub/SupplierOrdersTab';
import SupplierReturnsTab from '@/components/supplier-hub/SupplierReturnsTab';
import SupplierInventoryTab from '@/components/supplier-hub/SupplierInventoryTab';
import SupplierMenuTab from '@/components/supplier-hub/SupplierMenuTab';
import {
  ShippingLabelModal,
  BarcodeScannerModal,
  AddEditCatalogModal,
  SPFClaimModal,
  PricingToolModal,
  PayoutsModal,
  BulkUploadModal,
  ShipmentTrackingModal,
  QualityRatingModal,
  WarehouseLocationsModal,
  BusinessAnalyticsModal,
  SupplierSettingsModal,
} from '@/components/supplier-hub/SupplierModals';
import BankDetailsModal from '@/components/supplier-hub/BankDetailsModal';
import ShiprocketSettingsModal from '@/components/supplier-hub/ShiprocketSettingsModal';
import SupplierReelsStudio from '@/components/supplier-hub/SupplierReelsStudio';
import { safeLocalStorageSetItem, safeLocalStorageGetItem, getCleanSellerStoreName } from '@/utils/storageHelper';
import {
  saveProductToFirestore,
  deleteProductFromFirestore,
  updateOrderStatusInFirestore,
  subscribeOrders,
} from '@/firebase';

// Initial Mock Catalogs
const INITIAL_PRODUCTS: SellerProduct[] = [
  {
    id: 'sp_1',
    catalogId: 'CAT-98421',
    sku: 'AK-BOULT-Z40',
    title: 'Boult Audio AirBass Z40 Wireless Earbuds (60H Playtime)',
    description: 'Ultra-low latency gaming mode, 60 hours playback, ENC quad mic, IPX5 water resistant.',
    price: 1299,
    mrp: 3999,
    discount: 68,
    category: 'electronics',
    images: [
      'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    stock: 45,
    brand: 'Boult',
    status: 'live',
    salesCount: 0,
    views: 0,
    rating: 0.0,
  },
  {
    id: 'sp_2',
    catalogId: 'CAT-89302',
    sku: 'AK-FASTRACK-BEAT',
    title: 'Fastrack Reflex Beat+ 1.69" UltraVU Display Smartwatch',
    description: 'Heart rate tracker, 60+ sports modes, 100+ cloud watch faces, 5ATM water resistance.',
    price: 1799,
    mrp: 4995,
    discount: 64,
    category: 'watches',
    images: [
      'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    stock: 18,
    brand: 'Fastrack',
    status: 'live',
    salesCount: 0,
    views: 0,
    rating: 0.0,
  },
  {
    id: 'sp_3',
    catalogId: 'CAT-74910',
    sku: 'AK-DENNIS-OLIVE',
    title: 'Dennis Lingo Men Slim Fit Casual Cotton Shirt - Olive Green',
    description: '100% premium breathable cotton, full sleeve, button down collar, regular machine wash.',
    price: 649,
    mrp: 1849,
    discount: 65,
    category: 'fashion',
    images: [
      'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    stock: 25,
    brand: 'Dennis Lingo',
    status: 'live',
    salesCount: 0,
    views: 0,
    rating: 0.0,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: '100% Pure Cotton',
  },
  {
    id: 'sp_4',
    catalogId: 'CAT-62914',
    sku: 'AK-PUMA-RUNNER',
    title: 'Puma Men Running & Walking Lightweight Shoes',
    description: 'SoftFoam+ sockliner for superior cushioning and optimal comfort for everyday running.',
    price: 2199,
    mrp: 4999,
    discount: 56,
    category: 'footwear',
    images: [
      'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    stock: 4, // low stock
    brand: 'Puma',
    status: 'live',
    salesCount: 0,
    views: 0,
    rating: 0.0,
  },
  {
    id: 'sp_5',
    catalogId: 'CAT-51928',
    sku: 'AK-ROADSTER-TEE',
    title: 'Roadster Pure Cotton Solid Round Neck Regular T-Shirt',
    description: 'High-density 180 GSM combed cotton fabric, bio-washed for ultra-soft handfeel.',
    price: 399,
    mrp: 999,
    discount: 60,
    category: 'fashion',
    images: [
      'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    stock: 50,
    brand: 'Roadster',
    status: 'live',
    salesCount: 0,
    views: 0,
    rating: 0.0,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: '100% Pure Cotton',
  },
  {
    id: 'sp_6',
    catalogId: 'CAT-41092',
    sku: 'AK-USPA-POLO',
    title: 'U.S. Polo Assn. Men Solid Pure Cotton Polo Collar T-Shirt',
    description: 'Signature ribbed collar, 2-button placket, breathable piqué honeycomb cotton knit.',
    price: 899,
    mrp: 1999,
    discount: 55,
    category: 'fashion',
    images: [
      'https://images.pexels.com/photos/1232459/pexels-photo-1232459.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    stock: 0, // out of stock
    brand: 'U.S. Polo Assn.',
    status: 'out_of_stock',
    salesCount: 0,
    views: 0,
    rating: 0.0,
    sizes: ['M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton Blend',
  },
];

// Initial Mock Orders (Default 00 Clean Slate for Public Launch)
const INITIAL_ORDERS: SellerOrder[] = [];

// Initial Returns (Default 00 Clean Slate for Public Launch)
const INITIAL_RETURNS: ReturnItem[] = [];

// Initial SPF Claims (Default 00 Clean Slate for Public Launch)
const INITIAL_CLAIMS: SPFClaim[] = [];

// Sample order generator for testing courier dispatch & label printing
const SAMPLE_TEST_ORDER: SellerOrder = {
  id: `ord_${Date.now()}`,
  orderNumber: `OD${Math.floor(1000000000 + Math.random() * 9000000000)}`,
  customerName: 'Rahul Sharma',
  customerCity: 'New Delhi, DL',
  customerAddress: 'Flat 402, Royal Palms, Sector 62, Noida Road',
  customerPincode: '201301',
  customerPhone: '+91 98112 34567',
  items: [
    {
      title: 'Dennis Lingo Men Slim Fit Cotton Shirt',
      quantity: 1,
      price: 649,
      image: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg',
      sku: 'AK-DENNIS-OLIVE',
      size: 'L',
    },
  ],
  totalAmount: 649,
  paymentMethod: 'Prepaid (UPI)',
  status: 'pending',
  orderDate: 'Just Now',
};

export { type SellerProduct };

interface SellerDashboardProps {
  onBack: () => void;
}

export default function SellerDashboard({ onBack }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<SupplierTab>('home');
  const [subFilter, setSubFilter] = useState<string | undefined>(undefined);

  // Clean Store Name
  const [storeName, setStoreName] = useState(() => {
    return getCleanSellerStoreName();
  });

  const handleSaveStoreName = (newName: string) => {
    const cleaned = newName.trim() || 'AK Yadav Prints';
    setStoreName(cleaned);
    try {
      const existing = localStorage.getItem('akselling_active_seller');
      if (existing && existing.startsWith('{')) {
        const parsed = JSON.parse(existing);
        parsed.business_name = cleaned;
        parsed.businessName = cleaned;
        localStorage.setItem('akselling_active_seller', JSON.stringify(parsed));
      } else {
        localStorage.setItem('akselling_active_seller', cleaned);
      }
    } catch {
      localStorage.setItem('akselling_active_seller', cleaned);
    }
  };

  // State initialization with localStorage fallback
  const [products, setProducts] = useState<SellerProduct[]>(() => {
    try {
      const saved = safeLocalStorageGetItem('akselling_seller_products');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<SellerOrder[]>(() => {
    try {
      const saved = safeLocalStorageGetItem('akselling_supplier_orders');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_ORDERS;
  });

  const [returns] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [claims, setClaims] = useState<SPFClaim[]>(INITIAL_CLAIMS);

  // Modals state
  const [activeLabelOrder, setActiveLabelOrder] = useState<SellerOrder | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null | 'new'>(null);
  const [claimReturnItem, setClaimReturnItem] = useState<ReturnItem | null | 'generic'>(null);
  const [showPricingTool, setShowPricingTool] = useState(false);
  const [showPayoutsModal, setShowPayoutsModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [showShiprocketModal, setShowShiprocketModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReelsStudio, setShowReelsStudio] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<SellerOrder | ReturnItem | null>(null);

  // Reset to fresh startup numbers if requested
  const handleResetStartupData = () => {
    if (window.confirm('Reset this store to a clean "AKSelling Startup" slate (0 orders, fresh metrics)? Your catalog products will remain safe.')) {
      setOrders([]);
      safeLocalStorageSetItem('akselling_supplier_orders', JSON.stringify([]));
      alert('Store reset to clean startup slate successfully!');
    }
  };

  // Add 1 sample test order for seller testing & dispatch demonstration
  const handleAddSampleOrder = () => {
    const newSample: SellerOrder = {
      ...SAMPLE_TEST_ORDER,
      id: `ord_${Date.now()}`,
      orderNumber: `OD${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      orderDate: 'Just Now',
    };
    setOrders(prev => [newSample, ...prev]);
    alert('Sample Test Order generated! You can now test packing, generating shipping labels, and courier dispatch.');
  };

  // Synchronize products to localStorage safely & notify customer shopping app
  useEffect(() => {
    safeLocalStorageSetItem('akselling_seller_products', JSON.stringify(products));
    try {
      window.dispatchEvent(new CustomEvent('akselling_products_updated'));
    } catch {
      // ignore
    }
  }, [products]);

  // Synchronize orders to localStorage safely and listen for live customer orders
  useEffect(() => {
    safeLocalStorageSetItem('akselling_supplier_orders', JSON.stringify(orders));
  }, [orders]);

  // Listen for live customer orders and Firestore sync
  useEffect(() => {
    // 1. Subscribe to Firestore orders
    const unsubscribe = subscribeOrders(undefined, (remoteOrders) => {
      if (remoteOrders.length > 0) {
        setOrders(prev => {
          const map = new Map<string, SellerOrder>();
          // Existing items
          prev.forEach(o => map.set(o.id, o));
          // Remote items converted
          remoteOrders.forEach(ro => {
            const converted: SellerOrder = {
              id: ro.id,
              orderNumber: ro.id.startsWith('ORD-') ? ro.id : `ORD-${ro.id.slice(-6).toUpperCase()}`,
              customerName: ro.customer_name || 'Customer',
              customerCity: ro.customer_address?.split(',').slice(-2, -1)[0]?.trim() || 'New Delhi',
              customerAddress: ro.customer_address,
              customerPhone: ro.customer_phone,
              customerPincode: ro.customer_address?.match(/\b\d{6}\b/)?.[0] || '110001',
              items: (ro.items || []).map(item => ({
                title: item.product_title,
                quantity: item.quantity,
                price: item.price,
                image: item.product_image,
                sku: item.sku || `AK-${(item.product_id || 'prod').slice(0, 8).toUpperCase()}`,
                size: item.size,
                color: item.color,
              })),
              totalAmount: ro.total_amount,
              paymentMethod: ro.payment_method || 'Prepaid',
              status: (ro.status?.toLowerCase() === 'placed' ? 'pending' : ro.status?.toLowerCase() || 'pending') as SellerOrder['status'],
              orderDate: new Date(ro.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
              dispatchDeadline: 'Within 24 Hours (NDD)',
              awbCode: ro.awb_code,
              courierName: ro.courier_name,
            };
            map.set(ro.id, converted);
          });
          const merged = Array.from(map.values());
          merged.sort((a, b) => (b.id > a.id ? 1 : -1));
          safeLocalStorageSetItem('akselling_supplier_orders', JSON.stringify(merged));
          return merged;
        });
      }
    });

    const handleCustomerOrderPlaced = (e: Event) => {
      const customEvent = e as CustomEvent<SellerOrder>;
      if (customEvent.detail) {
        setOrders(prev => [customEvent.detail, ...prev.filter(o => o.id !== customEvent.detail.id)]);
      } else {
        try {
          const saved = safeLocalStorageGetItem('akselling_supplier_orders');
          if (saved) setOrders(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('akselling_orders_updated', handleCustomerOrderPlaced);
    return () => {
      unsubscribe();
      window.removeEventListener('akselling_orders_updated', handleCustomerOrderPlaced);
    };
  }, []);

  // Sync helper
  const syncProductToCloud = async (prod: SellerProduct) => {
    try {
      await saveProductToFirestore(prod);
    } catch (err) {
      console.log('Product Firestore cloud sync notice:', err);
    }
  };

  // Navigation helper
  const handleNavigateTab = (tab: SupplierTab, filter?: string) => {
    setActiveTab(tab);
    setSubFilter(filter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Order actions
  const handleUpdateOrderStatus = (orderId: string, newStatus: SellerOrder['status']) => {
    const awb = `SFX${Math.floor(10000000 + Math.random() * 90000000)}`;
    const courier = 'Shadowfax Express';

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            awbCode: o.awbCode || awb,
            courierName: o.courierName || courier,
          };
        }
        return o;
      })
    );

    updateOrderStatusInFirestore(orderId, newStatus, {
      awb_code: awb,
      courier_name: courier,
    }).catch(() => {});
  };

  // Product actions
  const handleSaveProduct = (prod: SellerProduct) => {
    setProducts(prev => {
      const exists = prev.some(p => p.id === prod.id);
      const nextList = exists
        ? prev.map(p => (p.id === prod.id ? prod : p))
        : [prod, ...prev];
      safeLocalStorageSetItem('akselling_seller_products', JSON.stringify(nextList));
      try {
        window.dispatchEvent(new CustomEvent('akselling_products_updated'));
      } catch {
        // ignore
      }
      return nextList;
    });
    syncProductToCloud(prod);
    setEditingProduct(null);
    alert(`🎉 Product "${prod.title}" publish ho gaya hai aur customer shopping feed / search me active dikhne laga hai!`);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const updated = {
            ...p,
            stock: newStock,
            status: (newStock > 0 ? 'live' : 'out_of_stock') as SellerProduct['status'],
          };
          syncProductToCloud(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const handleToggleStatus = (productId: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const nextStatus = p.status === 'live' ? 'out_of_stock' : 'live';
          const updated = {
            ...p,
            status: nextStatus as SellerProduct['status'],
            stock: nextStatus === 'live' && p.stock === 0 ? 10 : p.stock,
          };
          syncProductToCloud(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this catalog?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      deleteProductFromFirestore(productId).catch(() => {});
    }
  };

  const handleApplyPrice = (productId: string, newPrice: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            price: newPrice,
            discount: p.mrp > newPrice ? Math.round(((p.mrp - newPrice) / p.mrp) * 100) : p.discount,
          };
        }
        return p;
      })
    );
  };

  // Submit Claim
  const handleSubmitClaim = (claim: SPFClaim) => {
    setClaims(prev => [claim, ...prev]);
  };

  // Pending count for tab badge
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-gray-900 flex flex-col font-sans selection:bg-[#2874f0] selection:text-white">
      {/* 1. Top Supplier Hub Header (Flipkart Blue Theme) */}
      <header className="sticky top-0 z-40 bg-[#2874f0] text-white border-b border-[#1a65dc] shadow-md">
        <div className="max-w-4xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-white/15 rounded-xl text-white transition-colors flex items-center gap-1"
              title="Return to Shopping"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center text-gray-950 font-black text-sm shadow-xs shrink-0">
                💎
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                    {storeName}
                  </span>
                  <span className="bg-yellow-400 text-gray-950 text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                    SELLER HUB
                  </span>
                </div>
                <p className="text-[10px] text-blue-100 truncate">Flipkart / AKSelling Seller Hub</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAddSampleOrder}
              className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-gray-950 text-xs font-black px-2.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all"
              title="Add 1 Test Order to test shipping labels & courier dispatch"
            >
              <Package size={13} />
              <span className="hidden sm:inline">+ Test Order</span>
            </button>

            <button
              onClick={onBack}
              className="bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 transition-all"
            >
              <ShoppingBag size={14} className="text-yellow-300" />
              <span className="hidden sm:inline">Buyer Mode</span>
              <span className="inline sm:hidden text-[11px]">Store</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4">
        {activeTab === 'home' && (
          <SupplierHomeTab
            storeName={storeName}
            products={products}
            orders={orders}
            onNavigateTab={handleNavigateTab}
            onOpenScanner={() => setShowScannerModal(true)}
            onOpenLabelModal={ord => setActiveLabelOrder(ord || orders[0])}
            onOpenReelsStudio={() => setShowReelsStudio(true)}
          />
        )}

        {activeTab === 'orders' && (
          <SupplierOrdersTab
            orders={orders}
            initialSubFilter={subFilter}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onOpenLabelModal={ord => setActiveLabelOrder(ord)}
            onOpenTrackingModal={ord => setTrackingOrder(ord)}
          />
        )}

        {activeTab === 'returns' && (
          <SupplierReturnsTab
            returns={returns}
            claims={claims}
            onOpenClaimModal={item => setClaimReturnItem(item || 'generic')}
            onOpenTrackingModal={retItem =>
              setTrackingOrder({
                id: retItem.id,
                orderNumber: retItem.orderNumber,
                customerName: retItem.customerName,
                customerCity: retItem.customerCity,
                items: [],
                totalAmount: retItem.refundAmount,
                paymentMethod: 'Return',
                status: 'shipped',
                orderDate: retItem.initiatedDate,
                courierName: retItem.courierPartner,
                awbCode: retItem.trackingNumber,
              })
            }
          />
        )}

        {activeTab === 'inventory' && (
          <SupplierInventoryTab
            products={products}
            initialSubFilter={subFilter}
            onAddProduct={() => setEditingProduct('new')}
            onBulkUpload={() => setShowBulkUploadModal(true)}
            onEditProduct={prod => setEditingProduct(prod)}
            onUpdateStock={handleUpdateStock}
            onToggleStatus={handleToggleStatus}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'menu' && (
          <SupplierMenuTab
            storeName={storeName}
            onOpenPricingTool={() => setShowPricingTool(true)}
            onOpenClaimsModal={() => {
              setActiveTab('returns');
              setSubFilter('claims');
            }}
            onOpenBulkUpload={() => setShowBulkUploadModal(true)}
            onOpenPayouts={() => setShowPayoutsModal(true)}
            onOpenBankDetails={() => setShowBankDetailsModal(true)}
            onOpenShiprocket={() => setShowShiprocketModal(true)}
            onOpenQuality={() => setShowQualityModal(true)}
            onOpenWarehouse={() => setShowWarehouseModal(true)}
            onOpenAnalytics={() => setShowAnalyticsModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            onSwitchToBuying={onBack}
            onOpenReelsStudio={() => setShowReelsStudio(true)}
            onResetStartupData={handleResetStartupData}
          />
        )}
      </main>

      {/* 3. Bottom Navigation Bar (Flipkart Blue Theme) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full z-40 bg-white border-t border-gray-200/90 shadow-lg">
        <div className="w-full grid grid-cols-5 py-1 px-1">
          {/* 1. Home Tab */}
          <button
            onClick={() => handleNavigateTab('home')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all ${
              activeTab === 'home'
                ? 'text-[#2874f0] font-black'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <Home size={20} className={activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[11px] mt-0.5">Home</span>
          </button>

          {/* 2. Orders Tab */}
          <button
            onClick={() => handleNavigateTab('orders', 'pending')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all relative ${
              activeTab === 'orders'
                ? 'text-[#2874f0] font-black'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <div className="relative">
              <Package size={20} className={activeTab === 'orders' ? 'stroke-[2.5]' : 'stroke-2'} />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-black rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5">Orders</span>
          </button>

          {/* 3. Returns Tab */}
          <button
            onClick={() => handleNavigateTab('returns')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all ${
              activeTab === 'returns'
                ? 'text-[#2874f0] font-black'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <RotateCcw size={20} className={activeTab === 'returns' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[11px] mt-0.5">Returns</span>
          </button>

          {/* 4. Inventory Tab */}
          <button
            onClick={() => handleNavigateTab('inventory')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all ${
              activeTab === 'inventory'
                ? 'text-[#2874f0] font-black'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <Boxes size={20} className={activeTab === 'inventory' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[11px] mt-0.5">Inventory</span>
          </button>

          {/* 5. Menu Tab */}
          <button
            onClick={() => handleNavigateTab('menu')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all ${
              activeTab === 'menu'
                ? 'text-[#2874f0] font-black'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <MenuIcon size={20} className={activeTab === 'menu' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[11px] mt-0.5">Menu</span>
          </button>
        </div>
      </nav>

      {/* 4. Modals */}
      {activeLabelOrder && (
        <ShippingLabelModal
          order={activeLabelOrder}
          onClose={() => setActiveLabelOrder(null)}
        />
      )}

      {showScannerModal && (
        <BarcodeScannerModal
          onClose={() => setShowScannerModal(false)}
          onDispatched={() => {
            if (orders.length > 0) {
              handleUpdateOrderStatus(orders[0].id, 'shipped');
            }
          }}
        />
      )}

      {editingProduct && (
        <AddEditCatalogModal
          product={editingProduct === 'new' ? null : editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}

      {claimReturnItem && (
        <SPFClaimModal
          returnItem={claimReturnItem === 'generic' ? undefined : claimReturnItem}
          onClose={() => setClaimReturnItem(null)}
          onSubmitClaim={handleSubmitClaim}
        />
      )}

      {showPricingTool && (
        <PricingToolModal
          onClose={() => setShowPricingTool(false)}
          onApplyPrice={handleApplyPrice}
        />
      )}

      {showPayoutsModal && (
        <PayoutsModal onClose={() => setShowPayoutsModal(false)} />
      )}

      {showBankDetailsModal && (
        <BankDetailsModal onClose={() => setShowBankDetailsModal(false)} />
      )}

      {showShiprocketModal && (
        <ShiprocketSettingsModal onClose={() => setShowShiprocketModal(false)} />
      )}

      {showBulkUploadModal && (
        <BulkUploadModal onClose={() => setShowBulkUploadModal(false)} />
      )}

      {showQualityModal && (
        <QualityRatingModal onClose={() => setShowQualityModal(false)} />
      )}

      {showWarehouseModal && (
        <WarehouseLocationsModal onClose={() => setShowWarehouseModal(false)} />
      )}

      {showAnalyticsModal && (
        <BusinessAnalyticsModal onClose={() => setShowAnalyticsModal(false)} />
      )}

      {showSettingsModal && (
        <SupplierSettingsModal
          storeName={storeName}
          onSaveStoreName={handleSaveStoreName}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showReelsStudio && (
        <SupplierReelsStudio
          isOpen={showReelsStudio}
          onClose={() => setShowReelsStudio(false)}
          storeName={storeName}
          products={products}
        />
      )}

      {trackingOrder && (
        <ShipmentTrackingModal
          orderNumber={trackingOrder.orderNumber}
          courierName={trackingOrder.courierName || 'Shadowfax Express'}
          awb={trackingOrder.awbCode || 'SFX9482910'}
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </div>
  );
}
