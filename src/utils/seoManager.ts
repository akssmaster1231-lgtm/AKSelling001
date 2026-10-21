/**
 * AKSelling Enterprise SEO & Data Privacy Routing Pipeline
 * Delegates to the unified updateDynamicSeo engine in SeoHeadManager.
 */

export {
  updateDynamicSeo,
  updateDynamicSeo as updatePageSeo,
  updateSeoHead,
  updateDocumentTitleAndMeta,
  setDynamicSeo,
  type DynamicSeoOptions,
  type DynamicSeoOptions as SeoConfig,
} from '@/components/seo/SeoHeadManager';
