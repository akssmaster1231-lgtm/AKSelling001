import { useState, useEffect } from 'react';
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
  Eye,
  RotateCcw,
  Loader2,
  Copy,
  CheckCircle2,
  Phone,
  Mail,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, type AddressEntry, type CardEntry } from '@/auth-context';
import { useCart } from '@/cart-context';
import { useI18n, type Language } from '@/i18n';
import { getCleanSellerStoreName } from '@/utils/storageHelper';

interface AccountPageProps {
  onLogout: () => void;
  onLogin: () => void;
  onSellOnAKSelling: () => void;
  onSellerDashboard: () => void;
  onOrders: () => void;
  onAdminPanel: () => void;
  onSwitchToSeller?: () => void;
}

type SubScreen =
  | null
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

      {/* Account Settings Section */}
      <Section title="Account Settings">
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

          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
            <button
              onClick={onAdminPanel}
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
                  </div>
                  <p className="text-[11px] text-gray-500">Sellers & KYC logs • Order management • Platform oversight</p>
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
    <div className="fixed inset-0 z-[65] bg-gray-50 overflow-y-auto animate-fade-in flex flex-col">
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
      className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
    >
      <span className="text-gray-500 shrink-0">{icon}</span>
      <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
      {value && <span className="text-xs font-medium text-gray-400">{value}</span>}
      <ChevronRight size={17} className="text-gray-300 shrink-0" />
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
  const [selected, setSelected] = useState(language || profile.language || 'English');

  const handleSelect = async (lang: string) => {
    setSelected(lang);
    setLanguage(lang as Language);
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
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [offers, setOffers] = useState(true);
  const [recommendations, setRecommendations] = useState(false);

  const toggleMain = async () => {
    const newVal = !enabled;
    setEnabled(newVal);
    await updateProfile({ notificationEnabled: newVal });
  };

  return (
    <div className="space-y-3">
      <InfoCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800">Push Notifications</p>
            <p className="text-xs text-gray-500">Enable all alerts and notifications</p>
          </div>
          <ToggleSwitch checked={enabled} onChange={toggleMain} />
        </div>
      </InfoCard>
      {enabled && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Order Updates</p>
              <p className="text-xs text-gray-400">Live delivery tracking & dispatch alerts</p>
            </div>
            <ToggleSwitch checked={orderUpdates} onChange={() => setOrderUpdates(!orderUpdates)} />
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Offers & Flash Deals</p>
              <p className="text-xs text-gray-400">Price drop alerts and seasonal sales</p>
            </div>
            <ToggleSwitch checked={offers} onChange={() => setOffers(!offers)} />
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Recommendations</p>
              <p className="text-xs text-gray-400">Personalized product picks for you</p>
            </div>
            <ToggleSwitch checked={recommendations} onChange={() => setRecommendations(!recommendations)} />
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
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-flipkart-500' : 'bg-gray-300'}`}
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
  const items = [
    { icon: <Lock size={18} />, title: 'Data Privacy & Encryption', desc: 'Manage stored telemetry and token preferences' },
    { icon: <Eye size={18} />, title: 'Ad Preferences', desc: 'Control personalized suggestions and tracking' },
    { icon: <Shield size={18} />, title: 'Account Security', desc: 'Secure OTP-based login and session tokens' },
    { icon: <FileText size={18} />, title: 'Download Account Data', desc: 'Request an export of your order history' },
  ];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex items-center gap-3.5">
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
    </div>
  );
}

function ReviewsScreen() {
  const reviews = [
    {
      product: 'Premium Wireless Headphones ANC',
      rating: 5,
      text: 'Superb sound stage, battery lasts over 30 hours! Fast delivery from AKSelling.',
      date: '12 Aug 2026',
    },
    {
      product: 'Pro Runner Sneaker Men',
      rating: 4,
      text: 'Lightweight and very comfortable for marathon prep. True to size.',
      date: '5 Aug 2026',
    },
  ];
  return (
    <div className="space-y-3">
      {reviews.map((r, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4">
          <p className="text-sm font-bold text-gray-800">{r.product}</p>
          <div className="flex items-center gap-1 mt-1.5">
            {[1, 2, 3, 4, 5].map(n => (
              <Star
                key={n}
                size={14}
                className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
              />
            ))}
            <span className="text-xs text-gray-400 ml-2">{r.date}</span>
          </div>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">{r.text}</p>
        </div>
      ))}
    </div>
  );
}

function QAScreen() {
  const qas = [
    {
      q: 'Is this Bluetooth headphone compatible with iPhone and Android?',
      a: 'Yes, it supports universal Bluetooth 5.3 with AAC and SBC codecs across iOS & Android.',
      product: 'Premium Wireless Headphones ANC',
    },
    {
      q: 'Does this watch have official brand warranty in India?',
      a: 'Yes, all electronic purchases come with 1-Year National Brand Warranty.',
      product: 'Luxury Automatic Chronograph Watch',
    },
  ];
  return (
    <div className="space-y-3">
      {qas.map((qa, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4">
          <span className="text-[10px] font-bold text-flipkart-600 bg-flipkart-50 px-2 py-0.5 rounded-full">
            {qa.product}
          </span>
          <p className="text-sm font-semibold text-gray-800 mt-2">Q: {qa.q}</p>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            A: {qa.a}
          </p>
        </div>
      ))}
    </div>
  );
}

function TermsScreen() {
  return (
    <InfoCard>
      <h3 className="text-base font-bold text-gray-800 mb-2">Terms of Service</h3>
      <div className="text-xs text-gray-600 leading-relaxed space-y-3">
        <p>
          Welcome to AKSelling India. By using our platform, you accept our standard terms of use, fair pricing policies, and consumer protection protocols.
        </p>
        <p>
          All products sold on AKSelling are genuine and backed by verified sellers. We ensure standard 7-day return policies on eligible orders and fast dispute resolution.
        </p>
        <p>
          Transactions are secured via industry standard 256-bit encryption. For any support or inquiries, our 24/7 customer support team is at your service.
        </p>
      </div>
    </InfoCard>
  );
}

function PoliciesScreen() {
  const policies = [
    { title: 'Return & Refund Policy', desc: '7-day easy return window with full instant refunds' },
    { title: 'Privacy Policy', desc: 'Zero data reselling; strict security for payment details' },
    { title: 'Shipping & Delivery', desc: 'Free express shipping on eligible Plus orders' },
    { title: 'Seller Fair Play Agreement', desc: 'Rules for authentic products & accurate listings' },
    { title: 'GST & Regulatory Compliance', desc: 'All invoices include certified GST billing' },
  ];
  return (
    <div className="space-y-3">
      {policies.map((p, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex items-center gap-3.5">
          <FileText size={20} className="text-flipkart-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">{p.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function FAQsScreen() {
  const faqs = [
    { q: 'How do I track my order?', a: 'Go to Account > Orders to view real-time tracking, courier dispatch, and expected delivery date.' },
    { q: 'What is the return policy on AKSelling?', a: 'You can easily request a return within 7 days of delivery directly from the Orders section.' },
    { q: 'How can I pay for my purchase?', a: 'We support UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery.' },
    { q: 'How do I start selling as a vendor?', a: 'Tap "Sell on AKSelling" in your Account page, fill your GST/PAN details, and start listing products in minutes.' },
    { q: 'How do I apply coupon codes?', a: 'Browse My Coupons, tap Copy Code, and paste it at the checkout summary screen to get instant discounts.' },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2.5">
      {faqs.map((faq, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          >
            <span className="text-sm font-semibold text-gray-800">{faq.q}</span>
            <ChevronRight
              size={18}
              className={`text-gray-400 transition-transform ${open === i ? 'rotate-90 text-flipkart-600' : ''}`}
            />
          </button>
          {open === i && (
            <p className="px-4 pb-3.5 text-xs text-gray-600 leading-relaxed animate-fade-in border-t border-gray-50 pt-2">
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

  if (returns.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-flipkart-50 text-flipkart-600 flex items-center justify-center mx-auto mb-3">
          <RotateCcw size={26} />
        </div>
        <h3 className="text-base font-bold text-gray-800">No Return Requests</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          Need to return a delivered product? Visit your Orders page and select "Request Return" on eligible items.
        </p>
        <button
          onClick={onOrders}
          className="mt-4 bg-flipkart-500 text-white font-bold text-xs px-5 py-2.5 rounded-full hover:bg-flipkart-600 shadow-sm transition-colors"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {returns.map(r => (
        <div key={r.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4">
          <div className="flex gap-3">
            {r.product_image && <img src={r.product_image} alt="" className="w-14 h-14 rounded-xl object-cover" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{r.product_title}</p>
              <p className="text-xs text-gray-400 mt-0.5">Reason: {r.reason}</p>
              <span
                className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-2 capitalize ${
                  r.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-600'
                    : r.status === 'rejected'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                Status: {r.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WishlistScreen() {
  const { addToCart } = useCart();
  const [addedItem, setAddedItem] = useState<string | null>(null);

  const items = [
    {
      id: 'wish_1',
      title: 'Luxury Automatic Chronograph Watch',
      price: 8999,
      image: 'https://images.pexels.com/photos/30077330/pexels-photo-30077330.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    },
    {
      id: 'wish_2',
      title: 'GlowRadiance Skincare Set',
      price: 999,
      image: 'https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    },
  ];

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      originalPrice: item.price * 1.4,
      discount: '40% OFF',
      rating: 4.8,
      reviewsCount: 124,
      images: [item.image],
      category: 'Electronics',
      description: item.title,
      highlights: ['Premium Quality', 'Express Delivery'],
      inStock: true,
      stockCount: 10,
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
