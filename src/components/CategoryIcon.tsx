import React from 'react';
import {
  Shirt,
  Smartphone,
  Headphones,
  Sofa,
  Sparkles,
  Footprints,
  Watch,
  Plug,
  Tag,
  Flame,
  Trophy,
  Package,
  Heart,
  Palette,
  ShoppingBag,
  Scissors,
  Crown,
  Gem,
  Glasses,
  Baby,
  BookOpen,
  Utensils,
  Dumbbell,
  Car,
  Percent,
} from 'lucide-react';

export const POPULAR_CATEGORY_ICONS: Array<{
  id: string;
  label: string;
  emoji: string;
  iconName: string;
}> = [
  { id: 'Shirt', label: 'T-Shirts & Apparel', emoji: '👕', iconName: 'Shirt' },
  { id: 'Footprints', label: 'Shoes & Footwear', emoji: '👟', iconName: 'Footprints' },
  { id: 'Flame', label: 'Trending & Hot Deals', emoji: '🔥', iconName: 'Flame' },
  { id: 'Smartphone', label: 'Mobiles & Tech', emoji: '📱', iconName: 'Smartphone' },
  { id: 'Headphones', label: 'Electronics & Audio', emoji: '🎧', iconName: 'Headphones' },
  { id: 'Watch', label: 'Watches & Wearables', emoji: '⌚', iconName: 'Watch' },
  { id: 'ShoppingBag', label: 'Bags & Accessories', emoji: '🛍️', iconName: 'ShoppingBag' },
  { id: 'Sparkles', label: 'Beauty & Skincare', emoji: '✨', iconName: 'Sparkles' },
  { id: 'Sofa', label: 'Home & Decor', emoji: '🛋️', iconName: 'Sofa' },
  { id: 'Tag', label: 'Special Offers', emoji: '🏷️', iconName: 'Tag' },
  { id: 'Crown', label: 'Premium & Luxury', emoji: '👑', iconName: 'Crown' },
  { id: 'Trophy', label: 'Sports & Activewear', emoji: '🏆', iconName: 'Trophy' },
  { id: 'Palette', label: 'Custom Prints & Art', emoji: '🎨', iconName: 'Palette' },
  { id: 'Scissors', label: 'Tailored & Fabrics', emoji: '✂️', iconName: 'Scissors' },
  { id: 'Heart', label: 'Ethnic & Festive', emoji: '❤️', iconName: 'Heart' },
  { id: 'Package', label: 'General / Other', emoji: '📦', iconName: 'Package' },
];

export const CATEGORY_PRESET_COLORS = [
  '#E91E63', // Rose Pink
  '#2874F0', // Flipkart Blue
  '#009688', // Teal Green
  '#FF9800', // Amber Orange
  '#E040FB', // Purple Neon
  '#4CAF50', // Emerald Green
  '#795548', // Earth Brown
  '#607D8B', // Blue Grey
  '#DC2626', // Crimson Red
  '#4F46E5', // Indigo
  '#059669', // Jade
  '#D97706', // Gold Amber
];

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  useLucide?: boolean;
}

export function CategoryIcon({ name, className = '', size = 20, useLucide = false }: CategoryIconProps) {
  if (!useLucide) {
    // High-visibility Emoji circular representation
    const emojiMap: Record<string, string> = {
      Shirt: '👕',
      Footprints: '👟',
      Flame: '🔥',
      Smartphone: '📱',
      Headphones: '🎧',
      Watch: '⌚',
      ShoppingBag: '🛍️',
      Sparkles: '✨',
      Sofa: '🛋️',
      Tag: '🏷️',
      Crown: '👑',
      Trophy: '🏆',
      Palette: '🎨',
      Scissors: '✂️',
      Heart: '❤️',
      Package: '📦',
      Refrigerator: '🔌',
      Plug: '🔌',
      Gem: '💎',
      Glasses: '👓',
      Baby: '👶',
      Book: '📚',
      BookOpen: '📚',
      Utensils: '🍽️',
      Dumbbell: '🏋️',
      Car: '🚗',
      Layers: '🗂️',
      Percent: '🏷️',
    };

    if (emojiMap[name]) {
      return <span className={`select-none leading-none ${className}`}>{emojiMap[name]}</span>;
    }
  }

  // Lucide SVG representation
  switch (name) {
    case 'Shirt':
      return <Shirt size={size} className={className} />;
    case 'Footprints':
      return <Footprints size={size} className={className} />;
    case 'Flame':
      return <Flame size={size} className={className} />;
    case 'Smartphone':
      return <Smartphone size={size} className={className} />;
    case 'Headphones':
      return <Headphones size={size} className={className} />;
    case 'Watch':
      return <Watch size={size} className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag size={size} className={className} />;
    case 'Sparkles':
      return <Sparkles size={size} className={className} />;
    case 'Sofa':
      return <Sofa size={size} className={className} />;
    case 'Tag':
      return <Tag size={size} className={className} />;
    case 'Crown':
      return <Crown size={size} className={className} />;
    case 'Trophy':
      return <Trophy size={size} className={className} />;
    case 'Palette':
      return <Palette size={size} className={className} />;
    case 'Scissors':
      return <Scissors size={size} className={className} />;
    case 'Heart':
      return <Heart size={size} className={className} />;
    case 'Plug':
    case 'Refrigerator':
      return <Plug size={size} className={className} />;
    case 'Gem':
      return <Gem size={size} className={className} />;
    case 'Glasses':
      return <Glasses size={size} className={className} />;
    case 'Baby':
      return <Baby size={size} className={className} />;
    case 'Book':
    case 'BookOpen':
      return <BookOpen size={size} className={className} />;
    case 'Utensils':
      return <Utensils size={size} className={className} />;
    case 'Dumbbell':
      return <Dumbbell size={size} className={className} />;
    case 'Car':
      return <Car size={size} className={className} />;
    case 'Percent':
      return <Percent size={size} className={className} />;
    case 'Package':
    default:
      return <Package size={size} className={className} />;
  }
}

export default CategoryIcon;
