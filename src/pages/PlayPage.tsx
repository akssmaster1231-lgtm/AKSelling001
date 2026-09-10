import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, ShoppingBag, Play, Volume2, VolumeX, Send, X, Check } from 'lucide-react';
import { formatCount, formatPrice } from '@/data';
import type { VideoReel, Product } from '@/types';
import { useCart } from '@/cart-context';
import { getAllReels } from '@/utils/reelsHelper';

interface PlayPageProps {
  onProductClick: (product: Product) => void;
}

interface Comment {
  id: string;
  reelId: string;
  user: string;
  text: string;
  time: string;
}

export default function PlayPage({ onProductClick }: PlayPageProps) {
  const [reels, setReels] = useState<VideoReel[]>(() => getAllReels());
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Comment[]>([
    { id: 'c1', reelId: 'v1', user: 'Priya S.', text: 'Sound quality is amazing!', time: '2h' },
    { id: 'c2', reelId: 'v1', user: 'Rahul K.', text: 'Is it worth buying?', time: '1h' },
    { id: 'c3', reelId: 'v2', user: 'Sneha M.', text: 'Camera looks incredible', time: '3h' },
  ]);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sharedReel, setSharedReel] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleReelsUpdated = () => {
      setReels(getAllReels());
    };
    window.addEventListener('akselling_reels_updated', handleReelsUpdated);
    return () => window.removeEventListener('akselling_reels_updated', handleReelsUpdated);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            setActiveIndex(idx);
          }
        });
      },
      { threshold: [0.6] }
    );
    const items = containerRef.current?.querySelectorAll('[data-index]');
    items?.forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [reels]);

  const toggleLike = (id: string) => {
    setReels(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
          : r
      )
    );
  };

  const toggleFollow = (id: string) => {
    setFollowing(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleComments = (id: string) => {
    setOpenComments(openComments === id ? null : id);
  };

  const addComment = (reelId: string) => {
    if (!commentText.trim()) return;
    setComments(prev => [
      ...prev,
      { id: 'c' + Date.now(), reelId, user: 'You', text: commentText, time: 'now' },
    ]);
    setCommentText('');
    setReels(prev =>
      prev.map(r => (r.id === reelId ? { ...r, comments: r.comments + 1 } : r))
    );
  };

  const handleShare = (id: string) => {
    setSharedReel(id);
    setReels(prev =>
      prev.map(r => (r.id === id ? { ...r, shares: r.shares + 1 } : r))
    );
    setTimeout(() => setSharedReel(null), 2500);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black overflow-y-auto snap-y snap-mandatory no-scrollbar">
        <div ref={containerRef} className="h-full">
          {reels.map((reel, index) => (
            <ReelItem
              key={reel.id}
              reel={reel}
              index={index}
              isActive={index === activeIndex}
              muted={muted}
              isFollowing={!!following[reel.id]}
              onToggleMute={() => setMuted(!muted)}
              onLike={() => toggleLike(reel.id)}
              onFollow={() => toggleFollow(reel.id)}
              onToggleComments={() => toggleComments(reel.id)}
              onShare={() => handleShare(reel.id)}
              shared={sharedReel === reel.id}
              onProductClick={() => onProductClick(reel.product)}
            />
          ))}
        </div>
      </div>

      {/* Comments Drawer */}
      {openComments && (
        <div className="fixed inset-0 z-[55] flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenComments(null)} />
          <div className="relative w-full bg-white rounded-t-2xl max-h-[60vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">
                Comments ({comments.filter(c => c.reelId === openComments).length})
              </h3>
              <button onClick={() => setOpenComments(null)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {comments.filter(c => c.reelId === openComments).map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-flipkart-100 flex items-center justify-center text-flipkart-600 text-xs font-bold shrink-0">
                    {c.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">{c.user} <span className="text-gray-400 font-normal ml-1">{c.time}</span></p>
                    <p className="text-sm text-gray-600 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
              {comments.filter(c => c.reelId === openComments).length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No comments yet. Be the first to comment!</p>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment(openComments)}
                placeholder="Add a comment..."
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-flipkart-500"
              />
              <button
                onClick={() => addComment(openComments)}
                className="w-9 h-9 rounded-full bg-flipkart-500 flex items-center justify-center text-white"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ReelItemProps {
  reel: VideoReel;
  index: number;
  isActive: boolean;
  muted: boolean;
  isFollowing: boolean;
  shared: boolean;
  onToggleMute: () => void;
  onLike: () => void;
  onFollow: () => void;
  onToggleComments: () => void;
  onShare: () => void;
  onProductClick: () => void;
}

function ReelItem({
  reel,
  index,
  isActive,
  muted,
  isFollowing,
  shared,
  onToggleMute,
  onLike,
  onFollow,
  onToggleComments,
  onShare,
  onProductClick,
}: ReelItemProps) {
  const { addToCart } = useCart();
  const [showAdded, setShowAdded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const handleAddToCart = () => {
    addToCart(reel.product);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  const storeHandle = (reel.sellerStoreName || 'akselling')
    .toLowerCase()
    .replace(/\s+/g, '');

  return (
    <div
      data-index={index}
      className="h-full w-full snap-start relative flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden"
    >
      <div className="relative w-full h-full">
        {reel.videoUrl ? (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            poster={reel.thumbnail}
            playsInline
            loop
            muted={muted}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={reel.thumbnail}
            alt={reel.title}
            className="w-full h-full object-cover opacity-90"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/75" />

        {!reel.videoUrl && isActive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 animate-pulse">
              <Play size={32} className="text-white fill-white" />
            </div>
          </div>
        )}

        <button
          onClick={onToggleMute}
          className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors z-10"
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Share toast */}
        {shared && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 animate-fade-in z-20">
            <Check size={16} className="text-success-500" />
            <span className="text-sm font-medium text-gray-800">Link copied!</span>
          </div>
        )}

        {/* Right side actions */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
          <button onClick={onLike} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <div className={`p-2 rounded-full transition-colors ${reel.liked ? 'text-rose-500' : 'text-white'}`}>
              <Heart size={28} className={reel.liked ? 'fill-rose-500' : ''} />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(reel.likes)}</span>
          </button>
          <button onClick={onToggleComments} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <div className="p-2 text-white">
              <MessageCircle size={28} />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(reel.comments)}</span>
          </button>
          <button onClick={onShare} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <div className="p-2 text-white">
              <Share2 size={28} />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(reel.shares)}</span>
          </button>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-16 p-4 z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-[#9f2089] flex items-center justify-center text-white font-black text-xs shadow-md">
              {(reel.sellerStoreName || 'AK').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-sm">@{storeHandle}</span>
                {reel.sellerStoreName && (
                  <span className="bg-amber-400/90 text-gray-900 text-[9px] font-black px-1.5 py-0.2 rounded">
                    SELLER
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onFollow}
              className={`ml-1 text-xs font-bold px-3 py-0.5 rounded-full transition-colors ${
                isFollowing
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-[#9f2089] text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
          <p className="text-white text-sm font-bold mb-1">{reel.title}</p>
          <p className="text-white/80 text-xs mb-3 line-clamp-2">{reel.description}</p>

          <button
            onClick={onProductClick}
            className="flex items-center gap-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl p-2.5 w-full max-w-xs border border-white/20 transition-colors"
          >
            <img
              src={reel.product.images[0] || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'}
              alt=""
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/20"
            />
            <div className="flex-1 text-left min-w-0">
              <p className="text-white text-xs font-bold truncate">{reel.product.title}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-amber-300 text-sm font-black">{formatPrice(reel.product.price)}</span>
                <span className="text-white/60 text-xs line-through">{formatPrice(reel.product.mrp)}</span>
              </div>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              className={`shrink-0 rounded-xl p-2 transition-colors ${
                showAdded ? 'bg-emerald-500' : 'bg-[#9f2089]'
              }`}
            >
              {showAdded ? (
                <span className="text-white text-xs font-bold px-1">Added!</span>
              ) : (
                <ShoppingBag size={18} className="text-white" />
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
