import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  Search,
  Plus,
} from 'lucide-react';
import type { ReturnItem, SPFClaim } from '@/types/supplier';

interface SupplierReturnsTabProps {
  returns: ReturnItem[];
  claims: SPFClaim[];
  onOpenClaimModal: (returnItem?: ReturnItem) => void;
  onOpenTrackingModal: (returnItem: ReturnItem) => void;
}

export default function SupplierReturnsTab({
  returns,
  claims,
  onOpenClaimModal,
  onOpenTrackingModal,
}: SupplierReturnsTabProps) {
  const [returnTypeFilter, setReturnTypeFilter] = useState<'customer_return' | 'rto_courier' | 'claims'>('customer_return');
  const [searchQuery, setSearchQuery] = useState('');

  const customerReturns = returns.filter(r => r.returnType === 'customer_return');
  const rtoReturns = returns.filter(r => r.returnType === 'rto_courier');

  const filteredReturns = (returnTypeFilter === 'customer_return' ? customerReturns : rtoReturns).filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.orderNumber.toLowerCase().includes(query) ||
      item.productTitle.toLowerCase().includes(query) ||
      item.customerName.toLowerCase().includes(query) ||
      item.trackingNumber.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-3.5 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Returns & RTO Hub</h1>
            <p className="text-xs text-gray-500">Track customer returns, RTO shipments & file SPF claims</p>
          </div>
          <button
            onClick={() => onOpenClaimModal()}
            className="bg-[#2874f0] hover:bg-[#1a65dc] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1 transition-all"
          >
            <Plus size={14} /> File SPF Claim
          </button>
        </div>

        {/* Return Health Scorecard */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 text-center">
          <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
            <div className="text-[10px] text-emerald-800 font-semibold">Customer Return Rate</div>
            <div className="text-base font-black text-emerald-700 mt-0.5">0%</div>
            <div className="text-[9px] text-emerald-600 font-bold">🟢 Startup Safe</div>
          </div>

          <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
            <div className="text-[10px] text-blue-800 font-semibold">Courier Return (RTO)</div>
            <div className="text-base font-black text-blue-700 mt-0.5">0%</div>
            <div className="text-[9px] text-blue-600 font-bold">🟢 Safe Range</div>
          </div>

          <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
            <div className="text-[10px] text-indigo-800 font-semibold">SPF Recovered</div>
            <div className="text-base font-black text-[#2874f0] mt-0.5">₹0</div>
            <div className="text-[9px] text-indigo-600 font-bold">100% Protected</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search return order #, product name, or tracking..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#2874f0]"
          />
        </div>

        {/* Sub-Filters Tabs */}
        <div className="flex items-center gap-1.5 pt-1 text-xs font-bold">
          <button
            onClick={() => setReturnTypeFilter('customer_return')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all border flex items-center justify-center gap-1.5 ${
              returnTypeFilter === 'customer_return'
                ? 'bg-[#2874f0] text-white border-[#2874f0] shadow-2xs'
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <span>Customer Returns</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              returnTypeFilter === 'customer_return' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
            }`}>
              {customerReturns.length}
            </span>
          </button>

          <button
            onClick={() => setReturnTypeFilter('rto_courier')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all border flex items-center justify-center gap-1.5 ${
              returnTypeFilter === 'rto_courier'
                ? 'bg-[#2874f0] text-white border-[#2874f0] shadow-2xs'
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <span>Courier Returns (RTO)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              returnTypeFilter === 'rto_courier' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
            }`}>
              {rtoReturns.length}
            </span>
          </button>

          <button
            onClick={() => setReturnTypeFilter('claims')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all border flex items-center justify-center gap-1.5 ${
              returnTypeFilter === 'claims'
                ? 'bg-[#2874f0] text-white border-[#2874f0] shadow-2xs'
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <span>SPF Claims</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              returnTypeFilter === 'claims' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
            }`}>
              {claims.length}
            </span>
          </button>
        </div>
      </div>

      {/* SPF Claims View */}
      {returnTypeFilter === 'claims' ? (
        <div className="space-y-3">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-xs text-blue-950 flex items-start gap-2">
            <ShieldCheck size={16} className="text-[#2874f0] shrink-0 mt-0.5" />
            <p>
              <strong>Supplier Protection Fund (SPF):</strong> If you received a wrong, damaged, or empty return parcel, file a claim within 7 days of delivery to get a 100% refund.
            </p>
          </div>

          {claims.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-2xs space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#2874f0]">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-sm font-bold text-gray-900">0 SPF Claims Filed</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                No active or historical SPF claims found. All your dispatches are fully insured.
              </p>
            </div>
          ) : (
            claims.map(claim => (
              <div key={claim.id} className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-900">Claim #{claim.id}</span>
                    <div className="text-[11px] text-gray-500">Order: {claim.orderNumber} • Submitted {claim.submittedDate}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      claim.status === 'approved' || claim.status === 'settled'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {claim.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={claim.productImage}
                    alt={claim.productTitle}
                    className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{claim.productTitle}</h4>
                    <p className="text-[11px] text-gray-600 mt-0.5">Reason: <strong>{claim.claimReason}</strong></p>
                    <p className="text-xs font-bold text-[#2874f0]">Claim Amount: ₹{claim.claimedAmount}</p>
                  </div>
                </div>

                {claim.remarks && (
                  <div className="text-[11px] bg-gray-50 p-2 rounded-lg text-gray-600 border border-gray-100">
                    <strong>Resolution:</strong> {claim.remarks}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Returns List */
        <div className="space-y-3">
          {filteredReturns.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-2xs space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#2874f0]">
                <Truck size={24} />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No {returnTypeFilter === 'customer_return' ? 'Customer Returns' : 'RTO Returns'}</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                0 returns in this tab. Your AKSelling Seller Hub orders are healthy with zero return complaints!
              </p>
            </div>
          ) : (
            filteredReturns.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3 hover:border-blue-200 transition-all"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-900">{item.orderNumber}</span>
                    <div className="text-[11px] text-gray-500">{item.initiatedDate} • {item.customerCity}</div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'delivered_to_seller'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.status === 'delivered_to_seller' ? 'Delivered to You' : 'In Transit'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={item.productImage}
                    alt={item.productTitle}
                    className="w-14 h-14 object-cover rounded-xl border border-gray-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.productTitle}</h4>
                    <div className="text-[11px] text-rose-600 font-semibold mt-0.5 bg-rose-50 px-2 py-0.5 rounded inline-block">
                      Reason: {item.reason}
                    </div>
                    <div className="text-xs font-bold text-gray-700 mt-1">
                      Value: ₹{item.refundAmount} • SKU: {item.sku}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Truck size={13} className="text-[#2874f0]" />
                    <span>{item.courierPartner} (AWB: {item.trackingNumber})</span>
                  </div>
                  <button
                    onClick={() => onOpenTrackingModal(item)}
                    className="text-[11px] font-bold text-[#2874f0] hover:underline"
                  >
                    Track Parcel
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onOpenClaimModal(item)}
                    className="flex-1 bg-[#2874f0] hover:bg-[#1a65dc] text-white text-xs font-bold py-2 px-3 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ShieldCheck size={14} />
                    <span>File Wrong Return Claim</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
