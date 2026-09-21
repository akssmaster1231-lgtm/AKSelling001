import { Home, Grid3x3, Flame, User, ShoppingCart } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/auth-context';

export type TabId = 'home' | 'categories' | 'deals' | 'cart' | 'account';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  cartCount: number;
}

export default function BottomNav({ activeTab, onTabChange, cartCount }: BottomNavProps) {
  const { t } = useI18n();
  const { user } = useAuth();

  const tabs: { id: TabId; label: string; icon: typeof Home; badge?: string }[] = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'categories', label: t('categories'), icon: Grid3x3 },
    { id: 'deals', label: t('bestDeals') || 'Best Deals', icon: Flame, badge: 'HOT' },
    { id: 'cart', label: t('cart'), icon: ShoppingCart },
    { id: 'account', label: user?.name ? (user.name.split(' ')[0] || t('account')) : t('account'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-3px_12px_rgba(15,23,42,0.08)] overflow-hidden">
      <div className="flex items-stretch justify-around w-full px-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDeals = tab.id === 'deals';
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 flex-1 min-w-0 transition-colors cursor-pointer ${
                isActive
                  ? isDeals ? 'text-amber-600 font-bold' : 'text-[#1b365d] font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {tab.id === 'account' && user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'Account'}
                    className={`w-5 h-5 rounded-full object-cover border transition-all ${
                      isActive ? 'border-amber-500 ring-2 ring-amber-200 scale-105' : 'border-slate-300'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-all ${
                      isDeals && isActive
                        ? 'text-amber-500 fill-amber-400'
                        : isActive
                        ? 'text-[#1b365d]'
                        : 'text-slate-500'
                    }`}
                  />
                )}
                {isDeals && (
                  <span className="absolute -top-1.5 -right-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 text-[8px] font-black px-1 py-0.2 rounded-full uppercase tracking-tight shadow-xs ring-1 ring-white">
                    HOT
                  </span>
                )}
                {tab.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 shadow-xs ring-1 ring-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] truncate max-w-[62px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className={`absolute top-0 h-0.5 w-6 rounded-full ${
                  isDeals ? 'bg-amber-500' : 'bg-[#1b365d]'
                }`} />
              )}
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
