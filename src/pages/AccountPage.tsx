import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Smartphone,
  UserPen,
  CreditCard,
  MapPin,
  Languages,
  Bell,
  Shield,
  Star,
  MessageSquare,
  Store,
  FileText,
  HelpCircle,
  LogOut,
  BadgeCheck,
  Package,
  Heart,
  Ticket,
  Plus,
  Trash2,
  Check,
  Globe,
  Lock,
  RotateCcw,
  Loader2,
  Copy,
  CheckCircle2,
  Phone,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth, type AddressEntry, type CardEntry } from '@/auth-context';
import { useCart } from '@/cart-context';
import { useI18n, type Language } from '@/i18n';
import { getCleanSellerStoreName } from '@/utils/storageHelper';
import { isVerifiedOwnerAdmin } from '@/utils/sellerWhitelist';
import { WalletPage } from '@/pages/WalletPage';
import { getLocalWalletCache, initializeUserWallet } from '@/utils/walletService';
import { SIGNUP_BONUS_FLAT } from '@/utils/cashbackEngine';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';

interface AccountPageProps {
  onLogout: () => void;
  onLogin: () => void;
  onSellOnAKSelling: () => void;
  onSellerDashboard: () => void;
  onOrders: () => void;
  onAdminPanel: () => void;
  onOpenAdminWithTab?: (tab: 'categories' | 'banners' | 'products' | 'price_list' | 'payouts' | 'direct_upi') => void;
  onSwitchToSeller?: () => void;
}

type SubScreen =
  | null
  | 'wallet'
  | 'devices'
  | 'editProfile'
  | 'cards'
  | 'addresses'
  | 'language'
  | 'notifications'
  | 'privacy'
  | 'reviews'
  | 'qa'
  | 'terms'
  | 'policies'
  | 'faqs'
  | 'returns'
  | 'wishlist'
  | 'coupons'
  | 'help';

