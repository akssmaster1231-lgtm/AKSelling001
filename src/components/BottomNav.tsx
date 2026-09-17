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
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full z-50 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch justify-around w-full px-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDeals = tab.id === 'deals';
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 flex-1 transition-colors cursor-pointer ${
                isActive
                  ? isDeals ? 'text-amber-600' : 'text-flipkart-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {tab.id === 'account' && user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'Account'}
                    className={`w-5 h-5 rounded-full object-cover border transition-all ${
                      isActive ? 'border-flipkart-500 ring-2 ring-flipkart-200 scale-105' : 'border-gray-300'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-all ${
                      isDeals && isActive ? 'text-amber-500 fill-amber-400' : ''
                    }`}
                  />
                )}
                {isDeals && (
                  <span className="absolute -top-1.5 -right-3 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[8px] font-black px-1 py-0.2 rounded-full uppercase tracking-tight shadow-2xs ring-1 ring-white">
                    HOT
                  </span>
                )}
                {tab.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-accent-400 text-flipkart-900 text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 shadow-xs ring-1 ring-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] truncate max-w-[62px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className={`absolute top-0 h-0.5 w-6 rounded-full ${
                  isDeals ? 'bg-amber-500' : 'bg-flipkart-500'
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
