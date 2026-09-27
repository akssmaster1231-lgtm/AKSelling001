import React, { useState } from 'react';
import {
  X,
  Wallet,
  IndianRupee,
  Copy,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  getOwnerPaymentSettings,
  generateUpiUri,
  generateQrCodeUrl,
} from '@/config/ownerPaymentConfig';
import { depositMoneyToUserWallet } from '@/utils/walletService';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  onSuccess?: (newBalance: number) => void;
}

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userPhone,
  userEmail,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(500);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ amount: number; newBalance: number } | null>(null);

  if (!isOpen) return null;

  const ownerSettings = getOwnerPaymentSettings();
  const upiUri = generateUpiUri({
    upiId: ownerSettings.upiId,
    payeeName: ownerSettings.beneficiaryName || 'ANOJKUMAR',
    amount,
    note: `Wallet Deposit User ${userId.slice(0, 8)}`,
  });
  const qrUrl = generateQrCodeUrl(upiUri, 280);

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ownerSettings.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMsg('कृपया सही 12-अंकों का UPI UTR या Transaction Reference नंबर दर्ज करें।');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('कृपया वैध राशि दर्ज करें (कम से कम ₹10)।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await depositMoneyToUserWallet(userId, amount, cleanUtr, {
        name: userName,
        phone: userPhone,
        email: userEmail,
      });

      if (res.success) {
        setSuccessData({ amount, newBalance: res.newBalance });
        if (onSuccess) onSuccess(res.newBalance);
      } else {
        setErrorMsg(res.error || 'डिपॉजिट करने में समस्या आई। कृपया पुनः प्रयास करें।');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'लेनदेन विफल रहा।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Wallet size={20} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                <span>वॉलेट में खुद का रुपया जोड़ें</span>
                <span className="bg-yellow-400 text-stone-900 text-[9px] font-black px-1.5 py-0.2 rounded">
                  0% FEE
                </span>
              </h3>
              <p className="text-[11px] text-emerald-100">
                Direct UPI से अपने खाते से तुरंत रुपया जमा करें
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {successData ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-base font-black text-gray-900">
                ₹{successData.amount} रुपया सफलतापूर्वक जुड़ गया!
              </h4>
              <p className="text-xs text-gray-600">
                आपका नया वॉलेट बैलेंस: <strong className="text-emerald-700 text-sm">₹{successData.newBalance}</strong>
              </p>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-medium">
                आप इस रुपये का उपयोग किसी भी प्रोडक्ट की खरीद पर 100% डिस्काउंट पाने के लिए कर सकते हैं।
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                ठीक है (Done)
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Select Amount Pack */}
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1.5 flex items-center justify-between">
                  <span>1. रुपया चुनें (Select Amount Pack)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">तुरंत क्रेडिट</span>
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={`amt-${amt}`}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        amount === amt
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="10"
                    value={amount || ''}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="या कोई अन्य रुपया दर्ज करें..."
                    className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Step 2: Pay via QR or UPI ID */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                  <span>2. स्कैन करके पेमेंट करें</span>
                  <span className="text-[10px] text-gray-500">{ownerSettings.businessName}</span>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-3 rounded-2xl shadow-2xs border border-gray-100 flex flex-col items-center">
                  <img
                    src={qrUrl}
                    alt="UPI Payment QR"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                  <p className="text-[11px] font-bold text-gray-600 mt-2 flex items-center gap-1">
                    <IndianRupee size={12} className="text-emerald-600" />
                    <span>पेमेंट राशि: <strong>₹{amount}</strong></span>
                  </p>
                </div>

                {/* Copy UPI ID */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-gray-500 block">Personal UPI ID</span>
                    <span className="text-xs font-mono font-bold text-gray-800 truncate block">
                      {ownerSettings.upiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedUpi ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedUpi ? 'कॉपी हो गया' : 'कॉपी करें'}</span>
                  </button>
                </div>

                {/* Direct UPI App launch button */}
                <a
                  href={upiUri}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={13} />
                  <span>Google Pay / PhonePe / Paytm से खोलें</span>
                </a>
              </div>

              {/* Step 3: Enter UTR Reference Number */}
              <form onSubmit={handleDepositSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">
                    3. पेमेंट के बाद 12-अंकों का UPI UTR दर्ज करें *
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                    placeholder="उदा. 428192849182 या Txn Ref"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    पेमेंट सफल होने के बाद GPay / PhonePe स्क्रीन पर 12-अंकों का UTR नंबर दिखता है।
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !utrNumber.trim()}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} className="text-yellow-300" />
                  )}
                  <span>
                    {isSubmitting ? 'वेरिफाई हो रहा है...' : `₹${amount} रुपया वॉलेट में जोड़ें`}
                  </span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default AddMoneyModal;
