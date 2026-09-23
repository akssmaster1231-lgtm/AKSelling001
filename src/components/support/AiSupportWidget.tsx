import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
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
} from 'lucide-react';
import { useAuth } from '@/auth-context';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  orderId?: string;
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

const WHATSAPP_SUPPORT_URL = 'https://wa.me/917290894907?text=Hello%20AKSelling%20Support%2C%20I%20need%20assistance%20with%20my%20order';
const WHATSAPP_PHONE = '+91 7290894907';

const QUICK_PROMPTS = [
  { label: 'Track Order', icon: Package, query: 'Where is my order? Track my recent order status.' },
  { label: '240 GSM Fabric', icon: Shirt, query: 'Tell me about AKSelling 240 GSM heavy cotton fabric specs.' },
  { label: '₹30 Bonus', icon: Wallet, query: 'How does the ₹30 signup bonus & wallet coins work?' },
  { label: '10% Advance COD', icon: ShieldCheck, query: 'Why is 10% online advance required for Cash on Delivery?' },
  { label: 'Shipping Time', icon: Truck, query: 'What are the delivery charges and shipping timeline across India?' },
];

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
      text: `Namaste! 🙏 Welcome to **AKSelling 24/7 AI Smart Support**.\n\nMain aapki real-time order tracking, **240 GSM heavy-cotton fabric details**, **₹30 wallet welcome bonus**, aur **10% advance COD payment** me help kar sakta hoon.\n\nAap direct hamare official admin se WhatsApp par bhi connect kar sakte hain! ✨`,
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

      const data = await res.json();
      const reply = data?.reply || 'Hum abhi request process kar rahe hain. Please WhatsApp par connect karein: +91 7290894907';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Support chat fetch error:', err);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: `Aapke message ka instant answer milne me delay ho raha hai. Aap direct hamare WhatsApp support desk se connect ho sakte hain: [Click to Chat on WhatsApp](${WHATSAPP_SUPPORT_URL}) ya call karein \`${WHATSAPP_PHONE}\`.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
            return <strong key={`b-${lIdx}-${pIdx}-${sIdx}`} className="font-semibold text-slate-900">{seg.slice(2, -2)}</strong>;
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

  return (
    <>
      {/* Floating Action Button (FAB) Bottom Right */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6 select-none">
        {/* Quick WhatsApp Escalation Pill */}
        <a
          href={WHATSAPP_SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-3 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-xs font-bold border border-emerald-400/30"
          title="Direct WhatsApp Support (+91 7290894907)"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>WhatsApp 24/7</span>
          <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full">Admin</span>
        </a>

        {/* AI Support Toggle Launcher */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 border border-blue-400/30"
          aria-label="Open 24/7 AI Smart Support Assistant"
        >
          <div className="relative">
            <Bot size={22} className="text-amber-300" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>

          <div className="text-left hidden sm:block">
            <div className="text-xs font-black tracking-wide flex items-center gap-1">
              AI Support <Sparkles size={11} className="text-amber-300" />
            </div>
            <div className="text-[9px] text-blue-100 font-medium">Order • 240 GSM • Wallet</div>
          </div>

          <span className="text-xs font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] uppercase sm:hidden">
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
                  <p className="text-[10px] text-blue-100">Order Tracking • Fabric • COD Advance • Instant Help</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Direct WhatsApp Escalation */}
                <a
                  href={WHATSAPP_SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white p-1.5 rounded-full transition shadow-sm"
                  title="Direct WhatsApp Support (+91 7290894907)"
                >
                  <MessageSquare size={16} />
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
                      AI is typing answer in Hinglish...
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
                    className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition"
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
                  placeholder="Ask about orders, 240 GSM, wallet bonus..."
                  className="flex-1 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden transition"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white w-9 h-9 rounded-xl flex items-center justify-center transition shadow-sm shrink-0"
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
                  href={WHATSAPP_SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
                >
                  WhatsApp: +91 7290894907
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
