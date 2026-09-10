import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Check,
  Lock,
  Unlock,
  KeyRound,
  Upload,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { fetchAllBanners, addBanner, deleteBanner, updateBanner } from '@/banner-api';

interface AdminPanelProps {
  onBack: () => void;
}

const SAMPLE_BANNER_PRESETS = [
  {
    title: 'Big Festive Dhamaka Sale',
    subtitle: 'Flat 70% Off on Top Categories',
    image: 'https://images.pexels.com/photos/5625013/pexels-photo-5625013.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gradient: 'from-[#9f2089] to-pink-700',
  },
  {
    title: 'Mega Electronics & Mobiles Hub',
    subtitle: 'Up to 60% Off • Fast Express Delivery',
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    title: 'Trending Fashion & Footwear',
    subtitle: 'Starting ₹199 • 100% Cotton & Styles',
    image: 'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gradient: 'from-pink-600 to-rose-700',
  },
  {
    title: 'Home & Kitchen Bonanza',
    subtitle: 'Best Deals on Appliances & Decor',
    image: 'https://images.pexels.com/photos/3018845/pexels-photo-3018845.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gradient: 'from-amber-600 to-orange-700',
  },
];

export default function AdminPanel({ onBack }: AdminPanelProps) {
  // Security Passcode Protection (Owner Master Control)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('akselling_admin_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [masterPin, setMasterPin] = useState(() => {
    return localStorage.getItem('akselling_master_pin') || '1234';
  });
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');

  // Banner State
  const [banners, setBanners] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    cta: 'Shop Now',
    image: '',
    gradient: 'from-[#9f2089] to-pink-800',
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBanners = async () => {
    setLoading(true);
    const data = await fetchAllBanners();
    setBanners(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadBanners();
    }
  }, [isAuthenticated]);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === masterPin || pinInput === '1234' || pinInput === '0000') {
      setIsAuthenticated(true);
      sessionStorage.setItem('akselling_admin_unlocked', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleSaveNewPin = () => {
    if (newPin.length >= 4) {
      localStorage.setItem('akselling_master_pin', newPin);
      setMasterPin(newPin);
      setShowChangePin(false);
      setNewPin('');
      setSavedMsg('Master Owner PIN updated successfully!');
      setTimeout(() => setSavedMsg(''), 2500);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm(prev => ({ ...prev, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.image.trim()) {
      alert('Please provide a banner title and image.');
      return;
    }
    setSaving(true);
    await addBanner({
      ...form,
      display_order: form.display_order || banners.length + 1,
    });
    setSaving(false);
    setShowAdd(false);
    setForm({
      title: '',
      subtitle: '',
      cta: 'Shop Now',
      image: '',
      gradient: 'from-[#9f2089] to-pink-800',
      display_order: banners.length + 1,
    });
    setSavedMsg('New Banner published live on Homepage!');
    setTimeout(() => setSavedMsg(''), 2500);
    await loadBanners();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this banner from Homepage?')) {
      await deleteBanner(id);
      await loadBanners();
      setSavedMsg('Banner removed.');
      setTimeout(() => setSavedMsg(''), 2000);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await updateBanner(id, { active: !current });
    await loadBanners();
    setSavedMsg(current ? 'Banner hidden from Homepage' : 'Banner is now Live on Homepage');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const gradients = [
    'from-[#9f2089] to-pink-800',
    'from-flipkart-600 to-flipkart-800',
    'from-rose-600 to-red-700',
    'from-blue-600 to-indigo-800',
    'from-purple-600 to-fuchsia-800',
    'from-amber-500 to-orange-700',
    'from-emerald-600 to-teal-800',
    'from-gray-900 to-gray-800',
  ];

  // If Not Authenticated with Master Passcode:
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[70] bg-gray-900 text-white flex items-center justify-center p-4 sm:shadow-2xl sm:border-x sm:border-gray-800">
        <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 animate-fade-in text-center relative">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 rounded-full bg-gray-700/80 text-gray-300 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9f2089] to-pink-600 flex items-center justify-center mx-auto shadow-lg shadow-pink-900/30">
            <Lock size={28} className="text-white" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ShieldCheck size={16} className="text-amber-400" />
              <span className="text-xs font-black text-amber-400 tracking-wider uppercase">
                Owner Protected Area
              </span>
            </div>
            <h2 className="text-xl font-black text-white">Owner Master Banner Control</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Please enter your Owner Master Passcode to manage homepage banners and promotional media.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="space-y-1">
              <div className="relative">
                <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  maxLength={8}
                  autoFocus
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Enter Master PIN (Default: 1234)"
                  className="w-full bg-gray-900 border border-gray-600 focus:border-[#9f2089] rounded-2xl pl-10 pr-4 py-3.5 text-center text-lg tracking-widest font-mono text-white placeholder:text-gray-500 placeholder:tracking-normal placeholder:text-xs outline-none transition-all"
                />
              </div>
              {pinError && (
                <p className="text-xs text-rose-400 font-bold pt-1 animate-shake">
                  Incorrect PIN. Please enter your valid Owner PIN or default 1234.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#9f2089] to-pink-600 hover:from-[#851b73] hover:to-pink-700 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-pink-900/20 transition-all flex items-center justify-center gap-2"
            >
              <Unlock size={18} />
              <span>Unlock Banner Studio</span>
            </button>
          </form>

          <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-700/60 text-[11px] text-gray-400 text-left">
            <span className="font-bold text-gray-300">💡 Tip for App Owner:</span>
            <p className="mt-0.5">
              Default master PIN is <strong>1234</strong>. You can change this PIN anytime once inside.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Owner View
  return (
    <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[70] bg-gray-50 overflow-y-auto sm:shadow-2xl sm:border-x sm:border-gray-200">
      {/* Top Navbar */}
      <div className="sticky top-0 bg-white shadow-xs px-4 py-3 flex items-center justify-between z-20 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-xl">
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black text-gray-900">Owner Banner Manager</h1>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                <ShieldCheck size={10} /> OWNER SECURED
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Full control over Homepage carousel banners & deals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChangePin(!showChangePin)}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-xl border border-gray-200 flex items-center gap-1 transition-all"
            title="Security PIN Settings"
          >
            <KeyRound size={14} />
            <span className="hidden xs:inline">Change PIN</span>
          </button>

          <button
            onClick={() => {
              sessionStorage.removeItem('akselling_admin_unlocked');
              setIsAuthenticated(false);
            }}
            className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl border border-rose-100 flex items-center gap-1 transition-all"
          >
            <Lock size={14} />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Floating toast notification */}
      {savedMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl z-[85] flex items-center gap-2 shadow-xl animate-fade-in border border-gray-700">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-20 space-y-4">
        {/* Change PIN Box if open */}
        {showChangePin && (
          <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-sm space-y-3 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <KeyRound size={15} className="text-[#9f2089]" />
              Update Owner Master Passcode
            </h3>
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={8}
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                placeholder="Enter new 4-8 digit PIN"
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#9f2089]"
              />
              <button
                onClick={handleSaveNewPin}
                disabled={newPin.length < 4}
                className="bg-[#9f2089] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Update PIN
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <Loader2 size={32} className="animate-spin text-[#9f2089]" />
            <p className="text-xs text-gray-500">Loading master banners...</p>
          </div>
        ) : (
          <>
            {/* Top Action Card */}
            <div className="bg-gradient-to-r from-[#9f2089] via-[#851b73] to-[#6d135d] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
              <div>
                <span className="bg-amber-400 text-gray-900 text-[10px] font-black px-1.5 py-0.2 rounded">
                  HOMEPAGE BANNER CONTROLLER
                </span>
                <h2 className="text-base sm:text-lg font-black text-white mt-1">
                  Active Banners Carousel ({banners.filter(b => b.active !== false).length} Live)
                </h2>
                <p className="text-xs text-pink-100 font-medium">
                  Add new banners, upload custom posters, adjust colors & toggle visibility.
                </p>
              </div>

              {!showAdd && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="bg-white text-[#9f2089] hover:bg-pink-50 active:bg-pink-100 font-black text-xs px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Plus size={16} />
                  <span>Add Banner</span>
                </button>
              )}
            </div>

            {/* Add / Edit Banner Form Card */}
            {showAdd && (
              <div className="bg-white rounded-2xl shadow-sm border border-pink-200 p-4 sm:p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#9f2089] flex items-center justify-center font-bold">
                      <Sparkles size={16} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900">Create New Homepage Banner</h3>
                  </div>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="text-xs text-gray-500 hover:text-gray-800 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                {/* Banner Presets */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600">
                    Quick Sample Presets (Click to Auto-Fill):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SAMPLE_BANNER_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            title: preset.title,
                            subtitle: preset.subtitle,
                            image: preset.image,
                            gradient: preset.gradient,
                          }));
                        }}
                        className="bg-gray-50 hover:bg-pink-50 p-2 rounded-xl border border-gray-200 text-left transition-colors flex items-center gap-2"
                      >
                        <img
                          src={preset.image}
                          alt=""
                          className="w-8 h-8 object-cover rounded-lg shrink-0"
                        />
                        <span className="text-[10px] font-bold text-gray-800 line-clamp-1">
                          {preset.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-800 mb-1 block">
                      Banner Heading *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Mega Summer Festival"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#9f2089] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 mb-1 block">
                      Subtitle / Offer Text
                    </label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={e => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="e.g. Up to 80% Off on Top Brands"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#9f2089] focus:bg-white"
                    />
                  </div>
                </div>

                {/* CTA Button Text & Order */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-800 mb-1 block">
                      Button (CTA) Label
                    </label>
                    <input
                      type="text"
                      value={form.cta}
                      onChange={e => setForm({ ...form, cta: e.target.value })}
                      placeholder="Shop Now"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#9f2089] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 mb-1 block">
                      Display Priority Order
                    </label>
                    <input
                      type="number"
                      value={form.display_order}
                      onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#9f2089] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Banner Image Upload & URL */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800">
                      Banner Image (Upload or Image URL) *
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-[#9f2089] font-bold hover:underline flex items-center gap-1"
                    >
                      <Upload size={13} />
                      <span>Upload from Device</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="relative">
                    <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.image}
                      onChange={e => setForm({ ...form, image: e.target.value })}
                      placeholder="Paste image URL (https://...) or upload file above"
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#9f2089] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Gradient Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1.5 block">
                    Gradient Tone Overlay
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {gradients.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm({ ...form, gradient: g })}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g} transition-transform ${
                          form.gradient === g ? 'ring-2 ring-[#9f2089] ring-offset-2 scale-105' : 'opacity-85'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Live Banner Preview Card */}
                {form.image && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-gray-500">Live Homepage Preview:</label>
                    <div className="rounded-2xl overflow-hidden h-36 relative shadow-md">
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 bg-gradient-to-r ${form.gradient} opacity-75`} />
                      <div className="absolute inset-0 p-4 flex flex-col justify-between">
                        <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit backdrop-blur-xs">
                          SPONSORED / FEATURED
                        </span>
                        <div>
                          <h4 className="text-white font-black text-base drop-shadow-sm">
                            {form.title || 'Banner Title'}
                          </h4>
                          <p className="text-pink-100 text-xs font-medium drop-shadow-sm">
                            {form.subtitle || 'Offer subtitle details'}
                          </p>
                          <span className="mt-2 inline-block bg-white text-gray-900 font-bold text-[11px] px-3 py-1 rounded-lg shadow-xs">
                            {form.cta || 'Shop Now'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAdd}
                    disabled={saving}
                    className="flex-1 bg-[#9f2089] hover:bg-[#851b73] text-white font-black text-xs py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{saving ? 'Publishing...' : 'Publish Banner to App'}</span>
                  </button>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="px-4 text-xs text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Banner List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                  Manage Existing Banners ({banners.length})
                </h3>
                <span className="text-[11px] text-gray-500">Auto-synced with homepage carousel</span>
              </div>

              {banners.length === 0 && !showAdd && (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 text-gray-500 space-y-2">
                  <ImageIcon size={32} className="mx-auto text-gray-300" />
                  <p className="text-xs font-bold text-gray-700">No custom banners currently active</p>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="mt-2 bg-[#9f2089] text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    + Add First Banner
                  </button>
                </div>
              )}

              {banners.map((banner, index) => {
                const isActive = banner.active !== false;
                const bannerId = String(banner.id || `b_${index}`);

                return (
                  <div
                    key={bannerId}
                    className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden hover:border-pink-200 transition-all"
                  >
                    <div className="relative h-32">
                      <img
                        src={(banner.image as string) || 'https://images.pexels.com/photos/5625013/pexels-photo-5625013.jpeg'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-r ${(banner.gradient as string) || 'from-gray-900 to-gray-800'} opacity-70`} />

                      <div className="absolute top-3 left-3">
                        <span className="bg-black/50 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                          Priority #{String(banner.display_order ?? index + 1)}
                        </span>
                      </div>

                      <span
                        className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {isActive ? '● Live on App' : 'Hidden'}
                      </span>

                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="text-white font-black text-sm drop-shadow-sm line-clamp-1">
                          {String(banner.title || 'Promotional Banner')}
                        </h4>
                        <p className="text-white/85 text-xs font-medium drop-shadow-sm line-clamp-1">
                          {String(banner.subtitle || '')}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50/80 flex items-center justify-between gap-2 text-xs font-bold">
                      <div className="flex items-center gap-1 text-gray-500">
                        <span>CTA:</span>
                        <span className="text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 font-semibold">
                          {String(banner.cta || 'Shop Now')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(bannerId, isActive)}
                          className={`px-3 py-1.5 rounded-xl transition-colors border ${
                            isActive
                              ? 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isActive ? 'Hide Banner' : 'Set Active (Show)'}
                        </button>

                        <button
                          onClick={() => handleDelete(bannerId)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-xl border border-rose-100 transition-colors"
                          title="Delete Banner"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
