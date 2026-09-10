import { Home, Play, Grid3x3, User, ShoppingCart } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/auth-context';

export type TabId = 'home' | 'play' | 'categories' | 'account' | 'cart';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  cartCount: number;
}

export default function BottomNav({ activeTab, onTabChange, cartCount }: BottomNavProps) {
  const { t } = useI18n();
  const { user } = useAuth();

  const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'play', label: t('play'), icon: Play },
    { id: 'categories', label: t('categories'), icon: Grid3x3 },
    { id: 'account', label: user?.name ? (user.name.split(' ')[0] || t('account')) : t('account'), icon: User },
    { id: 'cart', label: t('cart'), icon: ShoppingCart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full z-50 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch justify-around w-full px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 flex-1 transition-colors ${
                isActive ? 'text-flipkart-500' : 'text-gray-500'
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
                    className="transition-all"
                  />
                )}
                {tab.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-accent-400 text-flipkart-900 text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 shadow-xs ring-1 ring-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] truncate max-w-[58px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 h-0.5 w-6 bg-flipkart-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
