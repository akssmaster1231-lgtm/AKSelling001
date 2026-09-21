import type { Product } from '@/types';

/**
 * Generates a normalized design signature for a product.
 * Products with identical images + normalized titles are recognized as the same design.
 */
export function getProductDesignKey(product: Product): string {
  if (!product) return '';

  // 1. Normalized title (lowercase, trimmed, collapsed whitespace, punctuation stripped)
  const normalizedTitle = (product.title || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');

  // 2. Primary image URL (strip query parameters and whitespace)
  let mainImg = '';
  if (Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string') {
    mainImg = product.images[0].trim().split('?')[0];
  } else if ('image' in product && typeof (product as unknown as { image: string }).image === 'string') {
    mainImg = ((product as unknown as { image: string }).image).trim().split('?')[0];
  }

  // 3. SKU if provided and non-empty
  const sku = ('sku' in product && typeof (product as unknown as { sku: string }).sku === 'string')
    ? (product as unknown as { sku: string }).sku.trim().toLowerCase()
    : '';

  if (sku) {
    return `sku_${sku}`;
  }

  // If real image exists and title exists, image + title is the strongest design signature
  const isPlaceholder = !mainImg || mainImg.startsWith('data:image/svg') || mainImg.includes('8532616');
  if (!isPlaceholder && normalizedTitle) {
    return `design_${normalizedTitle}:::${mainImg}`;
  }

  // If only real image exists without title
  if (!isPlaceholder && mainImg) {
    return `img_${mainImg}`;
  }

  // Fallback: title + category + brand
  const brand = (product.brand || '').trim().toLowerCase();
  const category = (product.category || '').trim().toLowerCase();
  return `text_${normalizedTitle}:::${brand}:::${category}`;
}

/**
 * Deduplicates a list of products so that:
 * 1. Each product ID is unique (no duplicate IDs).
 * 2. Each design (title + image signature) appears exactly once (no duplicate design listings).
 */
export function deduplicateProducts(products: Product[]): Product[] {
  if (!Array.isArray(products) || products.length === 0) return [];

  const seenIds = new Set<string>();
  const seenDesigns = new Set<string>();
  const uniqueProducts: Product[] = [];

  for (const product of products) {
    if (!product || !product.id) continue;

    // Check ID
    if (seenIds.has(product.id)) continue;

    // Check design key
    const designKey = getProductDesignKey(product);
    if (designKey && seenDesigns.has(designKey)) {
      // Duplicate design already added; skip
      continue;
    }

    seenIds.add(product.id);
    if (designKey) {
      seenDesigns.add(designKey);
    }
    uniqueProducts.push(product);
  }

  return uniqueProducts;
}

/**
 * Tracks displayed products across page sections so no product or design
 * is repeated in multiple shelves/sections on the same page.
 */
export class DisplayDeduplicator {
  private displayedIds = new Set<string>();
  private displayedDesigns = new Set<string>();

  public isDisplayed(product: Product): boolean {
    if (!product || !product.id) return true;
    if (this.displayedIds.has(product.id)) return true;
    const dKey = getProductDesignKey(product);
    if (dKey && this.displayedDesigns.has(dKey)) return true;
    return false;
  }

  public markDisplayed(product: Product): void {
    if (!product || !product.id) return;
    this.displayedIds.add(product.id);
    const dKey = getProductDesignKey(product);
    if (dKey) {
      this.displayedDesigns.add(dKey);
    }
  }

  public filterAndMark(products: Product[], limit?: number): Product[] {
    const selected: Product[] = [];
    for (const p of products) {
      if (typeof limit === 'number' && selected.length >= limit) break;
      if (!this.isDisplayed(p)) {
        this.markDisplayed(p);
        selected.push(p);
      }
    }
    return selected;
  }

  public reset(): void {
    this.displayedIds.clear();
    this.displayedDesigns.clear();
  }
}
