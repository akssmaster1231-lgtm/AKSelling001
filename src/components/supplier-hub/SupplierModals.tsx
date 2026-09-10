import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Scan,
  Upload,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Truck,
  FileSpreadsheet,
  Download,
  MapPin,
  ExternalLink,
  Clock,
} from 'lucide-react';
import type { SellerOrder, ReturnItem, SPFClaim } from '@/types/supplier';
import { getShipments } from '@/shiprocket-api';

// 1. Shipping Label Modal
export function ShippingLabelModal({
  order,
  onClose,
}: {
  order: SellerOrder;
  onClose: () => void;
}) {
  const item = order.items[0];
  const awb = order.awbCode || `SFX${Math.floor(10000000 + Math.random() * 90000000)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
        <div className="bg-[#2874f0] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer size={18} />
            <h3 className="font-bold text-sm">Shipping Label Preview</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Printable Label Box */}
        <div className="p-4 overflow-y-auto space-y-3">
          <div className="border-2 border-black p-3.5 rounded-lg font-sans text-xs space-y-3 bg-white text-black">
            {/* Top header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div>
                <span className="text-base font-black tracking-wider">AKSelling Seller Hub</span>
                <p className="text-[10px] uppercase font-bold">Standard Surface Express</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black bg-black text-white px-2 py-0.5 rounded">
                  {order.paymentMethod.toUpperCase()}
                </span>
                <p className="text-[10px] font-mono mt-0.5 font-bold">₹{order.totalAmount}</p>
              </div>
            </div>

            {/* Barcode representation */}
            <div className="text-center py-2 border-b-2 border-black space-y-1">
              <div className="font-mono text-xl tracking-[0.3em] font-black">||| | |||| || ||| |||| |</div>
              <div className="font-mono text-xs font-bold tracking-widest">{awb}</div>
              <div className="text-[9px] text-gray-700">Courier: Shadowfax Express Surface</div>
            </div>

            {/* Delivery address */}
            <div className="border-b-2 border-black pb-2 space-y-0.5">
              <p className="text-[10px] font-bold uppercase text-gray-600">Ship To (Customer):</p>
              <p className="font-black text-sm">{order.customerName}</p>
              <p className="text-xs">{order.customerAddress || 'Flat 402, Royal Palms, Sector 62'}</p>
              <p className="font-bold text-xs">{order.customerCity} - PIN: {order.customerPincode || '201301'}</p>
              <p className="text-[11px] font-mono">Phone: {order.customerPhone || '+91 98112 34567'}</p>
            </div>

            {/* Return Address & Item Details */}
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
              <div>
                <p className="font-bold uppercase text-gray-600">Return Address (Seller):</p>
                <p className="font-bold">AK Yadav Prints Hub</p>
                <p>Khasra 42, Okhla Phase 3</p>
                <p>New Delhi - 110020</p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase text-gray-600">Item Details:</p>
                <p className="font-bold truncate">{item?.title || 'Catalog Product'}</p>
                <p>Qty: {item?.quantity || 1} • SKU: {item?.sku || 'AK-TSHIRT'}</p>
                <p>Order: {order.orderNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-xl"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 bg-[#2874f0] hover:bg-[#1a65dc] text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
          >
            <Printer size={15} />
            <span>Print Label (A6 / Thermal)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Barcode Scanner / Packet Dispatch Simulator Modal
export function BarcodeScannerModal({
  onClose,
  onDispatched,
}: {
  onClose: () => void;
  onDispatched: (awb: string) => void;
}) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedList, setScannedList] = useState<string[]>(['SFX9482910', 'SFX8372019']);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const code = barcodeInput.trim().toUpperCase();
    if (!scannedList.includes(code)) {
      setScannedList(prev => [code, ...prev]);
    }
    setLastScanned(code);
    setBarcodeInput('');
  };

  const handleSimulateQuickScan = () => {
    const randomAwb = `SFX${Math.floor(10000000 + Math.random() * 90000000)}`;
    setScannedList(prev => [randomAwb, ...prev]);
    setLastScanned(randomAwb);
  };

  const handleConfirmHandover = () => {
    if (scannedList.length > 0) {
      onDispatched(scannedList[0]);
    }
    alert(`Success! Handed over ${scannedList.length} packets to Courier Pickup Partner.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan size={18} />
            <h3 className="font-bold text-sm">Scan & Dispatch Branded Packets</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {/* Scanner Simulation box */}
          <div className="bg-gray-900 rounded-xl p-4 text-center text-white relative overflow-hidden space-y-3">
            <div className="w-16 h-16 border-2 border-emerald-400 border-dashed rounded-xl mx-auto flex items-center justify-center relative">
              <Scan size={32} className="text-emerald-400 animate-pulse" />
              <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] top-1/2 animate-bounce"></div>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300">Scanner Camera Ready</p>
              <p className="text-[10px] text-gray-400">Point at shipping label barcode or enter AWB number below</p>
            </div>
            <button
              onClick={handleSimulateQuickScan}
              type="button"
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm"
            >
              ⚡ Simulate 1-Tap Barcode Scan
            </button>
          </div>

          {/* Manual Entry Form */}
          <form onSubmit={handleScanSubmit} className="flex gap-2">
            <input
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder="Or type AWB e.g. SFX9482910"
              className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl"
            >
              Add
            </button>
          </form>

          {/* Scanned List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>Scanned Packets ({scannedList.length})</span>
              {lastScanned && (
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                  Last Scanned: {lastScanned}
                </span>
              )}
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-gray-100 bg-gray-50 p-2 rounded-xl border border-gray-200">
              {scannedList.map((code, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 text-xs">
                  <span className="font-mono font-bold text-gray-800">{code}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmHandover}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={15} />
            <span>Generate Manifest & Confirm Handover ({scannedList.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Re-export AddEditCatalogModal from dedicated component
export { default as AddEditCatalogModal } from './AddEditCatalogModal';

// Re-export Business Modals
export {
  QualityRatingModal,
  WarehouseLocationsModal,
  BusinessAnalyticsModal,
  SupplierSettingsModal,
} from './SupplierBusinessModals';

// 4. SPF Claim Modal
export function SPFClaimModal({
  returnItem,
  onClose,
  onSubmitClaim,
}: {
  returnItem?: ReturnItem;
  onClose: () => void;
  onSubmitClaim: (claim: SPFClaim) => void;
}) {
  const [reason, setReason] = useState('Damaged product received in return');
  const [amount, setAmount] = useState(returnItem?.refundAmount?.toString() || '649');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClaim: SPFClaim = {
      id: `SPF-${Math.floor(10000 + Math.random() * 90000)}`,
      returnId: returnItem?.id || `ret_${Date.now()}`,
      orderNumber: returnItem?.orderNumber || 'OD3948572910',
      productTitle: returnItem?.productTitle || 'Dennis Lingo Men Slim Fit Cotton Shirt',
      productImage: returnItem?.productImage || 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg',
      claimReason: reason,
      claimedAmount: parseInt(amount) || 649,
      status: 'pending',
      submittedDate: 'Today, Just now',
      proofImages: ['https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg'],
      remarks: 'Under review by Supplier Protection Fund Team. Decision within 48h.',
    };

    onSubmitClaim(newClaim);
    alert('SPF Claim submitted successfully! Your claim will be reviewed within 48 hours.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-[#2874f0] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} />
            <h3 className="font-bold text-sm">File SPF Compensation Claim</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 text-[#2874f0]">
            <strong>Supplier Protection Guarantee:</strong> Get up to 100% refund for wrong, damaged, or empty return parcels.
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Claim Reason *</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#2874f0]"
            >
              <option value="Damaged product received in return">Damaged / Torn product received in return</option>
              <option value="Wrong item sent by customer">Wrong item sent by customer</option>
              <option value="Empty box received / item missing">Empty box received / item missing</option>
              <option value="Used / washed product returned">Used / washed product returned</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Claim Amount (₹) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#2874f0]"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Attach Photo Proof (Simulated)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center bg-gray-50">
              <Upload size={20} className="text-gray-400 mx-auto mb-1" />
              <span className="text-[11px] text-gray-500 font-semibold">Damage Photo Attached (1 File)</span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-gray-600 bg-white border border-gray-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold py-2 px-4 rounded-xl shadow-xs"
            >
              Submit Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 5. Pricing Tool Modal
export function PricingToolModal({
  onClose,
  onApplyPrice,
}: {
  onClose: () => void;
  onApplyPrice: (catalogId: string, newPrice: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-[#2874f0] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            <h3 className="font-bold text-sm">Pricing Recommendations</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto text-xs">
          <p className="text-gray-600">
            Based on customer searches on AKSelling Seller Hub, here are recommended prices to win the Buy Box:
          </p>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">Roadster Pure Cotton T-Shirt</span>
              <span className="text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.2 rounded text-[10px]">
                +3.2x Orders
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Current: ₹399</span>
              <span className="font-black text-[#2874f0]">Recommended: ₹369</span>
            </div>
            <button
              onClick={() => {
                onApplyPrice('sp_5', 369);
                alert('Price updated to ₹369! Your catalog is now marked Best Price.');
                onClose();
              }}
              className="w-full bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold py-1.5 rounded-lg text-xs"
            >
              Apply ₹369 & Win Buy Box
            </button>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// 6. Payouts Modal
export function PayoutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="bg-[#2874f0] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={18} />
            <h3 className="font-bold text-sm">Payments & Payouts</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto text-xs">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
            <div className="text-[11px] text-blue-800 font-medium">Upcoming Bank Transfer</div>
            <div className="text-2xl font-black text-[#2874f0] mt-0.5">₹34,250.00</div>
            <div className="text-[10px] text-blue-700 mt-1">Expected in HDFC Bank (**4829) on <strong>25 Aug 2026</strong></div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-gray-900">Recent Bank Settlements</h4>
            {[
              { date: '18 Aug 2026', amount: '₹28,940', orders: 48, utr: 'UTR8920194820' },
              { date: '11 Aug 2026', amount: '₹31,420', orders: 56, utr: 'UTR8920119284' },
              { date: '04 Aug 2026', amount: '₹24,800', orders: 42, utr: 'UTR8920048192' },
            ].map((p, idx) => (
              <div key={idx} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900">{p.amount}</span>
                  <div className="text-[10px] text-gray-500">{p.date} • {p.orders} Orders</div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Settled
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// 7. Bulk Upload Modal
export function BulkUploadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-[#2874f0] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} />
            <h3 className="font-bold text-sm">Bulk Catalog Upload (Excel/CSV)</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 text-xs">
          <div className="border-2 border-dashed border-[#2874f0]/40 bg-blue-50/40 p-5 rounded-2xl text-center space-y-2">
            <FileSpreadsheet size={32} className="text-[#2874f0] mx-auto" />
            <p className="font-bold text-gray-800">Drag & drop your Catalog CSV file here</p>
            <p className="text-[10px] text-gray-500">Supports .csv, .xlsx up to 500 products at once</p>
            <button
              onClick={() => {
                alert('Catalog Batch Imported successfully! 15 new products listed in Live status.');
                onClose();
              }}
              className="bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
            >
              Select CSV File from Computer
            </button>
          </div>

          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
            <span className="text-gray-700">Need the template?</span>
            <button
              onClick={() => alert('Downloaded AKSelling_Seller_Hub_Catalog_Template.csv')}
              className="text-[#2874f0] font-bold flex items-center gap-1 hover:underline text-[11px]"
            >
              <Download size={13} /> Download Template
            </button>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// 8. Live Tracking Modal
export function ShipmentTrackingModal({
  orderNumber,
  courierName = 'Shadowfax Express Surface',
  awb = 'SFX9482910',
  onClose,
}: {
  orderNumber: string;
  courierName?: string;
  awb?: string;
  onClose: () => void;
}) {
  const allShipments = getShipments();
  const matched =
    allShipments[orderNumber] ||
    allShipments[awb] ||
    Object.values(allShipments).find(
      s => s.orderNumber === orderNumber || s.orderId === orderNumber || s.awbCode === awb
    );

  const activeCourier = matched?.courierName || courierName;
  const activeAwb = matched?.awbCode || awb;
  const destination = matched?.destinationCity
    ? `${matched.destinationCity} (PIN: ${matched.destinationPincode || '201301'})`
    : 'Noida (PIN: 201301)';
  const pickupHub = matched?.pickupLocation || 'Primary Central Logistics Hub (Gurugram - 122015)';

  const steps = matched?.trackingSteps && matched.trackingSteps.length > 0
    ? matched.trackingSteps
    : [
        {
          label: 'Order Confirmed & Inventory Locked',
          location: 'Merchant Store Database',
          time: '16 Aug, 10:30 AM',
          done: true,
          activity: 'Payment verified and packing slip generated',
        },
        {
          label: `Manifest Generated via ${activeCourier}`,
          location: pickupHub,
          time: '16 Aug, 03:45 PM',
          done: true,
          activity: `AWB ${activeAwb} allotted in Shiprocket live panel`,
        },
        {
          label: 'Courier Rider Arrived & Packet Picked Up',
          location: pickupHub,
          time: '17 Aug, 11:20 AM',
          done: true,
          activity: 'Physical barcode verified and sealed',
        },
        {
          label: `In Transit to ${destination}`,
          location: 'Regional Sorting Hub',
          time: '18 Aug, 06:15 PM',
          done: true,
          activity: 'Express line-haul transit in progress',
        },
        {
          label: `Out for Delivery to ${matched?.customerName || 'Customer'}`,
          location: destination,
          time: `Expected in ${matched?.expectedDelivery || '1-2 Days'}`,
          done: matched?.status === 'DELIVERED',
          activity: 'Courier agent will contact for doorstep delivery',
        },
      ];

  const [copied, setCopied] = useState(false);
  const handleCopyAwb = () => {
    navigator.clipboard.writeText(activeAwb);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up border border-gray-100">
        <div className="bg-gradient-to-r from-[#2874f0] via-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Truck size={18} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Shiprocket Live Tracking Hub</h3>
              <p className="text-[11px] text-blue-100 font-mono">
                Order: {orderNumber} • {activeCourier}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3.5 text-xs overflow-y-auto">
          {/* Header Card with AWB and Live Status */}
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-3.5 rounded-2xl border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                  Assigned Courier Partner
                </span>
                <h4 className="text-sm font-black text-gray-900">{activeCourier}</h4>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live In Transit
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500 font-medium">AWB:</span>
                <span className="font-mono font-bold text-gray-900 text-xs">{activeAwb}</span>
                <button
                  onClick={handleCopyAwb}
                  className="text-[10px] text-[#2874f0] font-bold hover:underline bg-white px-1.5 py-0.2 rounded border border-blue-200"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <div className="text-[11px] text-gray-600 font-medium">
                ETA: <strong className="text-gray-900">{matched?.expectedDelivery || '2-3 Days'}</strong>
              </div>
            </div>
          </div>

          {/* Route Info */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-0.5">
              <span className="text-gray-400 font-bold uppercase text-[9.5px] block">
                Pickup Warehouse
              </span>
              <p className="font-bold text-gray-800 truncate">{pickupHub}</p>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-0.5">
              <span className="text-gray-400 font-bold uppercase text-[9.5px] block">
                Delivery Destination
              </span>
              <p className="font-bold text-gray-800 truncate">{destination}</p>
            </div>
          </div>

          {/* Checkpoint Timeline */}
          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={13} className="text-[#2874f0]" />
              <span>Real-Time Checkpoint Logs</span>
            </h4>

            <div className="space-y-3 pl-1.5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  {idx < steps.length - 1 && (
                    <div
                      className={`absolute left-2.5 top-6 w-0.5 h-10 ${
                        step.done ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 mt-0.5 ${
                      step.done ? 'bg-emerald-500 font-bold shadow-xs' : 'bg-gray-300'
                    }`}
                  >
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-bold text-gray-900 text-xs">{step.label}</p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{step.time}</span>
                    </div>
                    {step.location && (
                      <p className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {step.location}
                      </p>
                    )}
                    {step.activity && (
                      <p className="text-[10.5px] text-gray-500 mt-0.5">{step.activity}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
          <a
            href={matched?.trackingUrl || `https://shiprocket.co/tracking/${activeAwb}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-[#2874f0] hover:underline flex items-center gap-1"
          >
            <span>Open Shiprocket Web Tracking</span>
            <ExternalLink size={12} />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
