import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  ExternalLink,
  Package,
  Shirt,
  Wallet,
  Truck,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  Ruler,
  CreditCard,
  Headphones,
} from 'lucide-react';
import { useAuth } from '@/auth-context';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  orderId?: string;
  isEscalatedToWhatsApp?: boolean;
  userQuery?: string;
}

interface LocalOrder {
  id?: string;
  orderId?: string;
  status?: string;
  totalAmount?: number;
  price?: number;
  paymentMethod?: string;
  trackingNumber?: string;
  createdAt?: string;
}

const WHATSAPP_PHONE = '+91 7290894907';
const SUPPORT_EMAIL = 'support.akselling@gmail.com';

function getWhatsAppUrl(queryText?: string, orderId?: string) {
  const base = 'https://wa.me/917290894907';
  if (!queryText) {
    return `${base}?text=${encodeURIComponent('Hello AKSelling Support, I need assistance with my order/inquiry')}`;
  }
  const prefix = orderId ? `[Order #${orderId}] ` : '';
  const message = `Hello AKSelling Support Executive, ${prefix}I need urgent assistance with: ${queryText.trim()}`;
  return `${base}?text=${encodeURIComponent(message)}`;
}

// Authentic WhatsApp SVG Icon
function WhatsAppIcon({ className = 'w-5 h-5', size }: { className?: string; size?: number }) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      className={`fill-current ${className}`}
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

const QUICK_PROMPTS = [
  { label: 'Track Order', icon: Package, query: 'Where is my order? Track my recent order status.' },
  { label: '7-Day Return', icon: RefreshCw, query: 'How does the 7-day return and instant refund policy work?' },
  { label: '240 GSM Fabric', icon: Shirt, query: 'Tell me about AKSelling 240 GSM heavy cotton fabric specs.' },
  { label: 'Size Guide', icon: Ruler, query: 'What size should I order? Give me the chest measurement guide.' },
  { label: 'Payment & COD', icon: CreditCard, query: 'What are the payment options and why 10% advance for COD?' },
  { label: '₹30 Bonus', icon: Wallet, query: 'How does the ₹30 signup bonus & wallet coins work?' },
  { label: 'Delivery Time', icon: Truck, query: 'What are the delivery charges and shipping timeline across India?' },
  { label: 'Human Help', icon: Headphones, query: 'I have a complex issue, connect me with WhatsApp human support.' },
];

