import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  Plus,
  Link,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { compressImageFile } from '@/utils/imageCompressor';
import type { WizardStepProps } from './types';

const ANGLE_LABELS = [
  'Cover / Front View',
  'Back Angle',
  'Fabric / Print Close-Up',
  'Model / Side Angle',
  'Flat Lay / Packaging',
];

const SAMPLE_APPAREL_IMAGES = [
  {
    title: 'Oversized Tee (Front)',
    url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    title: 'Oversized Tee (Back)',
    url: 'https://images.pexels.com/photos/1232459/pexels-photo-1232459.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    title: 'Fabric Texture Zoom',
    url: 'https://images.pexels.com/photos/2294342/pexels-photo-2294342.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    title: 'Model Fit Angle',
    url: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
];

export default function Step2Media({
  formData,
  setFormData,
  onNext,
  onBack,
}: WizardStepProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = formData.images || [];

  // File upload handler
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setValidationError('');
    setIsCompressing(true);

    try {
      const remainingSlots = 5 - images.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      const processedUrls: string[] = [];
      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) continue;
        const compressedBase64 = await compressImageFile(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
        });
        processedUrls.push(compressedBase64);
      }

      if (processedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...processedUrls].slice(0, 5),
        }));
      }
    } catch (err) {
      console.error('Error compressing images:', err);
      setValidationError('Failed to process image file. Please try another image.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add via URL
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;
    if (images.length >= 5) {
      setValidationError('Maximum 5 images allowed per product catalog.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), cleanUrl].slice(0, 5),
    }));
    setUrlInput('');
    setValidationError('');
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Set as Primary (move to index 0)
  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setFormData(prev => {
      const copy = [...prev.images];
      const [item] = copy.splice(index, 1);
      return {
        ...prev,
        images: [item, ...copy],
      };
    });
  };

  // 1-Tap Preset Image adder
  const handleAddPresetImages = () => {
    const urls = SAMPLE_APPAREL_IMAGES.map(s => s.url);
    setFormData(prev => ({
      ...prev,
      images: Array.from(new Set([...(prev.images || []), ...urls])).slice(0, 5),
    }));
    setValidationError('');
  };

  // Insert description template
  const handleInsertDescTemplate = () => {
    const template = `• Premium Fabric: Crafted from 100% combed heavyweight cotton for supreme softness and breathable durability.
• High-Definition Print: Fade-resistant graphic artwork designed for premium daily streetwear.
• Tailored Comfort Fit: Engineered with drop shoulders and reinforced ribbed collar to retain shape after every wash.
• Care Instructions: Machine wash cold with like colors, do not iron directly on print.
• Guaranteed Quality: Dispatched directly from our verified manufacturing hub.`;
    setFormData(prev => ({
      ...prev,
      description: template,
    }));
  };

  const handleProceed = () => {
    if (images.length === 0) {
      setValidationError('Please upload at least 1 high-resolution product image.');
      return;
    }
    if (!formData.title.trim()) {
      setValidationError('Please enter a descriptive Product Title.');
      return;
    }
    setValidationError('');
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full mb-1">
          Step 2 of 5 • Media & Presentation
        </span>
        <h2 className="text-lg font-extrabold text-gray-900">
          Media Gallery & Basic Product Details
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">
          Upload up to 5 multi-angle HD product photos (front, back, fabric zoom) and write clear title & description.
        </p>
      </div>

      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2 animate-shake">
          <Info size={16} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Media Upload Area */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4.5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon size={16} className="text-flipkart-600" />
              <span>Multi-Angle Product Photos ({images.length}/5)</span>
              <span className="text-red-500">*</span>
            </h3>
            <p className="text-[11px] text-gray-500">
              First image serves as the Main Cover thumbnail on the home feed.
            </p>
          </div>

          {images.length < 5 && (
            <button
              type="button"
              onClick={handleAddPresetImages}
              className="inline-flex items-center gap-1 text-xs font-bold text-flipkart-700 hover:text-flipkart-800 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Sparkles size={14} />
              <span>⚡ Load Sample HD Apparel Images</span>
            </button>
          )}
        </div>

        {/* Upload Dropzone & URL input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Drag and Drop Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`md:col-span-2 border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              images.length >= 5
                ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                : 'bg-blue-50/30 hover:bg-blue-50/60 border-blue-300 hover:border-flipkart-500'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={images.length >= 5 || isCompressing}
              onChange={handleFilesSelected}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-flipkart-50 flex items-center justify-center text-flipkart-600 mb-2 shadow-xs">
              <Upload size={22} className={isCompressing ? 'animate-bounce' : ''} />
            </div>
            <p className="text-xs font-bold text-gray-800">
              {isCompressing
                ? 'Compressing and optimizing images...'
                : images.length >= 5
                ? 'Maximum 5 images reached'
                : 'Click or Drag & Drop Product Images'}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Supports JPEG, PNG, WEBP • Auto-compressed for fast buyer loading
            </p>
          </div>

          {/* Web URL Input */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                <Link size={14} className="text-gray-500" />
                <span>Or Paste Image URL</span>
              </p>
              <p className="text-[10px] text-gray-500 mb-2">
                Paste direct links from Imgur, Cloudinary, or Pexels
              </p>
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://example.com/tee.jpg"
                disabled={images.length >= 5}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-flipkart-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={!urlInput.trim() || images.length >= 5}
              className="mt-3 w-full py-2 text-xs font-bold text-flipkart-700 bg-blue-100/70 hover:bg-blue-100 disabled:opacity-50 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus size={14} />
              <span>Add URL Image</span>
            </button>
          </div>
        </div>

        {/* Gallery Preview Matrix */}
        {images.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold text-gray-700 mb-2">
              Uploaded Images Preview ({images.length}/5)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((img, idx) => {
                const isCover = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all group bg-gray-100 aspect-square flex flex-col justify-between shadow-xs ${
                      isCover ? 'border-flipkart-500 ring-2 ring-flipkart-400/40' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Product Angle ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Cover badge */}
                    {isCover && (
                      <span className="absolute top-1.5 left-1.5 bg-flipkart-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <Star size={10} fill="white" />
                        <span>Cover Photo</span>
                      </span>
                    )}

                    {/* Angle tag */}
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.5 rounded text-center truncate">
                      {ANGLE_LABELS[idx] || `Angle ${idx + 1}`}
                    </span>

                    {/* Hover actions */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="p-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-flipkart-600 rounded-lg shadow-sm transition-colors cursor-pointer"
                          title="Set as Main Cover Photo"
                        >
                          <Star size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                        title="Delete Image"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Product Title & Detailed Description */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-gray-900">
              Product Title <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] font-mono text-gray-500">
              {formData.title.length}/120
            </span>
          </div>
          <input
            type="text"
            maxLength={120}
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., AK Yadav Print Men's 240 GSM Heavyweight Oversized Cotton Graphic T-Shirt"
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-flipkart-500 font-medium"
            required
          />
          <p className="text-[11px] text-gray-500 mt-1">
            A descriptive title includes Brand, GSM/Fabric, Fit Type, and Sleeve Style for high search ranking.
          </p>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-gray-900">
              Detailed Product Description & Features
            </label>
            <button
              type="button"
              onClick={handleInsertDescTemplate}
              className="text-[11px] font-bold text-flipkart-600 hover:text-flipkart-700 underline cursor-pointer"
            >
              + Use Professional Bullet Template
            </button>
          </div>
          <textarea
            rows={5}
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe product highlights, fabric quality, feel, printing technology, and sizing advice..."
            className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-flipkart-500 font-normal leading-relaxed"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Category</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold text-white bg-flipkart-600 hover:bg-flipkart-700 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer"
          id="step2-next-btn"
        >
          <span>Next: Apparel Specs & Pricing</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
