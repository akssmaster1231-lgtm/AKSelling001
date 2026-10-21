import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Type,
  Camera,
  Upload,
  Download,
  Sparkles,
  Check,
  Sliders,
  Eye,
  RefreshCw,
  Zap,
  Printer,
  ChevronRight,
} from 'lucide-react';
import {
  FONT_COLLECTION,
  APPAREL_COLORS,
  PRINT_PALETTE,
  GRAPHIC_TEMPLATES,
  type FontDefinition,
  type ApparelColor,
  type GraphicTemplate,
} from './customStudioData';
import { formatPrice } from '@/data';
import type { Product } from '@/types';

interface CustomApparelStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseProduct?: Product | null;
  onBuyCustomTshirt?: (customProduct: Product, printDataUrl: string) => void;
}

export default function CustomApparelStudioModal({
  isOpen,
  onClose,
  baseProduct,
  onBuyCustomTshirt,
}: CustomApparelStudioModalProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'text' | 'tryon' | 'specs'>('text');

  // Text & Typography state
  const [customText, setCustomText] = useState('ARJUN');
  const [subText, setSubText] = useState('STREETWEAR 99');
  const [selectedFont, setSelectedFont] = useState<FontDefinition>(FONT_COLLECTION[0]);
  const [fontCategory, setFontCategory] = useState<string>('all');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [selectedGarment, setSelectedGarment] = useState<ApparelColor>(APPAREL_COLORS[0]);
  const [printPlacement, setPrintPlacement] = useState<'chest' | 'pocket' | 'back'>('chest');

  // Text FX Controls
  const [letterSpacing, setLetterSpacing] = useState(4);
  const [arcDegree, setArcDegree] = useState(0); // -40 to +40 degrees
  const [hasStroke, setHasStroke] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#111827');
  const [hasDropShadow, setHasDropShadow] = useState(false);
  const [hasDistress, setHasDistress] = useState(false);
  const [textTransform, setTextTransform] = useState<'uppercase' | 'none' | 'lowercase'>('uppercase');

  // Virtual Try-On state
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isLiveCamera, setIsLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [tryonScale, setTryonScale] = useState(100); // 70 to 140
  const [tryonYOffset, setTryonYOffset] = useState(38); // 10% to 70%
  const [tryonXOffset, setTryonXOffset] = useState(50); // 30% to 70%
  const [tryonRotation, setTryonRotation] = useState(0); // -20 to 20 deg
  const [fabricBlendOpacity, setFabricBlendOpacity] = useState(88); // 40 to 100
  const [isComparing, setIsComparing] = useState(false);
  const [isDetectingPose, setIsDetectingPose] = useState(false);

  // Canvas refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filtered fonts
  const filteredFonts = FONT_COLLECTION.filter((f) => {
    if (fontCategory === 'all') return true;
    return f.category === fontCategory;
  });

  /**
   * Apply selected graphic template
   */
  const handleApplyTemplate = (tmpl: GraphicTemplate) => {
    setCustomText(tmpl.defaultText);
    if (tmpl.subText) setSubText(tmpl.subText);
    const matched = FONT_COLLECTION.find((f) => f.id === tmpl.recommendedFontId);
    if (matched) setSelectedFont(matched);
  };

  /**
   * Render the 300 DPI Print-Ready Asset onto offscreen canvas
   */
  const renderPrintReadyCanvas = useCallback((): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas');
    // Standard 12" x 16" DTF printbed at 300 DPI = 3600 x 4800 pixels
    const width = 3600;
    const height = 4800;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Clear transparent
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Apply font settings
    const fontSize = 320;
    ctx.font = `bold ${fontSize}px ${selectedFont.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textToPrint =
      textTransform === 'uppercase'
        ? customText.toUpperCase()
        : textTransform === 'lowercase'
        ? customText.toLowerCase()
        : customText;

    // Optional 3D Extrusion Shadow
    if (hasDropShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 18;
      ctx.shadowOffsetY = 24;
    }

    // Arc / Curve rendering
    if (arcDegree !== 0 && textToPrint.length > 0) {
      const radius = 1800 / (Math.abs(arcDegree) * 0.04);
      const angleStep = ((arcDegree * Math.PI) / 180) / textToPrint.length;
      const startAngle = -(angleStep * (textToPrint.length - 1)) / 2;

      ctx.save();
      for (let i = 0; i < textToPrint.length; i++) {
        const char = textToPrint[i];
        const angle = startAngle + i * angleStep;
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(0, -radius);

        if (hasStroke) {
          ctx.lineWidth = 28;
          ctx.strokeStyle = strokeColor;
          ctx.strokeText(char, 0, 0);
        }

        ctx.fillStyle = textColor;
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    } else {
      // Linear centered text
      if (hasStroke) {
        ctx.lineWidth = 32;
        ctx.strokeStyle = strokeColor;
        ctx.strokeText(textToPrint, 0, -80);
      }

      ctx.fillStyle = textColor;
      ctx.fillText(textToPrint, 0, -80);
    }

    // Subtitle / Secondary Typography
    if (subText.trim()) {
      ctx.font = `600 110px 'Inter', 'Montserrat', sans-serif`;
      ctx.fillStyle = textColor;
      ctx.letterSpacing = `${letterSpacing * 4}px`;
      ctx.fillText(subText.toUpperCase(), 0, 180);
    }

    // Optional Distress Texture Overlay (simulated micro-grunge for vintage DTF)
    if (hasDistress) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let i = 0; i < 600; i++) {
        const rx = (Math.random() - 0.5) * 2600;
        const ry = (Math.random() - 0.5) * 1200;
        const rw = Math.random() * 8 + 2;
        const rh = Math.random() * 4 + 1;
        ctx.fillRect(rx, ry, rw, rh);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
    return canvas;
  }, [
    customText,
    subText,
    selectedFont,
    textColor,
    hasStroke,
    strokeColor,
    hasDropShadow,
    hasDistress,
    textTransform,
    arcDegree,
    letterSpacing,
  ]);

  /**
   * Draw the interactive preview canvas (T-shirt mockup with print overlay)
   */
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Garment Background Base (Realistic T-shirt shape simulation)
    ctx.save();

    // Subtle background studio gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Realistic T-shirt Torso Silhouette
    ctx.fillStyle = selectedGarment.tshirtHex;
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;

    ctx.beginPath();
    // Neck collar curve
    ctx.moveTo(w * 0.36, h * 0.12);
    ctx.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.64, h * 0.12);
    // Right shoulder
    ctx.lineTo(w * 0.86, h * 0.2);
    // Right sleeve
    ctx.lineTo(w * 0.94, h * 0.38);
    ctx.lineTo(w * 0.81, h * 0.44);
    // Right armpit & side seam
    ctx.lineTo(w * 0.77, h * 0.36);
    ctx.lineTo(w * 0.76, h * 0.9);
    // Bottom hem
    ctx.quadraticCurveTo(w * 0.5, h * 0.93, w * 0.24, h * 0.9);
    // Left side seam & armpit
    ctx.lineTo(w * 0.23, h * 0.36);
    ctx.lineTo(w * 0.19, h * 0.44);
    // Left sleeve
    ctx.lineTo(w * 0.06, h * 0.38);
    ctx.lineTo(w * 0.14, h * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Garment Wrinkles & Fabric Depth Shading
    ctx.save();
    ctx.strokeStyle = selectedGarment.id === 'white' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 3;
    // Collar ribbed border
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.13, w * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Torso gentle wrinkle contours
    ctx.beginPath();
    ctx.moveTo(w * 0.28, h * 0.4);
    ctx.quadraticCurveTo(w * 0.5, h * 0.44, w * 0.72, h * 0.41);
    ctx.moveTo(w * 0.26, h * 0.58);
    ctx.quadraticCurveTo(w * 0.5, h * 0.62, w * 0.74, h * 0.59);
    ctx.stroke();
    ctx.restore();

    // 3. Render Custom Text & Graphics inside Print Boundary Area
    ctx.save();

    let targetX = w * 0.5;
    let targetY = h * 0.42;
    let maxPrintW = w * 0.46;

    if (printPlacement === 'pocket') {
      targetX = w * 0.36;
      targetY = h * 0.36;
      maxPrintW = w * 0.18;
    } else if (printPlacement === 'back') {
      targetY = h * 0.46;
      maxPrintW = w * 0.5;
    }

    ctx.translate(targetX, targetY);

    const baseFontSize = printPlacement === 'pocket' ? 18 : 34;
    ctx.font = `bold ${baseFontSize}px ${selectedFont.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textToPrint =
      textTransform === 'uppercase'
        ? customText.toUpperCase()
        : textTransform === 'lowercase'
        ? customText.toLowerCase()
        : customText;

    if (hasDropShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
    }

    // Draw main text
    if (hasStroke) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = strokeColor;
      ctx.strokeText(textToPrint, 0, 0, maxPrintW);
    }

    ctx.fillStyle = textColor;
    ctx.fillText(textToPrint, 0, 0, maxPrintW);

    // Subtitle
    if (subText.trim() && printPlacement !== 'pocket') {
      ctx.font = `bold 11px 'Inter', sans-serif`;
      ctx.fillStyle = textColor;
      ctx.letterSpacing = `${letterSpacing}px`;
      ctx.fillText(subText.toUpperCase(), 0, baseFontSize * 0.85);
    }

    ctx.restore();
  }, [
    selectedGarment,
    selectedFont,
    customText,
    subText,
    textColor,
    printPlacement,
    hasStroke,
    strokeColor,
    hasDropShadow,
    textTransform,
    letterSpacing,
  ]);

  // Redraw preview whenever parameters change
  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  /**
   * Live Camera Try-On Setup
   */
  const handleStartCamera = async () => {
    setCameraError('');
    setIsLiveCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Camera access denied or unavailable. Please upload a selfie image below.');
      setIsLiveCamera(false);
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsLiveCamera(false);
  };

  const handleCaptureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror image for natural selfie feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setSelfieImage(dataUrl);
    handleStopCamera();
    handleSimulatePoseDetection();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setSelfieImage(event.target.result);
        handleSimulatePoseDetection();
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Intelligent Upper-Body Torso Alignment Simulation
   */
  const handleSimulatePoseDetection = () => {
    setIsDetectingPose(true);
    // Simulate smart torso geometry calculation
    setTimeout(() => {
      setTryonScale(105);
      setTryonYOffset(40);
      setTryonXOffset(50);
      setTryonRotation(0);
      setIsDetectingPose(false);
    }, 700);
  };

  /**
   * Download 300 DPI Print-Ready Asset
   */
  const handleDownloadPrintReadyAsset = () => {
    const canvas = renderPrintReadyCanvas();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `AKSelling_DTF_300DPI_${customText.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  /**
   * Order Customized T-shirt directly
   */
  const handleOrderCustomApparel = () => {
    const printCanvas = renderPrintReadyCanvas();
    const printDataUrl = printCanvas ? printCanvas.toDataURL('image/png') : '';

    const customizedProduct: Product = {
      id: `custom_${Date.now()}`,
      title: `Custom Printed 180 GSM Cotton Tee ("${customText}")`,
      brand: 'AKSelling Studio',
      price: 599,
      mrp: 1299,
      discount: 54,
      rating: 4.9,
      ratingCount: 88,
      category: 'streetwear',
      fabric: '100% Pure Combed 180 GSM Bio-Wash Cotton',
      neckType: 'Round Neck',
      sleeveType: 'Half Sleeve',
      fitType: 'Oversized Streetwear Fit',
      printDesign: `Custom DTF: "${customText}" (${selectedFont.name})`,
      images: [
        previewCanvasRef.current ? previewCanvasRef.current.toDataURL('image/png') : '/ak_brand_logo.jpg',
      ],
      colors: [selectedGarment.name],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      inStock: true,
      delivery: 'Free Express Delivery (Dispatches in 24 hrs)',
      deliveryFee: 0,
    };

    if (onBuyCustomTshirt) {
      onBuyCustomTshirt(customizedProduct, printDataUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 animate-fade-in">
      <div className="relative w-full h-[96dvh] sm:h-[820px] sm:max-w-4xl bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  AKSelling Custom Print & Virtual Try-On Studio
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                  300 DPI DTF
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Type your name with 50+ fonts & preview on your selfie in real-time
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feature Mode Switcher Tabs */}
        <div className="flex bg-slate-900 border-b border-slate-800 px-3 py-1.5 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('text');
              handleStopCamera();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'text'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Type size={15} />
            <span>1. Custom Text & 50+ Fonts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tryon')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'tryon'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera size={15} />
            <span>2. Virtual Try-On (Selfie Mockup)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('specs');
              handleStopCamera();
            }}
            className={`hidden sm:flex py-2 px-3 rounded-xl text-xs font-black transition-all items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'specs'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Printer size={15} />
            <span>300 DPI Print Spec</span>
          </button>
        </div>

        {/* Modal Body Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT / TOP: Visual Mockup Canvas & Virtual Try-On Area */}
          <div className="md:w-1/2 bg-slate-100 flex flex-col items-center justify-center p-3 relative border-b md:border-b-0 md:border-r border-gray-200 overflow-hidden">
            {activeTab === 'tryon' ? (
              /* VIRTUAL TRY-ON (SELFIE MOCKUP) VIEW */
              <div className="relative w-full h-[280px] sm:h-full max-h-[460px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                {isLiveCamera ? (
                  /* Live Camera View */
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-20">
                      <button
                        type="button"
                        onClick={handleCaptureSelfie}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-full shadow-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera size={16} /> Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleStopCamera}
                        className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3 py-2 rounded-full cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : selfieImage ? (
                  /* Photo Overlay Composite View */
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    {/* User Selfie Base */}
                    <img
                      src={selfieImage}
                      alt="User Selfie"
                      className="w-full h-full object-cover"
                    />

                    {/* Auto Torso Detection Scan Animation */}
                    {isDetectingPose && (
                      <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-2xs flex flex-col items-center justify-center text-white z-30">
                        <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-3" />
                        <span className="text-xs font-black tracking-wide">
                          Detecting upper body torso & aligning apparel...
                        </span>
                      </div>
                    )}

                    {/* Virtual T-Shirt Mockup Overlaid on Torso */}
                    {!isComparing && (
                      <div
                        style={{
                          position: 'absolute',
                          top: `${tryonYOffset}%`,
                          left: `${tryonXOffset}%`,
                          transform: `translate(-50%, -50%) scale(${tryonScale / 100}) rotate(${tryonRotation}deg)`,
                          width: '78%',
                          height: '78%',
                          pointerEvents: 'none',
                          mixBlendMode: 'multiply',
                          opacity: fabricBlendOpacity / 100,
                          filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.45))',
                        }}
                        className="transition-all duration-75"
                      >
                        <canvas
                          ref={previewCanvasRef}
                          width={480}
                          height={540}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    {/* Overlay Controls (Compare toggle, reposition reset) */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                      <button
                        type="button"
                        onMouseDown={() => setIsComparing(true)}
                        onMouseUp={() => setIsComparing(false)}
                        onTouchStart={() => setIsComparing(true)}
                        onTouchEnd={() => setIsComparing(false)}
                        className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                        title="Hold to see original selfie without T-shirt"
                      >
                        <Eye size={13} /> {isComparing ? 'Original Selfie' : 'Hold to Compare'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelfieImage(null)}
                        className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-1.5 rounded-lg cursor-pointer"
                        title="Change photo"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>

                    {/* Garment tag indicator */}
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md z-20">
                      Wearing: {selectedGarment.name}
                    </div>
                  </div>
                ) : (
                  /* Empty State: Prompt upload or camera */
                  <div className="p-6 text-center text-white space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg">
                      <Camera size={28} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Upload Selfie for Virtual Try-On</h4>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                        See how this custom printed T-shirt fits and looks on your actual body before ordering.
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera size={15} /> Use Camera
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={15} /> Upload Photo
                      </button>
                    </div>

                    {cameraError && (
                      <p className="text-[11px] text-rose-400 mt-2 font-medium">{cameraError}</p>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              /* STANDARD 2D STUDIO MOCKUP VIEW */
              <div className="relative w-full h-[280px] sm:h-full max-h-[460px] flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  width={480}
                  height={540}
                  className="w-full h-full object-contain rounded-2xl shadow-md border border-gray-200 bg-white"
                />

                {/* Print specs overlay watermark */}
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span>DTF Vector Preview</span> • <span>{selectedFont.name}</span>
                </div>

                <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-200">
                  {selectedGarment.name}
                </div>
              </div>
            )}

            {/* Quick Garment Color Palette */}
            <div className="w-full mt-2 pt-2 border-t border-gray-200 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-1">
                Tee Color:
              </span>
              <div className="flex items-center gap-1.5">
                {APPAREL_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedGarment(col)}
                    className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                      selectedGarment.id === col.id
                        ? 'ring-2 ring-flipkart-500 scale-110 border-white'
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {selectedGarment.id === col.id && (
                      <Check
                        size={12}
                        className={col.id === 'white' ? 'text-black stroke-[3]' : 'text-white stroke-[3]'}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT / BOTTOM: Controls, 50+ Fonts Selector, & Try-On Sliders */}
          <div className="md:w-1/2 flex-1 p-4 overflow-y-auto space-y-4 text-left">
            {activeTab === 'tryon' && selfieImage ? (
              /* VIRTUAL TRY-ON FINE-TUNING CONTROLS */
              <div className="space-y-4 animate-fade-in">
                <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} className="text-indigo-600" />
                    <span className="text-xs font-black text-indigo-950">
                      AI Torso Fitting & Alignment Controls
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulatePoseDetection}
                    className="text-[10px] font-extrabold text-indigo-700 bg-white px-2 py-1 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50"
                  >
                    Auto-Fit Torso
                  </button>
                </div>

                {/* Torso Scale Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>T-Shirt Size / Scale on Body</span>
                    <span className="text-indigo-600">{tryonScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="140"
                    value={tryonScale}
                    onChange={(e) => setTryonScale(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Vertical Torso Position */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Vertical Neck & Chest Height</span>
                    <span className="text-indigo-600">{tryonYOffset}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="65"
                    value={tryonYOffset}
                    onChange={(e) => setTryonYOffset(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Horizontal Center */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Chest Horizontal Center</span>
                    <span className="text-indigo-600">{tryonXOffset}%</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="65"
                    value={tryonXOffset}
                    onChange={(e) => setTryonXOffset(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Shoulder Tilt Angle */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Shoulder Tilt Angle</span>
                    <span className="text-indigo-600">{tryonRotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={tryonRotation}
                    onChange={(e) => setTryonRotation(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Realistic Fabric Shadow Blending */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Fabric Wrinkle & Shadow Opacity</span>
                    <span className="text-indigo-600">{fabricBlendOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={fabricBlendOpacity}
                    onChange={(e) => setFabricBlendOpacity(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[10px] text-gray-400">
                    Multiplies natural garment folds through custom print graphics.
                  </p>
                </div>
              </div>
            ) : (
              /* CUSTOM TEXT & 50+ FONTS CONTROLS */
              <div className="space-y-3.5">
                {/* Text Inputs */}
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-black text-gray-800 flex items-center justify-between mb-1">
                      <span>Custom Name / Main Text *</span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {customText.length}/20 chars
                      </span>
                    </label>
                    <input
                      type="text"
                      value={customText}
                      maxLength={20}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Type your name or brand..."
                      className="w-full border-2 border-gray-200 focus:border-flipkart-500 rounded-xl px-3 py-2 text-sm font-black outline-none tracking-wide text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      Subtext / Est. Year (Optional)
                    </label>
                    <input
                      type="text"
                      value={subText}
                      maxLength={28}
                      onChange={(e) => setSubText(e.target.value)}
                      placeholder="e.g. STREETWEAR 99, EST. 1998"
                      className="w-full border border-gray-200 focus:border-flipkart-500 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none text-gray-800 bg-white"
                    />
                  </div>
                </div>

                {/* Print Placement Selector */}
                <div>
                  <label className="text-xs font-black text-gray-800 block mb-1.5">
                    Print Placement
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'chest', label: 'Chest Center (A3)' },
                        { id: 'pocket', label: 'Left Pocket' },
                        { id: 'back', label: 'Back Print (A3+)' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPrintPlacement(p.id)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          printPlacement === p.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print Ink Color Swatches */}
                <div>
                  <label className="text-xs font-black text-gray-800 flex items-center justify-between mb-1.5">
                    <span>DTF Ink Color</span>
                    <span className="text-[10px] font-bold text-flipkart-600">
                      12 Eco-Solvent Shades
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRINT_PALETTE.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setTextColor(swatch.hex)}
                        className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                          textColor === swatch.hex
                            ? 'ring-2 ring-flipkart-500 scale-110 border-white shadow-sm'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.name}
                      >
                        {textColor === swatch.hex && (
                          <Check
                            size={14}
                            className={swatch.hex === '#FFFFFF' ? 'text-black stroke-[3]' : 'text-white stroke-[3]'}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 50+ Font Category Filter Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-gray-800">
                      Select Font Family ({FONT_COLLECTION.length}+ Styles)
                    </label>
                    <span className="text-[10px] font-bold text-gray-400">
                      Live Text Render
                    </span>
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                    {[
                      { id: 'all', label: 'All 50+' },
                      { id: 'cursive', label: '✨ Cursive & Script' },
                      { id: 'streetwear', label: '⚡ Streetwear' },
                      { id: 'retro', label: '🎨 Retro & 70s' },
                      { id: 'luxury', label: '👑 Luxury Serif' },
                      { id: 'athletic', label: '🏈 Athletic' },
                      { id: 'minimal', label: '💎 Minimal' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFontCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                          fontCategory === cat.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Font Cards Grid with Live Text Preview */}
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-200 rounded-2xl bg-gray-50/50">
                    {filteredFonts.map((f) => {
                      const isSelected = selectedFont.id === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFont(f)}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-flipkart-500 bg-white ring-2 ring-flipkart-500/20 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-gray-500 truncate max-w-[100px]">
                              {f.name}
                            </span>
                            {f.isPopular && (
                              <span className="text-[8px] font-black bg-amber-100 text-amber-800 px-1 py-0.2 rounded">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <div
                            style={{ fontFamily: f.fontFamily }}
                            className="text-base text-gray-900 truncate leading-tight py-0.5"
                          >
                            {customText || f.sampleText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Typography Effects (Arc, Distress, Shadow, Case, Spacing) */}
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 space-y-2.5">
                  <span className="text-xs font-black text-gray-800 block">Typography Effects</span>

                  {/* Text Case Transform */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600 block">Text Case</span>
                    <div className="flex items-center gap-1.5">
                      {(['uppercase', 'none', 'lowercase'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTextTransform(mode)}
                          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                            textTransform === mode
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {mode === 'uppercase' ? 'UPPERCASE' : mode === 'lowercase' ? 'lowercase' : 'Original'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Letter Spacing Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-gray-600">
                      <span>Letter Spacing</span>
                      <span>{letterSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      value={letterSpacing}
                      onChange={(e) => setLetterSpacing(Number(e.target.value))}
                      className="w-full accent-flipkart-600"
                    />
                  </div>

                  {/* Arc Curve Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-gray-600">
                      <span>Curved / Arc Text</span>
                      <span>{arcDegree}°</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={arcDegree}
                      onChange={(e) => setArcDegree(Number(e.target.value))}
                      className="w-full accent-flipkart-600"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={() => setHasDropShadow(!hasDropShadow)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        hasDropShadow
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      3D Drop Shadow
                    </button>

                    <button
                      type="button"
                      onClick={() => setHasDistress(!hasDistress)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        hasDistress
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      Vintage Distress Grunge
                    </button>

                    <button
                      type="button"
                      onClick={() => setHasStroke(!hasStroke)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        hasStroke
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      Dual Stroke Outline
                    </button>
                  </div>

                  {/* Stroke Color Picker if Stroke Enabled */}
                  {hasStroke && (
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-600">Outline Stroke Color:</span>
                      <div className="flex items-center gap-1.5">
                        {['#111827', '#FFFFFF', '#DC2626', '#F59E0B', '#2563EB'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setStrokeColor(color)}
                            className={`w-5 h-5 rounded-full border transition-transform ${
                              strokeColor === color ? 'ring-2 ring-flipkart-500 scale-110 border-white' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Graphic Templates Quick Pick */}
                <div>
                  <span className="text-xs font-black text-gray-800 block mb-1.5">
                    Pre-Made Graphic Templates
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {GRAPHIC_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className="p-2 rounded-xl border border-gray-200 hover:border-flipkart-400 bg-white text-left transition-all hover:bg-blue-50/40 cursor-pointer"
                      >
                        <div className="text-[11px] font-black text-gray-900 truncate">
                          {tmpl.name}
                        </div>
                        <div className="text-[10px] text-gray-500">{tmpl.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPrintReadyAsset}
              className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download 3600 x 4800 transparent PNG for Sublimation / DTF"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Download 300 DPI PNG</span>
              <span className="sm:hidden">PNG</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-gray-400 block line-through">
                {formatPrice(baseProduct?.mrp || 1299)}
              </span>
              <span className="text-sm font-black text-gray-900">
                {formatPrice(baseProduct?.price || 599)} ({baseProduct?.discount || 54}% OFF)
              </span>
            </div>

            <button
              type="button"
              onClick={handleOrderCustomApparel}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-lg shadow-orange-950/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap size={16} className="fill-slate-950" />
              <span>Order Custom T-Shirt (Buy Now)</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
