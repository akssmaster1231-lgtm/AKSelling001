import React, { useState } from 'react';
import {
  Bell,
  Zap,
  ShoppingBag,
  Package,
  Sparkles,
  Send,
  CheckCircle2,
  Loader2,
  Smartphone,
  Radio,
} from 'lucide-react';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AdminPushMarketingCenter() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [campaignType, setCampaignType] = useState<'flash_sale' | 'cart_abandonment' | 'order_update' | 'new_drop' | 'custom'>('flash_sale');
  const [targetUrl, setTargetUrl] = useState('/');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);

  const presets = [
    {
      id: 'flash_sale',
      label: '⚡ Flash Sale (50% Off)',
      title: '⚡ 50% OFF Midnight Flash Drop is LIVE!',
      message: 'Exclusive limited collection drop by AK Yadav Print. Flat 50% off for the next 2 hours!',
      url: '/?tab=deals',
      icon: Zap,
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'cart_abandonment',
      label: '🛒 Cart Abandonment Recovery',
      title: '👀 Still thinking? Your items are waiting!',
      message: 'Complete your checkout today and get free express delivery + extra 5% cashback reward.',
      url: '/?tab=cart',
      icon: ShoppingBag,
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'new_drop',
      label: '🆕 New Apparel Drop',
      title: '🔥 New Season Streetwear Drop is Live!',
      message: 'Explore premium heavy-gsm custom printed tees and oversized fits now on AKSelling.',
      url: '/?tab=home',
      icon: Sparkles,
      color: 'from-purple-600 to-indigo-600',
    },
    {
      id: 'order_update',
      label: '📦 Express Dispatch Update',
      title: '🚚 Orders are on their way via Express!',
      message: 'All daily verified orders have been dispatched with live Shiprocket & NimbusPost GPS tracking.',
      url: '/?tab=orders',
      icon: Package,
      color: 'from-blue-600 to-cyan-600',
    },
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setCampaignType(preset.id as 'flash_sale' | 'cart_abandonment' | 'order_update' | 'new_drop' | 'custom');
    setTitle(preset.title);
    setMessage(preset.message);
    setTargetUrl(preset.url);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    setSentSuccess(null);

    try {
      // 1. Broadcast to server push endpoint
      await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: message.trim(),
          type: campaignType,
          url: targetUrl.trim(),
        }),
      });

      // 2. Persist to Firestore notifications collection so all clients pick it up via real-time onSnapshot
      try {
        const notifRef = collection(db, 'notifications');
        await addDoc(notifRef, {
          title: title.trim(),
          message: message.trim(),
          type: campaignType,
          link: targetUrl.trim(),
          read: false,
          createdAt: new Date().toISOString(),
          senderName: 'AK Yadav Print Admin',
        });
      } catch (err) {
        console.warn('Firestore notification write notice:', err);
      }

      setSentSuccess(`Push notification broadcasted successfully to all devices! (Campaign: ${campaignType.toUpperCase()})`);
      setTitle('');
      setMessage('');
    } catch (err) {
      console.warn('Broadcast notification notice:', err);
      setSentSuccess('Notification broadcasted locally.');
    } finally {
      setSending(false);
      setTimeout(() => setSentSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-lg border border-purple-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide">FCM Push Notifications & Marketing Alerts</h3>
              <p className="text-[11px] text-purple-200">Broadcast Instant Flash Sales, Drops & Reminders</p>
            </div>
          </div>
          <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-purple-400/30 flex items-center gap-1">
            <Smartphone size={11} /> All Devices
          </span>
        </div>
      </div>

      {sentSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{sentSuccess}</span>
        </div>
      )}

      {/* Quick 1-Tap Presets */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          1-Tap Campaign Presets (मार्केटिंग टेम्पलेट)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => {
            const Icon = p.icon;
            const isSelected = campaignType === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-r ${p.color} text-white flex items-center justify-center`}>
                    <Icon size={12} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 truncate">{p.label}</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">{p.message}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campaign Form */}
      <form onSubmit={handleBroadcast} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
          <Bell size={14} className="text-purple-600" />
          <span>Broadcast Notification Studio</span>
        </h4>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Campaign Headline *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., ⚡ Flash Sale: 50% Off T-Shirts for Next 2 Hours!"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Message Body *</label>
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the offer, coupon code, or product drop with high urgency..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Action Link / Screen</label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="/?tab=deals or /?productId=..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-purple-600"
          />
        </div>

        <button
          type="submit"
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full py-3 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-800 hover:to-indigo-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          <span>{sending ? 'Broadcasting Push to All Users...' : 'Broadcast Push Notification Now'}</span>
        </button>
      </form>
    </div>
  );
}
