import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AppNotification } from '@/types/notification';
import {
  subscribeNotifications,
  broadcastNewCatalogNotification,
  type FirestoreProduct,
} from '@/firebase';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  activeToast: AppNotification | null;
  isPushSupported: boolean;
  isPushGranted: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  dismissToast: () => void;
  requestPushPermission: () => Promise<boolean>;
  playChime: () => void;
  triggerTestCatalogNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const READ_IDS_KEY = 'akselling_read_notification_ids';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(READ_IDS_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  });
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushGranted, setIsPushGranted] = useState(false);

  // Play synthetic two-tone chime via Web Audio API safely
  const playChime = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Tone 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1);
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.38);

      // Automatically clean up AudioContext to prevent resource leaks
      setTimeout(() => {
        try {
          ctx.close().catch(() => {});
        } catch {
          // ignore
        }
      }, 500);
    } catch {
      // Audio playback safely caught
    }
  }, []);

  // Check browser notification support & status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && window.self === window.top) {
      try {
        setIsPushSupported(true);
        setIsPushGranted(Notification.permission === 'granted');
      } catch {
        // ignore
      }
    }
  }, []);

  // Request native browser Push permission
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      window.self !== window.top
    ) {
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      const granted = perm === 'granted';
      setIsPushGranted(granted);
      return granted;
    } catch {
      return false;
    }
  }, []);

  // Helper to fire native browser notification
  const fireNativeNotification = useCallback(
    (notif: AppNotification) => {
      if (
        typeof window === 'undefined' ||
        !('Notification' in window) ||
        window.self !== window.top
      )
        return;
      try {
        if (Notification.permission !== 'granted') return;

        const nativeNotification = new Notification(notif.title, {
          body: notif.message,
          icon: notif.productImage || '/favicon.ico',
          badge: '/favicon.ico',
          tag: notif.id,
        });

        nativeNotification.onclick = () => {
          try {
            window.focus();
            if (notif.productId) {
              window.dispatchEvent(
                new CustomEvent('akselling_open_product_id', { detail: notif.productId })
              );
            }
            nativeNotification.close();
          } catch {
            // ignore
          }
        };
      } catch {
        // ignore
      }
    },
    []
  );

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsubscribe = subscribeNotifications((list) => {
      setNotifications((prev) => {
        // Detect newly arrived notifications to pop toast & sound
        if (prev.length > 0 && list.length > 0) {
          const newest = list[0];
          const isBrandNew = !prev.some((p) => p.id === newest.id);
          if (isBrandNew) {
            setActiveToast(newest);
            playChime();
            fireNativeNotification(newest);
          }
        }
        return list;
      });
    });

    // Also listen to local in-memory notification events
    const handleNewNotifEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AppNotification>;
      if (customEvent.detail) {
        const notif = customEvent.detail;
        setActiveToast(notif);
        playChime();
        fireNativeNotification(notif);
      }
    };

    window.addEventListener('akselling_new_notification', handleNewNotifEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('akselling_new_notification', handleNewNotifEvent);
    };
  }, [playChime, fireNativeNotification]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Save readIds to localStorage
  const saveReadIds = useCallback((newSet: Set<string>) => {
    try {
      localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(newSet)));
    } catch {
      // ignore
    }
  }, []);

  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        saveReadIds(next);
        return next;
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [saveReadIds]
  );

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveReadIds(next);
      return next;
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications, saveReadIds]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem('akselling_app_notifications');
    } catch {
      // ignore
    }
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Trigger a test catalog notification (for testing & verification)
  const triggerTestCatalogNotification = useCallback(async () => {
    const sampleProduct: FirestoreProduct = {
      id: `prod_demo_${Date.now()}`,
      title: 'Premium Handloom Khadi Silk Kurta & Jacket Set',
      description: 'Handcrafted premium traditional ethnic festive collection.',
      price: 1299,
      mrp: 2499,
      discount: 48,
      category: 'ethnic',
      images: [
        'https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg?auto=compress&cs=tinysrgb&w=600',
      ],
      brand: 'AKSelling Luxury',
      rating: 4.9,
      ratingCount: 88,
      inStock: true,
      delivery: 'Express 2-Day Delivery',
    };

    await broadcastNewCatalogNotification(
      sampleProduct,
      '🎉 New Exclusive Catalog Uploaded: Premium Handloom Khadi Silk Kurta Set is now live in Ethnic Wear!'
    );
  }, []);

  // Compute unread count based on readIds set
  const unreadCount = notifications.filter(
    (n) => !n.read && !readIds.has(n.id)
  ).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        isPushSupported,
        isPushGranted,
        markAsRead,
        markAllAsRead,
        clearAll,
        dismissToast,
        requestPushPermission,
        playChime,
        triggerTestCatalogNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
