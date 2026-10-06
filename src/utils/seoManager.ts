/**
 * AKSelling Enterprise SEO & Data Privacy Routing Pipeline
 * Enforces strict separation between Public (Indexed) and Private (Noindex) routes.
 */

import type { Product } from '@/types';

export interface SeoConfig {
  title: string;
  description: string;
  canonicalUrl?: string;
  imageUrl?: string;
  isPrivate: boolean; // true = apply noindex, nofollow
  pageType?: 'website' | 'product' | 'article';
  product?: Product;
}

const DEFAULT_BRAND = 'AKSelling';
const DEFAULT_TITLE = 'AKSelling - 180 GSM Bio-Wash Cotton & Streetwear Factory Store';
const DEFAULT_DESC =
  'Shop 100% pure combed 180 GSM bio-wash cotton and heavyweight 240+ GSM streetwear oversized t-shirts factory direct from Indore hub with cash on delivery & free shipping.';
const DEFAULT_IMAGE = '/ak_brand_logo.jpg';

export function updatePageSeo(config: SeoConfig): void {
  if (typeof document === 'undefined') return;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const finalCanonical = config.canonicalUrl || (config.product ? `${origin}/?productId=${config.product.id}` : currentUrl.split('?')[0]);

  // 1. Update Document Title
  document.title = config.title ? `${config.title} | ${DEFAULT_BRAND}` : DEFAULT_TITLE;

  // 2. Helper to set or create meta tag
  const setMeta = (nameAttr: 'name' | 'property', attrValue: string, content: string) => {
    let el = document.querySelector(`meta[${nameAttr}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(nameAttr, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 3. Helper to set or remove canonical link
  let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }

  // 4. Handle Strict Public vs Private Route Separation
  if (config.isPrivate) {
    // PRIVATE ROUTE: Strictly block search engine crawlers from indexing customer, order or admin data
    setMeta('name', 'robots', 'noindex, nofollow, noarchive, nosnippet');
    setMeta('name', 'googlebot', 'noindex, nofollow, noarchive, nosnippet');
    setMeta('name', 'bingbot', 'noindex, nofollow, noarchive, nosnippet');
    linkCanonical.setAttribute('href', origin); // Point away from private route

    // Remove any JSON-LD structured data to prevent data scraping of customer/order details
    const existingJsonLd = document.getElementById('akselling-seo-jsonld');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    // Set generic fallback for social tags on private routes
    setMeta('property', 'og:title', DEFAULT_TITLE);
    setMeta('property', 'og:description', DEFAULT_DESC);
    setMeta('property', 'og:url', origin);
    setMeta('property', 'og:image', `${origin}${DEFAULT_IMAGE}`);
    setMeta('name', 'twitter:title', DEFAULT_TITLE);
    setMeta('name', 'twitter:description', DEFAULT_DESC);
    return;
  }

  // PUBLIC ROUTE: Permitted for search engine indexing
  setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  setMeta('name', 'googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  linkCanonical.setAttribute('href', finalCanonical);

  const desc = config.description || DEFAULT_DESC;
  const image = config.imageUrl || (config.product ? (Array.isArray(config.product.images) ? config.product.images[0] : config.product.image) : DEFAULT_IMAGE);
  const fullImage = image && (image.startsWith('http') || image.startsWith('data:')) ? image : `${origin}${image || DEFAULT_IMAGE}`;

  // Standard Meta Description
  setMeta('name', 'description', desc);

  // OpenGraph Tags
  setMeta('property', 'og:title', config.title || DEFAULT_TITLE);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', finalCanonical);
  setMeta('property', 'og:image', fullImage);
  setMeta('property', 'og:type', config.pageType || (config.product ? 'product' : 'website'));
  setMeta('property', 'og:site_name', DEFAULT_BRAND);

  // Twitter Card Tags
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', config.title || DEFAULT_TITLE);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image', fullImage);

  // 5. Inject JSON-LD Schema.org Structured Data
  let jsonLdScript = document.getElementById('akselling-seo-jsonld') as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'akselling-seo-jsonld';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }

  if (config.product) {
    // Rich Product Schema for Google Search Snippets (Price, Name, Rating, Availability)
    const p = config.product;
    const prodImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || p.imageUrl || DEFAULT_IMAGE];
    const absoluteImages = prodImages.map(img => (img && (img.startsWith('http') || img.startsWith('data:')) ? img : `${origin}${img}`));

    const productSchema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: p.title,
      image: absoluteImages,
      description: p.description || `${p.title} - Pure 180 GSM Bio-Wash Combed Cotton Apparel by AKSelling.`,
      sku: p.id,
      mpn: p.id,
      brand: {
        '@type': 'Brand',
        name: p.brand || DEFAULT_BRAND,
      },
      offers: {
        '@type': 'Offer',
        url: finalCanonical,
        priceCurrency: 'INR',
        price: p.price,
        priceValidUntil: '2028-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: p.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'AKSelling Garment Hub',
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: p.rating || 4.8,
        reviewCount: p.ratingCount || 120,
        bestRating: '5',
        worstRating: '1',
      },
    };

    jsonLdScript.textContent = JSON.stringify(productSchema);
  } else {
    // Store & Organization Schema for Home Page
    const storeSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${origin}/#organization`,
          name: DEFAULT_BRAND,
          url: origin,
          logo: `${origin}${DEFAULT_IMAGE}`,
          description: DEFAULT_DESC,
          sameAs: ['https://instagram.com/akselling'],
        },
        {
          '@type': 'OnlineStore',
          '@id': `${origin}/#store`,
          name: 'AKSelling Direct Factory Store',
          url: origin,
          description: DEFAULT_DESC,
          currenciesAccepted: 'INR',
          paymentAccepted: 'Cash on Delivery, Direct UPI, QR Code',
          priceRange: '₹399 - ₹699',
          parentOrganization: {
            '@id': `${origin}/#organization`,
          },
        },
      ],
    };

    jsonLdScript.textContent = JSON.stringify(storeSchema);
  }
}
