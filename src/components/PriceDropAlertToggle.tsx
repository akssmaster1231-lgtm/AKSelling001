import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellRing,
  Check,
  Mail,
  Smartphone,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingDown,
  Send,
  Loader2,
} from 'lucide-react';
import type { Product, PriceAlert } from '@/types';
import { formatPrice } from '@/data';
import { useAuth } from '@/auth-context';
import {
  savePriceAlertToFirestore,
  removePriceAlertFromFirestore,
  getUserPriceAlertForProduct,
} from '@/firebase';

interface PriceDropAlertToggleProps {
  product: Product;
}

export default function PriceDropAlertToggle({ product }: PriceDropAlertToggleProps) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<PriceAlert | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [targetMode, setTargetMode] = useState<'any' | 'custom'>('any');
  const [customTargetPrice, setCustomTargetPrice] = useState<string>(
    String(Math.max(1, Math.round(product.price * 0.9)))
  );

  // UI feedback states
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [testingAlert, setTestingAlert] = useState(false);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  }, []);

  // Hydrate initial alert state from Firestore & LocalStorage
  useEffect(() => {
    let mounted = true;
    async function loadAlert() {
      setLoading(true);
      try {
        const existing = await getUserPriceAlertForProduct(
          product.id,
          user?.id,
          user?.email
        );

        if (mounted && existing && existing.active) {
          setIsActive(true);
          setCurrentAlert(existing);
          if (existing.notifyEmail) setEmail(existing.notifyEmail);
          if (typeof existing.notifyPush === 'boolean') setPushEnabled(existing.notifyPush);
          if (typeof existing.notifyEmailPref === 'boolean') setEmailEnabled(existing.notifyEmailPref);
          if (existing.targetPrice && existing.targetPrice < product.price) {
            setTargetMode('custom');
            setCustomTargetPrice(String(existing.targetPrice));
          }
        } else if (mounted) {
          // Default prefill from user profile
          if (user?.email) setEmail(user.email);
        }
      } catch (err) {
        console.warn('Error loading price alert:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAlert();

    return () => {
      mounted = false;
    };
  }, [product.id, product.price, user?.id, user?.email]);

  // Request browser push notification permission
  const requestPushPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } catch {
      return false;
    }
  };

  // Dispatch a local browser notification
  const fireLocalBrowserNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: product.images?.[0] || '/favicon.ico',
          badge: '/favicon.ico',
        });
      } catch {
        // Fallback for environments with strict worker constraints
      }
    }
  };

  // Main Toggle Handler
  const handleToggle = async () => {
    if (loading || saving) return;

    if (isActive) {
      // TURN OFF
      setSaving(true);
      try {
        const alertId = currentAlert?.id || `alert_${product.id}_${user?.id || 'guest'}`;
        await removePriceAlertFromFirestore(alertId, product.id);
        setIsActive(false);
        setCurrentAlert(null);
        setShowConfig(false);
        showToast('Price drop alert turned off for this item.', 'info');
      } catch (err) {
        console.error('Failed to disable price alert:', err);
        showToast('Could not turn off price alert. Please try again.', 'error');
      } finally {
        setSaving(false);
      }
    } else {
      // TURN ON
      // If user hasn't provided an email and wants email, open config to prompt
      const targetEmail = email.trim() || user?.email || '';
      if (!targetEmail && emailEnabled) {
        setShowConfig(true);
        setIsActive(true); // Tentative active
        return;
      }

      await applySaveAlert(targetEmail, pushEnabled, emailEnabled, targetMode, customTargetPrice);
    }
  };

  // Save/Update Alert to Firestore
  const applySaveAlert = async (
    targetEmail: string,
    push: boolean,
    mailPref: boolean,
    mode: 'any' | 'custom',
    targetPriceStr: string
  ) => {
    setSaving(true);
    try {
      let isPushGranted = false;
      if (push) {
        isPushGranted = await requestPushPermission();
      }

      const parsedTarget =
        mode === 'custom' && Number(targetPriceStr) > 0 ? Number(targetPriceStr) : undefined;

      const alertId = currentAlert?.id || `alert_${product.id}_${user?.id || 'guest'}`;
      const alertPayload: PriceAlert = {
        id: alertId,
        userId: user?.id || 'guest',
        productId: product.id,
        productTitle: product.title,
        productImage: product.images?.[0] || '',
        initialPrice: product.price,
        currentPrice: product.price,
        targetPrice: parsedTarget,
        notifyEmail: targetEmail || undefined,
        notifyPush: push,
        notifyEmailPref: mailPref,
        active: true,
        createdAt: currentAlert?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await savePriceAlertToFirestore(alertPayload);
      setIsActive(true);
      setCurrentAlert(alertPayload);
      setShowConfig(false);

      if (isPushGranted) {
        fireLocalBrowserNotification(
          'Price Drop Alert Active! 🔔',
          `We'll notify you the moment ${product.title.slice(0, 30)}... drops below ${formatPrice(
            parsedTarget || product.price
          )}!`
        );
      }

      showToast(
        `Subscribed! You will receive ${[
          push ? 'Push Notifications' : '',
          mailPref && targetEmail ? `Emails to ${targetEmail}` : '',
        ]
          .filter(Boolean)
          .join(' & ')} when price drops!`,
        'success'
      );
    } catch (err) {
      console.error('Failed to save price alert:', err);
      showToast('Could not save price drop alert. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Test Price Drop Alert simulation
  const handleTestAlert = async () => {
    if (testingAlert) return;
    setTestingAlert(true);
    const testSimulatedPrice = Math.max(1, Math.round(product.price * 0.85)); // 15% drop

    try {
      // 1. Fire local push notification immediately
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          fireLocalBrowserNotification(
            `📉 Price Drop: ${product.title}`,
            `Just dropped from ${formatPrice(product.price)} to ${formatPrice(testSimulatedPrice)}! Tap to buy now.`
          );
        } else {
          await requestPushPermission();
        }
      }

      // 2. Call backend price-alerts API for email & push log
      const targetEmail = email.trim() || user?.email || undefined;
      const res = await fetch('/api/price-alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          productImage: product.images?.[0] || '',
          oldPrice: product.price,
          newPrice: testSimulatedPrice,
          email: targetEmail,
          isTest: true,
        }),
      });

      const data = await res.json();
      if (data.email_sent) {
        showToast(`🎉 Test alert sent! Push triggered and test email delivered to ${targetEmail}.`, 'success');
      } else {
        showToast(
          `🎉 Test alert simulated! Push triggered for ${formatPrice(testSimulatedPrice)} (₹${
            product.price - testSimulatedPrice
          } drop).`,
          'success'
        );
      }
    } catch (err) {
      console.warn('Test alert notice:', err);
      showToast('Simulated notification triggered locally!', 'info');
    } finally {
      setTestingAlert(false);
    }
  };

  return (
    <div className="mt-3 bg-gradient-to-r from-amber-50/70 via-blue-50/40 to-indigo-50/50 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm transition-all duration-200">
      {/* Top Banner & Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isActive
                ? 'bg-flipkart-600 text-white shadow-md shadow-flipkart-200'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            {isActive ? (
              <BellRing size={18} className="animate-wiggle" />
            ) : (
              <Bell size={18} className="text-gray-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                Notify me of price drops
              </span>
              {isActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">
              {isActive
                ? `Alerting on ${
                    currentAlert?.targetPrice
                      ? `drop below ${formatPrice(currentAlert.targetPrice)}`
                      : 'any price reduction'
                  } via ${[
                    currentAlert?.notifyPush ? 'Push' : '',
                    currentAlert?.notifyEmailPref && currentAlert?.notifyEmail ? 'Email' : '',
                  ]
                    .filter(Boolean)
                    .join(' & ')}`
                : `Get instant push or email updates whenever this item drops below ${formatPrice(
                    product.price
                  )}`}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            disabled={loading || saving}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-flipkart-500 focus:ring-offset-2 ${
              isActive ? 'bg-flipkart-600' : 'bg-gray-300'
            } ${loading || saving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span className="sr-only">Notify me of price drops</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Action shortcuts when active */}
      {isActive && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-flipkart-700 hover:text-flipkart-800 font-semibold flex items-center gap-1 hover:underline py-1"
          >
            {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showConfig ? 'Hide Alert Preferences' : 'Customize Target Price & Channels'}
          </button>

          <button
            type="button"
            disabled={testingAlert}
            onClick={handleTestAlert}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 active:scale-95 shadow-2xs transition-all"
            title="Simulate price reduction notification"
          >
            {testingAlert ? (
              <Loader2 size={12} className="animate-spin text-flipkart-600" />
            ) : (
              <Sparkles size={12} className="text-amber-500" />
            )}
            Test Alert
          </button>
        </div>
      )}

      {/* Expandable Preferences / Setup Drawer */}
      {showConfig && (
        <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm animate-fade-in space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <TrendingDown size={14} className="text-flipkart-600" />
              Configure Price Drop Settings
            </span>
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={14} />
            </button>
          </div>

          {/* Target Price Strategy */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
              When should we notify you?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetMode('any')}
                className={`text-left p-2 rounded-lg border text-xs transition-all ${
                  targetMode === 'any'
                    ? 'border-flipkart-600 bg-flipkart-50/50 text-flipkart-900 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Any Price Drop</span>
                  {targetMode === 'any' && <Check size={14} className="text-flipkart-600" />}
                </div>
                <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                  Alert on any drop below {formatPrice(product.price)}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTargetMode('custom')}
                className={`text-left p-2 rounded-lg border text-xs transition-all ${
                  targetMode === 'custom'
                    ? 'border-flipkart-600 bg-flipkart-50/50 text-flipkart-900 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Custom Target</span>
                  {targetMode === 'custom' && <Check size={14} className="text-flipkart-600" />}
                </div>
                <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                  Only alert if price reaches target
                </p>
              </button>
            </div>

            {targetMode === 'custom' && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Alert if price drops to: ₹</span>
                <input
                  type="number"
                  min={1}
                  max={product.price - 1}
                  value={customTargetPrice}
                  onChange={e => setCustomTargetPrice(e.target.value)}
                  className="w-28 px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-lg focus:ring-1 focus:ring-flipkart-500 focus:outline-none"
                  placeholder="e.g. 499"
                />
                <span className="text-[11px] text-emerald-600 font-bold">
                  ({Math.round(((product.price - Number(customTargetPrice || 0)) / product.price) * 100)}% drop)
                </span>
              </div>
            )}
          </div>

          {/* Delivery Channels */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
              Notification Channels
            </label>
            <div className="space-y-2">
              {/* Push Notifications Toggle */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Smartphone size={15} className="text-flipkart-600" />
                  <div>
                    <span className="text-xs font-semibold text-gray-800 block">
                      Browser & Mobile Push
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Instant notifications on this device
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={e => setPushEnabled(e.target.checked)}
                  className="rounded text-flipkart-600 focus:ring-flipkart-500 h-4 w-4"
                />
              </label>

              {/* Email Notifications Toggle */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Mail size={15} className="text-emerald-600" />
                  <div>
                    <span className="text-xs font-semibold text-gray-800 block">
                      Email Updates
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Detailed alerts with price breakdown & direct buy links
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={e => setEmailEnabled(e.target.checked)}
                  className="rounded text-flipkart-600 focus:ring-flipkart-500 h-4 w-4"
                />
              </label>

              {/* Email Input Field */}
              {emailEnabled && (
                <div className="pl-6 pt-1">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email for price updates"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-flipkart-500"
                  />
                  {!email && (
                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> Please enter an email to receive price drop notifications.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="px-3 py-1.5 text-xs text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || (emailEnabled && !email.trim())}
              onClick={() =>
                applySaveAlert(
                  email.trim() || user?.email || '',
                  pushEnabled,
                  emailEnabled,
                  targetMode,
                  customTargetPrice
                )
              }
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-flipkart-600 hover:bg-flipkart-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Floating Status Toast / Notice */}
      {feedbackMsg && (
        <div
          className={`mt-2.5 p-2 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedbackMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <Check size={14} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={14} className="shrink-0" />
          )}
          <span className="font-medium text-[11px] sm:text-xs leading-snug">{feedbackMsg.text}</span>
        </div>
      )}
    </div>
  );
}