// High-precision client-side knowledge base & escalation detector
function getSmartClientReply(
  query: string,
  orderId?: string,
  recentOrders: LocalOrder[] = []
): { reply: string; isEscalatedToWhatsApp: boolean } {
  const lower = query.toLowerCase();

  // Detect "Bhari" / Complex Questions or Explicit Human Escalation
  const isComplex =
    lower.includes('damage') ||
    lower.includes('tuta') ||
    lower.includes('kharab') ||
    lower.includes('galat') ||
    lower.includes('wrong item') ||
    lower.includes('refund nahi aaya') ||
    lower.includes('paisa nahi aaya') ||
    lower.includes('paisa kat gaya') ||
    lower.includes('fraud') ||
    lower.includes('dispute') ||
    lower.includes('address badal') ||
    lower.includes('change address') ||
    lower.includes('cancel dispatch') ||
    lower.includes('bulk') ||
    lower.includes('wholesale') ||
    lower.includes('50 piece') ||
    lower.includes('100 piece') ||
    lower.includes('custom print') ||
    lower.includes('human') ||
    lower.includes('executive') ||
    lower.includes('manager') ||
    lower.includes('baat kar') ||
    lower.includes('call kar') ||
    lower.includes('admin') ||
    lower.includes('owner') ||
    lower.includes('complaint') ||
    lower.includes('heavy question') ||
    lower.includes('bhari question');

  if (isComplex) {
    return {
      isEscalatedToWhatsApp: true,
      reply: `🚨 **High Priority Support Desk Escalation**:\n\nAapka sawal/request ek sensitive ya personalized mamla hai (order grievance / payment discrepancy / custom bulk manufacturing). Humne isko priority escalation queue me daal diya hai!\n\n• **Direct Resolution**: Hamare senior customer executive WhatsApp par aapse direct baat karke turant solve karenge.\n• **WhatsApp Direct Desk**: Neeche diye green WhatsApp button par 1-tap kijiye ya connect karein: \`${WHATSAPP_PHONE}\`\n• **Official Email**: \`${SUPPORT_EMAIL}\`\n\nAapka issue 100% priority ke sath resolve hoga! 🙏`,
    };
  }

  // 7-Day Return, Replacement & Refund
  if (
    lower.includes('return') ||
    lower.includes('replace') ||
    lower.includes('exchange') ||
    lower.includes('wapas') ||
    lower.includes('badalna') ||
    lower.includes('refund') ||
    lower.includes('cancel')
  ) {
    return {
      isEscalatedToWhatsApp: false,
      reply: `🔄 **AKSelling 7-Day Doorstep Return & Instant Refund Guarantee**:\n\n• **7 Din Ka Easy Return**: Product receive hone ke 7 dino ke andar aap replacement ya 100% refund request kar sakte hain agar size fit na ho ya defect ho.\n• **Free Doorstep Pickup**: Courier partner aapke ghar se parcel bina kisi extra charge ke pickup karega.\n• **Instant 24-Hr Refund**: Pickup hote hi refund amount 24 ghante ke andar aapke original bank source ya AKSelling Wallet me credit ho jata hai!\n• **Zero Cancellation Fee**: Order dispatch hone se pehle cancel karne par 100% full refund turant milta hai. ✨`,
    };
  }

  // Size & Fit Guide
  if (
    lower.includes('size') ||
    lower.includes('chart') ||
    lower.includes('fit') ||
    lower.includes('measurement') ||
    lower.includes('chhota') ||
    lower.includes('bada') ||
    lower.includes('fitting')
  ) {
    return {
      isEscalatedToWhatsApp: false,
      reply: `📏 **AKSelling Indian Standard Size & Fit Guide**:\n\n• **Chest Sizes (Inches)**:\n  - **S**: 38"\n  - **M**: 40"\n  - **L**: 42"\n  - **XL**: 44"\n  - **XXL**: 46"\n• **Streetwear Drop-Shoulder Fit**: AKSelling apparel modern relaxed boxy streetwear cut me bana hai. Agar aapko trendy baggy streetwear look chahiye toh true size select karein; regular slim fit ke liye 1 size chhota order kar sakte hain! 👕`,
    };
  }

  // Order Tracking
  if (
    lower.includes('order') ||
    lower.includes('track') ||
    lower.includes('status') ||
    lower.includes('kaha') ||
    lower.includes('kab') ||
    lower.includes('awb')
  ) {
    if (orderId) {
      const found = recentOrders.find(
        (o) => String(o.id || o.orderId || '').toLowerCase() === String(orderId).toLowerCase()
      );
      return {
        isEscalatedToWhatsApp: false,
        reply: `📦 **Live Order Tracking (Order #${orderId})**:\n\n• **Status**: ${found?.status || 'Confirmed & Dispatched in Processing'}\n• **Total Amount**: ₹${found?.totalAmount || found?.price || 'N/A'}\n• **Estimated Delivery**: 3 se 5 business days me aapke address par deliver hoga.\n• **Express Courier**: Shiprocket / Bluedart / Delhivery Express.\n• **Live Stepper**: App ke **Orders** tab me jakar aap live timeline dekh sakte hain! 🚚`,
      };
    }
    return {
      isEscalatedToWhatsApp: false,
      reply: `📦 **Track Your Order Live**:\n\nApna **Order ID** (jaise \`ORD-123456\`) yahan type kijiye ya app ke **Orders** tab me visit karke live dispatch stepper check karein!\n\n• **Pan-India Speed**: 3-5 business days across 28,000+ pincodes.\n• **Express Partners**: Shiprocket / Bluedart / Delhivery. 🚚`,
    };
  }

  // 240 GSM Fabric Specs
  if (
    lower.includes('240') ||
    lower.includes('gsm') ||
    lower.includes('fabric') ||
    lower.includes('kapda') ||
    lower.includes('cotton') ||
    lower.includes('quality') ||
    lower.includes('tshirt') ||
    lower.includes('t-shirt')
  ) {
    return {
      isEscalatedToWhatsApp: false,
      reply: `👕 **AKSelling 240 GSM Heavy-Cotton Specifications**:\n\n• **100% Super Combed Ringspun Cotton**: Heavyweight **240 GSM** super-dense knit jo market ki 160-180 GSM t-shirts se 2 guna zyada thick aur premium hoti hai.\n• **Bio-Washed**: Silicon enzyme bio-wash se fabric ultra-soft peach feel deta hai aur skin par gentle rehta hai.\n• **Pre-Shrunk & Non-Fading**: Multiple machine wash ke baad bhi na shrink hota hai aur na color fade hota hai.\n• **Direct Factory Price**: Bina kisi middleman markup ke direct Tirupur textile manufacturing price par milta hai! ✨`,
    };
  }

  // ₹30 Wallet Bonus & Offers
  if (
    lower.includes('bonus') ||
    lower.includes('30') ||
    lower.includes('wallet') ||
    lower.includes('coin') ||
    lower.includes('paisa') ||
    lower.includes('cashback') ||
    lower.includes('reward') ||
    lower.includes('offer') ||
    lower.includes('spin')
  ) {
    return {
      isEscalatedToWhatsApp: false,
      reply: `💰 **AKSelling ₹30 Wallet Bonus & Daily Savings**:\n\n• **Instant ₹30 Welcome Bonus**: Har naye customer ko visit/signup karte hi wallet me direct ₹30 credit milta hai!\n• **Roz Check-In**: App par daily login karne se ₹5 se ₹50 tak ke shopping coins milte hain.\n• **Spin & Win**: Order complete karne par free lucky spin milta hai jisme ₹200 tak additional cash jeet sakte hain.\n• **Saath Mein Khareedo**: WhatsApp par friend ke sath order share karne par flat 15% instant extra discount milta hai!\n• **Automatic Checkout Deduction**: Payment karte waqt wallet balance direct total se minus ho jata hai! 🎉`,
    };
  }

  // Payments & 10% COD Advance
  if (
    lower.includes('advance') ||
    lower.includes('10%') ||
    lower.includes('cod') ||
    lower.includes('cash on delivery') ||
    lower.includes('payment') ||
    lower.includes('upi') ||
    lower.includes('card')
  ) {
    return {
      isEscalatedToWhatsApp: false,
      reply: `🛡️ **Payment Modes & 10% Advance COD System**:\n\n• **Payment Options**: 100% Secure UPI (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit Cards (RuPay, Visa, Mastercard) & Net Banking.\n• **10% Advance for COD**: Fake addresses aur RTO losses rokne ke liye COD orders par 10% online token payment secure gateway se liya jata hai.\n• **90% Doorstep Payment**: Baki bacha 90% payment parcel receive karte waqt courier wale ko cash ya UPI se dena hota hai.\n• **100% Safe**: Agar order cancel hota hai toh 10% advance turant aapke account me wapas refund mil jata hai! 🔒`,
    };
  }

  // Shipping & Delivery
  if (
    lower.includes('shipping') ||
    lower.includes('delivery') ||
    lower.includes('charges') ||
    lower.includes('charge') ||
    lower.includes('free delivery') ||
    lower.includes('speed') ||
    lower.includes('pincode')
  ) {
    return {
      isEscalatedToWhatsApp: false,
      reply: `🚚 **Shipping & Express Delivery Details**:\n\n• **FREE Shipping**: ₹500 se zyada ke sabhi orders par delivery bilkul FREE hai! (₹500 se kam par flat ₹49 delivery fee).\n• **Pan-India Coverage**: 28,000+ pincodes across all Indian states.\n• **Speed**: Metro cities me 2-3 din aur rest of India me 3-5 business days.\n• **Insured Delivery**: Tamper-evident secure packaging ke sath safely deliver hota hai. 📦`,
    };
  }

  // WhatsApp or Contact
  if (lower.includes('whatsapp') || lower.includes('contact') || lower.includes('phone') || lower.includes('help')) {
    return {
      isEscalatedToWhatsApp: true,
      reply: `💬 **Direct Admin & WhatsApp Support Desk**:\n\nAap direct hamari official executive desk se jud sakte hain:\n\n• **WhatsApp Support**: [Click to Chat on WhatsApp](${getWhatsAppUrl()}) (\`${WHATSAPP_PHONE}\`)\n• **Support Email**: \`${SUPPORT_EMAIL}\`\n\nHamari customer care team 24/7 aapki sahayata ke liye hazir hai! 🙏`,
    };
  }

  // Default Store Overview
  return {
    isEscalatedToWhatsApp: false,
    reply: `Namaste! 🙏 Welcome to **AKSelling 24/7 Smart Assistant**!\n\nMain aapki kya madad kar sakta hoon? Aap mujhse pooch sakte hain:\n\n1. 📦 **Order Status & Live Tracking** (Apna Order ID batayein)\n2. 🔄 **7-Day Easy Return & 100% Refund Policy**\n3. 👕 **240 GSM Heavy-Cotton Fabric Specs**\n4. 📏 **Size Chart & Streetwear Fit Guide**\n5. 💰 **₹30 Wallet Welcome Bonus & Daily Coins**\n6. 🛡️ **10% Advance COD Payment System**\n7. 🚚 **Free Shipping & Delivery Timeline**\n\nKisi bhi complex ya personalized issue ke liye aap hamare WhatsApp Executive se direct connect kar sakte hain! ✨`,
  };
}

