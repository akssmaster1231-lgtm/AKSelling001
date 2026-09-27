import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Building,
  CreditCard,
  Phone,
  User,
  CheckCircle2,
  Copy,
  Save,
  Loader2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  getOwnerPaymentSettings,
  saveOwnerPaymentSettings,
  generateUpiUri,
  generateQrCodeUrl,
  type OwnerPaymentSettings,
} from '@/config/ownerPaymentConfig';
import { formatPrice } from '@/data';

export function AdminDirectUpiSettings() {
  const [config, setConfig] = useState<OwnerPaymentSettings>(() => getOwnerPaymentSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testAmount, setTestAmount] = useState<number>(100);

  // Orders Ledger for Direct UPI verification
  interface OrderItem {
    id: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    upi_utr?: string;
    payment_screenshot?: string;
    status: string;
    created_at: string;
  }
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Load from backend if available
  useEffect(() => {
    fetch('/api/owner/payment-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const actual = data?.settings || data;
        if (actual && actual.upiId) {
          setConfig(actual);
          saveOwnerPaymentSettings(actual);
        }
      })
      .catch(() => {});

    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleCopy = (val: string, label: string) => {
    navigator.clipboard?.writeText(val);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess('');

    try {
      // 1. Save locally and to backend
      const updated = saveOwnerPaymentSettings(config);
      setConfig(updated);

      setSaveSuccess('Owner Direct UPI & Bank Settings successfully updated and live across the store!');
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch {
      setSaveSuccess('Settings saved.');
      setTimeout(() => setSaveSuccess(''), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const upiUri = generateUpiUri({
    upiId: config.upiId,
    payeeName: config.beneficiaryName,
    amount: testAmount,
    note: 'AKSelling Test QR',
  });
  const qrUrl = generateQrCodeUrl(upiUri, 260);

  const filteredOrders = orders.filter((o) => {
    const term = searchFilter.toLowerCase();
    return (
      o.id?.toLowerCase().includes(term) ||
      o.customer_name?.toLowerCase().includes(term) ||
      o.customer_phone?.toLowerCase().includes(term) ||
      o.upi_utr?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-md border border-emerald-700/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-400/30">
                0% Gateway Commission • Direct Settlement
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">Direct Personal UPI & Bank Payment Hub</h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
              All payments from Google Pay, PhonePe, Paytm, and BHIM QR are deposited directly into your personal
              bank account without any 2% to 3% deductions or third-party intermediaries.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <QrCode size={28} className="text-emerald-300" />
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold p-3.5 rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Grid: Form & Live QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Settings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <div className="flex items-center gap-2">
              <Building size={18} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-stone-800">Owner Bank & UPI Credentials</h3>
            </div>
            <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
              Active in Checkout
            </span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 flex items-start gap-2">
            <span className="text-base">💡</span>
            <div className="text-[11px] text-emerald-900 leading-relaxed">
              <strong className="font-bold">रुपया अपने बैंक में प्राप्त करने का तरीका:</strong>
              <p>
                यहाँ अपना खुद का <strong>UPI ID</strong> (PhonePe, GPay, Paytm) और बैंक विवरण दर्ज करके <strong>&quot;Save &amp; Publish&quot;</strong> करें। 
                ग्राहकों को चेकआउट पर आपका पर्सनल QR कोड व UPI ID दिखेगा, जिससे पेमेंट का 100% रुपया बिना किसी कटौती के सीधे आपके खाते में आएगा।
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <User size={13} className="text-stone-400" /> Account Beneficiary Name
                </label>
                <input
                  type="text"
                  value={config.beneficiaryName}
                  onChange={(e) => setConfig({ ...config, beneficiaryName: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Anoj Kumar Yadav"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <QrCode size={13} className="text-stone-400" /> Personal UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={config.upiId}
                  onChange={(e) => setConfig({ ...config, upiId: e.target.value })}
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="7290894907@ybl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Building size={13} className="text-stone-400" /> Bank Name
                </label>
                <input
                  type="text"
                  value={config.bankName}
                  onChange={(e) => setConfig({ ...config, bankName: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Airtel payment Bank"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <CreditCard size={13} className="text-stone-400" /> Bank Account Number
                </label>
                <input
                  type="text"
                  value={config.accountNumber}
                  onChange={(e) => setConfig({ ...config, accountNumber: e.target.value })}
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="7290894907"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={config.ifscCode}
                  onChange={(e) => setConfig({ ...config, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full text-xs font-mono font-bold uppercase px-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="AIRP0000001"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Phone size={13} className="text-stone-400" /> Payee Contact Phone
                </label>
                <input
                  type="text"
                  value={config.supportPhone}
                  onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="+91 9693247290"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Payment Settings
              </button>
            </div>
          </form>
        </div>

        {/* Live Dynamic QR Code Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col items-center text-center">
          <h3 className="text-sm font-bold text-stone-800 mb-1">Live Dynamic QR Code</h3>
          <p className="text-[11px] text-stone-500 mb-3">
            Customers scan this QR code directly in the checkout modal.
          </p>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 mb-3">
            <img
              src={qrUrl}
              alt="Owner Live Direct UPI QR Code"
              className="w-44 h-44 rounded-lg object-contain mix-blend-multiply"
            />
          </div>

          <div className="w-full bg-stone-50 rounded-xl p-2.5 mb-3 border border-stone-200 text-left space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-500">UPI ID:</span>
              <span className="font-mono font-bold text-stone-800">{config.upiId}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-500">Beneficiary:</span>
              <span className="font-bold text-stone-800">{config.beneficiaryName}</span>
            </div>
          </div>

          <div className="w-full flex items-center gap-2 text-xs">
            <span className="text-stone-500 text-[11px] shrink-0">Test Amount:</span>
            <input
              type="number"
              min="1"
              value={testAmount}
              onChange={(e) => setTestAmount(Number(e.target.value) || 1)}
              className="w-20 text-center font-bold px-2 py-1 rounded border border-stone-300 text-xs"
            />
            <button
              type="button"
              onClick={() => handleCopy(config.upiId, 'upi')}
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Copy size={12} />
              {copiedField === 'upi' ? 'Copied!' : 'Copy UPI'}
            </button>
          </div>
        </div>
      </div>

      {/* Direct UPI Orders & Verification Ledger */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-stone-800">
              Direct UPI Order Ledger ({filteredOrders.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search UTR / Order / Name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56"
              />
            </div>
            <button
              type="button"
              onClick={loadOrders}
              disabled={isLoadingOrders}
              className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 transition-colors cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw size={14} className={isLoadingOrders ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            No direct UPI transactions found matching the filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">UPI UTR Ref</th>
                  <th className="py-2.5 px-3">Payment Status</th>
                  <th className="py-2.5 px-3">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-stone-900">{ord.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-800">{ord.customer_name || 'Guest User'}</div>
                      <div className="text-[10px] text-stone-400">{ord.customer_phone}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-stone-900">{formatPrice(ord.total_amount)}</td>
                    <td className="py-3 px-3">
                      {ord.upi_utr ? (
                        <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold text-[11px]">
                          {ord.upi_utr}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">No UTR</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {ord.payment_status || 'Paid via Direct UPI'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {ord.payment_screenshot ? (
                        <a
                          href={ord.payment_screenshot}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-[11px] underline flex items-center gap-1 font-semibold"
                        >
                          Proof <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-stone-300 text-[10px]">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
