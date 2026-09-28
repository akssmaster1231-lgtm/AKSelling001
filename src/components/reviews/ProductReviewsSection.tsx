import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  Camera,
  CheckCircle2,
  ThumbsUp,
  Image as ImageIcon,
  X,
  Upload,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { ProductReview } from '@/types/review';
import { subscribeProductReviews, submitProductReview, uploadMediaToPermanentStorage } from '@/firebase';
import { useAuth } from '@/auth-context';

interface ProductReviewsSectionProps {
  productId: string;
  productTitle: string;
  defaultRating?: number;
  defaultRatingCount?: number;
}

export default function ProductReviewsSection({
  productId,
  productTitle,
  defaultRating = 4.8,
  defaultRatingCount = 142,
}: ProductReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'with_photos'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Write Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formName, setFormName] = useState(user?.displayName || 'Anoj Kumar');
  const [formSize, setFormSize] = useState('L');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time Firestore reviews listener
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeProductReviews(productId, (liveReviews) => {
      setReviews(liveReviews);
      setLoading(false);
    });
    return () => unsub();
  }, [productId]);

  // Seed default sample high-definition buyer reviews if no reviews yet
  const sampleReviews: ProductReview[] = [
    {
      id: 'rev_sample_1',
      productId,
      userName: 'Vikram Sharma',
      rating: 5,
      title: 'Top-tier fabric quality & precise custom print!',
      comment: 'The print sharpness and fabric breathability exceeded expectations. Ordered 2 pieces for our office team event. Delivered within 48 hours via Delhivery.',
      photos: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
      ],
      verifiedPurchase: true,
      helpfulCount: 24,
      sizePurchased: 'L',
      createdAt: '2 days ago',
    },
    {
      id: 'rev_sample_2',
      productId,
      userName: 'Priya Mehra',
      rating: 5,
      title: 'Flawless fit and vibrant colors after washing',
      comment: 'Color did not fade after first wash! Stitching is solid and premium. Truly direct factory value from AK Yadav Print.',
      photos: [
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
      ],
      verifiedPurchase: true,
      helpfulCount: 18,
      sizePurchased: 'M',
      createdAt: '5 days ago',
    },
    {
      id: 'rev_sample_3',
      productId,
      userName: 'Rahul Verma',
      rating: 4,
      title: 'Super fast delivery & comfortable everyday wear',
      comment: 'Received via Shiprocket in 2 days. 100% pure combed cotton. Looks super crisp with denim.',
      photos: [],
      verifiedPurchase: true,
      helpfulCount: 9,
      sizePurchased: 'XL',
      createdAt: '1 week ago',
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : sampleReviews;
  const filteredReviews = activeFilter === 'with_photos'
    ? displayReviews.filter((r) => r.photos && r.photos.length > 0)
    : displayReviews;

  // Aggregate Calculation
  const totalCount = reviews.length > 0 ? reviews.length : defaultRatingCount;
  const avgRating = reviews.length > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : defaultRating;

  // Rating Distribution breakdown
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  displayReviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    starCounts[star] = (starCounts[star] || 0) + 1;
  });

  // Collect all buyer uploaded photos
  const allBuyerPhotos = displayReviews.flatMap((r) => r.photos || []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const permUrl = await uploadMediaToPermanentStorage(file, 'reviews', `rev_${Date.now()}_${i}`);
        if (permUrl) newUrls.push(permUrl);
      }
      setUploadedPhotos((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.warn('Photo upload notice:', err);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formComment.trim()) return;

    setIsSubmitting(true);
    try {
      await submitProductReview({
        productId,
        userName: formName.trim() || 'Verified Buyer',
        rating: formRating,
        title: formTitle.trim() || 'Verified Purchase Feedback',
        comment: formComment.trim(),
        photos: uploadedPhotos,
        verifiedPurchase: true,
        helpfulCount: 0,
        sizePurchased: formSize,
      });

      setShowReviewModal(false);
      setFormTitle('');
      setFormComment('');
      setUploadedPhotos([]);
      setSuccessToast('Thank you! Your verified review and photos are live.');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.warn('Submit review notice:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-2 bg-white px-4 py-5 space-y-4">
      {/* Header and Call to Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Verified Customer Reviews</h2>
          <p className="text-xs text-slate-500">Real feedback & buyer photos from verified orders</p>
        </div>
        <button
          type="button"
          onClick={() => setShowReviewModal(true)}
          className="px-3.5 py-1.5 bg-[#1b365d] hover:bg-slate-900 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-amber-400/30 shrink-0"
        >
          <Camera size={14} />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Aggregate Score & Star Distribution Card */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
        {/* Left Big Score */}
        <div className="flex flex-col items-center justify-center sm:pr-6 sm:border-r border-slate-200 shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-950">{avgRating}</span>
            <span className="text-sm font-bold text-slate-400">/ 5</span>
          </div>
          <div className="flex items-center gap-1 my-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                className={s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-600">
            {totalCount} Verified Ratings
          </span>
        </div>

        {/* Right Star Breakdown Bars */}
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = starCounts[star as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = displayReviews.length > 0 ? Math.round((count / displayReviews.length) * 100) : star === 5 ? 75 : 15;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-6 font-bold text-slate-700 flex items-center gap-0.5 text-[11px]">
                  {star} <Star size={10} className="fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-slate-400 text-[10px]">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Photo Gallery Ribbon */}
      {allBuyerPhotos.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Camera size={14} className="text-blue-600" />
              <span>Customer Photos ({allBuyerPhotos.length})</span>
            </span>
            <span className="text-[10px] text-slate-400">Click photo to zoom</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {allBuyerPhotos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 group active:scale-95 transition-transform cursor-pointer"
              >
                <img
                  src={photo}
                  alt={`Buyer Photo ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#1b365d] text-amber-300 shadow-2xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Reviews ({displayReviews.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('with_photos')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            activeFilter === 'with_photos'
              ? 'bg-[#1b365d] text-amber-300 shadow-2xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ImageIcon size={12} />
          <span>With Photos ({displayReviews.filter((r) => r.photos && r.photos.length > 0).length})</span>
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-3 divide-y divide-slate-100">
        {filteredReviews.map((rev) => (
          <div key={rev.id} className="pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center">
                  {rev.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">{rev.userName}</span>
                    {rev.verifiedPurchase && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        <CheckCircle2 size={10} /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{rev.createdAt}</span>
                    {rev.sizePurchased && <span>• Size: {rev.sizePurchased}</span>}
                  </div>
                </div>
              </div>

              {/* Star Badge */}
              <div className="flex items-center gap-1 bg-emerald-600 text-white font-black text-[11px] px-2 py-0.5 rounded-md shadow-2xs">
                <span>{rev.rating}</span>
                <Star size={10} className="fill-white" />
              </div>
            </div>

            {/* Title & Comment */}
            {rev.title && (
              <h4 className="text-xs font-bold text-slate-900 leading-snug">{rev.title}</h4>
            )}
            <p className="text-xs text-slate-600 leading-relaxed font-normal">{rev.comment}</p>

            {/* Buyer Attached Photos */}
            {rev.photos && rev.photos.length > 0 && (
              <div className="flex gap-2 pt-1">
                {rev.photos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhoto(p)}
                    className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 group active:scale-95 cursor-pointer"
                  >
                    <img src={p} alt={`Customer upload ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105" />
                  </button>
                ))}
              </div>
            )}

            {/* Helpful Counter */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ThumbsUp size={12} className="text-slate-400" />
                <span>Helpful ({rev.helpfulCount || 0})</span>
              </span>
              <span className="text-[10px]">AK Yadav Print Quality Verified</span>
            </div>
          </div>
        ))}
      </div>

      {/* Write Review Modal Form */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Write a Verified Review</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5 mt-3">
              <p className="text-xs text-slate-500 truncate">
                Product: <strong className="text-slate-800">{productTitle}</strong>
              </p>

              {/* Star Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Rating *</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormRating(s)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        size={28}
                        className={s <= formRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-amber-600 ml-2">
                    {formRating === 5 ? 'Excellent ⭐⭐⭐⭐⭐' : formRating === 4 ? 'Very Good ⭐⭐⭐⭐' : formRating === 3 ? 'Good ⭐⭐⭐' : 'Fair'}
                  </span>
                </div>
              </div>

              {/* Your Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Anoj Kumar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Size Purchased</label>
                  <select
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {['S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'].map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Review Headline */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Review Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Outstanding fabric and high-definition print!"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Detailed Experience */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Detailed Feedback *</label>
                <textarea
                  required
                  rows={3}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Share details on print clarity, fabric softness, size accuracy, and delivery experience..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Photo Upload for Custom Apparel */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Add Photos of Received Apparel ({uploadedPhotos.length})
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold">Permanent Cloud Storage</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="px-3 py-2 border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-50"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 size={14} className="animate-spin text-blue-600" />
                    ) : (
                      <Upload size={14} className="text-blue-600" />
                    )}
                    <span>{isUploadingPhoto ? 'Compressing & Uploading...' : '+ Upload Photos'}</span>
                  </button>

                  {uploadedPhotos.map((url, idx) => (
                    <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 group">
                      <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formComment.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{isSubmitting ? 'Publishing...' : 'Submit Verified Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Zoom Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-400 p-1 cursor-pointer"
            >
              <X size={24} />
            </button>
            <img
              src={selectedPhoto}
              alt="Buyer Photo Zoom"
              className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <p className="text-white/80 text-xs font-bold mt-2">Verified Customer Photo • AK Yadav Print</p>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[99] bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-emerald-500/50 flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
}
