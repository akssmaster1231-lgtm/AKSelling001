import React from 'react';
import {
  Tag,
  ShieldCheck,
  CreditCard,
  Star,
  Building2,
  BarChart3,
  Settings,
  ShoppingBag,
  ChevronRight,
  PhoneCall,
  FileSpreadsheet,
  ArrowRightLeft,
  Truck,
  Landmark,
  Film,
  RotateCcw,
} from 'lucide-react';

interface SupplierMenuTabProps {
  storeName: string;
  onOpenPricingTool: () => void;
  onOpenClaimsModal: () => void;
  onOpenBulkUpload: () => void;
  onOpenPayouts: () => void;
  onOpenBankDetails: () => void;
  onOpenShiprocket: () => void;
  onOpenQuality: () => void;
  onOpenWarehouse: () => void;
  onOpenAnalytics: () => void;
  onOpenSettings: () => void;
  onSwitchToBuying: () => void;
  onOpenReelsStudio?: () => void;
  onResetStartupData?: () => void;
}

export default function SupplierMenuTab({
  storeName,
  onOpenPricingTool,
  onOpenClaimsModal,
  onOpenBulkUpload,
  onOpenPayouts,
  onOpenBankDetails,
  onOpenShiprocket,
  onOpenQuality,
  onOpenWarehouse,
  onOpenAnalytics,
  onOpenSettings,
  onSwitchToBuying,
  onOpenReelsStudio,
  onResetStartupData,
}: SupplierMenuTabProps) {
  // Read active seller info
  const sellerInfo = (() => {
    try {
      const raw = localStorage.getItem('akselling_active_seller');
      if (raw && raw.startsWith('{')) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  })();

  const docSubtitle = sellerInfo?.gst_number
    ? `GSTIN: ${sellerInfo.gst_number} • ${sellerInfo.state || 'Delhi Hub'}`
    : sellerInfo?.pan_number
    ? `PAN: ${sellerInfo.pan_number} • Aadhaar Linked • ${sellerInfo.state || 'India'}`
    : 'GSTIN: 07AAACA1234F1Z5 • Delhi Hub';

  const sellerId = sellerInfo?.seller_id || sellerInfo?.id || 'SLR-DIA-10293';

  const menuItems = [
    ...(onOpenReelsStudio
      ? [
          {
            icon: <Film size={20} className="text-[#2874f0]" />,
            bg: 'bg-blue-100',
            title: 'Video Reels & Shorts Studio',
            subtitle: 'Upload product showcase, dance and styling video reels to Play feed',
            badge: 'NEW STUDIO',
            onClick: onOpenReelsStudio,
          },
        ]
      : []),
    {
      icon: <Landmark size={20} className="text-[#2874f0]" />,
      bg: 'bg-blue-50',
      title: 'Bank Account & Settlement Details',
      subtitle: 'Add/Update Bank Account, IFSC, Beneficiary & UPI ID',
      badge: 'VERIFIED BANK',
      onClick: onOpenBankDetails,
    },
    {
      icon: <Truck size={20} className="text-blue-600" />,
      bg: 'bg-blue-50',
      title: 'Shiprocket Courier & Logistics API',
      subtitle: 'Connect Shiprocket API, auto-AWB & fast courier dispatch',
      badge: 'API READY',
      onClick: onOpenShiprocket,
    },
    {
      icon: <CreditCard size={20} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      title: 'Payments & Payouts',
      subtitle: 'Next Payout: Daily 0% • View settlement UTRs',
      badge: '0% COMMISSION',
      onClick: onOpenPayouts,
    },
    {
      icon: <Tag size={20} className="text-amber-500" />,
      bg: 'bg-amber-50',
      title: 'Pricing Recommendation',
      subtitle: 'Compare prices with top sellers to boost sales by 30%',
      badge: 'RECOMMENDED',
      onClick: onOpenPricingTool,
    },
    {
      icon: <ShieldCheck size={20} className="text-indigo-600" />,
      bg: 'bg-indigo-50',
      title: 'Claims & Compensation (SPF)',
      subtitle: 'Supplier Protection Fund for damaged or missing returns',
      badge: 'SPF PROTECTION',
      onClick: onOpenClaimsModal,
    },
    {
      icon: <FileSpreadsheet size={20} className="text-purple-600" />,
      bg: 'bg-purple-50',
      title: 'Catalog Bulk Upload',
      subtitle: 'Upload catalogs in batch via CSV or Excel templates',
      badge: 'FAST LISTING',
      onClick: onOpenBulkUpload,
    },
    {
      icon: <Star size={20} className="text-amber-500" />,
      bg: 'bg-amber-50',
      title: 'Quality & Rating Dashboard',
      subtitle: 'Store Rating: 4.4★ • Customer return defect rate 0.8%',
      badge: 'TOP RATED',
      onClick: onOpenQuality,
    },
    {
      icon: <Building2 size={20} className="text-cyan-600" />,
      bg: 'bg-cyan-50',
      title: 'Warehouse & Pickup Locations',
      subtitle: 'Manage dispatch pickup addresses & courier pin codes',
      badge: 'HUBS ACTIVE',
      onClick: onOpenWarehouse,
    },
    {
      icon: <BarChart3 size={20} className="text-purple-600" />,
      bg: 'bg-purple-50',
      title: 'Business Dashboard & Analytics',
      subtitle: 'City-wise sales heat map, top selling SKUs & conversion',
      badge: 'INSIGHTS',
      onClick: onOpenAnalytics,
    },
    {
      icon: <Settings size={20} className="text-gray-600" />,
      bg: 'bg-gray-100',
      title: 'Supplier Profile & KYC Documents',
      subtitle: 'GSTIN, PAN card, Aadhaar, pickup contact & bank',
      badge: 'VERIFIED',
      onClick: onOpenSettings,
    },
    ...(onResetStartupData
      ? [
          {
            icon: <RotateCcw size={20} className="text-amber-600" />,
            bg: 'bg-amber-100',
            title: '00 Diamond Startup Fresh Slate',
            subtitle: 'Clear test orders & reset to pure fresh startup metrics',
            badge: 'STARTUP MODE',
            onClick: onResetStartupData,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Store Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1b3b77] to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2874f0] to-blue-600 flex items-center justify-center font-black text-lg text-white shadow-xs">
              {(storeName || 'AK')[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white">{storeName || 'AK Yadav Prints'}</h2>
                <span className="bg-yellow-400 text-gray-950 text-[9px] font-black px-1.5 py-0.2 rounded">
                  {sellerId}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">{docSubtitle}</p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            KYC Verified
          </span>
        </div>
      </div>

      {/* Switch to Buying Mode Quick Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-xs border border-blue-400/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Switch to Buying Mode</h3>
              <p className="text-xs text-blue-100">Return to customer online shopping and cart</p>
            </div>
          </div>

          <button
            onClick={onSwitchToBuying}
            className="bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition-all"
          >
            <ArrowRightLeft size={14} />
            <span>Switch</span>
          </button>
        </div>
      </div>

      {/* All Modules List */}
      <div className="space-y-2">
        <div className="px-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
          Supplier Hub Services & Tools
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs divide-y divide-gray-100 overflow-hidden">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="w-full p-3.5 flex items-center gap-3 hover:bg-blue-50/50 transition-colors text-left group"
            >
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 shadow-2xs`}>
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-900 group-hover:text-[#2874f0] transition-colors">
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{item.subtitle}</p>
              </div>

              <ChevronRight size={16} className="text-gray-400 group-hover:text-[#2874f0] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Help & Support Footer */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs text-center space-y-2">
        <p className="text-xs font-bold text-gray-800">Need help with orders or catalogue?</p>
        <p className="text-[11px] text-gray-500">24x7 Flipkart / AKSelling 00 Seller Priority Desk</p>
        <div className="bg-blue-50/80 p-2 rounded-xl border border-blue-200 text-xs">
          <span className="text-gray-600 block text-[10px]">Official Seller Support Email:</span>
          <a
            href="mailto:support.akselling@gmail.com"
            className="font-bold text-[#2874f0] hover:underline text-xs"
          >
            support.akselling@gmail.com
          </a>
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => alert('00 Seller Diamond Helpline: 1800-208-9898 (Toll Free) • Email: support.akselling@gmail.com')}
            className="text-xs font-bold text-[#2874f0] bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors"
          >
            <PhoneCall size={14} /> Call Seller Support
          </button>
        </div>
      </div>
    </div>
  );
}
