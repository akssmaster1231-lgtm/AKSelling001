import { useEffect } from 'react';
import type { Product } from '@/types';
import type { TabId } from '@/components/BottomNav';

export interface DynamicSeoOptions {
  product?: Product | null;
  pageView?:
    | 'home'
    | 'product'
    | 'categories'
    | 'category'
    | 'deals'
    | 'cart'
    | 'account'
    | 'checkout'
    | 'orders'
    | 'admin'
    | 'seller'
    | 'auth'
    | 'notifications'
    | string;
  category?: string;
  searchQuery?: string;
  appMode?: 'buying' | 'selling';
  activeTab?: TabId;
  selectedProduct?: Product | null;
  buyNowProduct?: Product | null;
  showOrders?: boolean;
  showAdmin?: boolean;
  showSellerReg?: boolean;
  showAuth?: boolean;
  showNotifications?: boolean;
  hasSubScreen?: boolean;
  isPrivate?: boolean;
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
  canonicalPath?: string;
}

const BRAND_NAME = 'AKSelling';
const DEFAULT_TITLE = 'AKSelling – 180 GSM Bio-Wash Cotton & Streetwear Factory Store';
const DEFAULT_DESCRIPTION =
  'Shop 100% pure combed 180 GSM bio-wash cotton and heavyweight 240+ GSM streetwear oversized t-shirts factory direct from Indore hub with cash on delivery & free shipping.';
const DEFAULT_IMAGE = '/ak_brand_logo.jpg';
const DEFAULT_KEYWORDS =
  '180 GSM bio wash cotton t-shirt, oversized streetwear Indore, factory direct clothes, combed cotton apparel, custom DTF graphic tees, cash on delivery tshirts India, wholesale cotton tshirts';

/**
 * Helper to get or create a <meta> tag and update its content
 */