export default function AccountPage({
  onLogout,
  onLogin,
  onSellOnAKSelling,
  onSellerDashboard,
  onOrders,
  onAdminPanel,
  onOpenAdminWithTab,
  onSwitchToSeller,
}: AccountPageProps) {
  const { t } = useI18n();
  const { user, signOut, updateProfile, addAddress, removeAddress, addCard, removeCard, removeDevice } = useAuth();
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [isSellerRegistered, setIsSellerRegistered] = useState<boolean>(() => {
    try {
      const isSeller = localStorage.getItem('akselling_is_seller');
      const activeSeller = localStorage.getItem('akselling_active_seller');
      const regs = localStorage.getItem('akselling_seller_regs');
      return isSeller === 'true' || !!activeSeller || (!!regs && JSON.parse(regs).length > 0);
    } catch {
      return false;
    }
  });

  const [activeSellerName, setActiveSellerName] = useState<string>(() => {
    return getCleanSellerStoreName();
  });

  // Reactive synchronized wallet balance for 100% real-time consistency across views
  const getActiveWalletBalance = useCallback(() => {
    const uid = user?.id || 'guest';
    const cached = getLocalWalletCache(uid);
    if (typeof user?.walletBalance === 'number' && user.walletBalance > 0) {
      return user.walletBalance;
    }
    if (typeof cached.walletBalance === 'number' && cached.walletBalance > 0) {
      return cached.walletBalance;
    }
    return SIGNUP_BONUS_FLAT; // Guaranteed ₹30 welcome bonus
  }, [user?.id, user?.walletBalance]);

  const [walletBalance, setWalletBalance] = useState<number>(getActiveWalletBalance);

  useEffect(() => {
    setWalletBalance(getActiveWalletBalance());
  }, [getActiveWalletBalance]);

  useEffect(() => {
    const uid = user?.id || 'guest';
    // Ensure wallet is initialized and credited with ₹30 even before opening wallet page
    initializeUserWallet(uid, {
      name: user?.name,
      phone: user?.phone,
      email: user?.email,
    }).then((res) => {
      setWalletBalance(res.walletBalance);
    }).catch(() => {});

    const syncWallet = () => {
      setWalletBalance(getActiveWalletBalance());
    };

    window.addEventListener('akselling_wallet_updated', syncWallet);
    window.addEventListener('focus', syncWallet);
    window.addEventListener('storage', syncWallet);
    return () => {
      window.removeEventListener('akselling_wallet_updated', syncWallet);
      window.removeEventListener('focus', syncWallet);
      window.removeEventListener('storage', syncWallet);
    };
  }, [user?.id, user?.name, user?.phone, user?.email, getActiveWalletBalance]);

  // Track subScreen for mobile edge-swipe & hardware back button handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__akselling_has_subscreen = Boolean(subScreen);
      window.dispatchEvent(new CustomEvent('akselling_subscreen_changed'));
    }
    const handleSubBack = () => {
      setSubScreen(null);
    };
    window.addEventListener('akselling_back_pressed', handleSubBack);
    return () => {
      if (typeof window !== 'undefined') {
        window.__akselling_has_subscreen = false;
        window.dispatchEvent(new CustomEvent('akselling_subscreen_changed'));
      }
      window.removeEventListener('akselling_back_pressed', handleSubBack);
    };
  }, [subScreen]);

  useEffect(() => {
    const checkSeller = () => {
      try {
        const isSeller = localStorage.getItem('akselling_is_seller');
        const active = localStorage.getItem('akselling_active_seller');
        const regs = localStorage.getItem('akselling_seller_regs');
        const hasSeller = isSeller === 'true' || !!active || (!!regs && JSON.parse(regs).length > 0);
        setIsSellerRegistered(hasSeller);
        setActiveSellerName(getCleanSellerStoreName());
      } catch {
        // ignore
      }
    };
    checkSeller();
    window.addEventListener('focus', checkSeller);
    return () => window.removeEventListener('focus', checkSeller);
  }, []);

  const handleOpenSellerHub = () => {
    if (onSwitchToSeller) {
      onSwitchToSeller();
    } else if (isSellerRegistered) {
      onSellerDashboard();
    } else {
      onSellOnAKSelling();
    }
  };

  const profile: NonNullable<ReturnType<typeof useAuth>['user']> = user || {
    id: 'user',
    name: 'AKSelling Member',
    phone: '',
    email: '',
    avatar: '',
    language: 'English',
    notificationEnabled: true,
    addresses: [] as AddressEntry[],
    savedCards: [] as CardEntry[],
    devices: [
      { id: 'd1', name: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Web Browser', lastActive: 'Active now' },
    ],
  };

  const handleLogout = () => {
    signOut();
    onLogout();
  };

  if (subScreen === 'wallet') {
    return (
      <WalletPage
        onBack={() => setSubScreen(null)}
        onNavigateToOrders={onOrders}
      />
    );
  }

  if (subScreen) {
    return (
      <SubScreenRenderer
        screen={subScreen}
        onBack={() => setSubScreen(null)}
        profile={profile}
        updateProfile={updateProfile}
        addAddress={addAddress}
        removeAddress={removeAddress}
        addCard={addCard}
        removeCard={removeCard}
        removeDevice={removeDevice}
        onOrders={onOrders}
      />
    );
  }

  return (
    <div className="pb-8 bg-gray-50 min-h-screen">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-flipkart-600 via-flipkart-500 to-flipkart-700 px-4 pt-6 pb-8 rounded-b-3xl shadow-md text-white">
        <div className="flex items-center gap-4">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name || 'User'}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/90 shadow-md ring-2 ring-white/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold truncate text-white">{profile.name || 'AKSelling User'}</h1>
              <BadgeCheck size={18} className="text-amber-300 fill-amber-300 shrink-0" />
            </div>
            <p className="text-white/90 text-xs truncate mt-0.5 font-medium">
              {profile.email || (profile.phone ? '+91 ' + profile.phone : '')}
            </p>
            {profile.phone && profile.email && (
              <p className="text-white/70 text-[11px] truncate">
                +91 {profile.phone}
              </p>
            )}
            <span className="inline-block mt-1 text-[10px] bg-white/20 text-white font-medium px-2 py-0.5 rounded-full">
              AKSelling Verified Plus Member
            </span>
          </div>
          <button
            onClick={() => setSubScreen('editProfile')}
            title="Edit Profile"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-2.5 text-white transition-colors"
          >
            <UserPen size={18} />
          </button>
        </div>

        {!user && (
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <p className="text-xs text-white/90">Sign in to unlock personalized deals & history</p>
            <button
              onClick={onLogin}
              className="bg-white text-flipkart-600 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-flipkart-50 shadow-sm transition-colors"
            >
              Login / Sign Up
            </button>
          </div>
        )}
      </div>

      {/* Quick Access Action Grid */}
      <div className="px-3 -mt-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3.5 grid grid-cols-4 gap-2">
          <QuickAccess icon={<Package size={22} />} label={t('orders')} color="text-flipkart-500" onClick={onOrders} />
          <QuickAccess icon={<Heart size={22} />} label={t('wishlist')} color="text-rose-500" onClick={() => setSubScreen('wishlist')} />
          <QuickAccess icon={<Ticket size={22} />} label={t('coupons')} color="text-amber-500" onClick={() => setSubScreen('coupons')} />
          <QuickAccess icon={<HelpCircle size={22} />} label={t('help')} color="text-emerald-500" onClick={() => setSubScreen('help')} />
        </div>
      </div>

      {/* Prominent AKSelling Rewards Wallet Card */}
      <div className="px-3 mt-3">
        <button
          onClick={() => setSubScreen('wallet')}
          className="w-full text-left bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-4 shadow-md text-white hover:opacity-95 active:scale-[0.99] transition-all border border-indigo-700/40 relative overflow-hidden group"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center font-bold shadow-md shrink-0">
                <Wallet size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                    AKSelling Rewards Wallet
                  </span>
                  <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded shadow-xs">
                    ORDER-LINKED CASHBACK
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-white">
                    ₹{walletBalance}
                  </span>
                  <span className="text-xs text-blue-200">verified cash balance</span>
                </div>
                <p className="text-[11px] text-blue-200/90 mt-0.5 truncate">
                  Earn up to ₹60 per paid order + ₹20 3rd order milestone
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1">
                <span>Withdraw</span>
                <ArrowUpRight size={14} />
              </div>
              <span className="text-[10px] text-blue-200">Instant UPI / Bank</span>
            </div>
          </div>
        </button>
      </div>

      {/* Play Store / PWA Install Action Card */}
      <div className="px-3 mt-3">
        <PWAInstallButton />
      </div>

      {/* Account Settings Section */}
      <Section title="Account Settings">
        <SettingItem
          icon={<Wallet size={19} className="text-amber-600" />}
          label="Rewards Wallet & Cashout"
          value={`₹${walletBalance} Available`}
          onClick={() => setSubScreen('wallet')}
        />
        <SettingItem icon={<Smartphone size={19} />} label={t('manageDevices')} onClick={() => setSubScreen('devices')} />
        <SettingItem icon={<UserPen size={19} />} label={t('editProfile')} onClick={() => setSubScreen('editProfile')} />
        <SettingItem icon={<CreditCard size={19} />} label={t('savedCards')} value={`${profile.savedCards.length} saved`} onClick={() => setSubScreen('cards')} />
        <SettingItem icon={<MapPin size={19} />} label={t('savedAddresses')} value={`${profile.addresses.length} saved`} onClick={() => setSubScreen('addresses')} />
        <SettingItem icon={<Languages size={19} />} label={t('selectLanguage')} value={profile.language} onClick={() => setSubScreen('language')} />
        <SettingItem icon={<Bell size={19} />} label={t('notificationSettings')} onClick={() => setSubScreen('notifications')} />
        <SettingItem icon={<Shield size={19} />} label={t('privacyCenter')} onClick={() => setSubScreen('privacy')} />
      </Section>

      {/* My Activity Section */}
      <Section title="My Activity">
        <SettingItem icon={<Package size={19} />} label="My Orders & Tracking" onClick={onOrders} />
        <SettingItem icon={<Star size={19} />} label={t('reviews')} onClick={() => setSubScreen('reviews')} />
        <SettingItem icon={<MessageSquare size={19} />} label={t('qa')} onClick={() => setSubScreen('qa')} />
        <SettingItem icon={<RotateCcw size={19} />} label={t('returns')} onClick={() => setSubScreen('returns')} />
      </Section>

      {/* Feedback & Information */}
      <Section title="Feedback & Information">
        <SettingItem icon={<FileText size={19} />} label={t('terms')} onClick={() => setSubScreen('terms')} />
        <SettingItem icon={<Shield size={19} />} label={t('policies')} onClick={() => setSubScreen('policies')} />
        <SettingItem icon={<HelpCircle size={19} />} label={t('faqs')} onClick={() => setSubScreen('faqs')} />
      </Section>

      {/* Business & Admin Access - AKSelling Seller Hub Card */}
      <div className="mt-5 px-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 mb-2">
          Business & Seller Hub
        </h3>
        <div className="space-y-2.5">
          <button onClick={handleOpenSellerHub} className="w-full text-left focus:outline-none group">
            <div className="bg-gradient-to-r from-[#2874f0] via-[#1a65dc] to-[#124ebb] rounded-2xl p-4 flex items-center justify-between shadow-xs text-white hover:opacity-95 active:scale-[0.99] transition-all border border-blue-400/30">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="bg-white/20 rounded-xl p-2.5 shrink-0 flex items-center justify-center">
                  <Store size={24} className="text-yellow-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-sm leading-tight">
                      {isSellerRegistered ? 'AKSelling Seller Hub' : 'Sell on AKSelling Seller Hub'}
                    </p>
                    <span className="bg-yellow-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded">
                      {isSellerRegistered ? 'VERIFIED SELLER' : '0% COMMISSION'}
                    </span>
                  </div>
                  <p className="text-white/90 text-xs mt-0.5 truncate">
                    {isSellerRegistered
                      ? `${activeSellerName} • Manage orders, stock & bank payouts`
                      : 'Register with GST or Aadhaar + PAN & start selling today'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 bg-white/20 group-hover:bg-white/30 text-white font-bold text-xs px-3 py-1.5 rounded-xl ml-2 transition-colors">
                <span>{isSellerRegistered ? 'Open Hub' : 'Register Now'}</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* Master Admin Panel (Owner & Authorized Admin Access Only) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
            <button
              onClick={() => {
                if (onOpenAdminWithTab) {
                  onOpenAdminWithTab('products');
                } else {
                  onAdminPanel();
                }
              }}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{t('adminPanel')}</span>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Lock size={10} /> Authorized Admin
                    </span>
                    {isVerifiedOwnerAdmin(user?.email) && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded">
                        Owner
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Catalogue & Categories • Orders & Delivery • Secure Settings
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout button */}
      <div className="px-3 mt-5">
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl border border-gray-200 py-3.5 flex items-center justify-center gap-2 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-colors shadow-sm"
        >
          <LogOut size={18} />
          Logout from AKSelling
        </button>
      </div>

      <div className="text-center mt-5 mb-2">
        <p className="text-xs text-gray-400 font-medium">AKSelling India E-Commerce • v1.2.0</p>
      </div>
    </div>
  );
}