export default function AiSupportWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const [recentOrders, setRecentOrders] = useState<LocalOrder[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: `Namaste! 🙏 Welcome to **AKSelling 24/7 AI Smart Support**.\n\nMain aapki real-time order tracking, **7-Day Returns & 100% Refunds**, **240 GSM heavy-cotton fabric specs**, **₹30 wallet welcome bonus**, aur **10% advance COD payment** me instant help kar sakta hoon.\n\nKisi bhi complex ya bhari sawal ke liye aap direct hamare WhatsApp Support Executive se connect ho sakte hain! ✨`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Load user's recent orders from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('akselling_local_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentOrders(parsed.slice(0, 5));
          setSelectedOrderId(parsed[0].id || parsed[0].orderId);
        }
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customQuery?: string) => {
    const textToSend = (customQuery || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userQuery: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          orderId: selectedOrderId,
          userEmail: user?.email,
          recentOrders: recentOrders.map((o) => ({
            id: o.id || o.orderId,
            status: o.status,
            totalAmount: o.totalAmount || o.price,
            paymentMethod: o.paymentMethod,
            trackingNumber: o.trackingNumber,
            createdAt: o.createdAt,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('API temporary response error');
      }

      const data = await res.json();
      const reply = data?.reply;
      const isEscalated = Boolean(data?.isEscalatedToWhatsApp);

      if (!reply) {
        throw new Error('Empty reply received');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEscalatedToWhatsApp: isEscalated,
        userQuery: textToSend,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // Use intelligent algorithmic fallback engine with instant store intelligence
      const fallbackResult = getSmartClientReply(textToSend, selectedOrderId, recentOrders);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: fallbackResult.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEscalatedToWhatsApp: fallbackResult.isEscalatedToWhatsApp,
        userQuery: textToSend,
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render markdown bolding and URLs
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      // replace markdown link [text](url)
      const linkRegex = /\[(.*?)\]\((.*?)\)/g;
      const parts = [];
      let lastIdx = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIdx) {
          parts.push(line.substring(lastIdx, match.index));
        }
        const linkText = match[1];
        const linkUrl = match[2];
        parts.push(
          <a
            key={`link-${lIdx}-${match.index}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-bold underline inline-flex items-center gap-0.5"
          >
            {linkText}
            <ExternalLink size={12} className="inline ml-0.5" />
          </a>
        );
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < line.length) {
        parts.push(line.substring(lastIdx));
      }

      // Format bold (**text**)
      const renderedParts = parts.map((part, pIdx) => {
        if (typeof part !== 'string') return part;
        const boldSplit = part.split(/(\*\*.*?\*\*)/g);
        return boldSplit.map((seg, sIdx) => {
          if (seg.startsWith('**') && seg.endsWith('**')) {
            return (
              <strong key={`b-${lIdx}-${pIdx}-${sIdx}`} className="font-semibold text-slate-900">
                {seg.slice(2, -2)}
              </strong>
            );
          }
          return seg;
        });
      });

      return (
        <span key={`l-${lIdx}`} className="block min-h-[1.1rem]">
          {renderedParts}
        </span>
      );
    });
  };

  const activeWhatsAppUrl = getWhatsAppUrl();

  return (
    <>
      {/* Floating Action Buttons Bottom Right */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6 select-none">
        
        {/* Compact Round Circular Premium WhatsApp Button */}
        <a
          href={activeWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative group w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#20ba59] to-[#25D366] hover:from-[#1ea850] hover:to-[#22c35e] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(37,211,102,0.45)] hover:shadow-[0_6px_22px_rgba(37,211,102,0.65)] hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white cursor-pointer select-none"
          title="Direct WhatsApp Support (+91 7290894907)"
          aria-label="Direct WhatsApp Support"
        >
          {/* Authentic WhatsApp SVG Logo */}
          <WhatsAppIcon className="w-5 h-5 sm:w-6 sm:h-6" />

          {/* Online Pulsing Indicator Dot */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
          </span>

          {/* Desktop Hover Tooltip */}
          <span className="absolute right-14 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap hidden sm:block">
            WhatsApp 24/7
          </span>
        </a>

        {/* AI Support Toggle Launcher */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 border border-blue-400/30 cursor-pointer"
          aria-label="Open 24/7 AI Smart Support Assistant"
        >
          <div className="relative">
            <Bot size={20} className="text-amber-300" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>

          <div className="text-left hidden sm:block">
            <div className="text-xs font-black tracking-wide flex items-center gap-1">
              AI Support <Sparkles size={11} className="text-amber-300" />
            </div>
            <div className="text-[9px] text-blue-100 font-medium">Orders • Returns • 240 GSM</div>
          </div>

          <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold sm:hidden">
            AI Help
          </span>
        </button>
      </div>

      {/* Main Support Chat Window Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full sm:max-w-md h-[90vh] sm:h-[620px] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden relative animate-scale-up">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3.5 flex items-center justify-between shadow-md relative">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Bot size={22} className="text-amber-300" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-700 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black tracking-tight">AKSelling AI Assistant</h3>
                    <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-400/40">
                      24/7 Live
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-100">7-Day Returns • Orders • 240 GSM • Instant Help</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Round WhatsApp Escalation in Header */}
                <a
                  href={activeWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center transition shadow-sm"
                  title="Direct WhatsApp Support (+91 7290894907)"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </a>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Active Order Quick Selector Bar (if orders exist) */}
            {recentOrders.length > 0 && (
              <div className="bg-blue-50 border-b border-blue-100 px-3 py-1.5 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                  <Package size={13} className="text-blue-600" />
                  Select Order:
                </span>
                <div className="relative">
                  <select
                    value={selectedOrderId || ''}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedOrderId(newId);
                      handleSendMessage(`Status of my order #${newId}`);
                    }}
                    aria-label="Select an order to track"
                    className="bg-white border border-blue-200 rounded-lg text-[11px] font-semibold text-slate-800 px-2 py-0.5 pr-6 appearance-none focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    {recentOrders.map((o) => (
                      <option key={o.id || o.orderId} value={o.id || o.orderId}>
                        #{o.id || o.orderId} ({o.status || 'Active'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-1.5 top-1.5 text-blue-600 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-2xs ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-blue-600">
                        <Bot size={12} /> AKSelling Assistant
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      {renderFormattedText(m.text)}
                    </div>

                    {/* Interactive WhatsApp Escalation Card for Complex/Bhari Questions */}
                    {m.isEscalatedToWhatsApp && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-300 text-left">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 mb-1">
                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Executive WhatsApp Resolution</span>
                        </div>
                        <p className="text-[10px] text-emerald-800 leading-normal mb-2">
                          Yeh Bhari / complex query hai. Hamare senior executive WhatsApp par 1-to-1 live solve karenge:
                        </p>
                        <a
                          href={getWhatsAppUrl(m.userQuery || m.text, selectedOrderId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-1.5 px-3 rounded-lg text-[11px] font-bold shadow-xs hover:shadow-md transition active:scale-95"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          <span>Chat on WhatsApp (+91 7290894907)</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}

                    <div
                      className={`text-[9px] mt-1 text-right ${
                        m.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-xs p-3 shadow-2xs flex items-center gap-2">
                    <Bot size={14} className="text-blue-600 animate-bounce" />
                    <span className="text-[11px] font-semibold text-slate-500">
                      AI is finding verified answer...
                    </span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse delay-100" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse delay-200" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Carousel */}
            <div className="bg-white border-t border-slate-100 p-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
              {QUICK_PROMPTS.map((p, idx) => {
                const IconComp = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p.query)}
                    className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition cursor-pointer"
                  >
                    <IconComp size={12} className="text-blue-600" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Form Bar */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about returns, orders, 240 GSM, size guide..."
                  className="flex-1 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden transition"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white w-9 h-9 rounded-xl flex items-center justify-center transition shadow-sm shrink-0 cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </form>

              {/* WhatsApp direct escalation footnote */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 px-0.5">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  100% Verified Support
                </span>
                <a
                  href={activeWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
                >
                  <WhatsAppIcon className="w-3 h-3 text-emerald-600" />
                  <span>WhatsApp: +91 7290894907</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

