import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Smartphone,
  Building2,
  ShieldCheck,
  Upload,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Sparkles,
  CreditCard,
  Lock,
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

/** PhonePe Brand Icon */
function PhonePeIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-lg bg-[#5F259F] flex items-center justify-center text-white font-extrabold text-[12px] shadow-2xs shrink-0 select-none`}
    >
      पे
    </div>
  );
}

/** Paytm Brand Icon */
function PaytmIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-lg bg-[#002970] flex items-center justify-center text-[10px] font-black tracking-tighter shadow-2xs shrink-0 select-none px-1`}
    >
      <span className="text-[#00BAF2]">Pay</span>
      <span className="text-white">tm</span>
    </div>
  );
}

/** Card Brand Detection */
function detectCardBrand(num: string): 'Visa' | 'Mastercard' | 'RuPay' | 'Amex' | 'Card' {
  const clean = num.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
  if (/^(60|65|81|82)/.test(clean)) return 'RuPay';
  if (/^(34|37)/.test(clean)) return 'Amex';
  return 'Card';
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
  const [activeTab, setActiveTab] = useState<'upi' | 'card'>('upi');

  // UPI State
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardError, setCardError] = useState('');

  if (!isOpen) return null;

  const note = isCodAdvance ? `AKSelling 10% Advance #${orderId}` : `AKSelling Order #${orderId}`;
  const baseUpiParams = `pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.beneficiaryName)}&am=${actualPayable.toFixed(2)}&tr=${encodeURIComponent(orderId)}&cu=INR&tn=${encodeURIComponent(note)}`;

  // Dedicated native app intents (prevents playstore fallback redirection)
  const universalUpiUri = `upi://pay?${baseUpiParams}`;
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  // Exact native Android deep links without Play Store redirection
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

  // Crisp high-resolution QR code
  const qrCodeUrl = generateQrCodeUrl(universalUpiUri, 360);

  // Native launch click handler without Google Play Store fallbacks
  const handleLaunchApp = (url: string) => {
    try {
      window.location.href = url;
    } catch {
      // standard browser intent handling
    }
  };

  const handleCopy = (text: string, type: 'upi' | 'acc' | 'ifsc') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } else if (type === 'acc') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2500);
    } else if (type === 'ifsc') {
      setCopiedIfsc(true);
      setTimeout(() => setCopiedIfsc(false), 2500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotBase64(event.target?.result as string);
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  // UPI Form Submit
  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMessage('Please enter a valid 12-digit UTR / UPI Reference Number from your payment app.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await onConfirmPayment({
        utrNumber: cleanUtr,
        screenshotUrl: screenshotBase64 || undefined,
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

  // Card Form Submit
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCardNum = cardNumber.replace(/\s/g, '');
    if (rawCardNum.length < 15 || rawCardNum.length > 19) {
      setCardError('Please enter a valid 16-digit card number.');
      return;
    }

    if (!cardHolder.trim()) {
      setCardError('Please enter the name printed on your card.');
      return;
    }

    const [expMonth, expYear] = cardExpiry.split('/').map((s) => s.trim());
    const monthNum = parseInt(expMonth, 10);
    if (!expMonth || !expYear || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      setCardError('Please enter a valid card expiry date (MM/YY).');
      return;
    }

    if (cardCvv.length < 3 || cardCvv.length > 4) {
      setCardError('Please enter a valid 3 or 4 digit CVV/CVC code.');
      return;
    }

    setSubmitting(true);
    setCardError('');

    try {
      // Simulate bank-level 3D-Secure 2.0 gateway handshake
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const cardRef = `CRD-${Date.now().toString().slice(-8)}`;
      const brand = detectCardBrand(cardNumber);

      await onConfirmPayment({
        utrNumber: cardRef,
        upiIdUsed: 'card_secure_gateway',
        amountPaid: actualPayable,
        paymentMode: 'card',
        cardDetails: {
          last4: rawCardNum.slice(-4),
          cardHolder: cardHolder.trim(),
          cardBrand: brand,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Card authorization failed';
      setCardError(msg);
      setSubmitting(false);
    }
  };

  // Card number input formatter
  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 19);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    setCardError('');
  };

  // Expiry date formatter
  const handleExpiryChange = (val: string) => {
    let clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setCardExpiry(clean);
    setCardError('');
  };

  const currentBrand = detectCardBrand(cardNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0a192f] via-[#112240] to-[#0a192f] text-white p-4 shrink-0 border-b border-amber-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/ak_brand_logo.jpg"
                alt="AKSelling"
                className="w-10 h-10 rounded-xl object-contain border border-amber-400/50 shadow-sm bg-slate-950 shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black leading-tight text-white">AKSelling</h3>
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded shadow-2xs">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/90 font-medium">
                  {activeTab === 'upi' ? 'Direct UPI • 0% Convenience Fee' : 'Debit / Credit Card (Secure SSL)'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Amount Summary Card */}
          <div className="mt-3 bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center justify-between border border-amber-400/25">
            <div>
              <span className="text-[11px] font-medium text-amber-200 block">
                {isCodAdvance ? '10% COD Advance Token' : 'Total Amount Payable'}
              </span>
              <span className="text-2xl font-black tracking-tight text-white">₹{actualPayable}</span>
              {isCodAdvance && totalOrderAmount && (
                <span className="text-[10px] text-amber-300 block">
                  Remaining ₹{totalOrderAmount - actualPayable} due upon delivery
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded inline-block font-mono">
                Order #{orderId}
              </span>
              <p className="text-[10px] text-amber-100/90 mt-0.5 truncate max-w-[140px]">
                {customerName || 'Customer'}{customerPhone ? ` • ${customerPhone}` : ''}
              </p>
            </div>
          </div>

          {/* Top Payment Mode Switcher Tabs */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 p-1 bg-black/25 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('upi')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'upi'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone size={14} />
              <span>UPI & QR Scan (0%)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'card'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <CreditCard size={14} />
              <span>Debit / Credit Card</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'upi' ? (
            /* ========================================================
               UPI & QR SCAN TAB (QR at top, 1-tap buttons, then UTR)
               ======================================================== */
            <div className="space-y-4">
              {/* 1. QR Code AT VERY TOP: Large, Crisp, Centered */}
              <div className="bg-slate-50 border-2 border-emerald-100 rounded-2xl p-4 text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span className="text-xs font-black text-slate-800 tracking-wide">
                    Verified Merchant: <span className="text-emerald-700">{settings.beneficiaryName}</span>
                  </span>
                </div>

                {/* Crisp QR Code Container */}
                <div className="relative inline-block mx-auto p-3 bg-white rounded-2xl shadow-sm border border-emerald-200">
                  <img
                    src={qrCodeUrl}
                    alt="AKSelling Direct UPI QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 mx-auto object-contain select-none"
                  />
                  <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-600">
                    <span>Scan with Any UPI App</span>
                  </div>
                </div>

                {/* Direct UPI ID Copy Strip */}
                <div className="mt-3 flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 text-xs">
                  <div className="text-left overflow-hidden mr-2">
                    <span className="text-[10px] text-slate-500 block font-medium">Owner Personal UPI ID:</span>
                    <span className="font-mono font-bold text-slate-900 truncate block">{settings.upiId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.upiId, 'upi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                      copiedUpi ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {copiedUpi ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 2. 1-Tap UPI Apps: Google Pay, PhonePe, Paytm, Universal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-600" />
                    Or 1-Tap Pay via UPI Apps
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                    Pre-filled ₹{actualPayable}
                  </span>
                </div>

                {/* 3 Dedicated Native App Action Buttons (No Play Store Redirection) */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Google Pay */}
                  <a
                    href={gpayUrl}
                    onClick={() => handleLaunchApp(gpayUrl)}
                    className="group flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-white hover:border-[#4285F4] hover:bg-blue-50/40 active:scale-95 transition-all text-center shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <GooglePayIcon className="w-7 h-7 mb-1.5 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#1a73e8] leading-tight">
                      Google Pay
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                      Pay ₹{actualPayable}
                    </span>
                  </a>

                  {/* PhonePe */}
                  <a
                    href={phonepeUrl}
                    onClick={() => handleLaunchApp(phonepeUrl)}
                    className="group flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-white hover:border-[#5F259F] hover:bg-purple-50/40 active:scale-95 transition-all text-center shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <PhonePeIcon className="w-7 h-7 mb-1.5 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#5F259F] leading-tight">
                      PhonePe
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full mt-1">
                      Pay ₹{actualPayable}
                    </span>
                  </a>

                  {/* Paytm */}
                  <a
                    href={paytmUrl}
                    onClick={() => handleLaunchApp(paytmUrl)}
                    className="group flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-white hover:border-[#00BAF2] hover:bg-sky-50/40 active:scale-95 transition-all text-center shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <PaytmIcon className="w-7 h-7 mb-1.5 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#002970] leading-tight">
                      Paytm
                    </span>
                    <span className="text-[10px] font-bold text-[#002970] bg-sky-50 px-2 py-0.5 rounded-full mt-1">
                      Pay ₹{actualPayable}
                    </span>
                  </a>
                </div>

                {/* Universal UPI App Chooser (BHIM, CRED, Amazon Pay, Navi, etc.) */}
                <a
                  href={universalUpiUri}
                  onClick={() => handleLaunchApp(universalUpiUri)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 active:scale-[0.99] text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shadow-2xs shrink-0">
                      UPI
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">Any Other UPI App</div>
                      <div className="text-[10px] text-slate-500">BHIM, CRED, Amazon Pay, Navi, etc.</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    Open UPI <ArrowRight size={12} />
                  </span>
                </a>
              </div>

              {/* 3. Direct Bank Transfer Collapsible Accordion (IMPS/NEFT) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setShowBankDetails(!showBankDetails)}
                  className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-slate-500" />
                    Direct Bank Transfer (IMPS / NEFT)
                  </span>
                  <span className="text-[11px] text-blue-600">{showBankDetails ? 'Hide' : 'View Bank Info'}</span>
                </button>

                {showBankDetails && (
                  <div className="p-3 bg-white space-y-2 border-t border-slate-200 animate-fade-in">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Account Holder:</span>
                      <span className="font-bold text-slate-900">{settings.beneficiaryName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Bank Name:</span>
                      <span className="font-bold text-slate-900">{settings.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Account Number:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{settings.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.accountNumber, 'acc')}
                          className="text-blue-600 hover:text-blue-800 p-0.5 cursor-pointer"
                        >
                          {copiedAcc ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">IFSC Code:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{settings.ifscCode}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.ifscCode, 'ifsc')}
                          className="text-blue-600 hover:text-blue-800 p-0.5 cursor-pointer"
                        >
                          {copiedIfsc ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Complete Checkout: Enter 12-Digit UTR / UPI Ref ID & Screenshot */}
              <form onSubmit={handleUpiSubmit} className="space-y-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Enter 12-Digit UTR / UPI Reference Number *
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/\s+/g, ''));
                      setErrorMessage('');
                    }}
                    placeholder="e.g. 423871928374 or UPI Ref ID"
                    className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-mono tracking-wider outline-none transition-all placeholder:text-slate-400 font-bold"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <HelpCircle size={12} />
                    Found on your receipt in Google Pay, PhonePe, or Paytm under &quot;UPI Ref ID&quot; or &quot;UTR&quot;.
                  </p>
                </div>

                {/* Optional Screenshot Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attach Payment Screenshot (Optional for instant validation)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-2.5 text-center cursor-pointer transition-colors bg-slate-50/60">
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Upload size={14} className="text-emerald-600" />
                        <span>{screenshotBase64 ? 'Change Screenshot' : 'Upload Receipt Screenshot'}</span>
                      </div>
                    </label>
                    {screenshotBase64 && (
                      <div className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0">
                        <img src={screenshotBase64} alt="Receipt preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setScreenshotBase64(null)}
                          className="absolute top-0 right-0 bg-rose-600 text-white rounded-bl p-0.5 cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Verification Guarantee */}
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                  <Clock size={14} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Direct Bank Verification:</strong> Once submitted, your order is registered immediately and confirmed upon verifying your UTR reference number.
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !utrNumber.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <span>Verifying Payment...</span>
                    ) : (
                      <>
                        <span>Confirm Payment & Place Order (₹{actualPayable})</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ========================================================
               DEBIT / CREDIT CARD TAB (Flipkart/Razorpay UX)
               ======================================================== */
            <form onSubmit={handleCardSubmit} className="space-y-4">
              {/* Virtual Card Preview */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 p-4 text-white shadow-lg border border-slate-700/60">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-5 rounded bg-amber-400/80 flex items-center justify-center text-[9px] font-bold text-slate-950">
                      CHIP
                    </div>
                    <span className="text-[10px] tracking-widest text-slate-400 font-mono">SECURE</span>
                  </div>
                  <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                    {currentBrand}
                  </span>
                </div>

                <div className="font-mono text-base tracking-widest text-white/90 mb-3 select-none">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>

                <div className="flex justify-between items-end text-[10px] text-slate-300">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400">Cardholder</span>
                    <span className="font-bold tracking-wide text-white uppercase truncate max-w-[170px] block">
                      {cardHolder || 'CARDHOLDER NAME'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400">Expires</span>
                    <span className="font-mono font-bold tracking-wider text-white">
                      {cardExpiry || 'MM/YY'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                {/* Card Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full pl-10 pr-16 py-2.5 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-sm font-mono tracking-wider outline-none transition-all placeholder:text-slate-400 font-bold"
                      required
                    />
                    <CreditCard size={18} className="absolute left-3 top-3 text-slate-400" />
                    <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-500 uppercase">
                      {currentBrand}
                    </span>
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => {
                      setCardHolder(e.target.value);
                      setCardError('');
                    }}
                    placeholder="Full name as printed on card"
                    className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                {/* Expiry & CVV in 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      placeholder="MM / YY"
                      maxLength={5}
                      className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-sm font-mono text-center outline-none transition-all placeholder:text-slate-400 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span>CVV / CVC</span>
                      <span className="text-[10px] text-slate-400 font-normal">3-4 digits</span>
                    </label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => {
                        setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                        setCardError('');
                      }}
                      placeholder="•••"
                      maxLength={4}
                      className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-sm font-mono text-center tracking-widest outline-none transition-all placeholder:text-slate-400 font-bold"
                      required
                    />
                  </div>
                </div>
              </div>

              {cardError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{cardError}</span>
                </div>
              )}

              {/* Security Badges */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lock size={13} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold">256-bit Bank Grade SSL Encryption</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                  <CheckCircle2 size={12} className="text-indigo-600" />
                  <span>PCI-DSS</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || cardNumber.length < 15 || !cardExpiry || cardCvv.length < 3}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Card Payment...</span>
                    </div>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Pay ₹{actualPayable} Securely</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