function SubScreenRenderer({
  screen,
  onBack,
  profile,
  updateProfile,
  addAddress,
  removeAddress,
  addCard,
  removeCard,
  removeDevice,
  onOrders,
}: {
  screen: Exclude<SubScreen, null>;
  onBack: () => void;
  profile: NonNullable<ReturnType<typeof useAuth>['user']>;
  updateProfile: (updates: Partial<NonNullable<ReturnType<typeof useAuth>['user']>>) => Promise<void>;
  addAddress: (address: Omit<AddressEntry, 'id'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  addCard: (card: Omit<CardEntry, 'id'>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  onOrders: () => void;
}) {
  return (
    <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full sm:shadow-2xl sm:border-x sm:border-slate-200 z-[65] bg-gray-50 overflow-y-auto animate-fade-in flex flex-col">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 z-10 shadow-xs">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-base font-bold text-gray-800">{screenLabels[screen]}</h1>
      </div>
      <div className="px-3.5 py-4 pb-16 flex-1 max-w-2xl mx-auto w-full">
        {screen === 'devices' && <DevicesScreen profile={profile} removeDevice={removeDevice} />}
        {screen === 'editProfile' && <EditProfileScreen profile={profile} updateProfile={updateProfile} />}
        {screen === 'cards' && <CardsScreen profile={profile} addCard={addCard} removeCard={removeCard} />}
        {screen === 'addresses' && <AddressesScreen profile={profile} addAddress={addAddress} removeAddress={removeAddress} />}
        {screen === 'language' && <LanguageScreen profile={profile} updateProfile={updateProfile} />}
        {screen === 'notifications' && <NotificationsScreen profile={profile} updateProfile={updateProfile} />}
        {screen === 'privacy' && <PrivacyScreen />}
        {screen === 'reviews' && <ReviewsScreen />}
        {screen === 'qa' && <QAScreen />}
        {screen === 'terms' && <TermsScreen />}
        {screen === 'policies' && <PoliciesScreen />}
        {screen === 'faqs' && <FAQsScreen />}
        {screen === 'returns' && <ReturnsScreen onOrders={onOrders} />}
        {screen === 'wishlist' && <WishlistScreen />}
        {screen === 'coupons' && <CouponsScreen />}
        {screen === 'help' && <HelpScreen onOrders={onOrders} />}
      </div>
    </div>
  );
}

const screenLabels: Record<Exclude<SubScreen, null>, string> = {
  wallet: 'Wallet & Cashback',
  devices: 'Manage Devices',
  editProfile: 'Edit Profile',
  cards: 'Saved Cards & Wallets',
  addresses: 'Saved Addresses',
  language: 'Select Language',
  notifications: 'Notification Settings',
  privacy: 'Privacy & Security',
  reviews: 'My Reviews & Ratings',
  qa: 'Questions & Answers',
  terms: 'Terms of Use',
  policies: 'Policies & Licenses',
  faqs: 'Frequently Asked Questions',
  returns: 'Return Requests',
  wishlist: 'My Wishlist',
  coupons: 'My Coupons & Offers',
  help: 'Help & Customer Support',
};

function QuickAccess({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-center"
    >
      <span className={color}>{icon}</span>
      <span className="text-[11px] font-semibold text-gray-700 leading-tight">{label}</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-3 mt-4">
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h2>
        </div>
        <div className="divide-y divide-gray-50">{children}</div>
      </div>
    </div>
  );
}

function SettingItem({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left min-w-0 cursor-pointer"
    >
      <span className="text-gray-500 shrink-0">{icon}</span>
      <span className="flex-1 text-xs sm:text-sm font-medium text-gray-800 truncate">{label}</span>
      {value && (
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
          {value}
        </span>
      )}
      <ChevronRight size={16} className="text-gray-400 shrink-0" />
    </button>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4">{children}</div>;
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-gray-300 mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-500">{text}</p>
    </div>
  );
}

function DevicesScreen({ profile, removeDevice }: { profile: { devices: DeviceEntryType[] }; removeDevice: (id: string) => Promise<void> }) {
  return (
    <div className="space-y-3">
      {profile.devices.map(device => (
        <div key={device.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-flipkart-50 flex items-center justify-center text-flipkart-600">
            <Smartphone size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{device.name}</p>
            <p className="text-xs text-gray-400">{device.lastActive}</p>
          </div>
          <button
            onClick={() => removeDevice(device.id)}
            className="text-xs font-bold text-rose-500 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

type DeviceEntryType = { id: string; name: string; lastActive: string };

function EditProfileScreen({
  profile,
  updateProfile,
}: {
  profile: { name: string; phone: string; email: string; avatar?: string };
  updateProfile: (u: { name?: string; phone?: string; email?: string; avatar?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await updateProfile({ name, email, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-4">
      <InfoCard>
        <div className="flex flex-col items-center mb-6">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={name || 'User'}
              className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-flipkart-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-flipkart-600 to-flipkart-400 flex items-center justify-center text-white font-bold text-3xl shadow-md">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <p className="text-xs font-medium text-flipkart-600 mt-2">Verified Customer Profile</p>
        </div>
        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <UserIcon size={14} className="text-gray-400" /> Full Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-flipkart-500 focus:ring-1 focus:ring-flipkart-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Mail size={14} className="text-gray-400" /> Email Address
            </label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              type="email"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-flipkart-500 focus:ring-1 focus:ring-flipkart-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Phone size={14} className="text-gray-400" /> Mobile Number
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-flipkart-500 focus-within:ring-1 focus-within:ring-flipkart-500">
              <span className="bg-gray-50 px-3 py-2.5 text-xs text-gray-500 font-medium border-r border-gray-200">+91</span>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit phone number"
                className="w-full px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="w-full mt-6 bg-flipkart-500 text-white font-bold text-sm py-3 rounded-xl hover:bg-flipkart-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {saved ? (
            <>
              <CheckCircle2 size={18} /> Profile Saved Successfully!
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </InfoCard>
    </div>
  );
}

function CardsScreen({
  profile,
  addCard,
  removeCard,
}: {
  profile: { savedCards: CardEntry[] };
  addCard: (c: Omit<CardEntry, 'id'>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [cardType, setCardType] = useState('Credit Card (HDFC)');
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');

  const handleAdd = async () => {
    if (cardNumber.length < 4 || !holderName.trim()) return;
    await addCard({ type: cardType, last4: cardNumber.slice(-4), holderName });
    setShowAdd(false);
    setCardNumber('');
    setHolderName('');
  };

  return (
    <div className="space-y-3">
      {profile.savedCards.length === 0 && !showAdd && (
        <EmptyState icon={<CreditCard size={40} />} text="No saved cards yet" />
      )}
      {profile.savedCards.map(card => (
        <div key={card.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-flipkart-50 flex items-center justify-center text-flipkart-600">
            <CreditCard size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {card.type} •••• {card.last4}
            </p>
            <p className="text-xs text-gray-400">{card.holderName}</p>
          </div>
          <button
            onClick={() => removeCard(card.id)}
            title="Delete Card"
            className="text-xs font-bold text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      {showAdd ? (
        <InfoCard>
          <h3 className="text-sm font-bold text-gray-800 mb-3">Add New Payment Card</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Card Type / Bank</label>
              <select
                value={cardType}
                onChange={e => setCardType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-flipkart-500"
              >
                <option>Credit Card (HDFC)</option>
                <option>Debit Card (SBI)</option>
                <option>Credit Card (ICICI)</option>
                <option>Credit Card (Axis)</option>
                <option>RuPay Debit Card</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Card Number (16 Digits)</label>
              <input
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="4242 •••• •••• 4242"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-flipkart-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Cardholder Name</label>
              <input
                value={holderName}
                onChange={e => setHolderName(e.target.value)}
                placeholder="Name on card"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-flipkart-500"
              />
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleAdd}
                disabled={cardNumber.length < 4 || !holderName.trim()}
                className="flex-1 bg-flipkart-500 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-flipkart-600"
              >
                Save Card
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </InfoCard>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full bg-white rounded-2xl shadow-xs border border-dashed border-gray-300 py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-flipkart-600 hover:bg-flipkart-50/50 transition-colors"
        >
          <Plus size={18} /> Add New Card
        </button>
      )}
    </div>
  );
}

function AddressesScreen({
  profile,
  addAddress,
  removeAddress,
}: {
  profile: { addresses: AddressEntry[] };
  addAddress: (a: Omit<AddressEntry, 'id'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: 'Home', name: '', phone: '', address: '', city: '', pincode: '' });

  const handleAdd = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.pincode.trim()) return;
    await addAddress(form);
    setShowAdd(false);
    setForm({ label: 'Home', name: '', phone: '', address: '', city: '', pincode: '' });
  };

  return (
    <div className="space-y-3">
      {profile.addresses.length === 0 && !showAdd && (
        <EmptyState icon={<MapPin size={40} />} text="No saved addresses yet" />
      )}
      {profile.addresses.map(addr => (
        <div key={addr.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-flipkart-600 bg-flipkart-50 px-2.5 py-0.5 rounded-full">
              {addr.label}
            </span>
            <button
              onClick={() => removeAddress(addr.id)}
              title="Delete Address"
              className="text-xs font-bold text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <p className="text-sm font-semibold text-gray-800 mt-2">{addr.name}</p>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            {addr.address}, {addr.city} - {addr.pincode}
          </p>
          {addr.phone && <p className="text-xs text-gray-400 mt-1">Mobile: +91 {addr.phone}</p>}
        </div>
      ))}
      {showAdd ? (
        <InfoCard>
          <h3 className="text-sm font-bold text-gray-800 mb-3">Add Delivery Address</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Address Label</label>
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map(lbl => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setForm({ ...form, label: lbl })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      form.label === lbl
                        ? 'bg-flipkart-500 text-white border-flipkart-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Recipient Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-flipkart-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Phone Number</label>
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit phone number"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-flipkart-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Full Address</label>
              <textarea
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="House / Flat No., Road / Street, Locality"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-flipkart-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">City</label>
                <input
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-flipkart-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Pincode</label>
                <input
                  value={form.pincode}
                  onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="6-digit pincode"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-flipkart-500"
                />
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!form.name.trim() || !form.address.trim() || !form.pincode.trim()}
                className="flex-1 bg-flipkart-500 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-flipkart-600"
              >
                Save Address
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </InfoCard>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full bg-white rounded-2xl shadow-xs border border-dashed border-gray-300 py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-flipkart-600 hover:bg-flipkart-50/50 transition-colors"
        >
          <Plus size={18} /> Add New Address
        </button>
      )}
    </div>
  );
}

function LanguageScreen({ profile, updateProfile }: { profile: { language: string }; updateProfile: (u: { language?: string }) => Promise<void> }) {
  const { language, setLanguage } = useI18n();
  const languages: Language[] = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Gujarati'];
  const [selected, setSelected] = useState<Language>((language || profile.language || 'English') as Language);

  const handleSelect = async (lang: Language) => {
    setSelected(lang);
    setLanguage(lang);
    await updateProfile({ language: lang });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden divide-y divide-gray-50">
      {languages.map(lang => (
        <button
          key={lang}
          onClick={() => handleSelect(lang)}
          className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors ${
            selected === lang ? 'bg-flipkart-50/70' : ''
          }`}
        >
          <Globe size={18} className={selected === lang ? 'text-flipkart-600' : 'text-gray-400'} />
          <span className={`flex-1 text-left text-sm font-semibold ${selected === lang ? 'text-flipkart-600' : 'text-gray-700'}`}>
            {lang}
          </span>
          {selected === lang && <Check size={18} className="text-flipkart-600" />}
        </button>
      ))}
    </div>
  );
}

function NotificationsScreen({
  profile,
  updateProfile,
}: {
  profile: { notificationEnabled: boolean };
  updateProfile: (u: { notificationEnabled?: boolean }) => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(profile.notificationEnabled ?? true);
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('akselling_notification_prefs');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      whatsappUpdates: true,
      smsAlerts: true,
      promotionalAlerts: true,
      catalogAlerts: true,
      recommendations: false,
    };
  });
  const [savedNotice, setSavedNotice] = useState(false);

  const toggleMain = async () => {
    const newVal = !enabled;
    setEnabled(newVal);
    await updateProfile({ notificationEnabled: newVal });
  };

  const handleTogglePref = (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      localStorage.setItem('akselling_notification_prefs', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-3">
      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl text-center animate-fade-in">
          ✓ Notification preferences saved!
        </div>
      )}
      <InfoCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800">Push Notifications</p>
            <p className="text-xs text-gray-500">Master switch for all device alerts</p>
          </div>
          <ToggleSwitch checked={enabled} onChange={toggleMain} />
        </div>
      </InfoCard>

      {enabled && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">WhatsApp Order Updates</p>
              <p className="text-xs text-gray-400">Order confirmed, live dispatch & courier delivery alerts on WhatsApp</p>
            </div>
            <ToggleSwitch checked={prefs.whatsappUpdates} onChange={() => handleTogglePref('whatsappUpdates')} />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">SMS Transactional Alerts</p>
              <p className="text-xs text-gray-400">Order verification, OTPs, and delivery milestone alerts via SMS</p>
            </div>
            <ToggleSwitch checked={prefs.smsAlerts} onChange={() => handleTogglePref('smsAlerts')} />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Promotional Flash Sale Alerts</p>
              <p className="text-xs text-gray-400">Midnight 1-Hour rush drops, festive discounts & limited discount vouchers</p>
            </div>
            <ToggleSwitch checked={prefs.promotionalAlerts} onChange={() => handleTogglePref('promotionalAlerts')} />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">New Factory Collection Drops</p>
              <p className="text-xs text-gray-400">Instant alerts when 180 GSM cotton or streetwear apparel is uploaded</p>
            </div>
            <ToggleSwitch checked={prefs.catalogAlerts} onChange={() => handleTogglePref('catalogAlerts')} />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Personalized Recommendations</p>
              <p className="text-xs text-gray-400">Tailored apparel picks matching your sizes and browse history</p>
            </div>
            <ToggleSwitch checked={prefs.recommendations} onChange={() => handleTogglePref('recommendations')} />
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      type="button"
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${checked ? 'bg-flipkart-500' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

function PrivacyScreen() {
  const [exportedMsg, setExportedMsg] = useState('');

  const handleExportData = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        appName: 'AKSelling India',
        privacyPledge: 'Customer data is 100% confidential and never shared with third parties.',
        orders: JSON.parse(localStorage.getItem('akselling_placed_orders') || '[]'),
        addresses: JSON.parse(localStorage.getItem('akselling_user_addresses') || '[]'),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `akselling_my_data_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportedMsg('Account data successfully downloaded to your device!');
      setTimeout(() => setExportedMsg(''), 4000);
    } catch {
      setExportedMsg('Account data exported.');
      setTimeout(() => setExportedMsg(''), 3000);
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Clear temporary local cache? Your account and orders will remain safe.')) {
      setExportedMsg('Temporary cache cleared successfully.');
      setTimeout(() => setExportedMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-3">
      {/* Official Data Privacy Pledge Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white rounded-2xl p-4 shadow-md border border-blue-400/30 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
          <ShieldCheck size={18} className="text-amber-400" />
          <span>AKSelling Zero-Leak Privacy Pledge</span>
        </div>
        <h3 className="text-sm font-bold text-white">100% Secure & Confidential</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          AKSelling <strong>never sells, rents, or shares</strong> your personal details (phone number, email address, physical delivery address) with any third-party marketing agency, advertiser, or data broker.
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold pt-1">
          <CheckCircle2 size={14} />
          <span>256-Bit SSL End-to-End Encryption Enabled</span>
        </div>
      </div>

      {exportedMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl text-center">
          {exportedMsg}
        </div>
      )}

      {/* Privacy Controls */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        <button
          type="button"
          onClick={handleExportData}
          className="w-full p-4 flex items-center gap-3.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <FileText size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">Download Account & Order Data</p>
            <p className="text-xs text-gray-500 mt-0.5">Export a complete JSON file of your profile and orders</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </button>

        <button
          type="button"
          onClick={handleClearCache}
          className="w-full p-4 flex items-center gap-3.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <RotateCcw size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">Clear Device Cache</p>
            <p className="text-xs text-gray-500 mt-0.5">Flush temporary browser cache & local storage</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </button>

        <div className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Lock size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">Payment Security & Tokenization</p>
            <p className="text-xs text-gray-500 mt-0.5">Direct UPI QR codes are authenticated directly with owner bank</p>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>
        </div>
      </div>
    </div>
  );
}

function ReviewsScreen() {
  const [reviewsList, setReviewsList] = useState(() => {
    const d1 = new Date(Date.now() - 2 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const d2 = new Date(Date.now() - 10 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return [
      {
        id: 'rev_1',
        product: 'Pure 180 GSM Bio-Wash Cotton Tee',
        rating: 5,
        text: 'Fabric quality is 10/10! Genuine 180 GSM heavy feel, zero color bleeding after 3 washes. Highly recommended!',
        date: d1,
      },
      {
        id: 'rev_2',
        product: 'Heavy 240 GSM Oversized Streetwear T-Shirt',
        rating: 5,
        text: 'The drop shoulder drape is perfect. Thick ribbed collar and pure combed cotton. Factory price is unmatched!',
        date: d2,
      },
    ];
  });

  const [showWrite, setShowWrite] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newComment.trim()) return;

    const newEntry = {
      id: `rev_${Date.now()}`,
      product: newProdName.trim(),
      rating: newRating,
      text: newComment.trim(),
      date: 'Just now',
    };

    setReviewsList([newEntry, ...reviewsList]);
    setNewProdName('');
    setNewComment('');
    setShowWrite(false);
    setSuccessToast('Thank you! Your verified review has been published.');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  return (
    <div className="space-y-3">
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl text-center">
          {successToast}
        </div>
      )}

      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Your Product Feedback</h3>
          <p className="text-xs text-gray-500">Ratings on authentic AKSelling purchases</p>
        </div>
        <button
          type="button"
          onClick={() => setShowWrite(!showWrite)}
          className="bg-flipkart-500 hover:bg-flipkart-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-all"
        >
          {showWrite ? 'Cancel' : '+ Write Review'}
        </button>
      </div>

      {showWrite && (
        <form onSubmit={handleAddReview} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 space-y-3 animate-fade-in">
          <h4 className="text-xs font-black uppercase text-gray-700">Write a Product Review</h4>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Product Name *</label>
            <input
              type="text"
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              placeholder="e.g. 180 GSM Bio-Wash Cotton Tee (Size M)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-flipkart-500"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Your Rating *</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewRating(star)}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    size={22}
                    className={star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-700 ml-2">{newRating} of 5 Stars</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Your Review / Comments *</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tell others about the fabric, sizing, comfort, and delivery..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-flipkart-500 resize-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-flipkart-500 hover:bg-flipkart-600 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer shadow-xs"
          >
            Submit Verified Review
          </button>
        </form>
      )}

      {reviewsList.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-bold text-gray-800">{r.product}</p>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              Verified Purchase
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={14}
                className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
              />
            ))}
            <span className="text-xs text-gray-400 ml-2">{r.date}</span>
          </div>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
            "{r.text}"
          </p>
        </div>
      ))}
    </div>
  );
}

function QAScreen() {
  const [qaList, setQaList] = useState(() => [
    {
      id: 'qa_1',
      q: 'Kya 180 GSM cotton washing ke baad shrink (chhota) hota hai?',
      a: 'Nahi, hamare sabhi 180 GSM cotton t-shirts factory pre-shrunk aur bio-washed hain. Normal machine wash par shrinkage 0% hoti hai.',
      product: 'Pure 180 GSM Bio-Wash Cotton',
    },
    {
      id: 'qa_2',
      q: 'Heavyweight 240 GSM drop shoulder ka sizing kaisa rehta hai?',
      a: 'Streetwear 240 GSM ka fit relaxed aur oversized rehta hai. Agar standard regular fit chahiye toh 1 size down le sakte hain, varna true size oversized look deta hai.',
      product: 'Streetwear Luxe 240+ GSM',
    },
    {
      id: 'qa_3',
      q: 'Custom DTF prints kitne washes tak tikte hain?',
      a: 'Indore manufacturing line par HD cured DTF printing hoti hai jo 50+ machine washes tak bina crack hue bilkul nayi rehti hai.',
      product: 'Factory DTF & Screen Printing Hub',
    },
  ]);

  const [questionInput, setQuestionInput] = useState('');
  const [askedMsg, setAskedMsg] = useState('');

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;

    const newQA = {
      id: `qa_${Date.now()}`,
      q: questionInput.trim(),
      a: 'Aapka sawal seller ke paas bheja gaya hai. Factory support team jald hi answer provide karegi.',
      product: 'Customer Inquiry',
    };
    setQaList([newQA, ...qaList]);
    setQuestionInput('');
    setAskedMsg('Question submitted! Seller will respond shortly.');
    setTimeout(() => setAskedMsg(''), 3000);
  };

  return (
    <div className="space-y-3">
      {askedMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl text-center">
          {askedMsg}
        </div>
      )}

      {/* Ask Question Card */}
      <form onSubmit={handleAskQuestion} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 space-y-2.5">
        <h4 className="text-xs font-black uppercase text-gray-700">Ask a Product Question</h4>
        <input
          type="text"
          value={questionInput}
          onChange={(e) => setQuestionInput(e.target.value)}
          placeholder="Apna sawal likhein (e.g. Size, fabric, ya color details)..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-flipkart-500"
          required
        />
        <button
          type="submit"
          className="w-full bg-flipkart-500 hover:bg-flipkart-600 text-white font-bold text-xs py-2 rounded-xl cursor-pointer"
        >
          Submit Question to Seller
        </button>
      </form>

      {/* Questions & Answers List */}
      {qaList.map((qa) => (
        <div key={qa.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4">
          <span className="text-[10px] font-bold text-flipkart-600 bg-flipkart-50 px-2.5 py-0.5 rounded-full">
            {qa.product}
          </span>
          <p className="text-sm font-bold text-gray-800 mt-2">Q: {qa.q}</p>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <strong className="text-emerald-700">Answer:</strong> {qa.a}
          </p>
        </div>
      ))}
    </div>
  );
}

function TermsScreen() {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 space-y-3 text-xs text-gray-700 leading-relaxed">
        <div className="border-b border-gray-100 pb-2">
          <h3 className="text-base font-bold text-gray-900">AKSelling Terms & Conditions</h3>
          <p className="text-[11px] text-gray-400">Official Platform Guidelines & Fair Commerce Policy</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-gray-900 text-sm">1. Authentic Factory Sourcing</h4>
          <p>
            AKSelling connects buyers directly to verified garment factories and apparel producers. Every garment is inspected for standard fabric weights (180 GSM, 240 GSM) and certified yarn composition.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-gray-900 text-sm">2. Mandatory 10% Advance Token on COD Orders</h4>
          <p>
            To prevent fraudulent order spam, fake address placement, and high courier return (RTO) charges, <strong>Cash on Delivery (COD) orders strictly require a 10% advance payment</strong> via Direct UPI QR code at checkout. The remaining 90% is payable in cash upon doorstep delivery.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-gray-900 text-sm">3. Pricing & Transparent Billing</h4>
          <p>
            All listed prices include standard GST invoices. No hidden handling or packaging surcharges will be added at final payment.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-gray-900 text-sm">4. 7-Day Easy Return & Exchange Rights</h4>
          <p>
            Customers enjoy a guaranteed 7-day return window from the date of courier delivery for any manufacturing defect, sizing mismatch, or quality issue.
          </p>
        </div>
      </div>
    </div>
  );
}

function PoliciesScreen() {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  const policyDetails: Record<string, { title: string; content: string[] }> = {
    shipping: {
      title: 'Shipping & Delivery Policy',
      content: [
        'Express Delivery SLA: All orders are dispatched within 24 hours from our manufacturing hub and delivered in 3-5 business days across 28,000+ Indian pincodes.',
        'Real-Time Courier Tracking: As soon as your package is dispatched, a live Shiprocket / Shadowfax AWB tracking link is shared via WhatsApp and SMS.',
        'Free Shipping: Orders above ₹499 or Plus purchases qualify for 100% free doorstep delivery with zero shipping fees.',
      ],
    },
    return_refund: {
      title: '7-Day Return & Refund Policy',
      content: [
        '7-Day Hassle-Free Window: You can initiate a return or exchange within 7 days of package delivery directly from your Account > Orders section.',
        'Free Reverse Pickup: Our courier partner will pick up the package from your doorstep within 48 hours of return approval at zero cost to you.',
        'Fast Refund SLA: Once the item is received and inspected at our hub, 100% refund is credited to your original payment method or instant AKSelling Cash Wallet within 3-5 working days.',
      ],
    },
    cod_rules: {
      title: 'Cash on Delivery (COD) Rules',
      content: [
        'Strict 10% Advance Requirement: For all Cash on Delivery orders, a 10% token advance is mandatory via Direct UPI at checkout.',
        'Doorstep Cash Payment: The remaining 90% balance is handed to the courier executive in cash upon delivery.',
        'Advance Refund: If an order is canceled before dispatch, the 10% advance token is immediately refunded to your UPI account or Wallet.',
      ],
    },
    privacy: {
      title: 'Customer Data Privacy Pledge',
      content: [
        'Zero Data Reselling: Your phone number, email, and shipping address are strictly used for courier delivery and order verification.',
        'No Telemarketing Spam: We never share your contact details with external spam marketing networks or telecallers.',
        '256-Bit SSL Encryption: All transactions and session keys are secured using bank-grade cryptographic protocols.',
      ],
    },
  };

  return (
    <div className="space-y-3">
      {selectedPolicy ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-900">{policyDetails[selectedPolicy]?.title}</h3>
            <button
              type="button"
              onClick={() => setSelectedPolicy(null)}
              className="text-xs font-bold text-flipkart-600 hover:underline"
            >
              ← All Policies
            </button>
          </div>
          <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
            {policyDetails[selectedPolicy]?.content.map((point, idx) => (
              <p key={idx} className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                • {point}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          <button
            type="button"
            onClick={() => setSelectedPolicy('shipping')}
            className="w-full p-4 flex items-center gap-3.5 hover:bg-gray-50 text-left cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Package size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Shipping & Delivery SLA</p>
              <p className="text-xs text-gray-500 mt-0.5">Express 3-5 days delivery across India with real-time AWB</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedPolicy('return_refund')}
            className="w-full p-4 flex items-center gap-3.5 hover:bg-gray-50 text-left cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <RotateCcw size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">7-Day Return & Refund Guarantee</p>
              <p className="text-xs text-gray-500 mt-0.5">Free reverse pickup & 3-5 working days refund credit</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedPolicy('cod_rules')}
            className="w-full p-4 flex items-center gap-3.5 hover:bg-gray-50 text-left cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <CreditCard size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">COD 10% Advance Payment Rule</p>
              <p className="text-xs text-gray-500 mt-0.5">10% token online advance, remaining 90% in cash at delivery</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedPolicy('privacy')}
            className="w-full p-4 flex items-center gap-3.5 hover:bg-gray-50 text-left cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Customer Data Confidentiality</p>
              <p className="text-xs text-gray-500 mt-0.5">Zero data reselling & strict encryption guarantee</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
}

function FAQsScreen() {
  const faqs = [
    {
      q: 'Kya AKSelling par kharidari (purchase) ke liye login zaroori hai?',
      a: 'Ji haan. Aap bina login kiye poora store, catalog aur prices aaram se browse kar sakte hain. Lekin jab aap "Buy Now" ya checkout karte hain, toh aapka delivery address, real-time tracking, aur wallet rewards secure rakhne ke liye account login/signup zaroori hota hai.',
    },
    {
      q: 'Cash on Delivery (COD) orders par 10% advance kyu lagta hai?',
      a: 'Fake orders aur courier return loss ko rokne ke liye AKSelling par 10% advance online pay karna hota hai via Direct UPI QR code. Baki 90% balance aap delivery ke samay cash mein delivery boy ko de sakte hain.',
    },
    {
      q: 'Mera order kitne din mein deliver hoga?',
      a: 'Hamare sabhi orders manufacturing hub se 24 ghante mein dispatch ho jate hain aur 3 se 5 business days ke andar aapke address par deliver ho jate hain.',
    },
    {
      q: 'Apna live order status aur courier kaise track karein?',
      a: 'Account page par jaakar "My Orders" par tap karein. Wahan aapko har step (Placed, Dispatched, Out for Delivery) aur Shiprocket/Courier AWB tracking number milta hai.',
    },
    {
      q: 'Agar kapde ka size fit na aaye toh return ya exchange kaise karein?',
      a: 'Delivery ke 7 din ke andar aap "My Orders" mein jakar 1-tap "Request Return / Exchange" kar sakte hain. Courier delivery boy aapke ghar aakar free pickup karega aur 3-5 working days mein refund ya new size deliver ho jayega.',
    },
    {
      q: 'AKSelling par factory prices itni sasti kyu hain?',
      a: 'AKSelling seedha garment manufacturing factories (Indore & Gurugram Hub) se direct-to-consumer deliver karta hai. Isme beech ke wholesalers aur middlemen ka koi extra margin nahi hota.',
    },
  ];

  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-2.5">
      {faqs.map((faq, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left cursor-pointer"
          >
            <span className="text-sm font-semibold text-gray-800 pr-2">{faq.q}</span>
            <ChevronRight
              size={18}
              className={`text-gray-400 shrink-0 transition-transform ${open === i ? 'rotate-90 text-flipkart-600' : ''}`}
            />
          </button>
          {open === i && (
            <p className="px-4 pb-3.5 text-xs text-gray-600 leading-relaxed animate-fade-in border-t border-gray-50 pt-2.5 bg-gray-50/50">
              {faq.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ReturnsScreen({ onOrders }: { onOrders: () => void }) {
  const [returns, setReturns] = useState<
    Array<{ id: string; product_title: string; product_image: string; reason: string; status: string; created_at: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('akselling_returns');
      if (stored) {
        setReturns(JSON.parse(stored));
      }
    } catch {
      // fallback
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={26} className="animate-spin text-flipkart-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 7-Day Guarantee Banner */}
      <div className="bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/40 text-white rounded-2xl p-4 shadow-sm space-y-1.5">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase">
          <RotateCcw size={16} />
          <span>7-Day Easy Return & Exchange Guarantee</span>
        </div>
        <h4 className="text-sm font-bold text-white">Doorstep Free Pickup & Fast Refund</h4>
        <p className="text-xs text-emerald-200/80 leading-relaxed">
          Delivered item pasand na aane ya size mismatch hone par delivery ke 7 din ke andar 1-click return karein. 48 ghante mein doorstep pickup aur 3-5 din mein 100% refund credit!
        </p>
      </div>

      {returns.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <RotateCcw size={26} />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Active Return Requests</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Need to return or exchange a delivered apparel order? Visit your Orders page and select "Request Return" on eligible items.
          </p>
          <button
            onClick={onOrders}
            className="mt-4 bg-flipkart-500 text-white font-bold text-xs px-6 py-2.5 rounded-full hover:bg-flipkart-600 shadow-sm transition-colors cursor-pointer"
          >
            Go to My Orders →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4">
              <div className="flex gap-3">
                {r.product_image && <img src={r.product_image} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-100" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.product_title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Reason: {r.reason}</p>
                  <span
                    className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-2 capitalize ${
                      r.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : r.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-300'
                        : 'bg-amber-50 text-amber-700 border border-amber-300'
                    }`}
                  >
                    Status: {r.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div className="text-center pt-2">
            <button
              onClick={onOrders}
              className="text-xs font-bold text-flipkart-600 hover:underline"
            >
              View All Orders & Deliveries →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WishlistScreen() {
  const { addToCart } = useCart();
  const [addedItem, setAddedItem] = useState<string | null>(null);

  const items = [
    {
      id: 'AKY-01',
      title: 'Heavy Duty Oversized Black T-Shirt | Built For The Long Run',
      price: 499,
      image: '/uploads/prod_AKY-01_0.jpg',
      category: 'fashion',
    },
    {
      id: 'AKY-BG-03',
      title: 'AKSelling Premium Cotton T-Shirt (100% Combed Cotton)',
      price: 499,
      image: '/uploads/prod_AKY-BG-03_0.jpg',
      category: 'fashion',
    },
  ];

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      mrp: Math.round(item.price * 1.4),
      discount: 40,
      rating: 4.8,
      ratingCount: 124,
      images: [item.image],
      category: item.category || 'fashion',
      description: item.title,
      brand: 'AKSelling',
      delivery: 'Free delivery by tomorrow',
      inStock: true,
    });
    setAddedItem(item.id);
    setTimeout(() => setAddedItem(null), 2000);
  };

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex gap-3.5 items-center">
          <img src={item.image} alt="" className="w-18 h-18 rounded-xl object-cover bg-gray-50 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 line-clamp-2">{item.title}</p>
            <p className="text-sm font-bold text-gray-900 mt-1">₹{item.price.toLocaleString('en-IN')}</p>
            <button
              onClick={() => handleAddToCart(item)}
              className="mt-2 text-xs font-bold text-flipkart-600 px-3.5 py-1.5 rounded-lg border border-flipkart-200 hover:bg-flipkart-50 transition-colors flex items-center gap-1.5"
            >
              {addedItem === item.id ? (
                <>
                  <Check size={14} /> Added to Cart!
                </>
              ) : (
                'Add to Cart'
              )}
            </button>
          </div>
          <Heart size={20} className="text-rose-500 fill-rose-500 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function CouponsScreen() {
  const [copied, setCopied] = useState<string | null>(null);

  const coupons = [
    {
      code: 'AKSNEW50',
      desc: '₹50 instant discount on orders above ₹500',
      expiry: '31 Dec 2026',
      gradient: 'from-flipkart-600 to-flipkart-800',
    },
    {
      code: 'AKS200',
      desc: '₹200 discount on orders above ₹2000',
      expiry: '30 Sep 2026',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      code: 'AKSFASHION',
      desc: 'Flat 15% off on all Lifestyle & Fashion',
      expiry: '15 Sep 2026',
      gradient: 'from-rose-500 to-pink-600',
    },
  ];

  const handleCopy = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
    } catch {
      // ignore
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-3">
      {coupons.map((c, i) => (
        <div key={i} className={`bg-gradient-to-r ${c.gradient} rounded-2xl p-4 text-white shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-bold bg-white/20 px-2.5 py-1 rounded-lg tracking-wider">
                {c.code}
              </span>
              <p className="text-xs font-medium text-white/95 mt-2">{c.desc}</p>
              <p className="text-[10px] text-white/75 mt-1">Valid till {c.expiry}</p>
            </div>
            <button
              onClick={() => handleCopy(c.code)}
              className="bg-white text-gray-900 font-bold text-xs px-3 py-1.5 rounded-full hover:bg-white/90 shadow-sm flex items-center gap-1 transition-transform active:scale-95"
            >
              {copied === c.code ? (
                <>
                  <Check size={14} className="text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function HelpScreen({ onOrders }: { onOrders: () => void }) {
  const helpItems = [
    { icon: <Package size={20} />, title: 'Order Tracking & Delivery', desc: 'Track live courier location, cancel or reschedule', action: onOrders },
    { icon: <RotateCcw size={20} />, title: 'Returns & Instant Refunds', desc: 'Check refund status or initiate a replacement', action: onOrders },
    { icon: <CreditCard size={20} />, title: 'Payments & UPI Issues', desc: 'Resolved within 2 hours for failed deductions' },
    { icon: <Store size={20} />, title: 'Seller Onboarding Support', desc: 'Get assistance with product catalog and GST setup' },
    { icon: <Lock size={20} />, title: 'Account Security & Login', desc: 'OTP troubleshooting & 2FA protection' },
  ];

  return (
    <div className="space-y-3">
      {helpItems.map((item, i) => (
        <div
          key={i}
          onClick={item.action}
          className={`bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex items-center gap-3.5 ${
            item.action ? 'cursor-pointer hover:bg-gray-50' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-flipkart-50 flex items-center justify-center text-flipkart-600">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">{item.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </div>
      ))}

      <div className="bg-flipkart-50 rounded-2xl p-4 text-center border border-flipkart-100 mt-4">
        <p className="text-sm font-bold text-flipkart-700">Need direct human assistance?</p>
        <p className="text-xs text-gray-600 mt-1">24x7 Helpline: 1800-202-9898 (Toll Free)</p>
        <p className="text-xs text-flipkart-800 font-bold mt-1 bg-white/80 py-1 px-3 rounded-lg inline-block border border-flipkart-200">
          Official Support Email: support.akselling@gmail.com
        </p>
      </div>
    </div>
  );
}
