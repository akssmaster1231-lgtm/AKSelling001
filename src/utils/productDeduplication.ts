import type { Product } from '@/types';

/**
 * Generates a normalized design signature for a product.
 * Used for detecting identical duplicate listings.
 */
export function getProductDesignKey(product: Product): string {
  if (!product || !product.id) return '';

  const sku = (product as unknown as { sku?: string })?.sku?.trim().toLowerCase();
  if (sku) {
    return `sku_${sku}`;
  }

  // Use product.id as the primary unique key
  return `prod_${String(product.id).trim()}`;
}

/**
 * Deduplicates a list of products so that:
 * 1. Each unique product ID appears exactly once.
 * 2. Newly uploaded products are never filtered out or discarded.
 */
export function deduplicateProducts(products: Product[]): Product[] {
  if (!Array.isArray(products) || products.length === 0) return [];

  const seenIds = new Set<string>();
  const uniqueProducts: Product[] = [];

  for (const product of products) {
    if (!product) continue;
    const rawId = String(product.id || '').trim();
    if (!rawId) continue;

    // Check ID
    if (seenIds.has(rawId)) continue;
    seenIds.add(rawId);
    uniqueProducts.push(product);
  }

  return uniqueProducts;
}

/**
 * Tracks displayed products across page sections so no product
 * is repeated in multiple shelves/sections on the same page.
 */
export class DisplayDeduplicator {
  private displayedIds = new Set<string>();

  public isDisplayed(product: Product): boolean {
    if (!product || !product.id) return true;
    const cleanId = String(product.id).trim();
    return this.displayedIds.has(cleanId);
  }

  public markDisplayed(product: Product): void {
    if (!product || !product.id) return;
    const cleanId = String(product.id).trim();
    this.displayedIds.add(cleanId);
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
  }
}
