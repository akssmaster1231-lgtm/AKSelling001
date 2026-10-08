import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  getOwnerPaymentSettings,
  generateQrCodeUrl,
  OwnerPaymentSettings,
} from '@/config/ownerPaymentConfig';

export interface DirectUpiPaymentResult {
  utrNumber: string;
  screenshotUrl?: string;
  upiIdUsed: string;
  amountPaid: number;
  paymentMode: 'direct_upi_full' | 'direct_upi_cod_advance' | 'card';
  cardDetails?: {
    last4: string;
    cardHolder: string;
    cardBrand: string;
  };
}

interface DirectUpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payableAmount?: number;
  amount?: number;
  paymentMode?: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  isCodAdvance?: boolean;
  totalOrderAmount?: number;
  onConfirmPayment: (result: DirectUpiPaymentResult) => Promise<void>;
}

/** Google Pay Brand Icon SVG */
function GooglePayIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.96h3.86c2.26-2.09 3.56-5.17 3.56-8.78z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.96c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.06C3.26 21.27 7.33 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.65H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.35l3.98-3.06z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.73 1.29 6.65l3.98 3.06c.95-2.85 3.6-4.96 6.73-4.96z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function DirectUpiPaymentModal({
  isOpen,
  onClose,
  payableAmount,
  amount,
  orderId,
  customerName,
  customerPhone,
  isCodAdvance = false,
  totalOrderAmount,
  onConfirmPayment,
}: DirectUpiPaymentModalProps) {
  const actualPayable = payableAmount ?? amount ?? totalOrderAmount ?? 0;
  const [settings] = useState<OwnerPaymentSettings>(() => getOwnerPaymentSettings());

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const note = isCodAdvance ? `AKSelling 10% Advance #${orderId}` : `AKSelling Order #${orderId}`;
  const baseUpiParams = `pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.beneficiaryName)}&am=${actualPayable.toFixed(2)}&tr=${encodeURIComponent(orderId)}&cu=INR&tn=${encodeURIComponent(note)}`;

  // Dedicated native app deep links
  const universalUpiUri = `upi://pay?${baseUpiParams}`;
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  const gpayUrl = isAndroid
    ? `intent://pay?${baseUpiParams}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
    : isIOS
      ? `tez://upi/pay?${baseUpiParams}`
      : `gpay://upi/pay?${baseUpiParams}`;

  const phonepeUrl = isAndroid
    ? `intent://pay?${baseUpiParams}#Intent;scheme=upi;package=com.phonepe.app;end`
    : `phonepe://pay?${baseUpiParams}`;

  const paytmUrl = isAndroid
    ? `intent://pay?${baseUpiParams}#Intent;scheme=upi;package=net.one97.paytm;end`
    : `paytmmp://pay?${baseUpiParams}`;

  // Crisp QR code
  const qrCodeUrl = generateQrCodeUrl(universalUpiUri, 320);

  const handleLaunchApp = (url: string) => {
    try {
      window.location.href = url;
    } catch {
      // standard intent
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMessage('Please enter the 12-digit UTR number from your payment app.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await onConfirmPayment({
        utrNumber: cleanUtr,
        upiIdUsed: settings.upiId,
        amountPaid: actualPayable,
        paymentMode: isCodAdvance ? 'direct_upi_cod_advance' : 'direct_upi_full',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm payment';
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-[#0a192f] via-[#112240] to-[#0a192f] text-white p-3.5 shrink-0 border-b border-amber-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/ak_brand_logo.jpg"
                alt="AKSelling"
                className="w-8 h-8 rounded-lg object-contain border border-amber-400/50 bg-slate-950 shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5 leading-tight">
                  <h3 className="text-sm font-black text-white">AKSelling Pay</h3>
                  <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1 py-0.2 rounded">
                    Verified
                  </span>
                </div>
                <p className="text-[10px] text-amber-200/90 font-medium truncate max-w-[170px]">
                  {customerName ? `${customerName} • ` : ''}{isCodAdvance ? '10% COD Advance' : 'Direct UPI • 0% Fee'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={submitting}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Amount Badge */}
          <div className="mt-2.5 bg-white/10 rounded-xl px-3 py-1.5 flex items-center justify-between border border-white/10">
            <span className="text-xs text-amber-200 font-medium">Payable Amount:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-white tracking-tight">₹{actualPayable}</span>
              <span
                className="text-[9px] font-mono uppercase bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded"
                title={customerPhone ? `Contact: ${customerPhone}` : undefined}
              >
                #{orderId}
              </span>
            </div>
          </div>
        </div>

        {/* Clean, Non-Scrollable Center Body */}
        <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
          {/* Section 1: Compact Centered QR Code */}
          <div className="text-center">
            <div className="relative inline-block mx-auto p-2.5 bg-white rounded-2xl shadow-md border-2 border-emerald-400/60">
              <img
                src={qrCodeUrl}
                alt="Direct UPI QR"
                className="w-36 h-36 sm:w-40 sm:h-40 mx-auto object-contain select-none"
              />
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                <ShieldCheck size={10} />
                <span>Scan & Pay</span>
              </div>
            </div>

            {/* Compact inline UPI ID with 1-tap copy (NO extra bulky box) */}
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs">
              <span className="font-mono font-bold text-slate-800 text-[11px]">{settings.upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: PERFECT CIRCULAR (GOL) APP BUTTONS in Single Horizontal Row */}
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" />
                Or 1-Tap Pay via App:
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded-full">
                ₹{actualPayable}
              </span>
            </div>

            {/* Exactly 4 Perfect Circular Buttons in one horizontal line (No Rectangles) */}
            <div className="flex items-start justify-around px-1 py-1">
              {/* Google Pay - Perfect Circular Button */}
              <a
                href={gpayUrl}
                onClick={() => handleLaunchApp(gpayUrl)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 group-hover:border-blue-500 shadow-md group-hover:shadow-[0_0_18px_rgba(66,133,244,0.5)] flex items-center justify-center p-2 transition-all active:scale-90">
                  <GooglePayIcon className="w-6 h-6 shrink-0" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  GPay
                </span>
              </a>

              {/* PhonePe - Perfect Circular Button */}
              <a
                href={phonepeUrl}
                onClick={() => handleLaunchApp(phonepeUrl)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#5F259F] border-2 border-purple-300 shadow-md group-hover:shadow-[0_0_18px_rgba(95,37,159,0.5)] flex items-center justify-center transition-all active:scale-90">
                  <span className="text-white font-black text-lg select-none leading-none">पे</span>
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-purple-700 transition-colors">
                  PhonePe
                </span>
              </a>

              {/* Paytm - Perfect Circular Button */}
              <a
                href={paytmUrl}
                onClick={() => handleLaunchApp(paytmUrl)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#002970] border-2 border-sky-300 shadow-md group-hover:shadow-[0_0_18px_rgba(0,186,242,0.5)] flex items-center justify-center transition-all active:scale-90">
                  <span className="text-[9px] font-black tracking-tighter select-none leading-none">
                    <span className="text-[#00BAF2]">Pay</span>
                    <span className="text-white">tm</span>
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-[#002970] transition-colors">
                  Paytm
                </span>
              </a>

              {/* Any Other UPI - Perfect Circular Button */}
              <a
                href={universalUpiUri}
                onClick={() => handleLaunchApp(universalUpiUri)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 border-2 border-emerald-300 shadow-md group-hover:shadow-[0_0_18px_rgba(16,185,129,0.5)] flex items-center justify-center transition-all active:scale-90">
                  <span className="text-white font-black text-[11px] tracking-wider select-none leading-none">
                    UPI
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                  Other
                </span>
              </a>
            </div>
          </div>

          {/* Section 3: Clean & Compact UTR Input + Confirm Button */}
          <form onSubmit={handleUpiSubmit} className="space-y-2 pt-1 border-t border-slate-100">
            <div className="relative">
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''));
                  setErrorMessage('');
                }}
                placeholder="Enter 12-Digit UTR after payment"
                maxLength={22}
                className="w-full px-3 py-2 bg-amber-50/60 border-2 border-amber-300 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-mono tracking-wider outline-none transition-all placeholder:text-slate-400 placeholder:font-sans font-bold"
                required
              />
              <span className="absolute right-2.5 top-2.5 text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded uppercase">
                Required
              </span>
            </div>

            {errorMessage && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1.5">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !utrNumber.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              {submitting ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Confirm Payment & Place Order (₹{actualPayable})</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
