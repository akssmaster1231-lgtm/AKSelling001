import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Edit2,
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
  ShieldAlert,
  Wallet,
  Grid,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/auth-context';
import { isVerifiedOwnerAdmin, OWNER_ADMIN_EMAIL, ADMIN_MASTER_PASSCODE } from '@/utils/sellerWhitelist';
import { compressImageFile } from '@/utils/imageCompressor';
import { fetchAllBanners, addBanner, deleteBanner, updateBanner } from '@/banner-api';
import { AdminWithdrawalManager } from '@/components/AdminWithdrawalManager';
import { getAllCategories } from '@/data';
import {
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  subscribeCategories,
} from '@/firebase';
import type { Category } from '@/types';
import CategoryIcon, {
  POPULAR_CATEGORY_ICONS,
  CATEGORY_PRESET_COLORS,
} from '@/components/CategoryIcon';

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
  const { user } = useAuth();
  const isOwner = isVerifiedOwnerAdmin(user?.email);

  // Security Passcode Protection (Owner Master Control)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('akselling_admin_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminTab, setAdminTab] = useState<'categories' | 'banners' | 'payouts'>('categories');

  // Categories State & Management
  const [categoriesList, setCategoriesList] = useState<Category[]>(() => getAllCategories());
  const [catSearch, setCatSearch] = useState('');
  const [isCatEditing, setIsCatEditing] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    id: '',
    icon: 'Shirt',
    color: '#2874F0',
  });
  const [catSaving, setCatSaving] = useState(false);

  // Banner State
  const [banners, setBanners] = useState<Record<string, unknown>[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    cta: 'Shop Now',
    image: '',
    gradient: 'from-[#9f2089] to-pink-800',
    display_order: 0,
  });
  const [savingBanner, setSavingBanner] = useState(false);
  const [isCompressingBanner, setIsCompressingBanner] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Banners
  const loadBanners = async () => {
    setLoadingBanners(true);
    const data = await fetchAllBanners();
    setBanners(data);
    setLoadingBanners(false);
  };

  // Real-time synchronization for Categories and Banners
  useEffect(() => {
    if (!isOwner) return;

    setCategoriesList(getAllCategories());
    const unsubCat = subscribeCategories(() => {
      setCategoriesList(getAllCategories());
    });

    const handleLocalCatUpdate = () => {
      setCategoriesList(getAllCategories());
    };
    window.addEventListener('akselling_categories_updated', handleLocalCatUpdate);

    loadBanners();

    return () => {
      unsubCat();
      window.removeEventListener('akselling_categories_updated', handleLocalCatUpdate);
    };
  }, [isOwner]);

  // STRICT OWNER SECURITY LOCKDOWN: Public users have zero access permissions
  if (!isOwner) {
    return (
      <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[70] bg-slate-950 text-white flex items-center justify-center p-4 sm:shadow-2xl sm:border-x sm:border-slate-800">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 animate-fade-in text-center relative">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
            <Lock size={30} />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ShieldAlert size={16} className="text-rose-400" />
              <span className="text-xs font-black text-rose-400 tracking-wider uppercase">
                Owner Security Lockdown
              </span>
            </div>
            <h2 className="text-xl font-black text-white">Admin Panel Restricted</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Access to Category Management, Homepage Banners, and Platform Administration is strictly restricted exclusively to the verified store owner (<strong className="text-rose-300 font-mono">{OWNER_ADMIN_EMAIL}</strong>). Public accounts have zero access permissions.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-left text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Signed-in Identity:</span>
            <p className="font-mono text-slate-200 truncate">{user?.email || 'Public Visitor (Unauthenticated)'}</p>
          </div>

          <button
            onClick={onBack}
            className="w-full bg-white text-slate-950 font-bold text-sm py-3.5 rounded-2xl shadow hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  // Permanent Admin Master Passcode Verification Handler for Owner (anojkumaryadav7290@gmail.com)
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    // Strictly validate both owner authorized email and permanent master passcode @@AKSS1#aKSS$$$
    if (isOwner && cleanPin === ADMIN_MASTER_PASSCODE) {
      setIsAuthenticated(true);
      sessionStorage.setItem('akselling_admin_unlocked', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // CATEGORY CRUD HANDLERS
  const handleOpenAddCategory = () => {
    setEditingCatId(null);
    setCatForm({
      name: '',
      id: '',
      icon: 'Shirt',
      color: '#2874F0',
    });
    setIsCatEditing(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatForm({
      name: cat.name,
      id: cat.id,
      icon: cat.icon || 'Shirt',
      color: cat.color || '#2874F0',
    });
    setIsCatEditing(true);
  };

  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    const catId = editingCatId || catForm.id.trim() || catForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setCatSaving(true);
    try {
      const updatedCategory: Category = {
        id: catId,
        name: catForm.name.trim(),
        icon: catForm.icon,
        color: catForm.color,
      };

      await saveCategoryToFirestore(updatedCategory);
      setCategoriesList(getAllCategories());
      setIsCatEditing(false);
      setSavedMsg(`Category "${updatedCategory.name}" saved with live reflection!`);
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category. Please try again.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"? It will be removed from home category icons and product lists immediately.`)) {
      return;
    }

    try {
      await deleteCategoryFromFirestore(cat.id);
      setCategoriesList(getAllCategories());
      setSavedMsg(`Category "${cat.name}" deleted.`);
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category.');
    }
  };

  // BANNER CRUD HANDLERS
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingBanner(true);
    try {
      const compressed = await compressImageFile(file, 1200, 600, 0.82);
      if (compressed) {
        setBannerForm(prev => ({ ...prev, image: compressed }));
      }
    } catch (err) {
      console.error('Failed to compress banner image:', err);
    } finally {
      setIsCompressingBanner(false);
    }
  };

  const handleOpenAddBanner = () => {
    setEditingBannerId(null);
    setBannerForm({
      title: '',
      subtitle: '',
      cta: 'Shop Now',
      image: '',
      gradient: 'from-[#9f2089] to-pink-800',
      display_order: banners.length + 1,
    });
    setShowAddBanner(true);
  };

  const handleOpenEditBanner = (banner: Record<string, unknown>) => {
    setEditingBannerId(String(banner.id));
    setBannerForm({
      title: String(banner.title || ''),
      subtitle: String(banner.subtitle || ''),
      cta: String(banner.cta || 'Shop Now'),
      image: String(banner.image || ''),
      gradient: String(banner.gradient || 'from-[#9f2089] to-pink-800'),
      display_order: Number(banner.display_order || 1),
    });
    setShowAddBanner(true);
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.image.trim()) {
      alert('Please provide a banner title and image.');
      return;
    }
    setSavingBanner(true);
    try {
      if (editingBannerId) {
        await updateBanner(editingBannerId, {
          title: bannerForm.title,
          subtitle: bannerForm.subtitle,
          cta: bannerForm.cta,
          image: bannerForm.image,
          gradient: bannerForm.gradient,
          display_order: bannerForm.display_order,
        });
        setSavedMsg('Banner updated successfully!');
      } else {
        await addBanner({
          ...bannerForm,
          display_order: bannerForm.display_order || banners.length + 1,
        });
        setSavedMsg('New Banner published live on Homepage!');
      }
      setShowAddBanner(false);
      setEditingBannerId(null);
      await loadBanners();
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (err) {
      console.error('Error saving banner:', err);
      alert('Failed to save banner.');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this banner from Homepage?')) {
      await deleteBanner(id);
      await loadBanners();
      setSavedMsg('Banner removed from Homepage.');
      setTimeout(() => setSavedMsg(''), 2000);
    }
  };

  const handleToggleBannerActive = async (id: string, current: boolean) => {
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

  // Passcode gate for defense in depth
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[70] bg-gray-900 text-white flex items-center justify-center p-4 sm:shadow-2xl sm:border-x sm:border-gray-800">
        <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 animate-fade-in text-center relative">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 rounded-full bg-gray-700/80 text-gray-300 hover:text-white cursor-pointer"
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
            <h2 className="text-xl font-black text-white">AKSelling Admin Master Panel</h2>
            <p className="text-xs text-gray-300 mt-1 max-w-xs mx-auto">
              Authorized Owner: <span className="text-white font-bold">{OWNER_ADMIN_EMAIL}</span>. Enter the permanent Admin Master Passcode to unlock Category, Banner, and Admin controls.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="space-y-1">
              <div className="relative">
                <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  maxLength={64}
                  autoFocus
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Enter Master Passcode (@@AKSS1#aKSS$$$)"
                  className="w-full bg-gray-900 border border-gray-600 focus:border-[#9f2089] rounded-2xl pl-10 pr-11 py-3.5 text-center text-sm font-mono text-white placeholder:text-gray-500 placeholder:text-xs outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                  title={showPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {pinError && (
                <p className="text-xs text-rose-400 font-bold pt-1 animate-shake">
                  Access Denied. Passcode does not match @@AKSS1#aKSS$$$ or user is not {OWNER_ADMIN_EMAIL}.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#9f2089] to-pink-600 hover:from-[#851b73] hover:to-pink-700 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-pink-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock size={18} />
              <span>Unlock Admin Panel</span>
            </button>
          </form>

          <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-700/60 text-[11px] text-gray-400 text-left">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-400" />
              Enterprise Authentication Lock:
            </span>
            <p className="mt-0.5 leading-relaxed text-gray-300">
              Only requests authenticated as <strong>{OWNER_ADMIN_EMAIL}</strong> with master passcode <strong>@@AKSS1#aKSS$$$</strong> are authorized to configure store assets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filtered categories
  const filteredCategories = categoriesList.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
    c.id.toLowerCase().includes(catSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[70] bg-gray-50 overflow-y-auto sm:shadow-2xl sm:border-x sm:border-gray-200">
      {/* Top Navbar */}
      <div className="sticky top-0 bg-white shadow-xs px-4 py-3 flex items-center justify-between z-20 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer">
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black text-gray-900">AKSelling Admin Control</h1>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                <ShieldCheck size={10} /> OWNER SECURED
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Categories, Banners & Seller Payouts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5"
            title="Permanent Enterprise Passcode: @@AKSS1#aKSS$$$"
          >
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="hidden sm:inline">Hardened Passcode: Active</span>
          </div>

          <button
            onClick={() => {
              sessionStorage.removeItem('akselling_admin_unlocked');
              setIsAuthenticated(false);
            }}
            className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl border border-rose-100 flex items-center gap-1 transition-all cursor-pointer"
          >
            <Lock size={14} />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Switcher: Categories, Banners, Payouts */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 sticky top-[57px] z-10 shadow-xs">
        <button
          type="button"
          onClick={() => setAdminTab('categories')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'categories'
              ? 'bg-[#9f2089] text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Grid size={14} />
          <span className="truncate">Categories</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('banners')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'banners'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <ImageIcon size={14} />
          <span className="truncate">Banners</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('payouts')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'payouts'
              ? 'bg-amber-400 text-stone-950 shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Wallet size={14} />
          <span className="truncate">Payouts</span>
        </button>
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

        {/* TAB 1: PRODUCT CATEGORIES CRUD */}
        {adminTab === 'categories' && (
          <div className="space-y-4">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-[#9f2089] via-[#851b73] to-[#6d135d] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
              <div>
                <span className="bg-amber-400 text-gray-900 text-[10px] font-black px-1.5 py-0.2 rounded">
                  DYNAMIC CATEGORIES ENGINE
                </span>
                <h2 className="text-base sm:text-lg font-black text-white mt-1">
                  Product Categories ({categoriesList.length} Active)
                </h2>
                <p className="text-xs text-pink-100 font-medium">
                  Create, edit, change icons & colors with instant live reflection across the app.
                </p>
              </div>

              {!isCatEditing && (
                <button
                  onClick={handleOpenAddCategory}
                  className="bg-white text-[#9f2089] hover:bg-pink-50 active:bg-pink-100 font-black text-xs px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Category</span>
                </button>
              )}
            </div>

            {/* Category Add/Edit Form Card */}
            {isCatEditing && (
              <div className="bg-white rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#9f2089] flex items-center justify-center font-bold">
                      <Sparkles size={16} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900">
                      {editingCatId ? 'Edit Product Category' : 'Create New Product Category'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCatEditing(false)}
                    className="text-xs text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-800 mb-1 block">
                      Category Display Name *
                    </label>
                    <input
                      type="text"
                      value={catForm.name}
                      onChange={e => {
                        const nameVal = e.target.value;
                        setCatForm(prev => ({
                          ...prev,
                          name: nameVal,
                          id: editingCatId ? prev.id : nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        }));
                      }}
                      placeholder="e.g. Winter Wear, Smart Watches"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#9f2089] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 mb-1 block">
                      Category ID (Slug)
                    </label>
                    <input
                      type="text"
                      disabled={!!editingCatId}
                      value={catForm.id}
                      onChange={e => setCatForm(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="winter-wear"
                      className="w-full bg-gray-50 border border-gray-300 disabled:opacity-60 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#9f2089] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1.5 block">
                    Select Category Icon:
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200">
                    {POPULAR_CATEGORY_ICONS.map(iconItem => (
                      <button
                        key={iconItem.name}
                        type="button"
                        onClick={() => setCatForm(prev => ({ ...prev, icon: iconItem.name }))}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          catForm.icon === iconItem.name
                            ? 'bg-purple-100 border-[#9f2089] text-[#9f2089] font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <CategoryIcon name={iconItem.name} size={18} />
                        <span className="text-[10px] truncate max-w-full">{iconItem.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1.5 block">
                    Accent Color:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {CATEGORY_PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCatForm(prev => ({ ...prev, color: c }))}
                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                          catForm.color === c ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={catForm.color}
                      onChange={e => setCatForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-8 h-8 rounded-full cursor-pointer border border-gray-300"
                      title="Custom Color"
                    />
                  </div>
                </div>

                {/* Live Category Preview */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: catForm.color }}
                    >
                      <CategoryIcon name={catForm.icon} size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900">{catForm.name || 'Category Name'}</p>
                      <p className="text-[11px] font-mono text-gray-500">{catForm.id || 'category-id'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                    Live Preview
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveCategory}
                    disabled={catSaving}
                    className="flex-1 bg-[#9f2089] hover:bg-[#851b73] text-white font-black text-xs py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {catSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{catSaving ? 'Saving...' : editingCatId ? 'Update Category' : 'Publish Category'}</span>
                  </button>
                  <button
                    onClick={() => setIsCatEditing(false)}
                    className="px-4 text-xs text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Categories List Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    placeholder="Search categories by name or ID..."
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#9f2089]"
                  />
                </div>
                <button
                  onClick={() => setCategoriesList(getAllCategories())}
                  className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer"
                  title="Refresh categories"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="space-y-2">
                {filteredCategories.map(cat => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-purple-200 bg-white hover:bg-purple-50/20 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color || '#2874F0' }}
                      >
                        <CategoryIcon name={cat.icon || 'Shirt'} size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate">{cat.name}</p>
                        <p className="text-[10px] font-mono text-gray-500 truncate">ID: {cat.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No matching categories found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOMEPAGE BANNERS CRUD */}
        {adminTab === 'banners' && (
          <div className="space-y-4">
            {/* Banner Top Action Card */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
              <div>
                <span className="bg-amber-400 text-gray-900 text-[10px] font-black px-1.5 py-0.2 rounded">
                  HOMEPAGE BANNER CONTROLLER
                </span>
                <h2 className="text-base sm:text-lg font-black text-white mt-1">
                  Active Banners Carousel ({banners.filter(b => b.active !== false).length} Live)
                </h2>
                <p className="text-xs text-stone-300 font-medium">
                  Add new banners, upload posters, adjust colors & toggle live visibility.
                </p>
              </div>

              {!showAddBanner && (
                <button
                  onClick={handleOpenAddBanner}
                  className="bg-white text-stone-900 hover:bg-stone-100 active:bg-stone-200 font-black text-xs px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Banner</span>
                </button>
              )}
            </div>

            {/* Add / Edit Banner Form Card */}
            {showAddBanner && (
              <div className="bg-white rounded-2xl shadow-sm border border-pink-200 p-4 sm:p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#9f2089] flex items-center justify-center font-bold">
                      <Sparkles size={16} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900">
                      {editingBannerId ? 'Edit Homepage Banner' : 'Create New Homepage Banner'}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddBanner(false);
                      setEditingBannerId(null);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
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
                          setBannerForm(prev => ({
                            ...prev,
                            title: preset.title,
                            subtitle: preset.subtitle,
                            image: preset.image,
                            gradient: preset.gradient,
                          }));
                        }}
                        className="bg-gray-50 hover:bg-pink-50 p-2 rounded-xl border border-gray-200 text-left transition-colors flex items-center gap-2 cursor-pointer"
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
                      value={bannerForm.title}
                      onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
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
                      value={bannerForm.subtitle}
                      onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
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
                      value={bannerForm.cta}
                      onChange={e => setBannerForm({ ...bannerForm, cta: e.target.value })}
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
                      value={bannerForm.display_order}
                      onChange={e => setBannerForm({ ...bannerForm, display_order: parseInt(e.target.value) || 0 })}
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
                      disabled={isCompressingBanner}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-[#9f2089] font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isCompressingBanner ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Optimizing...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={13} />
                          <span>Upload from Device</span>
                        </>
                      )}
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
                      value={bannerForm.image}
                      onChange={e => setBannerForm({ ...bannerForm, image: e.target.value })}
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
                        onClick={() => setBannerForm({ ...bannerForm, gradient: g })}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g} transition-transform cursor-pointer ${
                          bannerForm.gradient === g ? 'ring-2 ring-[#9f2089] ring-offset-2 scale-105' : 'opacity-85'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Live Banner Preview Card */}
                {bannerForm.image && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-gray-500">Live Homepage Preview:</label>
                    <div className="rounded-2xl overflow-hidden h-36 relative shadow-md">
                      <img src={bannerForm.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 bg-gradient-to-r ${bannerForm.gradient} opacity-75`} />
                      <div className="absolute inset-0 p-4 flex flex-col justify-between">
                        <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit backdrop-blur-xs">
                          FEATURED CAROUSEL
                        </span>
                        <div>
                          <h4 className="text-white font-black text-base drop-shadow-sm">
                            {bannerForm.title || 'Banner Title'}
                          </h4>
                          <p className="text-pink-100 text-xs font-medium drop-shadow-sm">
                            {bannerForm.subtitle || 'Offer subtitle details'}
                          </p>
                          <span className="mt-2 inline-block bg-white text-gray-900 font-bold text-[11px] px-3 py-1 rounded-lg shadow-xs">
                            {bannerForm.cta || 'Shop Now'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveBanner}
                    disabled={savingBanner}
                    className="flex-1 bg-[#9f2089] hover:bg-[#851b73] text-white font-black text-xs py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {savingBanner ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{savingBanner ? 'Publishing...' : editingBannerId ? 'Update Banner' : 'Publish Banner to App'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddBanner(false);
                      setEditingBannerId(null);
                    }}
                    className="px-4 text-xs text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
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

              {loadingBanners ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-2">
                  <Loader2 size={32} className="animate-spin text-[#9f2089]" />
                  <p className="text-xs text-gray-500">Loading master banners...</p>
                </div>
              ) : banners.length === 0 && !showAddBanner ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 text-gray-500 space-y-2">
                  <ImageIcon size={32} className="mx-auto text-gray-300" />
                  <p className="text-xs font-bold text-gray-700">No custom banners currently active</p>
                  <button
                    onClick={handleOpenAddBanner}
                    className="mt-2 bg-[#9f2089] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    + Add First Banner
                  </button>
                </div>
              ) : (
                banners.map((banner, index) => {
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
                            onClick={() => handleOpenEditBanner(banner)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 rounded-xl border border-blue-100 transition-colors cursor-pointer"
                            title="Edit Banner"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => handleToggleBannerActive(bannerId, isActive)}
                            className={`px-3 py-1.5 rounded-xl transition-colors border cursor-pointer ${
                              isActive
                                ? 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isActive ? 'Hide' : 'Show Live'}
                          </button>

                          <button
                            onClick={() => handleDeleteBanner(bannerId)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-xl border border-rose-100 transition-colors cursor-pointer"
                            title="Delete Banner"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SELLER PAYOUTS & WITHDRAWALS */}
        {adminTab === 'payouts' && (
          <AdminWithdrawalManager />
        )}
      </div>
    </div>
  );
}
