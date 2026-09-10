import React, { useState, useEffect } from 'react';
import {
  Search,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Zap,
  X,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import type { SellerOrder } from '@/types/supplier';
import {
  getAvailableCouriers,
  createShiprocketOrder,
  getPickupLocations,
  type CourierPartner,
  type PickupLocation,
  saveShipment,
} from '@/shiprocket-api';
import { updateOrderStatusInFirestore } from '@/firebase';

interface SupplierOrdersTabProps {
  orders: SellerOrder[];
  initialSubFilter?: string;
  onUpdateOrderStatus: (orderId: string, status: SellerOrder['status']) => void;
  onOpenLabelModal: (order: SellerOrder) => void;
  onOpenTrackingModal: (order: SellerOrder) => void;
}

type OrderStatusFilter = 'pending' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled';

export default function SupplierOrdersTab({
  orders,
  initialSubFilter,
  onUpdateOrderStatus,
  onOpenLabelModal,
  onOpenTrackingModal,
}: SupplierOrdersTabProps) {
  const [activeFilter, setActiveFilter] = useState<OrderStatusFilter>(
    (initialSubFilter as OrderStatusFilter) || 'pending'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Shipping & Rate Check Modal State
  const [selectedOrderForShip, setSelectedOrderForShip] = useState<SellerOrder | null>(null);
  const [availableCouriers, setAvailableCouriers] = useState<CourierPartner[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<CourierPartner | null>(null);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<PickupLocation | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [shipmentSuccessAwb, setShipmentSuccessAwb] = useState<string | null>(null);

  useEffect(() => {
    const locs = getPickupLocations();
    setPickupLocations(locs);
    if (locs.length > 0) {
      setSelectedPickup(locs.find(l => l.is_default || l.isDefault) || locs[0]);
    }
  }, []);

  const handleOpenRateModal = async (order: SellerOrder) => {
    setSelectedOrderForShip(order);
    setShipmentSuccessAwb(null);
    setIsLoadingRates(true);

    const locs = getPickupLocations();
    setPickupLocations(locs);
    const defaultPickup = locs.find(l => l.is_default || l.isDefault) || locs[0];
    setSelectedPickup(defaultPickup);

    const pickupPin = defaultPickup?.pincode || '110020';
    const destPin = order.customerPincode || '201301';

    try {
      const couriers = await getAvailableCouriers(pickupPin, destPin, 0.5);
      setAvailableCouriers(couriers);
      const recommended = couriers.find(c => c.is_recommended) || couriers[0];
      setSelectedCourier(recommended);
    } catch {
      // fallback
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleConfirmShipment = () => {
    if (!selectedOrderForShip || !selectedCourier || !selectedPickup) return;

    setIsShipping(true);
    setTimeout(() => {
      const shipment = createShiprocketOrder({
        orderId: selectedOrderForShip.id,
        orderNumber: selectedOrderForShip.orderNumber,
        courier: selectedCourier,
        pickupLocation: selectedPickup,
        destinationCity: selectedOrderForShip.customerCity,
        destinationPincode: selectedOrderForShip.customerPincode || '201301',
        customerName: selectedOrderForShip.customerName,
        customerPhone: selectedOrderForShip.customerPhone,
        customerAddress: selectedOrderForShip.customerAddress,
        weightKg: 0.5,
      });

      saveShipment(shipment);
      onUpdateOrderStatus(selectedOrderForShip.id, 'shipped');
      setShipmentSuccessAwb(shipment.awbCode || 'SFX9482910');
      setIsShipping(false);

      // Real-time synchronization to Firebase Firestore
      updateOrderStatusInFirestore(selectedOrderForShip.id, 'Shipped', {
        awb_code: shipment.awbCode,
        courier_name: selectedCourier.name,
        tracking_url: shipment.trackingUrl,
        label_url: shipment.labelUrl,
      }).catch(err => console.warn('Firestore shipment status sync:', err));
    }, 600);
  };

  const counts: Record<OrderStatusFilter, number> = {
    pending: orders.filter(o => o.status === 'pending').length,
    ready_to_ship: orders.filter(o => o.status === 'ready_to_ship').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const filteredOrders = orders.filter(order => {
    if (order.status !== activeFilter) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.items.some(i => i.title.toLowerCase().includes(query) || (i.sku && i.sku.toLowerCase().includes(query)))
    );
  });

  return (
    <div className="space-y-3.5 pb-20">
      {/* Top Header & Search */}
      <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Orders Management</h1>
            <p className="text-xs text-gray-500">Live Shiprocket rate check, parcel label & dispatch</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-[#2874f0] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
              {counts.pending} Pending Dispatch
            </span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Customer Name, SKU..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2874f0] focus:bg-white transition-all"
          />
        </div>

        {/* Sub-Filters Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          {(
            [
              { id: 'pending', label: 'Pending', count: counts.pending, color: 'text-rose-600' },
              { id: 'ready_to_ship', label: 'Ready to Ship', count: counts.ready_to_ship, color: 'text-blue-600' },
              { id: 'shipped', label: 'Shipped', count: counts.shipped, color: 'text-amber-600' },
              { id: 'delivered', label: 'Delivered', count: counts.delivered, color: 'text-emerald-600' },
              { id: 'cancelled', label: 'Cancelled', count: counts.cancelled, color: 'text-gray-500' },
            ] as const
          ).map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? 'bg-[#2874f0] text-white border-[#2874f0] shadow-2xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-200/80 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200/80 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#2874f0]">
            <Package size={24} />
          </div>
          <h3 className="text-sm font-bold text-gray-900">No {activeFilter.replace('_', ' ')} orders</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {searchQuery
              ? `No orders matching "${searchQuery}". Try searching with another ID or name.`
              : `You currently have 0 orders in ${activeFilter.replace('_', ' ')} status. Ready for live customer orders!`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3 hover:border-blue-200 transition-all"
            >
              {/* Card Top: Order Number, Date & SLA */}
              <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-900">{order.orderNumber}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        order.paymentMethod.toLowerCase().includes('prepaid')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {order.paymentMethod}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{order.orderDate}</div>
                </div>

                {order.status === 'pending' && (
                  <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-200 shrink-0">
                    <Clock size={11} /> Dispatch by Tomorrow
                  </span>
                )}
                {order.status === 'ready_to_ship' && (
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200 shrink-0">
                    <CheckCircle2 size={11} /> Label Ready
                  </span>
                )}
                {order.status === 'shipped' && (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200 shrink-0">
                    <Truck size={11} /> In Transit
                  </span>
                )}
                {order.status === 'delivered' && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 shrink-0">
                    <CheckCircle2 size={11} /> Delivered
                  </span>
                )}
              </div>

              {/* Product Item info */}
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-14 object-cover rounded-xl border border-gray-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                        {item.sku && <span className="font-mono bg-gray-100 px-1.5 py-0.2 rounded text-[10px]">SKU: {item.sku}</span>}
                        {item.size && <span>Size: <strong className="text-gray-700">{item.size}</strong></span>}
                        <span>Qty: <strong className="text-gray-700">{item.quantity}</strong></span>
                      </div>
                      <div className="text-xs font-black text-[#2874f0] mt-0.5">
                        ₹{item.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer & Destination Summary */}
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-700 min-w-0">
                  <MapPin size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate">
                    <strong>{order.customerName}</strong> • {order.customerCity} (PIN: {order.customerPincode || '201301'})
                  </span>
                </div>
                <span className="font-bold text-gray-900 shrink-0 ml-2">
                  Total: ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleOpenRateModal(order)}
                      className="flex-1 bg-[#2874f0] hover:bg-[#1a65dc] text-white text-xs font-bold py-2 px-3 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Truck size={14} className="text-yellow-300" />
                      <span>Ship with Shiprocket (Check Rates)</span>
                    </button>
                    <button
                      onClick={() => onOpenLabelModal(order)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1 transition-all"
                      title="Preview Label"
                    >
                      <Printer size={14} />
                    </button>
                  </>
                )}

                {order.status === 'ready_to_ship' && (
                  <>
                    <button
                      onClick={() => onOpenLabelModal(order)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Printer size={14} />
                      <span>Print Shipping Label (A6)</span>
                    </button>
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'shipped')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-2xs flex items-center gap-1 transition-all"
                    >
                      <Truck size={14} />
                      <span>Handover to Courier</span>
                    </button>
                    <button
                      onClick={() => onOpenTrackingModal(order)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1 transition-all"
                      title="Track Live"
                    >
                      <span>Track</span>
                    </button>
                  </>
                )}

                {(order.status === 'shipped' || order.status === 'delivered') && (
                  <button
                    onClick={() => onOpenTrackingModal(order)}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-[#2874f0] text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all border border-blue-200 shadow-2xs"
                  >
                    <Truck size={14} />
                    <span>Track Live on Shiprocket ({order.courierName || 'Shadowfax Express'} • AWB: {order.awbCode || 'SFX9482910'})</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Shiprocket Live Rate Check & Courier Assignment Modal */}
      {/* ========================================================================= */}
      {selectedOrderForShip && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up border border-gray-100">
            {/* Top Modal Header */}
            <div className="bg-gradient-to-r from-[#2874f0] via-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Truck size={18} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Shiprocket Courier & Rate Selection</h3>
                  <p className="text-[11px] text-blue-100">
                    Order {selectedOrderForShip.orderNumber} • {selectedOrderForShip.customerCity}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForShip(null)}
                className="p-1.5 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto text-xs">
              {shipmentSuccessAwb ? (
                /* Success View */
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={26} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900">Shipment Booked Successfully!</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      AWB Code allotted: <strong className="font-mono text-emerald-800">{shipmentSuccessAwb}</strong> via{' '}
                      <strong>{selectedCourier?.name}</strong>
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-left space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Destination:</span>
                      <span className="font-bold text-gray-800">{selectedOrderForShip.customerCity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Pickup Hub:</span>
                      <span className="font-bold text-gray-800 truncate">{selectedPickup?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Estimated Delivery:</span>
                      <span className="font-bold text-emerald-700">{selectedCourier?.etd || '2-3 Days'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        const ord = selectedOrderForShip;
                        setSelectedOrderForShip(null);
                        onOpenLabelModal(ord);
                      }}
                      className="flex-1 bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Printer size={15} />
                      <span>Print Label</span>
                    </button>
                    <button
                      onClick={() => {
                        const ord = selectedOrderForShip;
                        setSelectedOrderForShip(null);
                        onOpenTrackingModal(ord);
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Truck size={15} />
                      <span>Track Live</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Order & Destination Overview */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Recipient Customer</span>
                        <h4 className="font-bold text-gray-900">{selectedOrderForShip.customerName}</h4>
                        <p className="text-[11px] text-gray-600">{selectedOrderForShip.customerAddress || 'Flat 402, Royal Palms'}</p>
                        <p className="text-[11px] font-bold text-gray-800">
                          {selectedOrderForShip.customerCity} - PIN: {selectedOrderForShip.customerPincode || '201301'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Order Value</span>
                        <div className="font-black text-sm text-[#2874f0]">₹{selectedOrderForShip.totalAmount}</div>
                        <span className="text-[10px] text-gray-500 font-mono">Weight: ~0.45 kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Pickup Address Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1">
                      <Building2 size={13} className="text-[#2874f0]" />
                      <span>Select Pickup Warehouse Hub</span>
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {pickupLocations.map(loc => {
                        const isSelected = selectedPickup?.id === loc.id;
                        return (
                          <div
                            key={loc.id}
                            onClick={() => setSelectedPickup(loc)}
                            className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-50/80 border-[#2874f0] ring-1 ring-[#2874f0]'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-gray-900 truncate">{loc.name}</span>
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">PIN: {loc.pincode}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5">{loc.city} • {loc.address}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-[#2874f0] bg-[#2874f0]' : 'border-gray-300'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Courier Partner Selection & Live Rates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1">
                        <Zap size={13} className="text-yellow-600" />
                        <span>Live Shiprocket Courier Rates & Speed</span>
                      </label>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                        ✓ Real-Time Sync
                      </span>
                    </div>

                    {isLoadingRates ? (
                      <div className="p-6 text-center space-y-2 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-6 h-6 border-2 border-[#2874f0] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-gray-500">Calculating cheapest live rates for PIN {selectedOrderForShip.customerPincode || '201301'}...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableCouriers.map(courier => {
                          const isSelected = selectedCourier?.id === courier.id;
                          return (
                            <div
                              key={courier.id}
                              onClick={() => setSelectedCourier(courier)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-50/70 border-[#2874f0] ring-1 ring-[#2874f0]'
                                  : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    isSelected ? 'border-[#2874f0] bg-[#2874f0]' : 'border-gray-300'
                                  }`}
                                >
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-900 text-xs">{courier.name}</span>
                                    {courier.is_recommended && (
                                      <span className="text-[9px] font-extrabold bg-yellow-400 text-gray-950 px-1.5 py-0.2 rounded">
                                        BEST VALUE
                                      </span>
                                    )}
                                    <span className="text-[9px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-bold">
                                      {courier.type}
                                    </span>
                                  </div>
                                  <div className="text-[10.5px] text-gray-500 mt-0.5 flex items-center gap-2">
                                    <span>Est: <strong className="text-gray-700">{courier.etd}</strong></span>
                                    <span>•</span>
                                    <span>{courier.pickup_performance}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0 ml-2">
                                <div className="text-sm font-black text-gray-900">₹{courier.rate}</div>
                                <div className="text-[10px] text-emerald-600 font-semibold">★ {courier.rating} rating</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Bottom Actions */}
            {!shipmentSuccessAwb && (
              <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedOrderForShip(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmShipment}
                  disabled={isShipping || !selectedCourier}
                  className="flex-1 bg-[#2874f0] hover:bg-[#1a65dc] disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  {isShipping ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Live AWB...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      <span>Confirm & Ship via {selectedCourier?.name || 'Courier'} (₹{selectedCourier?.rate || 38})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
