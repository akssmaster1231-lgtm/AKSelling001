/**
 * Product Image Mapper & Fallback System
 * 
 * Provides robust extraction of product image URLs across all supported data formats
 * (images[], imageUrl, image_url, image, thumbnail, photo, etc.) and guarantees
 * contextual, high-resolution authentic fashion product images instead of generic
 * wireframe shopping-bag SVG placeholders.
 */

export const BROKEN_IMAGE_SIGNATURE = '8532616';
export const LEGACY_SVG_BAG_INDICATOR = "viewBox='0 0 400 400'";

// Curated high-resolution, CDN-backed product photography for all apparel & fashion categories
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  // Apparel & Garments (T-shirts, Tops, Casualwear)
  'apparel-manufacturing':
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  fashion:
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  tshirts:
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',

  // Hoodies & Winterwear
  'hoodies-sweats':
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  hoodies:
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  winterwear:
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',

  // Fabrics & Textiles
  'fabrics-textiles':
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
  textiles:
    'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',

  // Custom Prints & Graphics
  'custom-prints':
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',

  // Bulk Wholesale Lots & Manufacturing
  'bulk-wholesale':
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',

  // Ethnic & Festive Wear
  'ethnic-wear':
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',

  // Footwear & Shoes
  footwear:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  shoes:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',

  // Accessories
  accessories:
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
};

// Default high-grade cotton crewneck t-shirt in studio lighting
export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
export const DEFAULT_PRODUCT_PLACEHOLDER = DEFAULT_PRODUCT_IMAGE;

/**
 * Checks if a given image string is empty, broken, or a legacy shopping-bag SVG.
 */
export function isPlaceholderOrBroken(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return true;
  if (trimmed.includes(BROKEN_IMAGE_SIGNATURE)) return true;
  if (trimmed.startsWith('data:image/svg+xml') || trimmed.includes(LEGACY_SVG_BAG_INDICATOR)) {
    return true;
  }
  return false;
}

/**
 * Dynamically infers the best matching authentic product photo based on
 * title, category, keywords, description, or tags.
 */
export function getProductFallbackImage(item?: unknown): string {
  if (!item || typeof item !== 'object') return DEFAULT_PRODUCT_IMAGE;

  const rec = item as Record<string, unknown>;
  const category = String(rec.category || '').toLowerCase().trim();
  const title = String(rec.title || '').toLowerCase().trim();
  const desc = String(rec.description || '').toLowerCase().trim();
  const prodType = String(rec.productType || '').toLowerCase().trim();
  const fabric = String(rec.fabric || '').toLowerCase().trim();
  const tags = Array.isArray(rec.tags) ? rec.tags.join(' ').toLowerCase() : '';
  const keywords = Array.isArray(rec.keywords) ? rec.keywords.join(' ').toLowerCase() : '';

  const fullText = `${title} ${desc} ${prodType} ${fabric} ${tags} ${keywords} ${category}`;

  // 1. Direct Category Match
  if (CATEGORY_FALLBACK_IMAGES[category]) {
    // If it's a specific sub-item within apparel (like hoodie, jeans, polo), check keywords first
  }

  // 2. Keyword-specific mapping for exact product types
  if (
    fullText.includes('hoodie') ||
    fullText.includes('sweatshirt') ||
    fullText.includes('sweats') ||
    fullText.includes('pullover') ||
    fullText.includes('winterwear')
  ) {
    return 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';
  }

  if (
    fullText.includes('jacket') ||
    fullText.includes('windcheater') ||
    fullText.includes('bomber') ||
    fullText.includes('blazer') ||
    fullText.includes('coat')
  ) {
    return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80';
  }

  if (
    fullText.includes('polo') ||
    fullText.includes('collar t-shirt') ||
    fullText.includes('collar tee')
  ) {
    return 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80';
  }

  if (
    fullText.includes('shirt') ||
    fullText.includes('formal') ||
    fullText.includes('button-down') ||
    fullText.includes('oxford')
  ) {
    return 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80';
  }

  if (
    fullText.includes('jeans') ||
    fullText.includes('denim') ||
    fullText.includes('trouser') ||
    fullText.includes('cargo') ||
    fullText.includes('jogger') ||
    fullText.includes('pants') ||
    fullText.includes('chinos')
  ) {
    return 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80';
  }

  if (
    fullText.includes('kurti') ||
    fullText.includes('saree') ||
    fullText.includes('kurta') ||
    fullText.includes('ethnic') ||
    fullText.includes('lehenga') ||
    fullText.includes('anarkali') ||
    fullText.includes('festive')
  ) {
    return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
  }

  if (
    fullText.includes('shoe') ||
    fullText.includes('sneaker') ||
    fullText.includes('footwear') ||
    fullText.includes('loafer') ||
    fullText.includes('sandal') ||
    fullText.includes('boot')
  ) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';
  }

  if (
    fullText.includes('fabric') ||
    fullText.includes('textile') ||
    fullText.includes('roll') ||
    fullText.includes('swatch') ||
    fullText.includes('gsm') ||
    fullText.includes('yarn')
  ) {
    return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80';
  }

  if (
    fullText.includes('print') ||
    fullText.includes('graphic') ||
    fullText.includes('dtf') ||
    fullText.includes('sublimation') ||
    fullText.includes('custom')
  ) {
    return 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80';
  }

  if (
    fullText.includes('cap') ||
    fullText.includes('belt') ||
    fullText.includes('wallet') ||
    fullText.includes('bag') ||
    fullText.includes('accessory') ||
    fullText.includes('accessories') ||
    fullText.includes('socks')
  ) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
  }

  if (
    fullText.includes('wholesale') ||
    fullText.includes('bulk') ||
    fullText.includes('lot') ||
    fullText.includes('manufacturing')
  ) {
    return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80';
  }

  // 3. Fallback to mapped category if present
  if (CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }

  return DEFAULT_PRODUCT_IMAGE;
}

