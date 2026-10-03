import { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Mail,
  Send,
  Gift,
} from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/data';
import { useAuth } from '@/auth-context';
import { getReferralShareUrl, getUserReferralCode } from '@/utils/referralService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function ShareModal({ isOpen, onClose, product }: ShareModalProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const refCode = useMemo(() => getUserReferralCode(user), [user]);

  // Generate canonical direct URL for this product including referral code
  const shareUrl = useMemo(() => {
    return getReferralShareUrl(product.id, user);
  }, [product.id, user]);

  const shareTitle = `${product.title} on AKSelling`;
  const shareText = `Check out ${product.title} at ${formatPrice(product.price)} on AKSelling! Free Delivery & Cash on Delivery available.\n\nShop here: ${shareUrl}`;

  if (!isOpen) return null;

  const handleCopyLink = async (customMessage?: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers / webviews
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setCopyNotice(customMessage || 'Product link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setCopyNotice(null);
      }, 2500);
    } catch {
      setCopyNotice('Failed to copy link automatically. Please copy from text box below.');
      setTimeout(() => setCopyNotice(null), 3000);
    }
  };

  const safeOpen = (url: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        // ignore
      }
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        onClose();
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }
    handleCopyLink();
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `🛍️ *${product.title}*\n` +
      `🔥 Special Price: *${formatPrice(product.price)}* (Save ${product.discount}%)\n` +
      `🚚 Free Delivery & Fast Shipping\n\n` +
      `👉 Tap to buy on AKSelling:\n${shareUrl}`
    );
    safeOpen(`https://api.whatsapp.com/send?text=${text}`);
  };

  const handleFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    safeOpen(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const handleInstagram = () => {
    // Instagram doesn't have a direct URL share API, so copy link and prompt user to paste in Story or DM
    handleCopyLink('Link copied! Open Instagram and paste in DM or Story');
    setTimeout(() => {
      safeOpen('https://www.instagram.com/');
    }, 600);
  };

  const handleMessenger = () => {
    const url = encodeURIComponent(shareUrl);
    safeOpen(`https://www.messenger.com/t/?link=${url}`);
  };

  const handleTelegram = () => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(`🛍️ Check out ${product.title} on AKSelling (${formatPrice(product.price)})`);
    safeOpen(`https://t.me/share/url?url=${url}&text=${text}`);
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`Check out ${product.title} at ${formatPrice(product.price)} on AKSelling! #OnlineShopping #AKSelling`);
    const url = encodeURIComponent(shareUrl);
    safeOpen(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Check out ${product.title} on AKSelling`);
    const body = encodeURIComponent(
      `Hi,\n\nI thought you might like this product on AKSelling:\n\n` +
      `${product.title}\nPrice: ${formatPrice(product.price)}\n\n` +
      `View product and order here:\n${shareUrl}`
    );
    try {
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } catch {
      safeOpen(`mailto:?subject=${subject}&body=${body}`);
    }
  };

  const thumbnail = product.images?.[0] || '';

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-fade-in p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-flipkart-600">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Share this Product</h3>
              <p className="text-xs text-gray-500">Send direct product link to friends & family</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close share modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {/* Product Preview Card */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200/80">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={product.title}
                className="w-14 h-14 rounded-lg object-cover bg-white border border-gray-100 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-200 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">
                {product.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-black text-gray-900">{formatPrice(product.price)}</span>
                {product.mrp > product.price && (
                  <span className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                )}
                {product.discount > 0 && (
                  <span className="text-[11px] font-bold text-green-600 bg-green-50 px-1.5 py-0.2 rounded">
                    {product.discount}% off
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Copy Notification Toast */}
          {copyNotice && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg text-xs font-medium animate-fade-in">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{copyNotice}</span>
            </div>
          )}

          {/* Referral Reward Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                ₹30
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-amber-950 flex items-center gap-1">
                  <span>Referral Earnings Active</span>
                  <Gift size={12} className="text-amber-600" />
                </p>
                <p className="text-[11px] text-amber-900 leading-tight">
                  Earn ₹30 cash in your wallet when a friend buys via your link (Min withdrawal ₹100).
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Code</span>
              <span className="text-xs font-mono font-black text-slate-950 bg-white px-2 py-0.5 rounded border border-amber-300 inline-block shadow-2xs">
                {refCode}
              </span>
            </div>
          </div>

          {/* Quick Direct Link Box */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Direct Product Link (Instant Access)
            </label>
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-flipkart-500 focus-within:border-transparent">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-xs text-gray-600 bg-transparent px-2 py-1 outline-none truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={() => handleCopyLink()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-flipkart-600 hover:bg-flipkart-700 text-white active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instant Social Channels Grid */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2.5">
              Share directly via Social Media & Apps
            </p>
            <div className="grid grid-cols-4 gap-2.5 text-center">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-green-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-green-500/20 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-gray-800">WhatsApp</span>
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleInstagram}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-pink-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-gray-800">Instagram</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebook}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-blue-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-gray-800">Facebook</span>
              </button>

              {/* Messenger */}
              <button
                type="button"
                onClick={handleMessenger}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-blue-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00c6ff] to-[#0072ff] text-white flex items-center justify-center shadow-md shadow-blue-400/20 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.081.299 2.235.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.89-3.259-6.56 6.963z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-gray-800">Messenger</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegram}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-sky-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
                  <Send size={22} className="-translate-x-0.5 translate-y-0.5" />
                </div>
                <span className="text-[11px] font-semibold text-gray-800">Telegram</span>
              </button>

              {/* Twitter / X */}
              <button
                type="button"
                onClick={handleTwitter}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-gray-100 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-md shadow-gray-900/20 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-gray-800">X (Twitter)</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={handleEmail}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-amber-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <Mail size={22} />
                </div>
                <span className="text-[11px] font-semibold text-gray-800">Email</span>
              </button>

              {/* Native System Share / More */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-purple-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
                  <Share2 size={22} />
                </div>
                <span className="text-[11px] font-semibold text-gray-800">More Apps</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="truncate">Anyone with this link can view & buy directly</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
