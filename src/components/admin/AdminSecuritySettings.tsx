import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  getStoredAdminPassword,
  saveAdminCustomPassword,
  isCustomPasswordSet,
  subscribeAdminSecurityPassword,
  lockAdminPanelSession,
} from '@/utils/adminSecurity';
import { OWNER_ADMIN_EMAIL, ADMIN_MASTER_PASSCODE } from '@/utils/sellerWhitelist';

interface AdminSecuritySettingsProps {
  onLockNow?: () => void;
}

export default function AdminSecuritySettings({ onLockNow }: AdminSecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState<string>(() => getStoredAdminPassword());
  const [isCustom, setIsCustom] = useState<boolean>(() => isCustomPasswordSet());
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // New password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync listener from Firestore / localStorage
  useEffect(() => {
    const unsub = subscribeAdminSecurityPassword((pwd) => {
      setCurrentPassword(pwd);
      setIsCustom(isCustomPasswordSet());
    });
    return () => unsub();
  }, []);

  const handleCopyCurrent = () => {
    navigator.clipboard?.writeText(currentPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanNew) {
      setErrorMsg('कृपया नया पासवर्ड दर्ज करें (Please enter a new password)');
      return;
    }

    if (cleanNew.length < 3) {
      setErrorMsg('पासवर्ड कम से कम 3 अक्षरों या अंकों का होना चाहिए (Minimum 3 characters required)');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setErrorMsg('दोनों पासवर्ड मेल नहीं खा रहे हैं (Passwords do not match)');
      return;
    }

    setIsSaving(true);
    try {
      await saveAdminCustomPassword(cleanNew);
      setCurrentPassword(cleanNew);
      setIsCustom(true);
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg(`सफलता! नया एडमिन पासवर्ड "${cleanNew}" सफलतापूर्वक सेट कर दिया गया है।`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'पासवर्ड सेव करने में त्रुटि आई। कृपया पुनः प्रयास करें।';
      setErrorMsg(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockAdmin = () => {
    lockAdminPanelSession();
    if (onLockNow) {
      onLockNow();
    } else {
      window.location.reload();
    }
  };

  const setPresetPin = (preset: string) => {
    setNewPassword(preset);
    setConfirmPassword(preset);
    setErrorMsg('');
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-purple-950 text-white rounded-3xl p-5 sm:p-6 border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-purple-600/30 text-purple-300 border border-purple-400/30">
                <KeyRound size={20} />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  एडमिन पैनल पासवर्ड मैनेजमेंट
                </h2>
                <p className="text-xs text-purple-200">
                  Admin Master Password & Access Protection
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-300 pt-2 leading-relaxed max-w-lg">
              यहाँ से आप अपने AKSelling एडमिन पैनल के लिए अपना मनपसंद गुप्त पासवर्ड सेट या बदल सकते हैं। जब भी कोई एडमिन पैनल खोलेगा, उसे यह पासवर्ड डालना अनिवार्य होगा।
            </p>
          </div>

          <button
            type="button"
            onClick={handleLockAdmin}
            className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-lg shadow-rose-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
            title="एडमिन पैनल तुरंत लॉक करें"
          >
            <Lock size={14} />
            <span>अभी लॉक करें</span>
          </button>
        </div>
      </div>

      {/* Current Active Password Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <h3 className="text-sm font-black text-gray-900">
              वर्तमान सक्रिय पासवर्ड (Current Password)
            </h3>
          </div>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              isCustom
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {isCustom ? 'कस्टम पासवर्ड सेट है' : 'मास्टर पासवर्ड (@@AKSS1#aKSS$$$)'}
          </span>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-mono font-black text-lg">
              {showCurrentPassword ? <KeyRound size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <div className="text-[11px] text-gray-500 font-medium">सक्रिय पासवर्ड:</div>
              <div className="text-base sm:text-lg font-mono font-black text-gray-900 tracking-wider">
                {showCurrentPassword ? currentPassword : '••••••••'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="p-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 cursor-pointer transition-colors"
              title={showCurrentPassword ? 'छुपाएं' : 'दिखाएं'}
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              type="button"
              onClick={handleCopyCurrent}
              className="p-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 cursor-pointer transition-colors flex items-center gap-1"
              title="पासवर्ड कॉपी करें"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 leading-normal flex items-center gap-1.5">
          <Info size={13} className="text-purple-600 shrink-0" />
          <span>
            यह पासवर्ड आपके क्लाउड डेटाबेस (Firestore) में रीयल-टाइम सुरक्षित रूप से सेव होता है।
          </span>
        </p>
      </div>

      {/* Set / Change New Password Form */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">
              नया एडमिन पासवर्ड सेट करें (Set New Password)
            </h3>
            <p className="text-[11px] text-gray-500">
              अपना नया 4-अंकों का पिन या कोई भी गुप्त शब्द दर्ज करें
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="text-[11px] font-bold text-gray-600 block mb-1.5">
            त्वरित सुझाव (Quick Options):
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPresetPin('@@AKSS1#aKSS$$$')}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-300 cursor-pointer"
            >
              @@AKSS1#aKSS$$$ (Master)
            </button>
            <button
              type="button"
              onClick={() => setPresetPin('7290')}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg border border-purple-200 cursor-pointer"
            >
              7290 (Anoj PIN)
            </button>
            <button
              type="button"
              onClick={() => setPresetPin('1234')}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg border border-gray-200 cursor-pointer"
            >
              1234 (Easy PIN)
            </button>
            <button
              type="button"
              onClick={() => setPresetPin('AKSelling@2026')}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 cursor-pointer"
            >
              AKSelling@2026
            </button>
            <button
              type="button"
              onClick={() => setPresetPin('9999')}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 cursor-pointer"
            >
              9999 (Fast PIN)
            </button>
          </div>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-3.5">
          <div>
            <label className="text-xs font-black text-gray-700 block mb-1">
              1. नया पासवर्ड दर्ज करें (Enter New Password):
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="उदा. 7290 या Anoj@123 या अपना गुप्त पिन"
                maxLength={40}
                className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-purple-600 rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 placeholder:font-sans outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-gray-700 block mb-1">
              2. पासवर्ड दोबारा दर्ज करें (Confirm New Password):
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="वही पासवर्ड दोबारा लिखें"
                maxLength={40}
                className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-purple-600 rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 placeholder:font-sans outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 disabled:opacity-50 text-white font-black text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>पासवर्ड सुरक्षित हो रहा है...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>नया पासवर्ड सुरक्षित करें (Save Password)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLockAdmin}
              className="sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-gray-300"
            >
              <Lock size={14} />
              <span>लॉक करके टेस्ट करें</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & Emergency Recovery Box */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 text-amber-900 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-amber-700" />
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
            इमरजेंसी रिकवरी व मालिक सुरक्षा (Owner Safe Lock)
          </h4>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          यदि आप कभी अपना सेट किया हुआ पासवर्ड भूल जाते हैं, तो आपकी अधिकृत ईमेल (<strong>{OWNER_ADMIN_EMAIL}</strong>) के लिए मास्टर रिकवरी की व्यवस्था है:
        </p>
        <ul className="text-[11px] text-amber-900 list-disc list-inside space-y-1 font-medium">
          <li>
            मास्टर इमरजेंसी पासकोड: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">{ADMIN_MASTER_PASSCODE}</code>
          </li>
          <li>
            डिफ़ॉल्ट बैकअप कोड्स: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">1234</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">admin</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">7290</code>
          </li>
          <li>
            आपका सेट किया गया पासवर्ड ही मुख्य रहेगा और हर बार एडमिन पैनल खोलते समय माँगा जाएगा।
          </li>
        </ul>
      </div>
    </div>
  );
}