/**
 * Universal extractor that checks all common product image keys:
 * - images (Array of strings, single string, or Array of objects)
 * - imageUrl / image_url
 * - image
 * - thumbnail / thumbnailUrl / thumbnail_url
 * - photo / photos
 * - img / picture / pic
 * 
 * Guarantees a non-empty array of valid, high-resolution URLs.
 */
export function resolveProductImages(item: unknown): string[] {
  if (!item) {
    return [DEFAULT_PRODUCT_IMAGE];
  }

  // Handle case where an array of image strings is directly passed: resolveProductImages(images)
  if (Array.isArray(item)) {
    const list: string[] = [];
    for (const entry of item) {
      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        if (trimmed && !isPlaceholderOrBroken(trimmed) && !list.includes(trimmed)) {
          list.push(trimmed);
        }
      } else if (entry && typeof entry === 'object') {
        const obj = entry as Record<string, unknown>;
        const candidate = obj.url || obj.src || obj.downloadURL || obj.secure_url || obj.imageUrl;
        if (typeof candidate === 'string') {
          const trimmed = candidate.trim();
          if (trimmed && !isPlaceholderOrBroken(trimmed) && !list.includes(trimmed)) {
            list.push(trimmed);
          }
        }
      }
    }
    return list.length > 0 ? list : [DEFAULT_PRODUCT_IMAGE];
  }

  if (typeof item !== 'object') {
    return [DEFAULT_PRODUCT_IMAGE];
  }

  const record = item as Record<string, unknown>;
  const foundUrls: string[] = [];

  const addIfValid = (candidate: unknown) => {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed && !isPlaceholderOrBroken(trimmed) && !foundUrls.includes(trimmed)) {
        foundUrls.push(trimmed);
      }
    }
  };

  // 1. Check array of images
  if (Array.isArray(record.images)) {
    for (const entry of record.images) {
      if (typeof entry === 'string') {
        addIfValid(entry);
      } else if (entry && typeof entry === 'object') {
        const obj = entry as Record<string, unknown>;
        addIfValid(obj.url || obj.src || obj.downloadURL || obj.secure_url || obj.imageUrl);
      }
    }
  } else if (typeof record.images === 'string') {
    const rawStr = record.images.trim();
    if (rawStr.startsWith('[') && rawStr.endsWith(']')) {
      try {
        const parsed = JSON.parse(rawStr);
        if (Array.isArray(parsed)) {
          for (const entry of parsed) {
            addIfValid(entry);
          }
        }
      } catch {
        addIfValid(rawStr);
      }
    } else if (rawStr.includes(',')) {
      rawStr.split(',').forEach(part => addIfValid(part));
    } else {
      addIfValid(rawStr);
    }
  }

  // 2. Check singular image keys
  addIfValid(record.imageUrl);
  addIfValid(record.image_url);
  addIfValid(record.image);
  addIfValid(record.thumbnail);
  addIfValid(record.thumbnailUrl);
  addIfValid(record.thumbnail_url);
  addIfValid(record.photo);
  addIfValid(record.img);
  addIfValid(record.picture);
  addIfValid(record.pic);

  // 3. Check photos array
  if (Array.isArray(record.photos)) {
    for (const p of record.photos) {
      addIfValid(p);
    }
  }

  // If at least one valid image is identified, return the list
  if (foundUrls.length > 0) {
    return foundUrls;
  }

  // Otherwise, intelligently infer the authentic product image based on product context
  return [getProductFallbackImage(record)];
}
