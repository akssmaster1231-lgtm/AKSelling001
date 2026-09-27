import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Upload,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShoppingBag,
  User,
  Music,
} from 'lucide-react';
import {
  subscribeVideoReels,
  saveVideoReelToFirestore,
  deleteVideoReelFromFirestore,
  type VideoReelItem,
} from '@/utils/videoReelsService';
import { getCachedProducts } from '@/firebase';
import type { Product } from '@/types';

export function AdminVideoReelsManager() {
  const [reels, setReels] = useState<VideoReelItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [creatorName, setCreatorName] = useState('AKSelling Official (ANOJKUMAR)');
  const [songTitle, setSongTitle] = useState('Original Audio • AKSelling (Sound Active)');
  const [tag, setTag] = useState('Oversized Tees');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Preview video player
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. Subscribe to video reels
    const unsubscribe = subscribeVideoReels((data) => {
      setReels(data);
    });

    // 2. Load store products for linking
    const prods = getCachedProducts();
    setProducts(prods);

    return () => unsubscribe();
  }, []);

  // Handle Video File Selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 35MB for browser video upload
    if (file.size > 35 * 1024 * 1024) {
      setStatusMsg({
        text: 'वीडियो का साइज़ 35MB से कम होना चाहिए। कृपया छोटा वीडियो चुनें।',
        type: 'error',
      });
      return;
    }

    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);

    // Auto-generate poster from video frame at 1s
    const tempVideo = document.createElement('video');
    tempVideo.src = objectUrl;
    tempVideo.crossOrigin = 'anonymous';
    tempVideo.currentTime = 1.0;
    tempVideo.onloadeddata = () => {
      tempVideo.currentTime = Math.min(1.0, tempVideo.duration / 2);
    };
    tempVideo.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(640, tempVideo.videoWidth || 480);
        canvas.height = Math.min(960, tempVideo.videoHeight || 720);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          const framePoster = canvas.toDataURL('image/jpeg', 0.82);
          setPosterUrl(framePoster);
        }
      } catch (err) {
        console.warn('Frame capture notice:', err);
      }
    };
  };

  // Handle Poster Image Upload
  const handlePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setPosterUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Convert File to permanent Data URL or upload
  const processVideoForSave = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read video file'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl && !videoFile) {
      setStatusMsg({ text: 'कृपया वीडियो फ़ाइल या वीडियो URL प्रदान करें।', type: 'error' });
      return;
    }
    if (!caption.trim()) {
      setStatusMsg({ text: 'कृपया वीडियो का शीर्षक/कैप्शन लिखें।', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      let finalVideoUrl = videoUrl;
      // If a local file was uploaded and is smaller than 12MB, convert to persistent data URL
      if (videoFile && fileIsUnderLimit(videoFile, 12)) {
        try {
          finalVideoUrl = await processVideoForSave(videoFile);
        } catch {
          // fallback to current url
        }
      }

      // Find linked product details
      const linkedProduct = products.find((p) => p.id === selectedProductId);
      const linkedProductPayload = linkedProduct
        ? {
            id: linkedProduct.id,
            title: linkedProduct.title,
            brand: linkedProduct.brand || 'AKSelling',
            price: linkedProduct.price,
            mrp: linkedProduct.mrp || linkedProduct.price,
            discount: linkedProduct.discount || 0,
            rating: linkedProduct.rating || 4.8,
            image: linkedProduct.images?.[0] || linkedProduct.image || '',
            sizes: linkedProduct.sizes || ['M', 'L', 'XL'],
            colors: linkedProduct.colors || ['Black', 'Navy Blue'],
          }
        : undefined;

      const newReel: VideoReelItem = {
        id: `reel_${Date.now()}`,
        productId: selectedProductId || (linkedProduct ? linkedProduct.id : ''),
        videoUrl: finalVideoUrl,
        posterUrl: posterUrl || (linkedProduct?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'),
        creatorName: creatorName.trim() || 'AKSelling Official (ANOJKUMAR)',
        creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        caption: caption.trim(),
        songTitle: songTitle.trim() || 'Original Audio • AKSelling (Sound Active)',
        likesCount: Math.floor(Math.random() * 200) + 50,
        commentsCount: Math.floor(Math.random() * 30) + 5,
        sharesCount: Math.floor(Math.random() * 50) + 10,
        tag: tag || 'Fashion',
        audioEnabled: audioEnabled,
        product: linkedProductPayload,
      };

      await saveVideoReelToFirestore(newReel);

      setStatusMsg({
        text: 'वीडियो रील आवाज़ (Sound) के साथ सफलतापूर्वक पब्लिश हो गई!',
        type: 'success',
      });

      // Reset form
      setVideoFile(null);
      setVideoUrl('');
      setPosterUrl('');
      setCaption('');
      setSelectedProductId('');
      setShowAddForm(false);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      console.error('Failed to save reel:', err);
      setStatusMsg({
        text: 'वीडियो सेव करने में समस्या आई। कृपया पुनः प्रयास करें।',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileIsUnderLimit = (file: File, mb: number) => file.size <= mb * 1024 * 1024;

  const handleDeleteReel = async (reelId: string) => {
    if (!window.confirm('क्या आप सच में इस वीडियो रील को हटाना चाहते हैं?')) return;
    try {
      await deleteVideoReelFromFirestore(reelId);
      setStatusMsg({ text: 'वीडियो रील हटा दी गई।', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg({ text: 'वीडियो हटाने में समस्या आई।', type: 'error' });
    }
  };

  const togglePreviewPlay = () => {
    if (!previewVideoRef.current) return;
    if (previewVideoRef.current.paused) {
      previewVideoRef.current.play();
      setIsPreviewPlaying(true);
    } else {
      previewVideoRef.current.pause();
      setIsPreviewPlaying(false);
    }
  };

  const togglePreviewMute = () => {
    if (!previewVideoRef.current) return;
    const nextState = !previewVideoRef.current.muted;
    previewVideoRef.current.muted = nextState;
    setIsPreviewMuted(nextState);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-4 text-white shadow-lg border border-purple-500/30">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Video size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>वीडियो रील्स व शॉर्ट्स अपलोड सेक्शन</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Volume2 size={11} /> आवाज़ के साथ (Audio Active)
                </span>
              </h2>
              <p className="text-[11px] text-purple-200">
                पब्लिक यूज़र्स को सीधे होमपेज व रील्स फ़ीड पर आवाज़ के साथ लाइव दिखाएं
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
          >
            {showAddForm ? <Trash2 size={14} /> : <Plus size={14} />}
            <span>{showAddForm ? 'बंद करें' : '+ नया वीडियो अपलोड करें'}</span>
          </button>
        </div>

        {/* Info stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-purple-800/40 text-[11px]">
          <div className="bg-white/5 rounded-xl p-2 border border-white/10">
            <span className="text-purple-300 block text-[10px]">कुल एक्टिव रील्स</span>
            <span className="font-black text-white text-sm">{reels.length} Videos</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 border border-white/10">
            <span className="text-purple-300 block text-[10px]">ऑडियो स्टेटस</span>
            <span className="font-black text-emerald-400 text-sm flex items-center gap-1">
              <Volume2 size={13} /> 100% फुल साउंड
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 border border-white/10">
            <span className="text-purple-300 block text-[10px]">डायरेक्ट शॉप</span>
            <span className="font-black text-amber-300 text-sm flex items-center gap-1">
              <ShoppingBag size={13} /> Buy Now बटन
            </span>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Upload Form Modal / Drawer */}
      {showAddForm && (
        <div className="bg-white rounded-2xl p-4 shadow-card border-2 border-purple-500 animate-scale-in">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Video size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">
                  नया वीडियो अपलोड करें (Upload Video with Sound)
                </h3>
                <p className="text-[11px] text-gray-500">
                  MP4 / WebM वीडियो आवाज़ के साथ अपलोड होगा और यूज़र्स को तुरंत दिखेगा
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold text-gray-400 hover:text-gray-700 p-1"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmitReel} className="space-y-3.5">
            {/* 1. Video Source: File or URL */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                वीडियो फ़ाइल चुनें या लिंक डालें *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://.../my_video.mp4 या फ़ाइल अपलोड करें"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoFileChange}
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Upload size={14} />
                  <span>वीडियो फ़ाइल चुनें</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                <span>💡 सपोर्टेड: MP4, WebM, MOV. आवाज़ (Audio) स्वतः सुरक्षित रहेगी।</span>
              </p>
            </div>

            {/* Live Video Preview with Audio Controls */}
            {videoUrl && (
              <div className="p-3 bg-slate-900 rounded-xl text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-purple-300">
                    <Video size={14} /> लाइव वीडियो व आवाज़ प्रिव्यू (Sound Test)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePreviewMute}
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        isPreviewMuted ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {isPreviewMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      <span>{isPreviewMuted ? 'म्यूट है' : 'आवाज़ चालू है (Sound ON)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={togglePreviewPlay}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isPreviewPlaying ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPreviewPlaying ? 'पॉज़' : 'चलाएं'}</span>
                    </button>
                  </div>
                </div>

                <div className="relative w-full aspect-[9/14] max-h-64 mx-auto rounded-lg overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                  <video
                    ref={previewVideoRef}
                    src={videoUrl}
                    poster={posterUrl}
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    onPlay={() => setIsPreviewPlaying(true)}
                    onPause={() => setIsPreviewPlaying(false)}
                  />
                  {!isPreviewPlaying && (
                    <button
                      type="button"
                      onClick={togglePreviewPlay}
                      className="absolute p-3 rounded-full bg-purple-600/80 text-white shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Play size={20} className="ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Poster / Cover Image */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                कवर / पोस्टर फोटो (Poster Thumbnail)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="ऑटो-कैप्चर होगी या फोटो का URL डालें..."
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="file"
                  ref={posterInputRef}
                  onChange={handlePosterFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => posterInputRef.current?.click()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  कवर चुनें
                </button>
              </div>
            </div>

            {/* Caption & Song Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  कैप्शन / विवरण (Caption) *
                </label>
                <input
                  type="text"
                  required
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. 100% Combed Cotton Oversized T-Shirt Review 🔥"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  ऑडियो / आवाज़ का नाम (Song/Audio Name)
                </label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="e.g. Original Sound • ANOJKUMAR"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Creator Name & Category Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  दुकान / क्रिएटर का नाम (Creator)
                </label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="AKSelling Official (ANOJKUMAR)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  कैटेगरी टैग (Tag)
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                >
                  <option value="Oversized Tees">Oversized Tees (टी-शर्ट्स)</option>
                  <option value="T-Shirts">T-Shirts (कॉटन टी-शर्ट)</option>
                  <option value="Ethnic Wear">Ethnic Wear (कुर्ता / एथनिक)</option>
                  <option value="Winterwear">Winterwear (हुडी / जैकेट्स)</option>
                  <option value="Footwear">Footwear (जूते / स्नीकर्स)</option>
                  <option value="Accessories">Accessories (एक्सेसरीज)</option>
                  <option value="New Arrival">New Arrival (नया स्टॉक)</option>
                </select>
              </div>
            </div>

            {/* Link Store Product */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span>दुकान का प्रोडक्ट लिंक करें (Link Store Product for Instant Buy)</span>
                <span className="text-[10px] text-purple-600 font-semibold">
                  यूज़र्स वीडियो देखते हुए सीधे खरीद सकेंगे
                </span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="">-- कोई प्रोडक्ट लिंक करें (वैकल्पिक) --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (₹{p.price})
                  </option>
                ))}
              </select>
            </div>

            {/* Sound Notice Checkbox */}
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 block">
                    आवाज़ चालू रखें (Sound / Audio Enabled)
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    यूज़र्स वीडियो को ओरिजिनल आवाज़ व बैकग्राउंड म्यूज़िक के साथ सुन पाएंगे
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                कैंसिल
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>पब्लिश हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>वीडियो रील पब्लिश करें (Publish Live)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Reels List */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
              <Video size={14} className="text-purple-600" />
              <span>सक्रिय वीडियो रील्स ({reels.length})</span>
            </h3>
            <p className="text-[11px] text-gray-500">
              यह वीडियो होमपेज और 'Video Reels' फ़ीड में पब्लिक यूज़र्स को दिख रहे हैं
            </p>
          </div>
        </div>

        {reels.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Video size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold">अभी कोई वीडियो नहीं है</p>
            <p className="text-[11px] text-gray-400">
              ऊपर दिए '+ नया वीडियो अपलोड करें' बटन से पहला वीडियो जोड़ें
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reels.map((reel) => (
              <div
                key={reel.id}
                className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex gap-3 hover:border-purple-300 transition-colors"
              >
                {/* Poster / Video thumb */}
                <div className="relative w-20 h-28 rounded-lg overflow-hidden bg-black shrink-0 border border-gray-300">
                  <img
                    src={reel.posterUrl}
                    alt={reel.caption}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play size={18} className="text-white fill-white/80" />
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1 rounded flex items-center gap-0.5">
                    <Volume2 size={9} /> Sound
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="bg-purple-100 text-purple-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                        {reel.tag}
                      </span>
                      {reel.product && (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 truncate">
                          <ShoppingBag size={9} /> ₹{reel.product.price}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mb-1">
                      {reel.caption}
                    </h4>

                    <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                      <User size={10} className="shrink-0" />
                      <span>{reel.creatorName}</span>
                    </p>

                    <p className="text-[10px] text-purple-700 flex items-center gap-1 truncate font-medium mt-0.5">
                      <Music size={10} className="shrink-0" />
                      <span>{reel.songTitle}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                    <span className="text-[10px] font-bold text-gray-500">
                      ❤️ {reel.likesCount} लाइक्स
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteReel(reel.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="डिलीट करें"
                    >
                      <Trash2 size={13} />
                      <span>हटाएं</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
