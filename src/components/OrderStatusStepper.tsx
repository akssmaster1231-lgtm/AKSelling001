import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Truck,
  Bike,
  CheckCircle2,
  Check,
  Radio,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  TRACKING_STEPS,
  getStepIndexFromStatus,
} from '@/utils/orderTracking';

export interface OrderStatusStepperProps {
  status: string;
  orderId?: string;
  orderDate?: string;
  courierName?: string;
  awbCode?: string;
  showDetailsButton?: boolean;
  onViewDetails?: () => void;
  onUpdateStatus?: (newStatus: string) => void;
  allowTestingControls?: boolean;
}

export default function OrderStatusStepper({
  status,
  orderDate,
  courierName = 'Shadowfax Express',
  awbCode,
  showDetailsButton = true,
  onViewDetails,
  onUpdateStatus,
  allowTestingControls = true,
}: OrderStatusStepperProps) {
  const activeIndex = getStepIndexFromStatus(status);
  const currentStep = TRACKING_STEPS[activeIndex];
  const [isSimulating, setIsSimulating] = useState(false);
  const [showTester, setShowTester] = useState(false);

  // Auto real-time step simulation for interactive verification
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulating && onUpdateStatus) {
      timer = setTimeout(() => {
        const nextIndex = (activeIndex + 1) % 4;
        const nextStep = TRACKING_STEPS[nextIndex];
        onUpdateStatus(nextStep.label);
        if (nextIndex === 3) {
          setIsSimulating(false);
        }
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isSimulating, activeIndex, onUpdateStatus]);

  // Width percentage for the horizontal progress connector
  // 0 -> 0%, 1 -> 33.3%, 2 -> 66.6%, 3 -> 100%
  const progressPercent = (activeIndex / 3) * 100;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs space-y-3.5">
      {/* Top Header: Real-time Live Tracking Pill & Current Status */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                activeIndex === 3 ? 'bg-emerald-400' : 'bg-[#2874f0]'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                activeIndex === 3 ? 'bg-emerald-600' : 'bg-[#2874f0]'
              }`}
            />
          </span>
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span>Real-time Tracking:</span>
            <strong
              className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide ${
                activeIndex === 3
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : activeIndex === 2
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : activeIndex === 1
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {currentStep.label}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {allowTestingControls && onUpdateStatus && (
            <button
              type="button"
              onClick={() => setShowTester(prev => !prev)}
              className="text-[10px] font-bold text-[#2874f0] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
              title="Test real-time step updates"
            >
              <Sparkles size={11} />
              <span>Simulate</span>
            </button>
          )}

          {showDetailsButton && onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className="text-xs font-bold text-[#2874f0] hover:text-blue-700 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span>Live Radar</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* The 4 Visual Progress Steps Track */}
      <div className="relative pt-2 pb-1 px-1 sm:px-2">
        {/* Background track line */}
        <div className="absolute top-[26px] left-[12%] right-[12%] h-1 bg-slate-200 rounded-full z-0" />

        {/* Dynamic active filled line with smooth transition */}
        <div
          className="absolute top-[26px] left-[12%] h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 rounded-full z-0 transition-all duration-700 ease-out"
          style={{ width: `${(progressPercent * 0.76)}%` }}
        />

        {/* 4 Step Nodes */}
        <div className="relative z-10 flex items-start justify-between">
          {TRACKING_STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center text-center w-1/4 px-0.5"
              >
                {/* Node Circle */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-white'
                      : isCurrent
                      ? activeIndex === 3
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 ring-offset-1 shadow-md'
                        : 'bg-[#2874f0] text-white ring-4 ring-blue-100 ring-offset-1 shadow-md animate-pulse'
                      : 'bg-white text-slate-300 border-2 border-slate-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} className="text-white" />
                  ) : (
                    <Icon size={16} strokeWidth={isCurrent ? 2.5 : 2} />
                  )}
                </div>

                {/* Step Labels */}
                <span
                  className={`mt-2 text-[11px] sm:text-xs font-bold leading-tight ${
                    isCompleted
                      ? 'text-emerald-800'
                      : isCurrent
                      ? 'text-slate-900 font-black'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>

                <span
                  className={`text-[9px] sm:text-[10px] mt-0.5 line-clamp-1 max-w-[76px] ${
                    isCurrent
                      ? 'text-blue-600 font-bold'
                      : isCompleted
                      ? 'text-emerald-600/90'
                      : 'text-slate-400'
                  }`}
                >
                  {isCurrent
                    ? activeIndex === 3
                      ? 'Verified'
                      : 'Active Now'
                    : isCompleted
                    ? 'Done'
                    : step.subLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Context Banner based on current active step */}
      <div
        className={`rounded-xl p-3 text-xs flex items-start gap-2.5 transition-all ${
          activeIndex === 3
            ? 'bg-emerald-50/90 border border-emerald-200/80 text-emerald-900'
            : activeIndex === 2
            ? 'bg-amber-50/90 border border-amber-200/80 text-amber-950'
            : activeIndex === 1
            ? 'bg-blue-50/90 border border-blue-200/80 text-blue-950'
            : 'bg-slate-50 border border-slate-200/80 text-slate-800'
        }`}
      >
        <div
          className={`p-1.5 rounded-lg shrink-0 ${
            activeIndex === 3
              ? 'bg-emerald-100 text-emerald-700'
              : activeIndex === 2
              ? 'bg-amber-100 text-amber-700'
              : activeIndex === 1
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {activeIndex === 3 ? (
            <CheckCircle2 size={16} />
          ) : activeIndex === 2 ? (
            <Bike size={16} />
          ) : activeIndex === 1 ? (
            <Truck size={16} />
          ) : (
            <PackageCheck size={16} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="font-extrabold text-[12px]">{currentStep.description}</span>
            <span className="text-[10px] font-semibold text-slate-500 shrink-0">
              {orderDate || 'Recent'}
            </span>
          </div>
          <p className="text-[11px] opacity-90 leading-relaxed">
            {activeIndex === 0 &&
              'The vendor is packaging the merchandise. Logistics express dispatch scheduled shortly.'}
            {activeIndex === 1 &&
              `Carried via ${courierName}${
                awbCode ? ` • AWB: ${awbCode}` : ''
              }. In transit between regional fulfillment centers.`}
            {activeIndex === 2 &&
              'Courier delivery executive has picked up your parcel for doorstep drop-off today. Keep your phone handy.'}
            {activeIndex === 3 &&
              'Item handed over to recipient. 7-day hassle-free replacement & return policy active.'}
          </p>
        </div>
      </div>

      {/* Interactive Real-Time Tester Drawer (when toggled) */}
      {showTester && onUpdateStatus && (
        <div className="bg-slate-50 border border-blue-200 rounded-xl p-3 space-y-2.5 animate-scale-up">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Radio size={13} className="text-blue-600 animate-pulse" />
              <span>Real-Time Status Simulator</span>
            </span>
            <button
              type="button"
              onClick={() => setIsSimulating(prev => !prev)}
              className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                isSimulating
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-[#2874f0] text-white hover:bg-blue-600'
              }`}
            >
              {isSimulating ? 'Pause Auto-Run' : '▶ Auto-Advance Every 3s'}
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Click any status step below to broadcast a live update to Firestore & verify instant real-time stepper rendering:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {TRACKING_STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setIsSimulating(false);
                  onUpdateStatus(s.label);
                }}
                className={`text-[11px] font-bold py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  i === activeIndex
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {i + 1}. {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