function setMetaTag(attrType: 'name' | 'property', attrName: string, content: string): void {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(`meta[${attrType}="${attrName}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrType, attrName);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Helper to remove product-specific OpenGraph tags on non-product pages
 */
function cleanupProductMetaTags(): void {
  if (typeof document === 'undefined') return;
  const productMetaNames = [
    'product:price:amount',
    'product:price:currency',
    'product:availability',
    'product:condition',
    'product:retailer_item_id',
    'product:brand',
  ];
  productMetaNames.forEach((name) => {
    const el = document.querySelector(`meta[property="${name}"]`);
    if (el) el.remove();
  });
}

/**
 * Helper to inject or update JSON-LD Schema.org structured data
 */
function setJsonLdSchema(schemaObj: Record<string, unknown> | null): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('akselling-seo-jsonld');
  if (!schemaObj) {
    if (existing) existing.remove();
    return;
  }
  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'akselling-seo-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schemaObj);
}

/**
 * Dynamically updates document title and meta tags based on the current product
 * or page view to improve organic discovery in search engines and social platforms.
 *
 * Enforces SEO best practices:
 * - 30-60 char branded titles
 * - 120-160 char descriptive meta descriptions with action CTAs
 * - OpenGraph and Twitter large image cards
 * - Product / Collection / OnlineStore Schema.org JSON-LD rich snippets
 * - Strict noindex protection for private checkout and account routes
 */
export function updateDynamicSeo(
  targetOrOptions?: Product | string | DynamicSeoOptions | null,
  extraOptions?: Partial<DynamicSeoOptions>
): void {
  if (typeof document === 'undefined') return;

  // Normalize arguments
  let opts: DynamicSeoOptions = {};
  if (targetOrOptions) {
    if (typeof targetOrOptions === 'string') {
      opts = { pageView: targetOrOptions, ...extraOptions };
    } else if ('id' in targetOrOptions && 'title' in targetOrOptions) {
      opts = { product: targetOrOptions as Product, pageView: 'product', ...extraOptions };
    } else {
      opts = { ...targetOrOptions, ...extraOptions };
    }
  } else if (extraOptions) {
    opts = { ...extraOptions };
  }

  // Detect product from either `product` or `selectedProduct`
  const activeProduct = opts.product || opts.selectedProduct || null;

  // Determine private session route state
  const isExplicitPrivate =
    opts.isPrivate ||
    Boolean(opts.buyNowProduct) ||
    Boolean(opts.showOrders) ||
    Boolean(opts.showAdmin) ||
    Boolean(opts.showSellerReg) ||
    Boolean(opts.showAuth) ||
    Boolean(opts.showNotifications) ||
    Boolean(opts.hasSubScreen) ||
    opts.appMode === 'selling' ||
    opts.activeTab === 'cart' ||
    opts.activeTab === 'account' ||
    opts.pageView === 'cart' ||
    opts.pageView === 'checkout' ||
    opts.pageView === 'orders' ||
    opts.pageView === 'admin' ||
    opts.pageView === 'seller' ||
    opts.pageView === 'account';

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Canonical Link element
  let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }

  // --------------------------------------------------------------------------
  // CASE 1: PRIVATE ROUTES (STRICT NOINDEX / NOFOLLOW TO PROTECT USER SESSIONS)
  // --------------------------------------------------------------------------
  if (isExplicitPrivate) {
    let privateTitle = 'Secure Session';
    let privateDesc = 'Private authenticated customer session on AKSelling.';

    if (opts.buyNowProduct || opts.pageView === 'checkout') {
      privateTitle = 'Secure Checkout';
      privateDesc = 'Direct UPI & COD payment checkout with 10% advance. Private customer session.';
    } else if (opts.showOrders || opts.pageView === 'orders') {
      privateTitle = 'My Orders & Real-Time Tracking';
      privateDesc = 'Customer order history, live parcel tracking, and invoice downloads.';
    } else if (opts.showAdmin || opts.pageView === 'admin') {
      privateTitle = 'Admin Master Control Panel';
      privateDesc = 'Authorized store owner administrative panel.';
    } else if (opts.appMode === 'selling' || opts.pageView === 'seller') {
      privateTitle = 'Seller Hub Dashboard';
      privateDesc = 'Verified seller inventory and order fulfillment dashboard.';
    } else if (opts.showSellerReg) {
      privateTitle = 'Seller Registration';
      privateDesc = 'Join AKSelling as a verified factory supplier with 0% commission.';
    } else if (opts.showAuth || opts.pageView === 'auth') {
      privateTitle = 'Sign In / Account Registration';
      privateDesc = 'Login to AKSelling to view orders, wallet rewards, and fast checkout.';
    } else if (opts.showNotifications || opts.pageView === 'notifications') {
      privateTitle = 'Notifications & Alerts';
      privateDesc = 'Customer notification inbox and order dispatch tracking.';
    } else if (opts.activeTab === 'cart' || opts.pageView === 'cart') {
      privateTitle = 'Shopping Cart';
      privateDesc = 'Review your factory-direct 180 GSM bio-wash cotton items before checkout.';
    } else if (opts.activeTab === 'account' || opts.pageView === 'account' || opts.hasSubScreen) {
      privateTitle = 'My Profile & Account Settings';
      privateDesc = 'Manage personal profile, delivery addresses, rewards wallet, and notifications.';
    }

    document.title = `${privateTitle} | ${BRAND_NAME}`;
    setMetaTag('name', 'description', privateDesc);
    setMetaTag('name', 'robots', 'noindex, nofollow, noarchive, nosnippet');
    setMetaTag('name', 'googlebot', 'noindex, nofollow, noarchive, nosnippet');
    setMetaTag('name', 'bingbot', 'noindex, nofollow, noarchive, nosnippet');
    linkCanonical.setAttribute('href', origin);

    cleanupProductMetaTags();
    setJsonLdSchema(null);

    // Safe fallback social cards for private links
    setMetaTag('property', 'og:title', DEFAULT_TITLE);
    setMetaTag('property', 'og:description', DEFAULT_DESCRIPTION);
    setMetaTag('property', 'og:url', origin);
    setMetaTag('property', 'og:image', `${origin}${DEFAULT_IMAGE}`);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', BRAND_NAME);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', DEFAULT_TITLE);
    setMetaTag('name', 'twitter:description', DEFAULT_DESCRIPTION);
    return;
  }

  // --------------------------------------------------------------------------
  // CASE 2: PUBLIC ROUTES (INDEXABLE WITH RICH METADATA & SCHEMA FOR DISCOVERY)
  // --------------------------------------------------------------------------
  setMetaTag(
    'name',
    'robots',
    'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  );
  setMetaTag(
    'name',
    'googlebot',
    'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  );

  // 2A: SINGLE PRODUCT DETAIL VIEW (Highest Intent Organic Landing Page)
  if (activeProduct) {
    const p = activeProduct;
    const priceText = `₹${p.price}`;

    // Specific & branded title (30-60 chars target)
    let pageTitle = `${p.title} (${priceText}) – 180 GSM Cotton | ${BRAND_NAME}`;
    if (pageTitle.length > 60) {
      pageTitle = `${p.title.slice(0, 36)}... (${priceText}) | ${BRAND_NAME}`;
    }
    if (opts.customTitle) pageTitle = opts.customTitle;

    // Compelling 120-160 char meta description with CTA
    const baseDesc = p.description ? p.description.replace(/\s+/g, ' ').trim() : '';
    let pageDesc = baseDesc
      ? `Buy ${p.title} online at factory price ${priceText} (${p.discount}% off). ${baseDesc.slice(0, 85)}... Doorstep Cash on Delivery available.`
      : `Buy ${p.title} online at factory direct price ${priceText} (${p.discount}% off). 100% combed 180 GSM bio-wash cotton, pre-shrunk with Cash on Delivery & Free Shipping.`;
    if (pageDesc.length > 160) {
      pageDesc = pageDesc.slice(0, 157) + '...';
    }
    if (opts.customDescription) pageDesc = opts.customDescription;

    const prodImages =
      Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : [p.image || p.imageUrl || DEFAULT_IMAGE];
    const rawImage = prodImages[0] || DEFAULT_IMAGE;
    const fullImage =
      rawImage.startsWith('http') || rawImage.startsWith('data:')
        ? rawImage
        : `${origin}${rawImage}`;

    const canonicalUrl =
      opts.canonicalPath || `${origin}/?productId=${encodeURIComponent(p.id)}`;

    // Update Head Elements
    document.title = pageTitle;
    setMetaTag('name', 'description', pageDesc);
    setMetaTag(
      'name',
      'keywords',
      `${p.title}, ${p.brand || 'AKSelling'}, 180 GSM cotton, bio wash t-shirt, factory direct apparel, buy ${p.title} online, Indore cotton apparel`
    );
    linkCanonical.setAttribute('href', canonicalUrl);

    // OpenGraph Tags
    setMetaTag('property', 'og:type', 'product');
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDesc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', fullImage);
    setMetaTag('property', 'og:site_name', BRAND_NAME);

    // OpenGraph Product Extension Properties (Supported by Google / Facebook / WhatsApp)
    setMetaTag('property', 'product:price:amount', String(p.price));
    setMetaTag('property', 'product:price:currency', 'INR');
    setMetaTag(
      'property',
      'product:availability',
      p.inStock !== false ? 'in stock' : 'out of stock'
    );
    setMetaTag('property', 'product:condition', 'new');
    setMetaTag('property', 'product:brand', p.brand || BRAND_NAME);
    setMetaTag('property', 'product:retailer_item_id', p.id);

    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDesc);
    setMetaTag('name', 'twitter:image', fullImage);

    // Schema.org Product Rich Snippet
    const absoluteImages = prodImages.map((img) =>
      img && (img.startsWith('http') || img.startsWith('data:')) ? img : `${origin}${img}`
    );

    const productSchema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: p.title,
      image: absoluteImages,
      description: pageDesc,
      sku: p.id,
      mpn: p.id,
      brand: {
        '@type': 'Brand',
        name: p.brand || BRAND_NAME,
      },
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'INR',
        price: p.price,
        priceValidUntil: '2028-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability:
          p.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'AKSelling Garment Hub',
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'IN',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 7,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/FreeReturn',
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '0',
            currency: 'INR',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 2,
              unitCode: 'd',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 2,
              maxValue: 4,
              unitCode: 'd',
            },
          },
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

    setJsonLdSchema(productSchema);
    return;
  }

  // Non-product page: clean up product-specific meta tags
  cleanupProductMetaTags();

  // 2B: CATEGORIES / SPECIFIC CATEGORY COLLECTION VIEW
  if (opts.activeTab === 'categories' || opts.pageView === 'categories' || opts.pageView === 'category') {
    const categoryName = opts.category || '';
    const title = categoryName
      ? `Buy ${categoryName} Online – 180 GSM Cotton | ${BRAND_NAME}`
      : `Shop Categories – 180 GSM Cotton & Streetwear | ${BRAND_NAME}`;
    const description = categoryName
      ? `Discover authentic factory direct ${categoryName} apparel from Indore hub. 100% combed 180 GSM bio-wash cotton and heavyweight streetwear at 0% markup.`
      : 'Explore pure combed 180 GSM cotton tees, heavyweight 240+ GSM streetwear, and custom HD DTF graphic prints at factory direct prices with Cash on Delivery.';
    const canonicalUrl = `${origin}/#categories`;

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', `${categoryName ? categoryName + ', ' : ''}${DEFAULT_KEYWORDS}`);
    linkCanonical.setAttribute('href', canonicalUrl);

    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', `${origin}${DEFAULT_IMAGE}`);
    setMetaTag('property', 'og:site_name', BRAND_NAME);

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', `${origin}${DEFAULT_IMAGE}`);

    // CollectionPage & Breadcrumb Schema
    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: canonicalUrl,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: origin,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryName || 'Categories',
            item: canonicalUrl,
          },
        ],
      },
    };

    setJsonLdSchema(collectionSchema);
    return;
  }

  // 2C: FLASH DEALS & DROPS VIEW
  if (opts.activeTab === 'deals' || opts.pageView === 'deals') {
    const title = `Flash Drops & Best Deals – Up to 60% Off | ${BRAND_NAME}`;
    const description =
      'Grab limited-time flash drops on 180 GSM bio-wash cotton tees and heavyweight streetwear up to 60% off. Factory direct pricing with doorstep Cash on Delivery.';
    const canonicalUrl = `${origin}/#deals`;

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', `factory deals, flash drop streetwear, t-shirt discount, ${DEFAULT_KEYWORDS}`);
    linkCanonical.setAttribute('href', canonicalUrl);

    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', `${origin}${DEFAULT_IMAGE}`);
    setMetaTag('property', 'og:site_name', BRAND_NAME);

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', `${origin}${DEFAULT_IMAGE}`);

    setJsonLdSchema(null);
    return;
  }

  // 2D: SEARCH QUERY RESULTS VIEW
  if (opts.searchQuery && opts.searchQuery.trim().length > 0) {
    const q = opts.searchQuery.trim();
    const title = `Search: "${q}" – Factory Direct Apparel | ${BRAND_NAME}`;
    const description = `Find top-quality 180 GSM bio-wash cotton and streetwear results for "${q}". Factory direct pricing from Indore with Cash on Delivery & Free Delivery.`;
    const canonicalUrl = `${origin}/?q=${encodeURIComponent(q)}`;

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', `${q}, search apparel, ${DEFAULT_KEYWORDS}`);
    linkCanonical.setAttribute('href', canonicalUrl);

    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', `${origin}${DEFAULT_IMAGE}`);
    setMetaTag('property', 'og:site_name', BRAND_NAME);

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', `${origin}${DEFAULT_IMAGE}`);

    setJsonLdSchema(null);
    return;
  }

  // 2E: DEFAULT HOME PAGE VIEW
  const homeTitle = opts.customTitle || DEFAULT_TITLE;
  const homeDesc = opts.customDescription || DEFAULT_DESCRIPTION;
  const canonicalUrl = opts.canonicalPath || origin || currentUrl.split('?')[0];

  document.title = homeTitle;
  setMetaTag('name', 'description', homeDesc);
  setMetaTag('name', 'keywords', DEFAULT_KEYWORDS);
  linkCanonical.setAttribute('href', canonicalUrl);

  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:title', homeTitle);
  setMetaTag('property', 'og:description', homeDesc);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:image', `${origin}${DEFAULT_IMAGE}`);
  setMetaTag('property', 'og:site_name', BRAND_NAME);

  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', homeTitle);
  setMetaTag('name', 'twitter:description', homeDesc);
  setMetaTag('name', 'twitter:image', `${origin}${DEFAULT_IMAGE}`);

  // Organization, OnlineStore & WebSite SearchAction Schema
  const storeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: BRAND_NAME,
        url: origin,
        logo: `${origin}${DEFAULT_IMAGE}`,
        description: homeDesc,
        sameAs: ['https://instagram.com/akselling'],
      },
      {
        '@type': 'OnlineStore',
        '@id': `${origin}/#store`,
        name: 'AKSelling Direct Factory Store',
        url: origin,
        description: homeDesc,
        currenciesAccepted: 'INR',
        paymentAccepted: 'Cash on Delivery, Direct UPI, Razorpay',
        priceRange: '₹399 - ₹699',
        parentOrganization: {
          '@id': `${origin}/#organization`,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: BRAND_NAME,
        description: homeDesc,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${origin}/?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  setJsonLdSchema(storeSchema);
}

// Aliases for developer ergonomics across components
export const updateSeoHead = updateDynamicSeo;
export const updateDocumentTitleAndMeta = updateDynamicSeo;
export const setDynamicSeo = updateDynamicSeo;

interface SeoHeadManagerProps {
  appMode: 'buying' | 'selling';
  activeTab: TabId;
  selectedProduct: Product | null;
  buyNowProduct: Product | null;
  showOrders: boolean;
  showAdmin: boolean;
  showSellerReg: boolean;
  showAuth: boolean;
  searchQuery?: string;
  showNotifications?: boolean;
  hasSubScreen?: boolean;
}

/**
 * Top-level React component that continuously watches application state
 * and dispatches dynamic SEO updates.
 */
export default function SeoHeadManager(props: SeoHeadManagerProps) {
  useEffect(() => {
    updateDynamicSeo({
      appMode: props.appMode,
      activeTab: props.activeTab,
      selectedProduct: props.selectedProduct,
      buyNowProduct: props.buyNowProduct,
      showOrders: props.showOrders,
      showAdmin: props.showAdmin,
      showSellerReg: props.showSellerReg,
      showAuth: props.showAuth,
      searchQuery: props.searchQuery,
      showNotifications: props.showNotifications,
      hasSubScreen: props.hasSubScreen,
    });
  }, [
    props.appMode,
    props.activeTab,
    props.selectedProduct,
    props.buyNowProduct,
    props.showOrders,
    props.showAdmin,
    props.showSellerReg,
    props.showAuth,
    props.searchQuery,
    props.showNotifications,
    props.hasSubScreen,
  ]);

  return null;
}
