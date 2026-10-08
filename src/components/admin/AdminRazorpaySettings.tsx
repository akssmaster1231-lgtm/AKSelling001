import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Loader2,
  RefreshCw,
  Power,
  Check,
  Smartphone,
  Globe,
} from 'lucide-react';
import {
  fetchRazorpayConfig,
  saveRazorpayConfig,
  testRazorpayConnection,
  type RazorpayServerConfig,
} from '@/utils/razorpayClient';

export function AdminRazorpaySettings() {
  const [config, setConfig] = useState<RazorpayServerConfig>({
    isActive: true,
    keyId: '',
    hasKeySecret: false,
    mode: 'live',
    businessName: 'AKSelling Store',
  });

  const [inputKeyId, setInputKeyId] = useState('');
  const [inputKeySecret, setInputKeySecret] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [mode, setMode] = useState<'live' | 'test'>('live');
  const [businessName, setBusinessName] = useState('AKSelling Store');

  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const cfg = await fetchRazorpayConfig();
      setConfig(cfg);
      setInputKeyId(cfg.keyId || '');
      setIsActive(cfg.isActive);
      setMode(cfg.mode || (cfg.keyId?.startsWith('rzp_test_') ? 'test' : 'live'));
      if (cfg.businessName) setBusinessName(cfg.businessName);
    } catch {
      showToast('Could not load existing config. You can enter your API keys below.', 'info');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handlePasteKeyId = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = text.trim();
        setInputKeyId(clean);
        if (clean.startsWith('rzp_test_')) setMode('test');
        else if (clean.startsWith('rzp_live_')) setMode('live');
        showToast('Key ID pasted from clipboard!', 'success');
      }
    } catch {
      showToast('Could not access clipboard. Please paste manually.', 'info');
    }
  };

  const handlePasteKeySecret = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputKeySecret(text.trim());
        showToast('Key Secret pasted from clipboard!', 'success');
      }
    } catch {
      showToast('Could not access clipboard. Please paste manually.', 'info');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKeyId.trim()) {
      showToast('Please enter your Razorpay API Key ID (rzp_live_... or rzp_test_...)', 'error');
      return;
    }

    setIsSaving(true);
    setTestResult(null);

    try {
      const updated = await saveRazorpayConfig({
        keyId: inputKeyId.trim(),
        keySecret: inputKeySecret.trim() || undefined,
        isActive,
        mode,
        businessName: businessName.trim() || 'AKSelling Store',
      });

      setConfig(updated);
      showToast('✅ Razorpay Gateway Successfully Activated & Saved!', 'success');
      setInputKeySecret(''); // Clear raw secret input once saved for security
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save configuration';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testRazorpayConnection(inputKeyId.trim(), inputKeySecret.trim());
      setTestResult({
        success: res.success,
        message: res.message || 'Razorpay connection test completed successfully!',
      });
      if (res.success) {
        showToast('Razorpay API keys verified successfully!', 'success');
      } else {
        showToast(res.message || 'API verification failed. Check Key ID & Secret.', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Test failed';
      setTestResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = Boolean(config.keyId && config.keyId.trim().length > 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl z-[90] flex items-center gap-2 shadow-2xl text-xs font-bold border transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-700'
              : 'bg-slate-900 text-slate-200 border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Status Banner */}
      <div className="bg-gradient-to-r from-[#0c2340] via-[#1b365d] to-[#0c2340] text-white p-4 sm:p-6 rounded-2xl shadow-md border border-blue-600/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1">
                <Zap size={11} className="text-amber-400" />
                Enterprise Payment Gateway
              </span>

              {isConfigured && config.isActive ? (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  GATEWAY ACTIVE & LIVE
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  GATEWAY INACTIVE / ACTION REQUIRED
                </span>
              )}

              <span className="bg-white/10 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded-full">
                Mode: {config.mode?.toUpperCase() || 'LIVE'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>Razorpay Payment Gateway Hub</span>
              <span className="text-xs font-normal text-blue-200">(रेज़रपे एक्टिवेशन)</span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
              Enable instant online payments for all customers via Google Pay, PhonePe, Paytm, RuPay, Visa,
              Mastercard, NetBanking (50+ Banks) and Wallets.
            </p>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={loadConfig}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Sync Status</span>
            </button>
            <a
              href="https://dashboard.razorpay.com/#/access/signin"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Razorpay Dashboard</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Gateway Status Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Gateway Status</span>
            <Power
              size={18}
              className={isConfigured && config.isActive ? 'text-emerald-500' : 'text-slate-400'}
            />
          </div>
          <p className="text-base font-black text-slate-900 mt-1">
            {isConfigured && config.isActive ? 'Active & Accepting Orders' : 'Gateway Paused'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {config.isActive ? 'Visible to buyers at checkout' : 'Hidden from buyers'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Key ID</span>
            <Key size={18} className="text-blue-500" />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-sm font-mono font-bold text-slate-900 truncate">
              {config.keyId ? `${config.keyId.slice(0, 10)}...${config.keyId.slice(-4)}` : 'Not configured'}
            </p>
            {config.keyId && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(config.keyId);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Copy Key ID"
              >
                {copiedKey ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {config.hasKeySecret ? 'Key Secret configured ✅' : 'Client-side Checkout Key'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Supported Methods</span>
            <Smartphone size={18} className="text-indigo-500" />
          </div>
          <p className="text-base font-black text-slate-900 mt-1">UPI, Cards, NetBanking</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Google Pay, PhonePe, Paytm, RuPay, Visa, EMI</p>
        </div>
      </div>

      {/* Main Activation & Credentials Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Key size={18} className="text-blue-600" />
              <span>Enter API Keys & Activate Razorpay</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste your Razorpay Key ID and Key Secret here to immediately route all customer payments to your account.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Activate Gateway:</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                isActive ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Key ID input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Key size={14} className="text-blue-600" />
                <span>Razorpay Key ID (API Key) *</span>
              </label>
              <button
                type="button"
                onClick={handlePasteKeyId}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Copy size={11} />
                <span>Paste from Clipboard</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={inputKeyId}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setInputKeyId(val);
                  if (val.startsWith('rzp_test_')) setMode('test');
                  else if (val.startsWith('rzp_live_')) setMode('live');
                }}
                placeholder="e.g. rzp_live_xxxxxxxxxxxxxx or rzp_test_xxxxxxxxxxxxxx"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Your Key ID starts with <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">rzp_live_</code> (for real money) or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">rzp_test_</code> (for test sandbox).
            </p>
          </div>

          {/* Key Secret input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Lock size={14} className="text-amber-600" />
                <span>Razorpay Key Secret (API Secret)</span>
                {config.hasKeySecret && !inputKeySecret && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                    Saved & Active
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={handlePasteKeySecret}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Copy size={11} />
                <span>Paste Secret</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={inputKeySecret}
                onChange={(e) => setInputKeySecret(e.target.value.trim())}
                placeholder={config.hasKeySecret ? '•••••••••••••••••••••••• (Leave blank to keep saved secret)' : 'Enter Razorpay Key Secret'}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showSecret ? 'Hide Secret' : 'Show Secret'}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Required for automated HMAC SHA-256 server signature verification to prevent fraudulent orders.
            </p>
          </div>

          {/* Mode & Business Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Environment Mode:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('live')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    mode === 'live'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🟢 Live (Real Payments)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('test')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    mode === 'test'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🟡 Test (Sandbox)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Store / Brand Name on Checkout:
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="AKSelling"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Test Result Message Box */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p>{testResult.message}</p>
                {testResult.success && (
                  <p className="text-[11px] text-emerald-700 font-normal mt-0.5">
                    Your store is fully ready to accept live payments from all customers!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Activating Razorpay...</span>
                </>
              ) : (
                <>
                  <Zap size={16} className="text-amber-300" />
                  <span>Activate & Save Razorpay Gateway (तुरंत एक्टिवेट करें)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !inputKeyId.trim()}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span>Test API Connection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Step-by-Step Guide in Hindi & English */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-900/60 shadow-md">
        <h3 className="text-sm font-black text-amber-300 flex items-center gap-2 mb-3">
          <Globe size={16} />
          <span>Razorpay API Key Kahan Se Milegi? (Step-by-Step Guide)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                1
              </span>
              <p className="text-slate-200 leading-relaxed">
                <strong>Razorpay Dashboard Login:</strong> Apne browser me{' '}
                <a
                  href="https://dashboard.razorpay.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-300 underline font-semibold"
                >
                  dashboard.razorpay.com
                </a>{' '}
                khol kar login karein.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                2
              </span>
              <p className="text-slate-200 leading-relaxed">
                <strong>Go to API Keys:</strong> Left-hand menu me <strong>Settings</strong> par jayein aur{' '}
                <strong>API Keys</strong> tab par click karein.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                3
              </span>
              <p className="text-slate-200 leading-relaxed">
                <strong>Generate Key:</strong> Agar pehle se key nahi hai toh <strong>&quot;Generate Key&quot;</strong> button
                dabayein. Screen par <strong>Key ID</strong> aur <strong>Key Secret</strong> dikhega.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                4
              </span>
              <p className="text-slate-200 leading-relaxed">
                <strong>Paste & Activate:</strong> Upar diye gaye boxes me Key ID aur Secret paste karke{' '}
                <strong>&quot;Activate & Save&quot;</strong> par click karein. App par turant Razorpay chalu ho jayega!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-indigo-800/60 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-300">
          <span>✨ Instant Settlement, Auto Payment Verification & Real-time Order Alerts directly to your mobile.</span>
          <span className="font-bold text-emerald-400">100% RBI & PCI-DSS Compliant</span>
        </div>
      </div>
    </div>
  );
}
