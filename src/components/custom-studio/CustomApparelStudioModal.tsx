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
  Search,
  CheckCircle2,
  AlertCircle,
  SwitchCamera,
  User,
  Palette,
  Bot,
  Shirt,
} from 'lucide-react';
import {
  FONT_COLLECTION,
  APPAREL_COLORS,
  PRINT_PALETTE,
  GRAPHIC_TEMPLATES,
  APPAREL_VARIANTS,
  type FontDefinition,
  type ApparelColor,
  type GraphicTemplate,
  type ApparelVariant,
} from './customStudioData';
import { PRESET_MODEL_AVATARS, type ModelAvatar } from './modelAvatars';
import AiSloganGenerator, { type GeneratedSlogan } from './AiSloganGenerator';
import CanvaDesignModal from './CanvaDesignModal';
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
  onBuyCustomTshirt,
}: CustomApparelStudioModalProps) {
  // Navigation tabs: 'text' (Design) | 'tryon' (Body Preview) | 'specs' (300 DPI Specs)
  const [activeTab, setActiveTab] = useState<'text' | 'tryon' | 'specs'>('text');

  // Apparel Variant Style Selector (Regular, Oversized, Full Sleeve, Hoodie)
  const [selectedVariant, setSelectedVariant] = useState<ApparelVariant>(APPAREL_VARIANTS[1]);

  // External APIs & Studio Add-ons Modal states
  const [showAiSloganModal, setShowAiSloganModal] = useState(false);
  const [showCanvaModal, setShowCanvaModal] = useState(false);
  const [importedCanvaGraphic, setImportedCanvaGraphic] = useState<string | null>(null);
  const [canvaGraphicTitle, setCanvaGraphicTitle] = useState<string>('');
  const [canvaImageObj, setCanvaImageObj] = useState<HTMLImageElement | null>(null);

  // Text & Typography state
  const [customText, setCustomText] = useState('महाकाल');
  const [subText, setSubText] = useState('काल के भी काल महाकाल');
  const [selectedFont, setSelectedFont] = useState<FontDefinition>(FONT_COLLECTION[0]);
  const [fontCategory, setFontCategory] = useState<string>('all');
  const [textColor, setTextColor] = useState('#EAB308');
  const [selectedGarment, setSelectedGarment] = useState<ApparelColor>(APPAREL_COLORS[0]);
  const [printPlacement, setPrintPlacement] = useState<'chest' | 'pocket' | 'back'>('chest');
  const [activeDecorTop, setActiveDecorTop] = useState<string>('ॐ नमः शिवाय • KAAL BHAIRAV');
  const [activeDecorBottom, setActiveDecorBottom] = useState<string>('|| कर्पूरगौरं करुणावतारं संसारसारम् ||');

  // 50+ Graphic Templates State
  const [templateCategory, setTemplateCategory] = useState<string>('All');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('mahakal_trishul');

  // Text FX Controls
  const [letterSpacing, setLetterSpacing] = useState(4);
  const [arcDegree, setArcDegree] = useState(0); // -40 to +40 degrees
  const [hasStroke, setHasStroke] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#111827');
  const [hasDropShadow, setHasDropShadow] = useState(true);
  const [hasDistress, setHasDistress] = useState(false);
  const [textTransform, setTextTransform] = useState<'uppercase' | 'none' | 'lowercase'>('none');

  // Virtual Try-On & Body Fit State
  const [selfieImage, setSelfieImage] = useState<string | null>(PRESET_MODEL_AVATARS[0].dataUrl);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('model_male');
  const [isLiveCamera, setIsLiveCamera] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [cameraFlash, setCameraFlash] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [tryonScale, setTryonScale] = useState(104); // 70 to 140
  const [tryonYOffset, setTryonYOffset] = useState(41); // 15% to 65%
  const [tryonXOffset, setTryonXOffset] = useState(50); // 35% to 65%
  const [tryonRotation, setTryonRotation] = useState(0); // -20 to 20 deg
  const [fabricBlendOpacity, setFabricBlendOpacity] = useState(90); // 40 to 100
  const [isComparing, setIsComparing] = useState(false);
  const [isDetectingPose, setIsDetectingPose] = useState(false);

  // Gated Inspection Status ("uske bad hi order place karne ka option Diya jaaye")
  const [isBodyFitInspected, setIsBodyFitInspected] = useState(false);
  const [showFitGateNotice, setShowFitGateNotice] = useState(false);
  const [compositeTryonSnapshot, setCompositeTryonSnapshot] = useState<string | null>(null);

  // Canvas refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tryonCompositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filtered fonts
  const filteredFonts = FONT_COLLECTION.filter((f) => {
    if (fontCategory === 'all') return true;
    return f.category === fontCategory;
  });

  // Filtered 54 Graphic Templates
  const filteredTemplates = GRAPHIC_TEMPLATES.filter((tmpl) => {
    const matchesCategory =
      templateCategory === 'All' ||
      tmpl.category.toLowerCase().includes(templateCategory.toLowerCase());
    const matchesSearch =
      !templateSearchQuery.trim() ||
      tmpl.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tmpl.defaultText.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tmpl.category.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      (tmpl.tagline && tmpl.tagline.toLowerCase().includes(templateSearchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  /**
   * Apply selected graphic template with instant color & font alignment
   */
  const handleApplyTemplate = (tmpl: GraphicTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setCustomText(tmpl.defaultText);
    setSubText(tmpl.subText || '');
    setActiveDecorTop(tmpl.svgDecorTop || '');
    setActiveDecorBottom(tmpl.svgDecorBottom || '');

    const matchedFont = FONT_COLLECTION.find((f) => f.id === tmpl.recommendedFontId);
    if (matchedFont) setSelectedFont(matchedFont);

    if (tmpl.suggestedInkColor) {
      setTextColor(tmpl.suggestedInkColor);
    }
    if (tmpl.suggestedGarmentColorId) {
      const matchGarment = APPAREL_COLORS.find((g) => g.id === tmpl.suggestedGarmentColorId);
      if (matchGarment) setSelectedGarment(matchGarment);
    }
  };

  // Synchronize Canva transparent PNG image object for Canvas rendering
  useEffect(() => {
    if (!importedCanvaGraphic) {
      setCanvaImageObj(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setCanvaImageObj(img);
    };
    img.src = importedCanvaGraphic;
  }, [importedCanvaGraphic]);

  /**
   * Apply AI Generated Slogan & Typography
   */
  const handleApplyAiSlogan = (slogan: GeneratedSlogan) => {
    setCustomText(slogan.text);
    if (slogan.subText) setSubText(slogan.subText);
    if (slogan.decorTop) setActiveDecorTop(slogan.decorTop);
    if (slogan.decorBottom) setActiveDecorBottom(slogan.decorBottom);
    if (slogan.suggestedInkColor) setTextColor(slogan.suggestedInkColor);
    if (slogan.recommendedFontId) {
      const matched = FONT_COLLECTION.find((f) => f.id === slogan.recommendedFontId);
      if (matched) setSelectedFont(matched);
    }
  };

  /**
   * Import high-res transparent graphic from Canva
   */
  const handleImportCanvaGraphic = (dataUrl: string, title?: string) => {
    setImportedCanvaGraphic(dataUrl);
    setCanvaGraphicTitle(title || 'Canva Graphic Overlay');
  };

  /**
   * Render the 300 DPI Print-Ready Asset onto an offscreen canvas
   * Produces transparent PNG sized 3600x4800 (12"x16" @ 300 DPI) for Direct-to-Film (DTF)
   */
  const renderPrintReadyCanvas = useCallback((): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas');
    const width = 3600;
    const height = 4800;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);

    // 1. Render Imported Canva Graphic (if present)
    if (canvaImageObj) {
      const maxCanvaW = width * 0.75;
      const maxCanvaH = height * 0.45;
      const aspect = canvaImageObj.width / canvaImageObj.height;
      let drawW = maxCanvaW;
      let drawH = drawW / aspect;
      if (drawH > maxCanvaH) {
        drawH = maxCanvaH;
        drawW = drawH * aspect;
      }
      ctx.drawImage(canvaImageObj, -drawW / 2, -drawH - 100, drawW, drawH);
    }

    // 2. Decorative Top Motif (Badge / Mantra / Stars)
    if (activeDecorTop) {
      ctx.font = `bold 85px 'Montserrat', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = textColor;
      ctx.letterSpacing = '8px';
      ctx.fillText(activeDecorTop.toUpperCase(), 0, canvaImageObj ? -60 : -320);
    }

    // 3. Main Custom Text
    const fontSize = canvaImageObj ? 220 : 310;
    ctx.font = `bold ${fontSize}px ${selectedFont.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textToPrint =
      textTransform === 'uppercase'
        ? customText.toUpperCase()
        : textTransform === 'lowercase'
        ? customText.toLowerCase()
        : customText;

    if (hasDropShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 18;
      ctx.shadowOffsetY = 24;
    }

    const textYOffset = canvaImageObj ? 120 : -40;

    // Arc / Curve rendering
    if (arcDegree !== 0 && textToPrint.length > 0) {
      const radius = 1800 / (Math.abs(arcDegree) * 0.04);
      const angleStep = ((arcDegree * Math.PI) / 180) / textToPrint.length;
      const startAngle = -(angleStep * (textToPrint.length - 1)) / 2;

      ctx.save();
      ctx.translate(0, textYOffset);
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
      if (hasStroke) {
        ctx.lineWidth = 32;
        ctx.strokeStyle = strokeColor;
        ctx.strokeText(textToPrint, 0, textYOffset);
      }

      ctx.fillStyle = textColor;
      ctx.fillText(textToPrint, 0, textYOffset);
    }

    // Secondary Subtitle / Est. Year
    if (subText.trim()) {
      ctx.font = `600 110px 'Inter', 'Montserrat', sans-serif`;
      ctx.fillStyle = textColor;
      ctx.letterSpacing = `${letterSpacing * 4}px`;
      ctx.fillText(subText.toUpperCase(), 0, textYOffset + 240);
    }

    // Decorative Bottom Motif
    if (activeDecorBottom) {
      ctx.font = `bold 75px 'Montserrat', sans-serif`;
      ctx.fillStyle = textColor;
      ctx.letterSpacing = '6px';
      ctx.fillText(activeDecorBottom.toUpperCase(), 0, textYOffset + 380);
    }

    // Vintage Distress Overlay
    if (hasDistress) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let i = 0; i < 700; i++) {
        const rx = (Math.random() - 0.5) * 2800;
        const ry = (Math.random() - 0.5) * 1400;
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
    activeDecorTop,
    activeDecorBottom,
    selectedFont,
    textColor,
    textTransform,
    hasDropShadow,
    hasStroke,
    strokeColor,
    arcDegree,
    letterSpacing,
    hasDistress,
    canvaImageObj,
  ]);

  /**
   * Draw 2D Apparel Mockup on active canvas (Dynamically switches silhouettes for Regular, Oversized, Full Sleeve, Hoodie)
   */
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Studio Background Gradient
    ctx.save();
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Apparel Silhouette based on selectedVariant
    ctx.fillStyle = selectedGarment.tshirtHex;
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 12;

    ctx.beginPath();

    const variantId = selectedVariant.id;

    if (variantId === 'hoodie') {
      // ===== HOODIE SILHOUETTE =====
      // Draw outer hood contours above shoulders
      ctx.moveTo(w * 0.32, h * 0.16);
      ctx.quadraticCurveTo(w * 0.22, h * 0.08, w * 0.33, h * 0.03);
      ctx.quadraticCurveTo(w * 0.50, h * 0.01, w * 0.67, h * 0.03);
      ctx.quadraticCurveTo(w * 0.78, h * 0.08, w * 0.68, h * 0.16);

      // Right shoulder & full sleeve
      ctx.lineTo(w * 0.88, h * 0.21);
      ctx.lineTo(w * 0.94, h * 0.52);
      ctx.lineTo(w * 0.90, h * 0.82); // wrist
      ctx.lineTo(w * 0.81, h * 0.82); // cuff
      ctx.lineTo(w * 0.81, h * 0.52);
      ctx.lineTo(w * 0.78, h * 0.38);

      // Right torso & hem
      ctx.lineTo(w * 0.78, h * 0.90);
      ctx.quadraticCurveTo(w * 0.5, h * 0.93, w * 0.22, h * 0.90);

      // Left torso & full sleeve
      ctx.lineTo(w * 0.22, h * 0.38);
      ctx.lineTo(w * 0.19, h * 0.52);
      ctx.lineTo(w * 0.19, h * 0.82); // cuff
      ctx.lineTo(w * 0.10, h * 0.82); // wrist
      ctx.lineTo(w * 0.06, h * 0.52);
      ctx.lineTo(w * 0.12, h * 0.21);
      ctx.closePath();
      ctx.fill();

    } else if (variantId === 'full_sleeve') {
      // ===== FULL SLEEVE T-SHIRT SILHOUETTE =====
      // Collar
      ctx.moveTo(w * 0.35, h * 0.12);
      ctx.quadraticCurveTo(w * 0.5, h * 0.20, w * 0.65, h * 0.12);
      // Right shoulder
      ctx.lineTo(w * 0.87, h * 0.20);
      // Long Right sleeve down to wrist
      ctx.lineTo(w * 0.93, h * 0.52);
      ctx.lineTo(w * 0.89, h * 0.82);
      ctx.lineTo(w * 0.80, h * 0.82); // wrist cuff
      ctx.lineTo(w * 0.80, h * 0.50);
      ctx.lineTo(w * 0.77, h * 0.36);
      // Torso right
      ctx.lineTo(w * 0.77, h * 0.90);
      // Bottom hem
      ctx.quadraticCurveTo(w * 0.5, h * 0.93, w * 0.23, h * 0.90);
      // Torso left & Long Left sleeve
      ctx.lineTo(w * 0.23, h * 0.36);
      ctx.lineTo(w * 0.20, h * 0.50);
      ctx.lineTo(w * 0.20, h * 0.82); // wrist cuff
      ctx.lineTo(w * 0.11, h * 0.82);
      ctx.lineTo(w * 0.07, h * 0.52);
      ctx.lineTo(w * 0.13, h * 0.20);
      ctx.closePath();
      ctx.fill();

    } else if (variantId === 'oversized') {
      // ===== OVERSIZED DROP-SHOULDER T-SHIRT SILHOUETTE =====
      // Relaxed crew neck
      ctx.moveTo(w * 0.34, h * 0.13);
      ctx.quadraticCurveTo(w * 0.5, h * 0.21, w * 0.66, h * 0.13);
      // Drop shoulders extending wider
      ctx.lineTo(w * 0.91, h * 0.23);
      // Drop shoulder wider & longer sleeve extending past elbow
      ctx.lineTo(w * 0.97, h * 0.49);
      ctx.lineTo(w * 0.82, h * 0.54);
      // Relaxed boxy torso side seam
      ctx.lineTo(w * 0.80, h * 0.40);
      ctx.lineTo(w * 0.81, h * 0.92);
      // Relaxed bottom hem
      ctx.quadraticCurveTo(w * 0.5, h * 0.95, w * 0.19, h * 0.92);
      // Left side seam
      ctx.lineTo(w * 0.20, h * 0.40);
      ctx.lineTo(w * 0.18, h * 0.54);
      ctx.lineTo(w * 0.03, h * 0.49);
      ctx.lineTo(w * 0.09, h * 0.23);
      ctx.closePath();
      ctx.fill();

    } else {
      // ===== REGULAR FIT CLASSIC T-SHIRT SILHOUETTE =====
      ctx.moveTo(w * 0.35, h * 0.12);
      ctx.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.65, h * 0.12);
      ctx.lineTo(w * 0.87, h * 0.2);
      ctx.lineTo(w * 0.95, h * 0.38);
      ctx.lineTo(w * 0.82, h * 0.44);
      ctx.lineTo(w * 0.78, h * 0.36);
      ctx.lineTo(w * 0.77, h * 0.9);
      ctx.quadraticCurveTo(w * 0.5, h * 0.93, w * 0.23, h * 0.9);
      ctx.lineTo(w * 0.22, h * 0.36);
      ctx.lineTo(w * 0.18, h * 0.44);
      ctx.lineTo(w * 0.05, h * 0.38);
      ctx.lineTo(w * 0.13, h * 0.2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // 3. Fabric Features: Cuffs, Collar, Kangaroo Pocket, Drawstrings
    ctx.save();
    const isLightGarment = selectedGarment.id === 'white' || selectedGarment.id === 'sand';
    ctx.strokeStyle = isLightGarment ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2.5;

    if (variantId === 'hoodie') {
      // Hood inner neckline & ribbed collar
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.15, w * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      // Kangaroo Front Pouch Pocket
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.66);
      ctx.lineTo(w * 0.68, h * 0.66);
      ctx.lineTo(w * 0.73, h * 0.88);
      ctx.lineTo(w * 0.27, h * 0.88);
      ctx.closePath();
      ctx.stroke();

      // Kangaroo pocket slanted hand openings
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.66);
      ctx.lineTo(w * 0.27, h * 0.88);
      ctx.moveTo(w * 0.68, h * 0.66);
      ctx.lineTo(w * 0.73, h * 0.88);
      ctx.stroke();

      // Drawstrings hanging down
      ctx.strokeStyle = isLightGarment ? '#94a3b8' : '#e2e8f0';
      ctx.lineWidth = 2.5;
      // Left string
      ctx.beginPath();
      ctx.moveTo(w * 0.44, h * 0.21);
      ctx.quadraticCurveTo(w * 0.42, h * 0.29, w * 0.43, h * 0.37);
      ctx.stroke();
      // Right string
      ctx.beginPath();
      ctx.moveTo(w * 0.56, h * 0.21);
      ctx.quadraticCurveTo(w * 0.58, h * 0.29, w * 0.57, h * 0.37);
      ctx.stroke();

      // Aglets (string tips)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(w * 0.42, h * 0.37, 3, 7);
      ctx.fillRect(w * 0.56, h * 0.37, 3, 7);

      // Wrist ribbed cuffs
      ctx.strokeStyle = isLightGarment ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)';
      ctx.strokeRect(w * 0.81, h * 0.78, w * 0.08, h * 0.04);
      ctx.strokeRect(w * 0.11, h * 0.78, w * 0.08, h * 0.04);

    } else if (variantId === 'full_sleeve') {
      // Collar ribbed border
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.13, w * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      // Ribbed wrist cuffs
      ctx.strokeRect(w * 0.80, h * 0.78, w * 0.09, h * 0.04);
      ctx.strokeRect(w * 0.11, h * 0.78, w * 0.09, h * 0.04);

    } else {
      // Regular / Oversized Collar ribbed border
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.13, w * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      // Torso wrinkle shading
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.4);
      ctx.quadraticCurveTo(w * 0.5, h * 0.44, w * 0.72, h * 0.41);
      ctx.moveTo(w * 0.26, h * 0.58);
      ctx.quadraticCurveTo(w * 0.5, h * 0.62, w * 0.74, h * 0.59);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Render Custom Text & Canva Graphic inside Print Boundary Area
    ctx.save();
    let targetX = w * 0.5;
    let targetY = variantId === 'hoodie' ? h * 0.46 : h * 0.43;
    let maxPrintW = variantId === 'oversized' ? w * 0.54 : w * 0.48;

    if (printPlacement === 'pocket') {
      targetX = w * 0.36;
      targetY = h * 0.36;
      maxPrintW = w * 0.18;
    } else if (printPlacement === 'back') {
      targetY = h * 0.47;
      maxPrintW = w * 0.52;
    }

    ctx.translate(targetX, targetY);

    // Draw Canva Graphic if present
    if (canvaImageObj && printPlacement !== 'pocket') {
      const gMaxW = maxPrintW * 0.75;
      const aspect = canvaImageObj.width / canvaImageObj.height;
      let gW = gMaxW;
      let gH = gW / aspect;
      if (gH > 90) {
        gH = 90;
        gW = gH * aspect;
      }
      ctx.drawImage(canvaImageObj, -gW / 2, -gH - 8, gW, gH);
    }

    // Render Decor Top if present
    if (activeDecorTop && printPlacement !== 'pocket') {
      ctx.font = `bold 9px 'Montserrat', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = textColor;
      ctx.letterSpacing = '1px';
      ctx.fillText(activeDecorTop.toUpperCase(), 0, canvaImageObj ? -6 : -32, maxPrintW);
    }

    const baseFontSize = printPlacement === 'pocket' ? 18 : canvaImageObj ? 24 : 32;
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

    const textPosY = canvaImageObj ? 14 : 0;

    if (hasStroke) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = strokeColor;
      ctx.strokeText(textToPrint, 0, textPosY, maxPrintW);
    }

    ctx.fillStyle = textColor;
    ctx.fillText(textToPrint, 0, textPosY, maxPrintW);

    // Subtitle
    if (subText.trim() && printPlacement !== 'pocket') {
      ctx.font = `bold 10px 'Inter', sans-serif`;
      ctx.fillStyle = textColor;
      ctx.letterSpacing = `${letterSpacing}px`;
      ctx.fillText(subText.toUpperCase(), 0, textPosY + baseFontSize * 0.9, maxPrintW);
    }

    // Decor Bottom
    if (activeDecorBottom && printPlacement !== 'pocket') {
      ctx.font = `bold 8px 'Montserrat', sans-serif`;
      ctx.fillStyle = textColor;
      ctx.letterSpacing = '1px';
      ctx.fillText(activeDecorBottom.toUpperCase(), 0, textPosY + baseFontSize * 1.45, maxPrintW);
    }

    ctx.restore();
  }, [
    selectedGarment,
    selectedFont,
    selectedVariant,
    canvaImageObj,
    customText,
    subText,
    activeDecorTop,
    activeDecorBottom,
    textColor,
    printPlacement,
    hasStroke,
    strokeColor,
    hasDropShadow,
    textTransform,
    letterSpacing,
  ]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  /**
   * Render High-Fidelity On-Body Virtual Try-On Composite Canvas
   */
  const renderTryonComposite = useCallback(() => {
    const canvas = tryonCompositeCanvasRef.current;
    if (!canvas || !selfieImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.onload = () => {
      // 1. Draw User's Selfie / Model Photo
      ctx.drawImage(baseImg, 0, 0, w, h);

      // 2. If comparing, only show original photo
      if (isComparing) return;

      // 3. Draw Draped T-Shirt on User's Torso
      const tshirtPreview = previewCanvasRef.current;
      if (!tshirtPreview) return;

      ctx.save();
      const shirtW = w * 0.82 * (tryonScale / 100);
      const shirtH = h * 0.82 * (tryonScale / 100);
      const posX = w * (tryonXOffset / 100);
      const posY = h * (tryonYOffset / 100);

      ctx.translate(posX, posY);
      ctx.rotate((tryonRotation * Math.PI) / 180);

      // Realistic Clothing Wrinkle Multiplier
      ctx.globalAlpha = fabricBlendOpacity / 100;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 10;

      ctx.drawImage(tshirtPreview, -shirtW / 2, -shirtH / 2, shirtW, shirtH);
      ctx.restore();

      // Cache snapshot for order attachment
      const snap = canvas.toDataURL('image/jpeg', 0.9);
      setCompositeTryonSnapshot(snap);
    };
    baseImg.src = selfieImage;
  }, [
    selfieImage,
    isComparing,
    tryonScale,
    tryonXOffset,
    tryonYOffset,
    tryonRotation,
    fabricBlendOpacity,
  ]);

  useEffect(() => {
    renderTryonComposite();
  }, [renderTryonComposite]);

  /**
   * Live Camera Try-On Setup
   */
  const handleStartCamera = async (mode: 'user' | 'environment' = cameraFacingMode) => {
    setCameraError('');
    setIsLiveCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Camera access denied or unavailable. Please upload a selfie image or choose a model below.');
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

  const handleToggleCameraFacing = () => {
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextMode);
    handleStopCamera();
    setTimeout(() => {
      handleStartCamera(nextMode);
    }, 200);
  };

  /**
   * Trigger 3-Second Selfie Countdown Snap
   */
  const handleTriggerCountdownSnap = () => {
    setCameraCountdown(3);
    const interval = setInterval(() => {
      setCameraCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          executeSnapPhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeSnapPhoto = () => {
    if (!videoRef.current) return;
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 300);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 720;
    canvas.height = videoRef.current.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cameraFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
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
        setSelectedAvatarId('custom_upload');
        handleSimulatePoseDetection();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetModel = (model: ModelAvatar) => {
    setSelectedAvatarId(model.id);
    setSelfieImage(model.dataUrl);
    setTryonScale(model.defaultScale);
    setTryonYOffset(model.defaultYOffset);
    handleSimulatePoseDetection();
  };

  /**
   * Upper-Body Torso Alignment Simulation
   */
  const handleSimulatePoseDetection = () => {
    setIsDetectingPose(true);
    setTimeout(() => {
      setIsDetectingPose(false);
    }, 600);
  };

  /**
   * Customer Inspects and Approves On-Body Fit
   */
  const handleApproveBodyFit = () => {
    setIsBodyFitInspected(true);
    setShowFitGateNotice(false);
    renderTryonComposite();
  };

  /**
   * Transition from Design step to On-Body Try-On
   */
  const handleProceedToTryon = () => {
    setActiveTab('tryon');
    if (!selfieImage && !isLiveCamera) {
      handleStartCamera();
    }
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
   * Order Customized T-shirt directly (Gated by on-body preview inspection)
   */
  const handleOrderCustomApparel = () => {
    if (!isBodyFitInspected) {
      setShowFitGateNotice(true);
      setActiveTab('tryon');
      return;
    }

    const printCanvas = renderPrintReadyCanvas();
    const printDataUrl = printCanvas ? printCanvas.toDataURL('image/png') : '';
    const onBodyMockupUrl =
      compositeTryonSnapshot ||
      (tryonCompositeCanvasRef.current ? tryonCompositeCanvasRef.current.toDataURL('image/jpeg', 0.9) : '') ||
      (previewCanvasRef.current ? previewCanvasRef.current.toDataURL('image/png') : '/ak_brand_logo.jpg');

    const effectivePrice = selectedVariant.basePrice;
    const effectiveMrp = selectedVariant.mrp;
    const effectiveDiscount = Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100);

    const customizedProduct: Product = {
      id: `custom_${Date.now()}`,
      title: `${selectedVariant.name} - ${selectedVariant.gsm} ("${customText}")`,
      brand: 'AKSelling Studio',
      price: effectivePrice,
      mrp: effectiveMrp,
      discount: effectiveDiscount,
      rating: 4.9,
      ratingCount: 128,
      category: 'streetwear',
      fabric: `${selectedVariant.gsm} ${selectedVariant.fabric}`,
      neckType: selectedVariant.id === 'hoodie' ? 'Hooded Collar with Drawstrings' : 'Round Ribbed Neck',
      sleeveType:
        selectedVariant.id === 'full_sleeve' || selectedVariant.id === 'hoodie'
          ? 'Full Sleeve Ribbed Cuff'
          : selectedVariant.id === 'oversized'
          ? 'Drop Shoulder Elbow Sleeve'
          : 'Regular Half Sleeve',
      fitType: selectedVariant.fitDescription,
      printDesign: `Custom DTF 300DPI: "${customText}" (${selectedFont.name})${canvaGraphicTitle ? ` + ${canvaGraphicTitle}` : ''} - Sharir Par Fit Inspected & Approved`,
      images: [onBodyMockupUrl, printDataUrl],
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
      <div className="relative w-full h-[96dvh] sm:h-[840px] sm:max-w-5xl bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  AKSelling Custom Print & Virtual Body Try-On Studio
                </h2>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                  50+ DESIGNS
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                  300 DPI DTF
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                50+ नए डिज़ाइन चुनें, फोटो खींचें और शरीर पर पहनकर जांचें (Check On-Body Fit)
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

        {/* 3-Step Guided Workflow Navigation + External APIs */}
        <div className="flex bg-slate-900 border-b border-slate-800 px-3 py-1.5 gap-2 shrink-0 items-center overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab('text');
              handleStopCamera();
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'text'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Type size={14} />
            <span>1. डिज़ाइन & स्टाइल</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tryon')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'tryon'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera size={14} />
            <span>2. फोटो खींचें & शरीर पर चढ़ाएं</span>
            {isBodyFitInspected && (
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            )}
          </button>

          <div className="h-5 w-px bg-slate-800 shrink-0 mx-1 hidden sm:block" />

          {/* OpenAI ChatGPT Slogan Generator Button */}
          <button
            type="button"
            onClick={() => setShowAiSloganModal(true)}
            className="py-1.5 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/10 hover:from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer shrink-0 transition-all hover:scale-[1.02] shadow-xs"
            title="Generate custom apparel slogans using OpenAI ChatGPT"
          >
            <Bot size={13} className="text-amber-400" />
            <span>AI Slogan (ChatGPT)</span>
          </button>

          {/* Canva Connect / Web SDK Button */}
          <button
            type="button"
            onClick={() => setShowCanvaModal(true)}
            className="py-1.5 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500/10 hover:from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer shrink-0 transition-all hover:scale-[1.02] shadow-xs"
            title="Design graphic overlays with Canva Web SDK and import at 300 DPI"
          >
            <Palette size={13} className="text-cyan-400" />
            <span>Design with Canva</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('specs');
              handleStopCamera();
            }}
            className={`hidden md:flex py-2 px-3 rounded-xl text-xs font-black transition-all items-center justify-center gap-1.5 cursor-pointer ml-auto whitespace-nowrap ${
              activeTab === 'specs'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Printer size={14} />
            <span>300 DPI Spec</span>
          </button>
        </div>

        {/* Gated Fit Warning Banner if customer tries to order early */}
        {showFitGateNotice && !isBodyFitInspected && (
          <div className="bg-amber-500 text-slate-950 px-3 py-2 text-xs font-black flex items-center justify-between shrink-0 shadow-sm animate-shake">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>
                पहले शरीर पर पहनकर जांचें कि कैसा लग रहा है! अपनी सेल्फी लें या नीचे दिए मॉडल पर देखें.
              </span>
            </div>
            <button
              onClick={() => setShowFitGateNotice(false)}
              className="p-1 hover:bg-amber-600/30 rounded-md"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Modal Main Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT: Live Interactive Preview & On-Body Try-On Stage */}
          <div className="md:w-1/2 bg-slate-950 flex flex-col items-center justify-center p-3 relative border-b md:border-b-0 md:border-r border-slate-800 overflow-hidden">
            {activeTab === 'tryon' ? (
              /* ================= ON-BODY VIRTUAL TRY-ON STAGE ================= */
              <div className="relative w-full h-[320px] sm:h-full max-h-[500px] bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                {isLiveCamera ? (
                  /* Live Camera Stream with Body Silhouette Guide */
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${
                        cameraFacingMode === 'user' ? 'transform -scale-x-100' : ''
                      }`}
                    />

                    {/* Camera Flash Animation */}
                    {cameraFlash && (
                      <div className="absolute inset-0 bg-white z-40 animate-fade-out pointer-events-none" />
                    )}

                    {/* Torso Alignment Silhouette Frame */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
                      <div className="w-56 h-72 border-2 border-dashed border-amber-400/80 rounded-full flex flex-col items-center justify-between py-4 shadow-lg">
                        <span className="bg-black/70 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full backdrop-blur-md">
                          चेहरा और कंधे यहां सेट करें
                        </span>
                        <div className="w-12 h-12 border-t-2 border-b-2 border-amber-400/60 rounded-full animate-pulse" />
                        <span className="bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                          Chest & Shoulders
                        </span>
                      </div>
                    </div>

                    {/* Countdown Overlay */}
                    {cameraCountdown !== null && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-30 animate-scale-up">
                        <span className="text-7xl font-black text-amber-400 drop-shadow-2xl">
                          {cameraCountdown}
                        </span>
                      </div>
                    )}

                    {/* Camera Control Buttons */}
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-20 px-4">
                      <button
                        type="button"
                        onClick={handleTriggerCountdownSnap}
                        className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                      >
                        <Camera size={16} /> 📸 फोटो खींचें (3s)
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleCameraFacing}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-2.5 rounded-full cursor-pointer shadow-md"
                        title="Flip Camera"
                      >
                        <SwitchCamera size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={handleStopCamera}
                        className="bg-slate-800/90 hover:bg-slate-800 text-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-full cursor-pointer shadow-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : selfieImage ? (
                  /* Rendered Composite Canvas of Custom T-Shirt Overlaid on Body */
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    <canvas
                      ref={tryonCompositeCanvasRef}
                      width={720}
                      height={960}
                      className="w-full h-full object-contain"
                    />

                    {/* Auto-Fit Scanning Simulation */}
                    {isDetectingPose && (
                      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-2xs flex flex-col items-center justify-center text-white z-30">
                        <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-3" />
                        <span className="text-xs font-black tracking-wide text-amber-300">
                          शरीर की बनावट को स्कैन कर टी-शर्ट पहनाई जा रही है...
                        </span>
                      </div>
                    )}

                    {/* Floating Controls: Hold to Compare & Change Photo */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                      <button
                        type="button"
                        onMouseDown={() => setIsComparing(true)}
                        onMouseUp={() => setIsComparing(false)}
                        onTouchStart={() => setIsComparing(true)}
                        onTouchEnd={() => setIsComparing(false)}
                        className="bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-white/20 flex items-center gap-1 cursor-pointer select-none active:scale-95"
                        title="Hold to see original photo without T-shirt"
                      >
                        <Eye size={13} className="text-amber-400" />
                        <span>{isComparing ? 'Original Body' : 'दबाकर तुलना करें'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartCamera()}
                        className="bg-black/75 hover:bg-black/90 backdrop-blur-md text-white p-2 rounded-xl border border-white/20 cursor-pointer"
                        title="Retake camera photo"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-white/10 z-20 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>शरीर पर: {selectedGarment.name}</span>
                    </div>

                    {/* Inspected Stamp Overlay */}
                    {isBodyFitInspected && (
                      <div className="absolute top-3 left-3 bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1 z-20">
                        <CheckCircle2 size={13} /> Fit Inspected & Approved
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty State: Take Selfie or Pick Ready Model */
                  <div className="p-6 text-center text-white space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center mx-auto shadow-lg">
                      <Camera size={26} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        शरीर पर पहनकर जांचें (Virtual Try-On)
                      </h4>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                        अपनी फोटो खींचें या नीचे दिए भारतीय मॉडल पर पहनकर देखें कि यह डिज़ाइन आपके सीने पर कैसा लग रहा है.
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleStartCamera()}
                        className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Camera size={15} /> 📸 कैमरा चालू करें
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={15} /> गैलरी से फोटो लें
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
              /* ================= 2D STUDIO VECTOR MOCKUP ================= */
              <div className="relative w-full h-[320px] sm:h-full max-h-[500px] flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  width={480}
                  height={540}
                  className="w-full h-full object-contain rounded-2xl shadow-xl border border-slate-800 bg-slate-900"
                />

                <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-slate-700">
                  <Sparkles size={12} className="text-amber-400" />
                  <span>300 DPI DTF Vector</span> • <span>{selectedFont.name}</span>
                </div>

                <div className="absolute bottom-3 right-3 bg-white/95 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-xl border border-gray-200 shadow-md">
                  {selectedGarment.name}
                </div>
              </div>
            )}

            {/* Quick Garment Color Palette */}
            <div className="w-full mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
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
                        ? 'ring-2 ring-amber-400 scale-110 border-white'
                        : 'border-slate-700 hover:scale-105'
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

            {/* Step 1 Quick CTA: Preview on Body */}
            {activeTab === 'text' && (
              <button
                type="button"
                onClick={handleProceedToTryon}
                className="w-full mt-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99]"
              >
                <Camera size={14} />
                <span>📸 अब शरीर पर पहनकर देखें (Preview on My Body)</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {/* RIGHT: Controls, 54 Graphic Templates & Virtual Try-On Fitting Sliders */}
          <div className="md:w-1/2 flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4 text-left">
            {activeTab === 'tryon' ? (
              /* ================= VIRTUAL TRY-ON BODY FITTING CONTROLS ================= */
              <div className="space-y-4 animate-fade-in">
                {/* Ready Indian Model Avatars Selector */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <User size={14} className="text-indigo-600" />
                      <span>तुरंत टेस्ट करें (Choose Model or Use Camera):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartCamera()}
                      className="text-[10px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer flex items-center gap-1"
                    >
                      <Camera size={11} /> 📸 Take Selfie
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_MODEL_AVATARS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectPresetModel(m)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedAvatarId === m.id
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-2xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <span className="text-[9px] font-black text-indigo-800 block truncate">
                          {m.badge}
                        </span>
                        <span className="text-[11px] font-bold text-gray-800 block truncate mt-0.5">
                          {m.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Torso Alignment Sliders */}
                <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <Sliders size={14} className="text-indigo-600" />
                      <span>शरीर पर फिटिंग एडजस्ट करें (Body Fit Alignment):</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleSimulatePoseDetection}
                      className="text-[10px] font-black text-gray-500 hover:text-gray-900"
                    >
                      Reset Fit
                    </button>
                  </div>

                  {/* Size / Scale Slider */}
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

                  {/* Vertical Chest Position */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>सीने की ऊंचाई (Neck & Chest Height)</span>
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
                      <span>बाएं / दाएं सेंटर (Chest Horizontal)</span>
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

                  {/* Shoulder Tilt */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>कंधों का झुकाव (Shoulder Tilt)</span>
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

                  {/* Wrinkle & Shadow Multiply */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>कपड़े की सिलवटें व परछाईं (Wrinkle & Shadow Multiplier)</span>
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
                  </div>
                </div>

                {/* Body Fit Inspection & Approval Action */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950">
                        शरीर पर फिटिंग जांच ली? (Inspection Check)
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        जांचें कि डिजाइन आपके शरीर पर सही लग रहा है. इसके बाद ही ऑर्डर लॉक होगा!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApproveBodyFit}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isBodyFitInspected
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md active:scale-95'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {isBodyFitInspected
                        ? '✅ शरीर पर लुक जांची गई (Look Approved)'
                        : 'हाँ, शरीर पर सही लग रहा है - फिट लॉक करें (Approve Look)'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* ================= 54 GRAPHICS & TEXT CONTROLS ================= */
              <div className="space-y-4">
                {/* 1. APPAREL STYLE & FIT SELECTOR (Regular, Oversized, Full Sleeve, Hoodie) */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Shirt size={15} className="text-amber-600" />
                      <span>कपड़े का स्टाइल चुनें (Apparel Style & Fit):</span>
                    </span>
                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                      {selectedVariant.gsm}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {APPAREL_VARIANTS.map((v) => {
                      const isSelected = selectedVariant.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                            isSelected
                              ? 'border-slate-950 bg-white ring-2 ring-slate-950/15 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {v.badge && (
                            <span className="absolute -top-2 right-2 text-[8px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.2 rounded-full shadow-xs">
                              {v.badge}
                            </span>
                          )}
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-black text-slate-900">{v.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 block truncate">
                            {v.gsm} • {v.hindiName}
                          </span>
                          <span className="text-xs font-black text-amber-600 block mt-1">
                            {formatPrice(v.basePrice)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-gray-500 italic bg-white p-2 rounded-xl border border-gray-100">
                    💡 <strong>{selectedVariant.name}:</strong> {selectedVariant.fitDescription}
                  </p>
                </div>

                {/* 2. CANVA IMPORTED GRAPHIC ACTIVE BANNER (IF LOADED) */}
                {importedCanvaGraphic && (
                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/40 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                        <Palette size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-cyan-950 flex items-center gap-1.5">
                          <span>{canvaGraphicTitle}</span>
                          <span className="bg-cyan-100 text-cyan-800 text-[9px] font-black px-1.5 py-0.2 rounded">
                            Canva Active
                          </span>
                        </span>
                        <p className="text-[11px] text-cyan-800">
                          Canva transparent vector overlay is rendered on your shirt!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportedCanvaGraphic(null);
                        setCanvaGraphicTitle('');
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-rose-200 cursor-pointer shrink-0 shadow-2xs"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* 3. QUICK EXTERNAL TOOL SHORTCUTS (OpenAI ChatGPT & Canva) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAiSloganModal(true)}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-300 text-left flex items-center gap-2.5 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                      <Bot size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">AI Slogan (ChatGPT)</span>
                      <span className="text-[10px] text-gray-600 block">Gym, Hindi Swag, Anime</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCanvaModal(true)}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/5 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-300 text-left flex items-center gap-2.5 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                      <Palette size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Design with Canva</span>
                      <span className="text-[10px] text-gray-600 block">Web SDK & 300 DPI Export</span>
                    </div>
                  </button>
                </div>

                {/* 54 GRAPHIC TEMPLATES EXPLORER */}
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 p-3 rounded-2xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-600 fill-amber-500" />
                      <span className="text-xs font-black text-slate-950 uppercase tracking-tight">
                        50+ नए ट्रेंडिंग डिज़ाइन (Graphic Templates)
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-amber-900 bg-white/80 px-2 py-0.5 rounded-full border border-amber-300">
                      {filteredTemplates.length} Available
                    </span>
                  </div>

                  {/* Template Search Bar */}
                  <div className="relative">
                    <Search size={14} className="text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={templateSearchQuery}
                      onChange={(e) => setTemplateSearchQuery(e.target.value)}
                      placeholder="डिज़ाइन खोजें (e.g. Mahakal, Banna, Anime, Gym, Tokyo, Rider)..."
                      className="w-full bg-white border border-amber-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      'All',
                      'Devotional',
                      'Desi Swag',
                      'Streetwear',
                      'Anime & Manga',
                      'Gym & Fitness',
                      'Rider & Biker',
                      'Luxury & Royal',
                      'Music & Band',
                      'Retro & Gaming',
                      'Minimalist',
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTemplateCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap border transition-all cursor-pointer ${
                          templateCategory === cat
                            ? 'bg-slate-950 text-white border-slate-950 shadow-2xs'
                            : 'bg-white text-gray-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* 54 Templates Grid */}
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 bg-white/60 rounded-xl border border-amber-200">
                    {filteredTemplates.map((tmpl) => {
                      const isSelected = selectedTemplateId === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => handleApplyTemplate(tmpl)}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/30 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-black text-gray-900 truncate">
                              {tmpl.iconSymbol} {tmpl.name}
                            </span>
                            {tmpl.badge && (
                              <span className="text-[8px] font-black bg-amber-200 text-amber-900 px-1 py-0.2 rounded shrink-0">
                                {tmpl.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 truncate">{tmpl.tagline || tmpl.category}</p>
                          <div className="mt-1 text-[11px] font-bold text-amber-800 bg-gray-50 px-1.5 py-0.5 rounded truncate">
                            "{tmpl.defaultText}"
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Text Inputs */}
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-black text-gray-800 flex items-center justify-between mb-1">
                      <span>अपना नाम या मुख्य टेक्स्ट बदलें (Custom Name) *</span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {customText.length}/28 chars
                      </span>
                    </label>
                    <input
                      type="text"
                      value={customText}
                      maxLength={28}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Type your name or brand..."
                      className="w-full border-2 border-gray-200 focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-black outline-none tracking-wide text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      सब-टेक्स्ट / साल / शहर (Optional Subtitle)
                    </label>
                    <input
                      type="text"
                      value={subText}
                      maxLength={36}
                      onChange={(e) => setSubText(e.target.value)}
                      placeholder="e.g. EST. 1998 • INDORE CITY"
                      className="w-full border border-gray-200 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none text-gray-800 bg-white"
                    />
                  </div>
                </div>

                {/* Print Placement */}
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

                {/* DTF Ink Palette */}
                <div>
                  <label className="text-xs font-black text-gray-800 flex items-center justify-between mb-1.5">
                    <span>DTF Ink Color</span>
                    <span className="text-[10px] font-bold text-amber-700">
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
                            ? 'ring-2 ring-amber-500 scale-110 border-white shadow-sm'
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

                {/* 50+ Font Family Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-gray-800">
                      50+ स्टाइलिश फॉन्ट्स ({FONT_COLLECTION.length}+ Styles)
                    </label>
                    <span className="text-[10px] font-bold text-gray-400">
                      Live Text Render
                    </span>
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                    {[
                      { id: 'all', label: 'All 50+' },
                      { id: 'cursive', label: '✨ Cursive' },
                      { id: 'streetwear', label: '⚡ Streetwear' },
                      { id: 'retro', label: '🎨 Retro' },
                      { id: 'luxury', label: '👑 Luxury' },
                      { id: 'athletic', label: '🏈 Athletic' },
                      { id: 'minimal', label: '💎 Minimal' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFontCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                          fontCategory === cat.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-gray-200 rounded-2xl bg-gray-50/50">
                    {filteredFonts.map((f) => {
                      const isSelected = selectedFont.id === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFont(f)}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-white ring-2 ring-amber-400/20 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
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

                {/* Typography Effects */}
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
                      className="w-full accent-amber-600"
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
                      className="w-full accent-amber-600"
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
                      Vintage Distress
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
                      Outline Stroke
                    </button>
                  </div>

                  {hasStroke && (
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-600">Outline Color:</span>
                      <div className="flex items-center gap-1.5">
                        {['#111827', '#FFFFFF', '#DC2626', '#F59E0B', '#2563EB'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setStrokeColor(color)}
                            className={`w-5 h-5 rounded-full border transition-transform ${
                              strokeColor === color ? 'ring-2 ring-amber-500 scale-110 border-white' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Footer with Gated Order Button */}
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

          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-gray-400 block line-through">
                {formatPrice(selectedVariant.mrp)}
              </span>
              <span className="text-sm font-black text-gray-900">
                {formatPrice(selectedVariant.basePrice)} (
                {Math.round(((selectedVariant.mrp - selectedVariant.basePrice) / selectedVariant.mrp) * 100)}% OFF)
              </span>
            </div>

            {/* Gated Order Button: Requires on-body inspection approval first! */}
            {isBodyFitInspected ? (
              <button
                type="button"
                onClick={handleOrderCustomApparel}
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-black text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-950/20 flex items-center gap-1.5 transition-all cursor-pointer ring-2 ring-emerald-400/50"
              >
                <Zap size={16} className="fill-white" />
                <span>ऑर्डर प्लेस करें (Buy Now)</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowFitGateNotice(true);
                  setActiveTab('tryon');
                  if (!selfieImage && !isLiveCamera) {
                    handleStartCamera();
                  }
                }}
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-orange-950/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Camera size={16} />
                <span>शरीर पर पहनकर देखें (Preview to Order)</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* OpenAI ChatGPT Slogan Generator Modal */}
        <AiSloganGenerator
          isOpen={showAiSloganModal}
          onClose={() => setShowAiSloganModal(false)}
          onApplySlogan={handleApplyAiSlogan}
        />

        {/* Canva Connect / Web SDK Modal */}
        <CanvaDesignModal
          isOpen={showCanvaModal}
          onClose={() => setShowCanvaModal(false)}
          onImportGraphic={handleImportCanvaGraphic}
        />
      </div>
    </div>
  );
}
