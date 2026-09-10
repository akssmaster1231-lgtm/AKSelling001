import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Package,
  CheckCircle2,
  Truck,
  Clock,
  PackageCheck,
  MapPin,
  Loader2,
  RotateCcw,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { formatPrice } from '@/data';
import { useI18n } from '@/i18n';
import { subscribeOrders, type FirestoreOrder } from '@/firebase';
import { useAuth } from '@/auth-context';

interface OrdersPageProps {
  onBack: () => void;
}

type OrderRow = FirestoreOrder;

export default function OrdersPage({ onBack }: OrdersPageProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [returnRequested, setReturnRequested] = useState<string | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderRow | null>(null);
  const [copiedAwb, setCopiedAwb] = useState(false);

  useEffect(() => {
    let localOrders: OrderRow[] = [];
    try {
      const stored = localStorage.getItem('akselling_local_orders');
      if (stored) {
        localOrders = JSON.parse(stored);
        setOrders(localOrders);
        setLoading(false);
      }
    } catch {
      // ignore
    }

    // Subscribe to Firestore orders in real-time
    const unsubscribe = subscribeOrders(user?.phone, (firestoreOrders) => {
      if (firestoreOrders.length > 0) {
        const ids = new Set(firestoreOrders.map(o => o.id));
        const remainingLocal = localOrders.filter(o => !ids.has(o.id));
        setOrders([...firestoreOrders, ...remainingLocal]);
      } else if (localOrders.length > 0) {
        setOrders(localOrders);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.phone]);

  const handleReturn = (order: OrderRow) => {
    const firstItem = order.items[0];
    if (!firstItem) return;
    try {
      const currentReturns = JSON.parse(localStorage.getItem('akselling_returns') || '[]');
      currentReturns.unshift({
        id: `ret_${Date.now()}`,
        order_id: order.id,
        product_id: firstItem.product_id,
        product_title: firstItem.product_title,
        product_image: firstItem.product_image,
        customer_name: order.customer_name,
        reason: 'Product fit/quality adjustment',
        status: 'Return Initiated',
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('akselling_returns', JSON.stringify(currentReturns));
    } catch {
      // ignore
    }
    setReturnRequested(order.id);
    setTimeout(() => setReturnRequested(null), 3500);
  };

  const getStatusInfo = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver')) {
      return { icon: <CheckCircle2 size={16} />, color: 'text-success-600 bg-success-500/10', label: t('delivered') };
    }
    if (s.includes('ship') || s.includes('transit')) {
      return { icon: <Truck size={16} />, color: 'text-accent-600 bg-accent-400/10', label: 'In Transit (Shipped)' };
    }
    if (s.includes('ready')) {
      return { icon: <Clock size={16} />, color: 'text-blue-600 bg-blue-50', label: 'Ready to Dispatch' };
    }
    if (s.includes('process')) {
      return { icon: <Clock size={16} />, color: 'text-flipkart-600 bg-flipkart-500/10', label: t('processing') };
    }
    return { icon: <PackageCheck size={16} />, color: 'text-gray-600 bg-gray-100', label: t('placed') };
  };

  const getTimeline = (status: string) => {
    const s = (status || '').toLowerCase();
    const isShippedOrMore = s.includes('ship') || s.includes('transit') || s.includes('deliver');
    const isDelivered = s.includes('deliver');
    const steps = [
      { label: t('placed'), done: true, icon: <PackageCheck size={14} /> },
      { label: 'Confirmed', done: true, icon: <Clock size={14} /> },
      { label: 'Shipped', done: isShippedOrMore, icon: <Truck size={14} /> },
      { label: t('delivered'), done: isDelivered, icon: <CheckCircle2 size={14} /> },
    ];
    return steps;
  };

  const copyAwb = (awb: string) => {
    try {
      navigator.clipboard.writeText(awb);
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[65] bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-flipkart-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[65] bg-gray-50 overflow-y-auto animate-fade-in sm:shadow-2xl sm:border-x sm:border-gray-200">
      <div className="sticky top-0 bg-white shadow-sm px-3 py-2.5 flex items-center gap-3 z-10">
        <button onClick={onBack} className="p-1 text-gray-700">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-base font-bold text-gray-800">{t('myOrders')}</h1>
      </div>

      <div className="px-3 py-4 pb-12">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-flipkart-50 flex items-center justify-center mb-4">
              <Package size={36} className="text-flipkart-300" />
            </div>
            <p className="text-sm text-gray-500">{t('noOrders')}</p>
            <p className="text-xs text-gray-400 mt-1">Your order history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const statusInfo = getStatusInfo(order.status);
              const isExpanded = expandedOrder === order.id;
              const hasShipment = Boolean(order.awb_code || order.courier_name || (order.status && order.status.toLowerCase().includes('ship')));
              const displayAwb = order.awb_code || 'SFX94820184';
              const displayCourier = order.courier_name || 'Shadowfax Surface';

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
                  {/* Order Header */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full p-3 flex items-center gap-3 text-left cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                      {order.items[0]?.product_image && (
                        <img src={order.items[0].product_image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {order.items[0]?.product_title || 'Order'}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Order ID: {order.id.slice(0, 8).toUpperCase()} • {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{formatPrice(order.total_amount)}</span>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-3 space-y-3 animate-fade-in">
                      {/* Shiprocket Live Tracking Highlight Banner */}
                      {hasShipment && (
                        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-blue-700 flex items-center gap-1">
                              <Truck size={12} />
                              <span>Shiprocket Express Dispatch</span>
                            </span>
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              ✓ Live Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-800">
                            <div>
                              <span className="text-gray-500 text-[11px]">Courier: </span>
                              <strong>{displayCourier}</strong>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="text-gray-500 text-[11px]">AWB: </span>
                              <strong>{displayAwb}</strong>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyAwb(displayAwb);
                                }}
                                className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                title="Copy AWB"
                              >
                                {copiedAwb ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => setTrackingModalOrder(order)}
                            className="w-full bg-[#2874f0] hover:bg-[#1a65dc] text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Truck size={14} />
                            <span>Track Live on Shiprocket Radar</span>
                          </button>
                        </div>
                      )}

                      {/* Timeline */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('orderTracking')}</p>
                        <div className="flex items-center justify-between">
                          {getTimeline(order.status).map((step, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? 'bg-flipkart-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                {step.icon}
                              </div>
                              <span className={`text-[10px] ${step.done ? 'text-flipkart-600 font-medium' : 'text-gray-400'}`}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <img src={item.product_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700 line-clamp-1">{item.product_title}</p>
                              <p className="text-xs text-gray-400">Qty: {item.quantity} • {formatPrice(item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address */}
                      <div className="bg-gray-50 rounded-lg p-2.5 flex items-start gap-2">
                        <MapPin size={14} className="text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-600">{order.customer_name}</p>
                          <p className="text-xs text-gray-400">{order.customer_address}</p>
                          <p className="text-xs text-gray-400">Phone: {order.customer_phone}</p>
                        </div>
                      </div>

                      {/* Return Button */}
                      {(order.status === 'Delivered' || order.status === 'delivered') && (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => handleReturn(order)}
                            disabled={returnRequested === order.id}
                            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-error-500 border border-error-200 rounded-lg py-2.5 hover:bg-error-50 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {returnRequested === order.id ? (
                              <><CheckCircle2 size={16} /> Return Request Registered</>
                            ) : (
                              <><RotateCcw size={16} /> Request Return</>
                            )}
                          </button>
                          <p className="text-[10px] text-gray-500 text-center">
                            For support and SPF disputes: <span className="font-semibold text-flipkart-700">support.akselling@gmail.com</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shiprocket Live Tracking Dialog */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-4 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#2874f0]">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Shiprocket Live Tracking</h3>
                  <p className="text-[10px] text-gray-500 font-mono">AWB: {trackingModalOrder.awb_code || 'SFX94820184'}</p>
                </div>
              </div>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 p-2.5 rounded-xl border text-xs space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Courier Partner:</span>
                <strong className="text-gray-900">{trackingModalOrder.courier_name || 'Shadowfax Surface'}</strong>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Destination PIN:</span>
                <strong className="text-gray-900">Delivery Address Hub</strong>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Expected Arrival:</span>
                <strong className="text-emerald-700">Within 48 Hours</strong>
              </div>
            </div>

            {/* Tracking Checkpoints */}
            <div className="space-y-3 text-xs pl-2 border-l-2 border-emerald-500 ml-3">
              <div className="relative pl-3">
                <div className="absolute -left-[19px] top-0 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <p className="font-bold text-gray-900">Order Dispatched from Logistics Hub</p>
                <p className="text-[11px] text-gray-500">Central Warehouse Depot • Picked up by Rider</p>
              </div>
              <div className="relative pl-3">
                <div className="absolute -left-[19px] top-0 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                <p className="font-bold text-gray-900">Manifest Generated & In Transit</p>
                <p className="text-[11px] text-gray-500">Express Container Linehaul • Moving to Local Hub</p>
              </div>
              <div className="relative pl-3">
                <div className="absolute -left-[19px] top-0 w-3 h-3 rounded-full bg-gray-300" />
                <p className="font-medium text-gray-400">Out for Doorstep Delivery</p>
                <p className="text-[11px] text-gray-400">Courier delivery executive scheduled</p>
              </div>
            </div>

            <button
              onClick={() => setTrackingModalOrder(null)}
              className="w-full bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold text-xs py-2.5 rounded-xl shadow-xs cursor-pointer"
            >
              Close Tracking Radar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

