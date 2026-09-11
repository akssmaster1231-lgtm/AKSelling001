import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatPrice } from '@/data';
import { useI18n } from '@/i18n';
import {
  subscribeOrders,
  updateOrderStatusInFirestore,
  saveOrderToFirestore,
  type FirestoreOrder,
} from '@/firebase';
import { useAuth } from '@/auth-context';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import { getStepIndexFromStatus } from '@/utils/orderTracking';
import OrderTrackingModal from '@/components/OrderTrackingModal';

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
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);

  // Synchronize orders in real-time from Firestore and local cache
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

    // Listen to local event broadcasts across windows/tabs
    const handleOrdersUpdated = () => {
      try {
        const updated = localStorage.getItem('akselling_local_orders');
        if (updated) {
          const parsed = JSON.parse(updated);
          setOrders(prev => {
            const map = new Map<string, OrderRow>();
            parsed.forEach((o: OrderRow) => map.set(o.id, o));
            prev.forEach(o => {
              if (!map.has(o.id)) map.set(o.id, o);
            });
            return Array.from(map.values());
          });
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('akselling_orders_updated', handleOrdersUpdated);
    window.addEventListener('storage', handleOrdersUpdated);

    return () => {
      unsubscribe();
      window.removeEventListener('akselling_orders_updated', handleOrdersUpdated);
      window.removeEventListener('storage', handleOrdersUpdated);
    };
  }, [user?.phone]);

  // Real-time status update handler (persists to Firestore + local storage)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const awb = `SFX${orderId.replace(/\D/g, '').slice(-8) || '98421045'}`;
    const courier = 'Shadowfax Express Surface';

    // 1. Optimistic UI update
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            awb_code: o.awb_code || awb,
            courier_name: o.courier_name || courier,
            updated_at: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    // Keep modal in sync if active
    if (trackingModalOrder && trackingModalOrder.id === orderId) {
      setTrackingModalOrder(prev => (prev ? { ...prev, status: newStatus } : null));
    }

    // 2. Persist to local cache
    try {
      const stored = localStorage.getItem('akselling_local_orders');
      if (stored) {
        const list: OrderRow[] = JSON.parse(stored);
        const updated = list.map(o => (o.id === orderId ? { ...o, status: newStatus } : o));
        localStorage.setItem('akselling_local_orders', JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    // 3. Persist to Firestore cloud database in real-time
    try {
      await updateOrderStatusInFirestore(orderId, newStatus, {
        awb_code: awb,
        courier_name: courier,
      });
    } catch (err) {
      console.warn('Real-time Firestore order status update notice:', err);
    }

    // 4. Notify any listeners
    window.dispatchEvent(new CustomEvent('akselling_orders_updated'));
  };

  // Helper to generate a sample order for demonstration/testing if empty
  const handleCreateSampleOrder = async () => {
    const sampleId = `ORD-SAMPLE-${Math.floor(10000 + Math.random() * 90000)}`;
    const sampleOrder: OrderRow = {
      id: sampleId,
      customer_name: user?.name || 'Verified Customer',
      customer_phone: user?.phone || '9876543210',
      customer_address: 'Flat 402, Green Avenue, Connaught Place, New Delhi - 110001',
      items: [
        {
          product_id: 'sample_1',
          product_title: 'Dennis Lingo Men Slim Fit Cotton Casual Shirt',
          product_image: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg',
          quantity: 1,
          price: 699,
          size: 'L',
          color: 'Olive Green',
        },
      ],
      total_amount: 699,
      payment_method: 'Prepaid (UPI / Card)',
      payment_status: 'Paid',
      status: 'Ordered',
      created_at: new Date().toISOString(),
      awb_code: `SFX${Math.floor(10000000 + Math.random() * 90000000)}`,
      courier_name: 'Shadowfax Express Surface',
    };

    setOrders(prev => [sampleOrder, ...prev]);

    try {
      const existing = JSON.parse(localStorage.getItem('akselling_local_orders') || '[]');
      localStorage.setItem('akselling_local_orders', JSON.stringify([sampleOrder, ...existing]));
    } catch {
      // ignore
    }

    try {
      await saveOrderToFirestore(sampleOrder);
    } catch {
      // ignore
    }

    window.dispatchEvent(new CustomEvent('akselling_orders_updated'));
  };

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

  const copyAwb = (awb: string) => {
    try {
      navigator.clipboard.writeText(awb);
      setCopiedAwb(awb);
      setTimeout(() => setCopiedAwb(null), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[65] bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#2874f0] mb-3" />
        <p className="text-xs font-bold text-slate-600">Loading your live orders...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[65] bg-slate-50 overflow-y-auto animate-fade-in sm:shadow-2xl sm:border-x sm:border-slate-200">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xs shadow-xs px-3.5 py-3 flex items-center justify-between z-20 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">{t('myOrders')}</h1>
            <p className="text-[10px] text-slate-500 font-medium">Real-time delivery radar & history</p>
          </div>
        </div>

        {/* Live sync indicator pill */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span>Live Sync</span>
        </div>
      </div>

      <div className="px-3.5 py-4 pb-16 space-y-4">
        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-[#2874f0]">
              <Package size={38} strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t('noOrders')}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              When you make a purchase, your delivery progress will track in real time with live status checkpoints.
            </p>

            <button
              type="button"
              onClick={handleCreateSampleOrder}
              className="mt-6 bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold text-xs py-3 px-5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Simulate Sample Order to View Live Stepper</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const activeIndex = getStepIndexFromStatus(order.status);
              const isExpanded = expandedOrder === order.id;
              const displayAwb = order.awb_code || `SFX${order.id.replace(/\D/g, '').slice(-8) || '98421045'}`;
              const displayCourier = order.courier_name || 'Shadowfax Express Surface';
              const firstItem = order.items[0];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden transition-all"
                >
                  {/* Card Header Info */}
                  <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/70">
                      {firstItem?.product_image ? (
                        <img
                          src={firstItem.product_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package size={24} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs text-slate-400 font-mono">
                          ID: {order.id.slice(0, 10).toUpperCase()}
                        </p>
                        <span className="text-sm font-black text-slate-900">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>

                      <h2 className="text-sm font-bold text-slate-800 line-clamp-1 mt-0.5">
                        {firstItem?.product_title || 'Order Item'}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </h2>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Placed on{' '}
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </p>
                    </div>
                  </div>

                  {/* Real-time Visual Order Status Progress Stepper */}
                  <div className="p-3 sm:p-3.5 bg-slate-50/50">
                    <OrderStatusStepper
                      status={order.status}
                      orderId={order.id}
                      orderDate={
                        order.created_at
                          ? new Date(order.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Live'
                      }
                      courierName={displayCourier}
                      awbCode={displayAwb}
                      showDetailsButton={true}
                      onViewDetails={() => setTrackingModalOrder(order)}
                      onUpdateStatus={(newStatus) => handleUpdateOrderStatus(order.id, newStatus)}
                      allowTestingControls={true}
                    />
                  </div>

                  {/* Accordion Toggle for Complete Details */}
                  <div className="border-t border-slate-100 bg-white">
                    <button
                      type="button"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full py-2.5 px-4 flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{isExpanded ? 'Hide Delivery & Item Details' : 'View Delivery & Item Details'}</span>
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {/* Expanded Section */}
                    {isExpanded && (
                      <div className="p-4 pt-1 border-t border-slate-100 space-y-3.5 animate-fade-in text-xs">
                        {/* Courier & AWB banner */}
                        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                              <Truck size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-700 font-bold uppercase">Logistics Express</p>
                              <p className="text-xs font-bold text-slate-800">{displayCourier}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="text-slate-500 text-[10px]">AWB:</span>
                            <strong className="text-slate-800">{displayAwb}</strong>
                            <button
                              type="button"
                              onClick={() => copyAwb(displayAwb)}
                              className="text-[#2874f0] hover:text-blue-700 p-0.5 cursor-pointer"
                              title="Copy AWB"
                            >
                              {copiedAwb === displayAwb ? (
                                <Check size={13} className="text-emerald-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Items in order */}
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                            Package Contents ({order.items.length} {order.items.length > 1 ? 'items' : 'item'})
                          </p>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2.5 items-center p-2 rounded-xl bg-slate-50 border border-slate-200/70"
                              >
                                <img
                                  src={item.product_image}
                                  alt=""
                                  className="w-11 h-11 rounded-lg object-cover bg-white"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                                    {item.product_title}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    Qty: {item.quantity} • {formatPrice(item.price)}
                                    {item.size ? ` • Size: ${item.size}` : ''}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-start gap-2.5">
                          <MapPin size={15} className="text-[#2874f0] mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-800">{order.customer_name}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{order.customer_address}</p>
                            <p className="text-[11px] text-slate-500">Phone: +91 {order.customer_phone}</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-1 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setTrackingModalOrder(order)}
                            className="w-full bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Truck size={14} />
                            <span>Open Full Live Tracking Radar</span>
                          </button>

                          {/* Return button if delivered */}
                          {activeIndex === 3 && (
                            <button
                              type="button"
                              onClick={() => handleReturn(order)}
                              disabled={returnRequested === order.id}
                              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-rose-600 border border-rose-200 rounded-xl py-2.5 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {returnRequested === order.id ? (
                                <>
                                  <CheckCircle2 size={15} /> Return Request Registered
                                </>
                              ) : (
                                <>
                                  <RotateCcw size={15} /> Request 7-Day Hassle-Free Return
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 text-center">
                          Official Support: <span className="font-bold text-slate-600">support.akselling@gmail.com</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Live Radar Modal */}
      {trackingModalOrder && (
        <OrderTrackingModal
          order={trackingModalOrder}
          onClose={() => setTrackingModalOrder(null)}
          onUpdateStatus={(orderId, newStatus) => handleUpdateOrderStatus(orderId, newStatus)}
        />
      )}
    </div>
  );
}
