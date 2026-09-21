import { Sparkles, X, ArrowRight, Package } from 'lucide-react';
import { useNotifications } from '@/notification-context';
import { formatPrice } from '@/data';

interface NotificationToastBannerProps {
  onOpenProduct: (productId: string) => void;
}

export default function NotificationToastBanner({
  onOpenProduct,
}: NotificationToastBannerProps) {
  const { activeToast, dismissToast, markAsRead } = useNotifications();

  if (!activeToast) return null;

  const handleClick = () => {
    markAsRead(activeToast.id);
    if (activeToast.productId) {
      onOpenProduct(activeToast.productId);
    }
    dismissToast();
  };

  return (
    <div
      id="live-notification-toast"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[999] w-[92%] max-w-md animate-slide-down"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-amber-400/40 flex items-center gap-3">
        {/* Thumbnail Image */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-amber-400/30 relative">
          {activeToast.productImage ? (
            <img
              src={activeToast.productImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-300">
              <Package size={22} />
            </div>
          )}
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/70 border border-amber-500/40 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <Sparkles size={10} className="text-amber-400" />
              New Catalog
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Just now</span>
          </div>

          <h4 className="text-xs font-bold text-white truncate mt-0.5">
            {activeToast.productTitle || activeToast.title}
          </h4>

          <div className="flex items-center gap-2 mt-0.5">
            {typeof activeToast.productPrice === 'number' && activeToast.productPrice > 0 && (
              <span className="text-xs font-black text-amber-300">
                {formatPrice(activeToast.productPrice)}
              </span>
            )}
            <span className="text-[10px] text-slate-300 flex items-center gap-0.5 font-semibold hover:text-amber-300">
              View Item <ArrowRight size={10} />
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={dismissToast}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
