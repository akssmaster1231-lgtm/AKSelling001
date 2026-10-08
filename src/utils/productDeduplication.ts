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

const PERMANENT_DUMMY_IDS = new Set([
  'sp_1',
  'sp_2',
  'sp_3',
  'sp_4',
  'sp_5',
  'demo_tshirt',
  'prod_1789471043550',
  'prod_1789377443939',
  'PRD-261462',
]);

/**
 * Deduplicates a list of products so that:
 * 1. Each unique product ID appears exactly once.
 * 2. Newly uploaded products are never filtered out or discarded.
 * 3. Any legacy or dummy product IDs are permanently excluded.
 */
export function deduplicateProducts(products: Product[]): Product[] {
  if (!Array.isArray(products) || products.length === 0) return [];

  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const uniqueProducts: Product[] = [];

  for (const product of products) {
    if (!product) continue;
    const rawId = String(product.id || '').trim();
    if (!rawId) continue;

    // Filter out dummy/test products permanently
    if (PERMANENT_DUMMY_IDS.has(rawId) || rawId.startsWith('sp_')) continue;

    // Check duplicate ID
    const cleanId = rawId.toLowerCase();
    if (seenIds.has(cleanId)) continue;

    // Check duplicate Title / SKU signature
    const normTitle = (product.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const normSku = ((product as { sku?: string }).sku || '').trim().toLowerCase();
    const sigKey = normSku ? `sku_${normSku}` : (normTitle ? `title_${normTitle}__${(product.category || '').toLowerCase()}` : cleanId);

    if (sigKey && seenSignatures.has(sigKey)) {
      continue;
    }

    seenIds.add(cleanId);
    if (sigKey) seenSignatures.add(sigKey);
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
  private displayedSignatures = new Set<string>();

  public isDisplayed(product: Product): boolean {
    if (!product || !product.id) return true;
    const cleanId = String(product.id).trim().toLowerCase();
    if (this.displayedIds.has(cleanId)) return true;

    const normTitle = (product.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normTitle && this.displayedSignatures.has(normTitle)) return true;

    return false;
  }

  public markDisplayed(product: Product): void {
    if (!product || !product.id) return;
    const cleanId = String(product.id).trim().toLowerCase();
    this.displayedIds.add(cleanId);

    const normTitle = (product.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normTitle) {
      this.displayedSignatures.add(normTitle);
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
    this.displayedSignatures.clear();
  }
}
