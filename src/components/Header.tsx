import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Search, Mic, Camera, ShoppingCart, X, Loader2, Bell } from 'lucide-react';
import { useCart } from '@/cart-context';
import { useAuth } from '@/auth-context';
import { useI18n } from '@/i18n';
import { useNotifications } from '@/notification-context';
import HeaderLocationWidget from '@/components/HeaderLocationWidget';
import SearchHistoryDropdown from '@/components/SearchHistoryDropdown';
import { addSearchQuery } from '@/utils/searchHistory';

interface HeaderProps {
  onSearch: (query: string) => void;
  onCartClick: () => void;
  onNavigateHome: () => void;
  onAccountClick?: () => void;
  onNotificationClick?: () => void;
  onOpenProduct?: (productId: string) => void;
}

export default function Header({
  onSearch,
  onCartClick,
  onNavigateHome,
  onAccountClick,
  onNotificationClick,
  onOpenProduct,
}: HeaderProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [hasStream, setHasStream] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const { cartCount } = useCart();
  const recognitionRef = useRef<unknown>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const SR = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      addSearchQuery(trimmed);
    }
    setShowDropdown(false);
    onSearch(trimmed);
  };

  const handleSelectQuery = (selectedQuery: string) => {
    setQuery(selectedQuery);
    addSearchQuery(selectedQuery);
    setShowDropdown(false);
    onSearch(selectedQuery);
  };

  const handleVoice = () => {
    const SR = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SR) {
      setVoiceActive(true);
      setTimeout(() => {
        setVoiceActive(false);
        setQuery('wireless headphones');
        addSearchQuery('wireless headphones');
        setShowDropdown(false);
        onSearch('wireless headphones');
      }, 2000);
      return;
    }

    const recognition = new SR() as {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (event: { results: { 0: { 0: { transcript: string } } } }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;

    setVoiceActive(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      if (transcript.trim()) {
        addSearchQuery(transcript.trim());
      }
      setShowDropdown(false);
      onSearch(transcript);
    };
    recognition.onerror = () => setVoiceActive(false);
    recognition.onend = () => setVoiceActive(false);

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setVoiceActive(false);
    }
  };

  const stopVoice = () => {
    setVoiceActive(false);
    (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
  };

  const handleCamera = async () => {
    setCameraOpen(true);
    setCameraError('');
    setCapturedImage(null);
    setHasStream(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported on this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Ignore autoplay restriction errors
        }
        setHasStream(true);
      }
    } catch {
      setCameraError('Camera access denied or not available on this device.');
    }
  };

  const closeCamera = () => {
    setCameraOpen(false);
    setCapturedImage(null);
    setCameraError('');
    setHasStream(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setCameraOpen(false);
      setCapturedImage(null);
      setQuery('headphones');
      addSearchQuery('headphones');
      setShowDropdown(false);
      onSearch('headphones');
      onNavigateHome();
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-[#1b365d] to-slate-900 shadow-md w-full border-b border-slate-800/80">
        <div className="w-full max-w-md mx-auto px-3 pt-2 pb-2.5">
          {/* Top Row: Logo & Location & Action Buttons */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={onNavigateHome} className="flex items-baseline gap-0.5 shrink-0 group" id="header-logo-btn">
                <span className="text-xl font-black text-white tracking-tight drop-shadow-xs">
                  AK<span className="text-amber-400 group-hover:text-yellow-300 transition-colors">Selling</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block ml-0.5" />
              </button>
              <HeaderLocationWidget />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onNotificationClick && (
                <button
                  type="button"
                  onClick={onNotificationClick}
                  className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  aria-label="View Notifications"
                  title="Notifications Radar"
                  id="header-notification-btn"
                >
                  <Bell size={20} className="text-slate-100" />
                  {unreadCount > 0 && (
                    <span
                      id="header-notification-badge"
                      className="absolute -top-0.5 right-0 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-0.5 shadow-md ring-1 ring-slate-900 pointer-events-none animate-pulse"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {onAccountClick && (
                <button
                  onClick={onAccountClick}
                  className="shrink-0 flex items-center justify-center p-1 rounded-full text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={user?.name || 'Account'}
                  id="header-account-btn"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'Account'}
                      className="w-7 h-7 rounded-full object-cover border border-amber-400/60 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-300 shadow-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </button>
              )}

              <button
                onClick={onCartClick}
                className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                aria-label="View Cart"
                id="header-cart-btn"
              >
                <ShoppingCart size={20} className="text-slate-100" />
                {cartCount > 0 && (
                  <span
                    id="header-cart-badge"
                    className="absolute -top-0.5 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-0.5 shadow-md ring-1 ring-slate-900 pointer-events-none"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Row */}
          <form onSubmit={handleSubmit} className="w-full relative mt-0.5">
            <div className="flex items-center bg-white rounded-2xl shadow-md border-2 border-amber-400/70 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-300/40 overflow-hidden h-12 transition-all">
              <div className="pl-3.5 pr-1 text-[#1b365d] shrink-0 flex items-center justify-center">
                <Search size={20} className="stroke-[2.5]" />
              </div>
              <input
                id="header-search-input"
                type="text"
                value={query}
                onFocus={() => setShowDropdown(true)}
                onClick={() => setShowDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowDropdown(false);
                  }
                }}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!showDropdown) setShowDropdown(true);
                }}
                placeholder={t('searchPlaceholder')}
                className="flex-1 min-w-0 px-2 text-sm sm:text-[15px] text-slate-900 placeholder-slate-500 bg-transparent outline-none font-medium tracking-normal"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    onSearch('');
                    setShowDropdown(true);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={handleCamera}
                className="px-2.5 py-1.5 border-l border-slate-200 text-slate-600 hover:text-[#1b365d] transition-colors shrink-0 cursor-pointer flex items-center justify-center"
                aria-label="Visual search"
                title="Photo search"
              >
                <Camera size={19} className="stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={voiceActive ? stopVoice : handleVoice}
                className={`pl-2 pr-3 py-1.5 transition-colors shrink-0 cursor-pointer flex items-center justify-center ${
                  voiceActive ? 'text-amber-500' : 'text-slate-600 hover:text-[#1b365d]'
                }`}
                aria-label="Voice search"
                title="Voice search"
              >
                {voiceActive ? (
                  <span className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-5 w-5 rounded-full bg-amber-200 animate-pulse-ring" />
                    <Mic size={19} className="relative text-amber-500 stroke-[2.2]" />
                  </span>
                ) : (
                  <Mic size={19} className="stroke-[2]" />
                )}
              </button>
            </div>

            <SearchHistoryDropdown
              isOpen={showDropdown}
              query={query}
              onSelectQuery={handleSelectQuery}
              onSelectProduct={onOpenProduct}
              onClose={() => setShowDropdown(false)}
            />
          </form>
        </div>
      </header>

      {/* Voice search overlay */}
      {voiceActive && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex flex-col items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-xs mx-4">
            <div className="relative">
              <span className="absolute inline-flex h-16 w-16 rounded-full bg-flipkart-200 animate-pulse-ring" />
              <div className="w-16 h-16 rounded-full bg-flipkart-500 flex items-center justify-center">
                <Mic size={32} className="text-white" />
              </div>
            </div>
            <p className="text-gray-700 font-medium text-sm">
              {voiceSupported ? 'Listening... speak now' : 'Searching for "wireless headphones"...'}
            </p>
            <button
              onClick={stopVoice}
              className="text-sm text-gray-500 font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Camera search overlay */}
      {cameraOpen && (
        <div className="fixed inset-0 z-[80] bg-black flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 bg-black">
            <button onClick={closeCamera} className="text-white p-1">
              <X size={24} />
            </button>
            <span className="text-white text-sm font-medium">Visual Search</span>
            <div className="w-8" />
          </div>

          {cameraError ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <Camera size={48} className="text-gray-500 mb-4" />
              <p className="text-white/80 text-sm">{cameraError}</p>
              <p className="text-white/50 text-xs mt-2">Please allow camera access in your browser settings.</p>
              <button
                onClick={closeCamera}
                className="mt-6 bg-flipkart-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl"
              >
                Go Back
              </button>
            </div>
          ) : capturedImage ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <img src={capturedImage} alt="Captured" className="max-h-[60vh] rounded-lg" />
              <div className="flex items-center gap-2 mt-6">
                {searching && <Loader2 size={20} className="animate-spin text-white" />}
                <p className="text-white text-sm font-medium">
                  {searching ? 'Searching for matching products...' : 'Photo captured!'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 relative bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onError={(e) => {
                    e.preventDefault();
                  }}
                  className={`w-full h-full object-cover ${hasStream ? 'block' : 'hidden'}`}
                />
                {!hasStream && (
                  <div className="flex flex-col items-center justify-center text-white/70 gap-2">
                    <Loader2 size={32} className="animate-spin text-flipkart-500" />
                    <p className="text-xs">Initializing camera...</p>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white/60 rounded-2xl" />
                </div>
                <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-xs">
                  Point your camera at a product to search
                </p>
              </div>
              <div className="bg-black py-6 flex items-center justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white border-4 border-flipkart-500 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Camera size={28} className="text-flipkart-500" />
                </button>
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </>
  );
}
