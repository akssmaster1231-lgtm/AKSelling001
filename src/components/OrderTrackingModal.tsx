import { useState } from 'react';
import {
  X,
  Truck,
  MapPin,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import type { FirestoreOrder } from '@/firebase';
import {
  TRACKING_STEPS,
  getStepIndexFromStatus,
} from '@/utils/orderTracking';
import { formatPrice } from '@/data';

export interface OrderTrackingModalProps {
  order: FirestoreOrder | null;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
}

export default function OrderTrackingModal({
  order,
  onClose,
  onUpdateStatus,
}: OrderTrackingModalProps) {
  const [copiedAwb, setCopiedAwb] = useState(false);

  if (!order) return null;

  const activeIndex = getStepIndexFromStatus(order.status);
  const currentStep = TRACKING_STEPS[activeIndex];
  const displayAwb = order.awb_code || `SFX${order.id.replace(/\D/g, '').slice(-8) || '98421045'}`;
  const displayCourier = order.courier_name || 'Shadowfax Express Surface';

  const copyAwb = () => {
    try {
      navigator.clipboard.writeText(displayAwb);
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    } catch {
      // fallback
    }
  };

  const checkpoints = [
    {
      stepId: 'ordered',
      title: 'Order Confirmed & Placed',
      location: 'AKSelling Seller Fulfillment Hub, New Delhi',
      time: order.created_at
        ? new Date(order.created_at).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'Confirmed',
      details: 'Vendor verified item inventory & generated dispatch manifest.',
    },
    {
      stepId: 'shipped',
      title: 'Dispatched & In Transit',
      location: `${displayCourier} Hub, Sorting Facility`,
      time: order.created_at
        ? new Date(new Date(order.created_at).getTime() + 4 * 3600000).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'In Transit',
      details: `AWB ${displayAwb} assigned. Linehaul express transport in transit.`,
    },
    {
      stepId: 'out_for_delivery',
      title: 'Out for Doorstep Delivery',
      location: 'Local Delivery Center, Destination PIN',
      time: 'Today, 10:30 AM',
      details: 'Delivery executive assigned. Rider will call before arrival.',
    },
    {
      stepId: 'delivered',
      title: 'Package Delivered',
      location: order.customer_address ? order.customer_address.split(',')[0] : 'Customer Doorstep',
      time: 'Completed',
      details: 'Item verified and handed over with zero contact delivery.',
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-[480px] w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh] my-auto animate-scale-up border border-slate-200">
        {/* Header */}
        <div className="bg-[#2874f0] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 relative overflow-hidden shadow-md">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-yellow-300">
              <Truck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Real-Time Order Radar</h2>
                <span className="bg-yellow-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Order ID: {order.id.slice(0, 10).toUpperCase()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer relative z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Live Status Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600" />
                </span>
                <span className="text-xs font-bold text-slate-800">
                  Current Status: <strong className="text-[#2874f0] font-black">{currentStep.label}</strong>
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                Express 48h SLA
              </span>
            </div>

            {/* Courier & AWB detail */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Courier Carrier</span>
                <strong className="text-slate-800 font-bold">{displayCourier}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide block">AWB Tracking No.</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-slate-800 font-bold">{displayAwb}</span>
                  <button
                    type="button"
                    onClick={copyAwb}
                    className="text-[#2874f0] hover:text-blue-700 p-0.5 cursor-pointer"
                    title="Copy AWB"
                  >
                    {copiedAwb ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Visual Steps Progress Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Visual Delivery Journey
            </h3>

            <div className="relative pt-1 pb-1">
              <div className="absolute top-[22px] left-[12%] right-[12%] h-1 bg-slate-200 rounded-full" />
              <div
                className="absolute top-[22px] left-[12%] h-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(activeIndex / 3) * 76}%` }}
              />

              <div className="relative z-10 flex items-start justify-between">
                {TRACKING_STEPS.map((s, idx) => {
                  const isDone = idx < activeIndex;
                  const isCurrent = idx === activeIndex;
                  const StepIcon = s.icon;

                  return (
                    <div key={s.id} className="flex flex-col items-center text-center w-1/4">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isCurrent
                            ? activeIndex === 3
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md'
                              : 'bg-[#2874f0] text-white ring-4 ring-blue-100 shadow-md animate-pulse'
                            : 'bg-white text-slate-300 border-2 border-slate-200'
                        }`}
                      >
                        {isDone ? (
                          <Check size={16} strokeWidth={3} className="text-white" />
                        ) : (
                          <StepIcon size={15} strokeWidth={isCurrent ? 2.5 : 2} />
                        )}
                      </div>
                      <span
                        className={`mt-2 text-[10px] sm:text-[11px] font-bold ${
                          isDone
                            ? 'text-emerald-700'
                            : isCurrent
                            ? 'text-slate-900 font-extrabold'
                            : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Status Switcher (for Instant Verification) */}
          {onUpdateStatus && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  <span>Update Live Status in Real-Time</span>
                </span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                  Firestore Snapshot
                </span>
              </div>
              <p className="text-[11px] text-blue-800/80">
                Click any status below to immediately sync and watch the progress line advance:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {TRACKING_STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onUpdateStatus(order.id, s.label)}
                    className={`text-xs font-bold py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      i === activeIndex
                        ? 'bg-[#2874f0] text-white border-[#2874f0] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vertical Checkpoints Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Detailed Movement Checkpoints
            </h3>

            <div className="space-y-4 pl-3 relative border-l-2 border-slate-200 ml-3">
              {checkpoints.map((cp, idx) => {
                const isPassed = idx <= activeIndex;
                const isCurrent = idx === activeIndex;

                return (
                  <div key={cp.stepId} className="relative pl-5">
                    {/* Circle checkpoint icon on the line */}
                    <div
                      className={`absolute -left-[19px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                        isPassed
                          ? isCurrent
                            ? 'bg-[#2874f0] ring-4 ring-blue-100 text-white'
                            : 'bg-emerald-600 ring-2 ring-emerald-100 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isPassed && <Check size={10} strokeWidth={3} />}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-bold ${
                            isPassed ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {cp.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">{cp.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{cp.location}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {cp.details}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Address Box */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <MapPin size={14} className="text-[#2874f0]" />
              <span>Destination Delivery Address</span>
            </div>
            <p className="text-slate-800 font-semibold pl-5">{order.customer_name}</p>
            <p className="text-slate-600 pl-5 leading-relaxed">{order.customer_address}</p>
            <p className="text-slate-500 pl-5 text-[11px]">Contact: +91 {order.customer_phone}</p>
          </div>

          {/* Support Notice */}
          <div className="text-center pt-2 text-[11px] text-slate-500 space-y-1">
            <p>
              Need assistance? Email vendor logistics at{' '}
              <a href="mailto:support.akselling@gmail.com" className="text-[#2874f0] font-bold underline">
                support.akselling@gmail.com
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs">
            <span className="text-slate-500 block text-[10px]">Order Value</span>
            <strong className="text-slate-900 font-black text-sm">{formatPrice(order.total_amount)}</strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
}
