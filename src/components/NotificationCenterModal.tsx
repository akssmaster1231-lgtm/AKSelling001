import { useState } from 'react';
import {
  Bell,
  X,
  Sparkles,
  CheckCheck,
  Package,
  ArrowRight,
  Send,
  Volume2,
  Trash2,
} from 'lucide-react';
import { useNotifications } from '@/notification-context';
import { formatPrice } from '@/data';
import type { AppNotification } from '@/types/notification';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProduct: (productId: string) => void;
}

export default function NotificationCenterModal({
  isOpen,
  onClose,
  onOpenProduct,
}: NotificationCenterModalProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    isPushSupported,
    isPushGranted,
    requestPushPermission,
    playChime,
    triggerTestCatalogNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'catalogs' | 'other'>('all');
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'catalogs') return n.type === 'NEW_CATALOG';
    if (filter === 'other') return n.type !== 'NEW_CATALOG';
    return true;
  });

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.productId) {
      onOpenProduct(item.productId);
      onClose();
    }
  };

  const handleTestSend = async () => {
    setTesting(true);
    try {
      await triggerTestCatalogNotification();
    } finally {
      setTimeout(() => setTesting(false), 800);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#1b365d] to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Notification Radar</h2>
                {unreadCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">Live catalog & product alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={playChime}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Test chime sound"
              aria-label="Test chime sound"
            >
              <Volume2 size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Browser Push Permission Banner */}
        {isPushSupported && !isPushGranted && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
              </span>
              <p className="text-xs font-semibold text-amber-900">
                Receive instant phone/desktop notifications when new catalogs upload
              </p>
            </div>
            <button
              type="button"
              onClick={requestPushPermission}
              className="shrink-0 bg-[#1b365d] hover:bg-slate-900 text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Enable
            </button>
          </div>
        )}

        {/* Action Controls & Filter Chips */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#1b365d] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('catalogs')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filter === 'catalogs'
                  ? 'bg-[#1b365d] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Catalogs ({notifications.filter((n) => n.type === 'NEW_CATALOG').length})
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[#1b365d] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                title="Clear all"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Bell size={26} />
              </div>
              <p className="text-sm font-bold text-slate-700">No notifications yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Whenever you or any seller uploads a new product or catalog, live alerts will broadcast here in real time!
              </p>

              <button
                type="button"
                onClick={handleTestSend}
                disabled={testing}
                className="mt-5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send size={13} />
                <span>{testing ? 'Broadcasting...' : 'Simulate New Catalog Upload'}</span>
              </button>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isCatalog = notif.type === 'NEW_CATALOG';
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex gap-3 ${
                    notif.read
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-amber-50/40 border-amber-300/80 shadow-2xs hover:bg-amber-50/70'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                    {notif.productImage ? (
                      <img
                        src={notif.productImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package size={20} />
                      </div>
                    )}
                    {!notif.read && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
                        {isCatalog && <Sparkles size={11} className="text-amber-600" />}
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
                      {notif.productTitle || notif.message}
                    </p>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80">
                      {typeof notif.productPrice === 'number' && notif.productPrice > 0 ? (
                        <span className="text-xs font-black text-[#1b365d]">
                          {formatPrice(notif.productPrice)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {notif.category || 'Catalog item'}
                        </span>
                      )}

                      {notif.productId && (
                        <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 hover:text-amber-800">
                          View Catalog <ArrowRight size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Testing Tool */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <p className="text-[11px] text-slate-500 font-medium">
            Broadcast radar active for all app users
          </p>
          <button
            type="button"
            onClick={handleTestSend}
            disabled={testing}
            className="text-[11px] font-bold text-[#1b365d] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Send size={11} />
            <span>{testing ? 'Sending...' : 'Test Upload Alert'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
