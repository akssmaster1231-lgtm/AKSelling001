import React, { useState, useRef } from 'react';
import {
  Video,
  Plus,
  Upload,
  Film,
  Trash2,
  CheckCircle2,
  X,
  Play,
  ShoppingBag,
  Sparkles,
  Layers,
  Heart,
  Eye,
  MessageCircle,
} from 'lucide-react';
import type { SellerProduct } from '@/types/supplier';
import type { Product, VideoReel } from '@/types';
import {
  getCustomReels,
  addSellerReel,
  deleteSellerReel,
  SAMPLE_PRODUCT_VIDEOS,
} from '@/utils/reelsHelper';

interface SupplierReelsStudioProps {
  storeName?: string;
  sellerProducts?: SellerProduct[];
  products?: SellerProduct[];
  isOpen?: boolean;
  onClose: () => void;
  onNavigateToPlay?: () => void;
}

export default function SupplierReelsStudio({
  storeName = 'AK Yadav Prints',
  sellerProducts,
  products,
  onClose,
}: SupplierReelsStudioProps) {
  const allSellerProducts = sellerProducts || products || [];
  const [activeTab, setActiveTab] = useState<'upload' | 'my_reels'>('upload');
  const [customReels, setCustomReels] = useState<VideoReel[]>(() => {
    return getCustomReels();
  });

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    allSellerProducts[0]?.id || ''
  );
  const [videoUrl, setVideoUrl] = useState<string>(SAMPLE_PRODUCT_VIDEOS[0]?.url || '');
  const [thumbnail, setThumbnail] = useState<string>(SAMPLE_PRODUCT_VIDEOS[0]?.thumbnail || '');
  const [uploadMode, setUploadMode] = useState<'file' | 'sample' | 'url'>('sample');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);

  // Selected product object
  const selectedSellerProduct = allSellerProducts.find(p => p.id === selectedProductId) || allSellerProducts[0];

  const mappedProduct: Product = selectedSellerProduct
    ? {
        id: selectedSellerProduct.id,
        title: selectedSellerProduct.title,
        description: selectedSellerProduct.description || '',
        price: selectedSellerProduct.price,
        mrp: selectedSellerProduct.mrp,
        discount: selectedSellerProduct.discount,
        category: selectedSellerProduct.category,
        images: selectedSellerProduct.images?.length > 0 ? selectedSellerProduct.images : [thumbnail],
        rating: selectedSellerProduct.rating || 4.5,
        ratingCount: selectedSellerProduct.views || 85,
        brand: selectedSellerProduct.brand || storeName,
        inStock: selectedSellerProduct.stock > 0 || selectedSellerProduct.status === 'live',
        delivery: 'Free Express Delivery',
      }
    : {
        id: 'sp_default',
        title: title || 'Premium Store Product',
        description: description || 'High quality product showcase',
        price: 999,
        mrp: 1999,
        discount: 50,
        category: 'fashion',
        images: [thumbnail || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'],
        rating: 4.5,
        ratingCount: 120,
        brand: storeName,
        inStock: true,
        delivery: 'Free delivery by tomorrow',
      };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const blobUrl = URL.createObjectURL(file);
      setVideoUrl(blobUrl);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch {
      // fallback
    }
  };

  const handleThumbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setThumbnail(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublishReel = () => {
    if (!title.trim() && !selectedSellerProduct?.title) {
      alert('Please enter a Reel Title or select a product.');
      return;
    }

    setIsPublishing(true);

    const newReel = addSellerReel({
      title: title.trim() || selectedSellerProduct?.title || 'Product Spotlight',
      description:
        description.trim() ||
        `Check out our best seller ${selectedSellerProduct?.title || ''}! Available now on AKSelling. #trending #viral #deals`,
      product: mappedProduct,
      thumbnail: thumbnail || mappedProduct.images[0] || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg',
      videoUrl: videoUrl || undefined,
      sellerStoreName: storeName,
    });

    setCustomReels(prev => [newReel, ...prev]);
    setIsPublishing(false);
    setPublishSuccess(true);

    setTimeout(() => {
      setPublishSuccess(false);
      setActiveTab('my_reels');
    }, 1500);
  };

  const handleDelete = (reelId: string) => {
    if (window.confirm('Delete this video reel from Play Page?')) {
      deleteSellerReel(reelId);
      setCustomReels(prev => prev.filter(r => r.id !== reelId));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2874f0] via-[#1a65dc] to-[#1253b8] text-white p-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Film size={20} className="text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-white">AKSelling Seller Hub Reels Studio</h2>
                <span className="bg-yellow-400 text-gray-950 text-[9px] font-black px-1.5 py-0.2 rounded">
                  PLAY UPLOADER
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                Upload video reels to customer Play page • Flipkart Blue edition
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50/80 px-4 pt-2 gap-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-[#2874f0] text-[#2874f0] font-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Plus size={15} />
            <span>Upload New Reel</span>
          </button>
          <button
            onClick={() => setActiveTab('my_reels')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'my_reels'
                ? 'border-[#2874f0] text-[#2874f0] font-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers size={15} />
            <span>My Uploaded Reels ({customReels.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {publishSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-fade-in shadow-2xs">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>Video Reel Published Live to AKSelling Play Page!</span>
                </div>
              )}

              {/* 1. Tag Product Selector */}
              <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/80 space-y-2">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-[#2874f0]" />
                  Tag Product from Your Store *
                </label>
                <p className="text-[11px] text-gray-500">
                  Customers can tap "Buy Now" directly on your video reel to purchase this product.
                </p>

                <select
                  value={selectedProductId}
                  onChange={e => {
                    setSelectedProductId(e.target.value);
                    const prod = allSellerProducts.find(p => p.id === e.target.value);
                    if (prod) {
                      if (!title) setTitle(prod.title);
                      if (prod.images?.[0]) setThumbnail(prod.images[0]);
                    }
                  }}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2874f0]"
                >
                  {allSellerProducts.length === 0 && (
                    <option value="">No products in catalog yet (General Showcase)</option>
                  )}
                  {allSellerProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} — ₹{p.price} ({p.category})
                    </option>
                  ))}
                </select>

                {selectedSellerProduct && (
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                    <img
                      src={selectedSellerProduct.images?.[0] || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg border border-gray-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{selectedSellerProduct.title}</p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xs font-black text-[#2874f0]">₹{selectedSellerProduct.price}</span>
                        <span className="text-[10px] text-gray-400 line-through">₹{selectedSellerProduct.mrp}</span>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {selectedSellerProduct.discount}% Off
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Video Source Choice */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Video size={14} className="text-[#2874f0]" />
                  Product Video Source
                </label>

                {/* Upload Mode Selector */}
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`py-2 px-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      uploadMode === 'file'
                        ? 'bg-[#2874f0]/10 border-[#2874f0] text-[#2874f0]'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Upload size={14} />
                    <span>Upload Video File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadMode('sample');
                      if (!videoUrl) setVideoUrl(SAMPLE_PRODUCT_VIDEOS[0]?.url || '');
                    }}
                    className={`py-2 px-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      uploadMode === 'sample'
                        ? 'bg-[#2874f0]/10 border-[#2874f0] text-[#2874f0]'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Sparkles size={14} />
                    <span>Curated HD Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`py-2 px-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      uploadMode === 'url'
                        ? 'bg-[#2874f0]/10 border-[#2874f0] text-[#2874f0]'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Film size={14} />
                    <span>Video URL / MP4</span>
                  </button>
                </div>

                {/* Mode: File Upload */}
                {uploadMode === 'file' && (
                  <div
                    onClick={() => videoFileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-300 hover:border-[#2874f0] bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                  >
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-[#2874f0] flex items-center justify-center mx-auto shadow-2xs">
                      <Upload size={22} />
                    </div>
                    <p className="text-xs font-bold text-gray-800">
                      Tap or Drag Video File here (MP4, WebM, QuickTime)
                    </p>
                    <p className="text-[10px] text-gray-500">Fast streaming & vertical mobile format supported</p>
                  </div>
                )}

                {/* Mode: Sample Curated Video */}
                {uploadMode === 'sample' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-500">Select a high quality product loop video:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SAMPLE_PRODUCT_VIDEOS.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setVideoUrl(item.url);
                            setThumbnail(item.thumbnail);
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            videoUrl === item.url
                              ? 'border-[#2874f0] bg-blue-50 ring-1 ring-[#2874f0]'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg shrink-0"
                          />
                          <span className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode: Video URL */}
                {uploadMode === 'url' && (
                  <div>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      placeholder="https://example.com/video.mp4"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2874f0]"
                    />
                  </div>
                )}
              </div>

              {/* 3. Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1 block">
                    Reel Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Trendy Cotton Shirt Unboxing & Styling"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2874f0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1 block">
                    Caption & Hashtags
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Must-have summer wardrobe pick! Order now on AKSelling #shopping #fashion #deals"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2874f0] resize-none"
                  />
                </div>
              </div>

              {/* 4. Thumbnail & Video Player Preview */}
              <div className="bg-gray-900 text-white rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-yellow-300">
                    <Play size={14} className="fill-yellow-300" />
                    Buyer Feed Video Preview
                  </span>
                  <button
                    type="button"
                    onClick={() => thumbFileInputRef.current?.click()}
                    className="text-[11px] text-blue-200 hover:text-white underline font-semibold"
                  >
                    Change Cover Photo
                  </button>
                  <input
                    ref={thumbFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="relative aspect-[9/14] max-h-56 mx-auto rounded-xl overflow-hidden bg-black border border-white/20 shadow-lg">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      poster={thumbnail}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={thumbnail || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Overlay mock elements */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70 flex flex-col justify-between p-3 pointer-events-none">
                    <div className="flex items-center justify-between">
                      <span className="bg-black/50 text-[9px] font-bold px-2 py-0.5 rounded-full text-white backdrop-blur-xs">
                        @{(storeName || 'AKSelling').toLowerCase().replace(/\s+/g, '')}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-white line-clamp-1">
                        {title || 'Product Spotlight'}
                      </p>
                      {selectedSellerProduct && (
                        <div className="bg-white/20 backdrop-blur-md rounded-lg p-1.5 flex items-center gap-2 border border-white/20">
                          <img
                            src={selectedSellerProduct.images[0]}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-white truncate">
                              {selectedSellerProduct.title}
                            </p>
                            <p className="text-[10px] font-black text-yellow-300">
                              ₹{selectedSellerProduct.price}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Publish Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePublishReel}
                  disabled={isPublishing}
                  className="w-full bg-[#2874f0] hover:bg-[#1a65dc] active:bg-[#1253b8] text-white font-black text-sm py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Film size={18} />
                  <span>Publish Reel to AKSelling Play</span>
                </button>
              </div>
            </div>
          ) : (
            /* My Uploaded Reels Tab */
            <div className="space-y-3">
              {customReels.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2874f0] flex items-center justify-center mx-auto">
                    <Film size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">No custom video reels uploaded yet</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Upload product videos to engage shoppers and get 3x higher direct checkout conversions!
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-2 bg-[#2874f0] text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    + Upload First Reel
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
                    <span>Active Reels on Play Feed</span>
                    <span>{customReels.length} Reels</span>
                  </div>

                  {customReels.map(reel => (
                    <div
                      key={reel.id}
                      className="bg-white rounded-2xl p-3 border border-gray-200/90 shadow-2xs flex items-center gap-3 hover:border-blue-200 transition-all"
                    >
                      <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-black shrink-0">
                        <img
                          src={reel.thumbnail}
                          alt={reel.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play size={16} className="text-white fill-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded">
                            LIVE ON PLAY
                          </span>
                          <span className="text-[10px] text-gray-400 truncate">
                            {reel.sellerStoreName || storeName}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-gray-900 truncate mt-0.5">{reel.title}</h4>
                        <p className="text-[11px] text-gray-500 truncate">{reel.description}</p>

                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Eye size={12} className="text-[#2874f0]" />
                            {reel.views || 340} Views
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={12} className="text-rose-500" />
                            {reel.likes} Likes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={12} className="text-blue-500" />
                            {reel.comments} Comments
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(reel.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        title="Delete Reel"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
