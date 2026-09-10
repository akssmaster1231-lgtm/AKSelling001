import type { Product, Category, VideoReel, Banner } from './types';
import { safeLocalStorageGetItem } from './utils/storageHelper';
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function fetchProducts(): Promise<Product[]> {
  const localSellerProducts = getLocalSellerProducts();
  const localIds = new Set(localSellerProducts.map(p => p.id));
  const fallbackList = products.filter(p => !localIds.has(p.id));

  try {
    const productsRef = collection(db, 'products');
    const snap = await getDocs(productsRef);
    if (!snap.empty) {
      const dbItems: Product[] = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (!localIds.has(docSnap.id)) {
          dbItems.push({
            id: docSnap.id,
            title: d.title || '',
            description: d.description || '',
            price: Number(d.price) || 0,
            mrp: Number(d.mrp) || Number(d.price) || 0,
            discount: Number(d.discount) || 0,
            category: d.category || 'fashion',
            images: Array.isArray(d.images) && d.images.length > 0 ? d.images : [d.image || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'],
            rating: typeof d.rating === 'number' ? d.rating : 4.2,
            ratingCount: Number(d.ratingCount || d.rating_count || 120),
            brand: d.brand || 'AKSelling',
            inStock: d.inStock !== false && d.in_stock !== false,
            delivery: d.delivery || 'Free delivery by tomorrow',
            sizes: d.sizes,
            colors: d.colors,
            neckType: d.neckType,
            sleeveType: d.sleeveType,
            fitType: d.fitType,
            fabric: d.fabric,
            pickupLocation: d.pickupLocation,
            weight: d.weight,
            dimensions: d.dimensions,
          });
        }
      });
      return [...localSellerProducts, ...dbItems];
    }
    return [...localSellerProducts, ...fallbackList];
  } catch (err) {
    console.warn('Firestore fetch products fallback:', err);
    return [...localSellerProducts, ...fallbackList];
  }
}

export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  const localSellerProducts = getLocalSellerProducts().filter(p => p.category === category);
  const localIds = new Set(localSellerProducts.map(p => p.id));
  const fallbackList = products.filter(p => p.category === category && !localIds.has(p.id));

  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('category', '==', category));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const dbItems: Product[] = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (!localIds.has(docSnap.id)) {
          dbItems.push({
            id: docSnap.id,
            title: d.title || '',
            description: d.description || '',
            price: Number(d.price) || 0,
            mrp: Number(d.mrp) || Number(d.price) || 0,
            discount: Number(d.discount) || 0,
            category: d.category || 'fashion',
            images: Array.isArray(d.images) && d.images.length > 0 ? d.images : [d.image || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'],
            rating: typeof d.rating === 'number' ? d.rating : 4.2,
            ratingCount: Number(d.ratingCount || d.rating_count || 120),
            brand: d.brand || 'AKSelling',
            inStock: d.inStock !== false && d.in_stock !== false,
            delivery: d.delivery || 'Free delivery by tomorrow',
            sizes: d.sizes,
            colors: d.colors,
            neckType: d.neckType,
            sleeveType: d.sleeveType,
            fitType: d.fitType,
            fabric: d.fabric,
            pickupLocation: d.pickupLocation,
            weight: d.weight,
            dimensions: d.dimensions,
          });
        }
      });
      return [...localSellerProducts, ...dbItems];
    }
    return [...localSellerProducts, ...fallbackList];
  } catch (err) {
    console.warn('Firestore fetch category products fallback:', err);
    return [...localSellerProducts, ...fallbackList];
  }
}

function getLocalSellerProducts(): Product[] {
  try {
    const saved = safeLocalStorageGetItem('akselling_seller_products') || localStorage.getItem('akselling_seller_products');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(p => !p.id?.startsWith('sp_') && p.catalogId !== 'CAT-98421' && p.catalogId !== 'CAT-89302' && p.catalogId !== 'CAT-74910' && p.catalogId !== 'CAT-62914' && p.catalogId !== 'CAT-51928' && p.catalogId !== 'CAT-41092')
      .map(p => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      price: Number(p.price) || 0,
      mrp: Number(p.mrp) || Number(p.price) || 0,
      discount: p.discount || (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0),
      category: p.category || 'fashion',
      images: p.images && p.images.length > 0 ? p.images : ['https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
      rating: typeof p.rating === 'number' ? p.rating : 0.0,
      ratingCount: p.salesCount || 0,
      brand: p.brand || 'AK Yadav Prints',
      inStock: p.stock > 0 || p.status === 'live',
      delivery: 'Free delivery by tomorrow',
      sizes: p.sizes,
      colors: p.colors,
      neckType: p.neckType,
      sleeveType: p.sleeveType,
      fitType: p.fitType,
      fabric: p.fabric,
    }));
  } catch {
    return [];
  }
}

export function mapDbProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    price: row.price as number,
    mrp: row.mrp as number,
    discount: row.discount as number,
    category: row.category as string,
    images: (row.images as string[]) || [],
    rating: Number(row.rating || 4.2),
    ratingCount: (row.rating_count as number) || (row.ratingCount as number) || 120,
    brand: (row.brand as string) || 'AKSelling',
    inStock: row.in_stock !== false,
    delivery: (row.delivery as string) || 'Free delivery in 2-3 days',
    sizes: (row.sizes as string[]) || undefined,
    colors: (row.colors as string[]) || undefined,
    neckType: (row.neck_type as string) || (row.neckType as string) || undefined,
    sleeveType: (row.sleeve_type as string) || (row.sleeveType as string) || undefined,
    fitType: (row.fit_type as string) || (row.fitType as string) || undefined,
    fabric: (row.fabric as string) || undefined,
  };
}

export const categories: Category[] = [
  { id: 'fashion', name: 'Fashion', icon: 'Shirt', color: '#e91e63' },
  { id: 'mobiles', name: 'Mobiles', icon: 'Smartphone', color: '#2874f0' },
  { id: 'electronics', name: 'Electronics', icon: 'Headphones', color: '#009688' },
  { id: 'home', name: 'Home', icon: 'Sofa', color: '#ff9800' },
  { id: 'beauty', name: 'Beauty', icon: 'Sparkles', color: '#e040fb' },
  { id: 'footwear', name: 'Footwear', icon: 'Footprints', color: '#4caf50' },
  { id: 'watches', name: 'Watches', icon: 'Watch', color: '#795548' },
  { id: 'appliances', name: 'Appliances', icon: 'Refrigerator', color: '#607d8b' },
];

export const banners: Banner[] = [
  {
    id: 'b1',
    title: 'Big Billion Days',
    subtitle: 'Up to 80% off on Electronics, Fashion & More',
    cta: 'Shop Now',
    image: 'https://images.pexels.com/photos/5625013/pexels-photo-5625013.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gradient: 'from-flipkart-600 to-flipkart-800',
  },
  {
    id: 'b2',
    title: 'Mega Fashion Sale',
    subtitle: 'Min 50% off on top brands',
    cta: 'Explore',
    image: 'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gradient: 'from-pink-600 to-rose-700',
  },
  {
    id: 'b3',
    title: 'Mobile Mania',
    subtitle: 'Latest smartphones starting ₹6,999',
    cta: 'Buy Now',
    image: 'https://images.pexels.com/photos/36680544/pexels-photo-36680544.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'b4',
    title: 'Beauty Bonanza',
    subtitle: 'Premium beauty brands up to 60% off',
    cta: 'Discover',
    image: 'https://images.pexels.com/photos/3018845/pexels-photo-3018845.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gradient: 'from-purple-600 to-fuchsia-700',
  },
];

export const products: Product[] = [
  {
    id: 'p1',
    title: 'Premium Wireless Over-Ear Headphones with Active Noise Cancellation',
    description: 'Experience studio-quality sound with these premium wireless over-ear headphones. Featuring active noise cancellation, 40-hour battery life, and plush memory foam ear cushions for all-day comfort. Bluetooth 5.3 connectivity with multipoint pairing. Includes fast USB-C charging.',
    price: 2999,
    mrp: 7999,
    discount: 62,
    category: 'electronics',
    images: [
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/3394653/pexels-photo-3394653.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/9058878/pexels-photo-9058878.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/9058883/pexels-photo-9058883.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.3,
    ratingCount: 12453,
    brand: 'SoundPro',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
  },
  {
    id: 'p2',
    title: 'Pro Max Smartphone 256GB - 108MP Camera, 6.7" AMOLED Display',
    description: 'Flagship smartphone with 108MP triple camera system, 6.7-inch 120Hz AMOLED display, 5000mAh battery with 67W fast charging, Snapdragon processor, and 256GB storage. IP68 water resistant. Box includes charger, USB-C cable, and protective case.',
    price: 24999,
    mrp: 39999,
    discount: 37,
    category: 'mobiles',
    images: [
      'https://images.pexels.com/photos/36680544/pexels-photo-36680544.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/18311092/pexels-photo-18311092.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/11120516/pexels-photo-11120516.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/947407/pexels-photo-947407.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.5,
    ratingCount: 28934,
    brand: 'TechNova',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
  },
  {
    id: 'p3',
    title: 'Classic Denim Jacket - Premium Cotton Blend, Unisex',
    description: 'Timeless denim jacket crafted from premium cotton blend fabric. Features button-front closure, two chest pockets, and a tailored fit. Perfect for layering in any season. Available in multiple sizes. Machine washable.',
    price: 1299,
    mrp: 3499,
    discount: 62,
    category: 'fashion',
    images: [
      'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/13632832/pexels-photo-13632832.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/18533668/pexels-photo-18533668.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/18533669/pexels-photo-18533669.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.1,
    ratingCount: 5421,
    brand: 'UrbanThread',
    inStock: true,
    delivery: 'Free delivery in 2-3 days',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Denim Blue', 'Black', 'Washed Grey'],
    fitType: 'Regular Fit',
    fabric: '100% Cotton Denim',
  },
  {
    id: 'p_fashion_tshirt_1',
    title: 'Solid Men Round Neck Pure Cotton Regular Fit T-Shirt',
    description: 'Elevate your daily style with this solid round neck premium combed cotton t-shirt. Bio-washed for ultra-soft hand feel, pre-shrunk, color-fast, and breathable fabric with reinforced ribbed neck band.',
    price: 399,
    mrp: 999,
    discount: 60,
    category: 'fashion',
    images: [
      'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/8532617/pexels-photo-8532617.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/8532618/pexels-photo-8532618.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.4,
    ratingCount: 14200,
    brand: 'UrbanThread',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    colors: ['Black', 'White', 'Navy Blue', 'Maroon', 'Olive Green'],
    neckType: 'Round Neck (गोल गला)',
    sleeveType: 'Half Sleeve',
    fitType: 'Regular Fit',
    fabric: '100% Pure Combed Cotton (180 GSM)',
  },
  {
    id: 'p_fashion_polo_1',
    title: 'Men Solid Polo Neck Premium Pique Cotton T-Shirt',
    description: 'Classic polo collar t-shirt with 2-button placket, ribbed collar and cuff hems. Crafted from premium honeycomb pique cotton knit. Ideal for smart-casual and formal layering.',
    price: 599,
    mrp: 1499,
    discount: 60,
    category: 'fashion',
    images: [
      'https://images.pexels.com/photos/1232459/pexels-photo-1232459.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.5,
    ratingCount: 9840,
    brand: 'PoloClub',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Royal Blue', 'Black', 'White', 'Yellow', 'Dark Green'],
    neckType: 'Polo Neck / Collar (पोलो कॉलर)',
    sleeveType: 'Half Sleeve',
    fitType: 'Slim Fit',
    fabric: 'Pique Cotton (220 GSM)',
  },
  {
    id: 'p4',
    title: 'Luxury Automatic Chronograph Watch - Stainless Steel',
    description: 'Elegant automatic chronograph wristwatch with stainless steel case and genuine leather strap. Features sapphire crystal, 50M water resistance, and exhibition caseback. Swiss movement with 42-hour power reserve. Comes in a premium gift box.',
    price: 8999,
    mrp: 19999,
    discount: 55,
    category: 'watches',
    images: [
      'https://images.pexels.com/photos/30077330/pexels-photo-30077330.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/28977357/pexels-photo-28977357.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/14312717/pexels-photo-14312717.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.6,
    ratingCount: 3421,
    brand: 'ChronoLux',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
  },
  {
    id: 'p5',
    title: 'Running Sneakers - Lightweight Breathable Sports Shoes',
    description: 'High-performance running sneakers with breathable mesh upper, cushioned EVA midsole, and durable rubber outsole. Features padded collar and tongue for extra comfort. Ideal for running, gym, and casual wear. Lightweight design at just 280g per shoe.',
    price: 1799,
    mrp: 4999,
    discount: 64,
    category: 'footwear',
    images: [
      'https://images.pexels.com/photos/33597709/pexels-photo-33597709.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/19869760/pexels-photo-19869760.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/8313383/pexels-photo-8313383.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/28488349/pexels-photo-28488349.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.2,
    ratingCount: 8932,
    brand: 'SwiftStep',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
  },
  {
    id: 'p6',
    title: 'GlowRadiance Skincare Set - Face Cream, Serum & Face Wash',
    description: 'Complete skincare routine in one set. Includes hydrating face cream with hyaluronic acid, vitamin C brightening serum, and gentle foaming face wash. Suitable for all skin types. Dermatologically tested. Paraben and sulfate free.',
    price: 999,
    mrp: 2999,
    discount: 66,
    category: 'beauty',
    images: [
      'https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/33538457/pexels-photo-33538457.png?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/33538456/pexels-photo-33538456.png?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/18441533/pexels-photo-18441533.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.4,
    ratingCount: 15623,
    brand: 'GlowRadiance',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
  },
  {
    id: 'p7',
    title: 'Modern Minimalist Kitchen Set - Cookware & Utensils',
    description: 'Premium 10-piece kitchen cookware set including non-stick pans, pots, and matching utensils. Made from food-grade aluminum with ceramic coating. Heat-resistant handles and tempered glass lids. Compatible with gas and induction cooktops.',
    price: 3499,
    mrp: 8999,
    discount: 61,
    category: 'home',
    images: [
      'https://images.pexels.com/photos/38609262/pexels-photo-38609262.png?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/33314763/pexels-photo-33314763.png?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/38609263/pexels-photo-38609263.png?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/32473246/pexels-photo-32473246.png?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.0,
    ratingCount: 2341,
    brand: 'HomeChef',
    inStock: true,
    delivery: 'Free delivery in 3-5 days',
  },
  {
    id: 'p8',
    title: 'Bluetooth In-Ear Earbuds with ENC - 30hr Playback',
    description: 'True wireless earbuds with environmental noise cancellation, 13mm dynamic drivers, and up to 30 hours total playback with charging case. IPX5 sweat and water resistant. Touch controls and low-latency gaming mode. Voice assistant compatible.',
    price: 1499,
    mrp: 4999,
    discount: 70,
    category: 'electronics',
    images: [
      'https://images.pexels.com/photos/9058879/pexels-photo-9058879.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/15840650/pexels-photo-15840650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/9058878/pexels-photo-9058878.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/3394653/pexels-photo-3394653.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.1,
    ratingCount: 18765,
    brand: 'SoundPro',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
  },
  {
    id: 'p9',
    title: 'Designer Leather Handbag - Premium PU Leather Tote',
    description: 'Elegant designer handbag crafted from premium PU leather. Features spacious main compartment with zip closure, interior pockets, and adjustable shoulder strap. Gold-tone hardware accents. Perfect for work, travel, and everyday use.',
    price: 899,
    mrp: 2499,
    discount: 64,
    category: 'fashion',
    images: [
      'https://images.pexels.com/photos/27174557/pexels-photo-27174557.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/13632832/pexels-photo-13632832.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/18533668/pexels-photo-18533668.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.3,
    ratingCount: 4567,
    brand: 'UrbanThread',
    inStock: true,
    delivery: 'Free delivery in 2-3 days',
  },
  {
    id: 'p10',
    title: 'Smartphone Lite 128GB - 50MP Camera, 5000mAh Battery',
    description: 'Feature-packed smartphone with 50MP dual camera, 6.5-inch HD+ display, 5000mAh battery, and 128GB storage expandable up to 1TB. Octa-core processor for smooth multitasking. Side-mounted fingerprint sensor. Dual SIM support.',
    price: 12999,
    mrp: 22999,
    discount: 43,
    category: 'mobiles',
    images: [
      'https://images.pexels.com/photos/27212302/pexels-photo-27212302.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/947407/pexels-photo-947407.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/36680544/pexels-photo-36680544.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/18311092/pexels-photo-18311092.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.2,
    ratingCount: 15234,
    brand: 'TechNova',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
  },
  {
    id: 'p11',
    title: 'Luxury Wristwatch - Gold Dial with Stainless Steel Strap',
    description: 'Sophisticated luxury wristwatch with gold-tone dial and stainless steel bracelet strap. Features date display, scratch-resistant mineral glass, and quartz movement. 30M water resistance. Comes with 2-year warranty and premium gift packaging.',
    price: 4999,
    mrp: 12999,
    discount: 61,
    category: 'watches',
    images: [
      'https://images.pexels.com/photos/12835318/pexels-photo-12835318.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/6157408/pexels-photo-6157408.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/28977357/pexels-photo-28977357.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.4,
    ratingCount: 6789,
    brand: 'ChronoLux',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
  },
  {
    id: 'p12',
    title: 'Pro Makeup Kit - 35 Color Eyeshadow Palette + Lipsticks',
    description: 'Complete professional makeup kit featuring 35 highly pigmented eyeshadow shades, 4 liquid lipsticks, blush, highlighter, and makeup brushes. Long-lasting, crease-resistant formula. Suitable for all skin tones. Cruelty-free and vegan.',
    price: 799,
    mrp: 2499,
    discount: 68,
    category: 'beauty',
    images: [
      'https://images.pexels.com/photos/6527699/pexels-photo-6527699.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/6527702/pexels-photo-6527702.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/3018845/pexels-photo-3018845.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/24602077/pexels-photo-24602077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.0,
    ratingCount: 9876,
    brand: 'GlowRadiance',
    inStock: true,
    delivery: 'Free delivery by tomorrow',
  },
];

export const videoReels: VideoReel[] = [
  {
    id: 'v1',
    title: 'Unboxing the SoundPro Headphones',
    product: products[0],
    likes: 45200,
    comments: 1234,
    shares: 567,
    liked: false,
    thumbnail: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    description: 'Check out the premium build quality and sound! #unboxing #headphones',
  },
  {
    id: 'v2',
    title: 'TechNova Pro Max Camera Test',
    product: products[1],
    likes: 89300,
    comments: 3421,
    shares: 1200,
    liked: false,
    thumbnail: 'https://images.pexels.com/photos/36680544/pexels-photo-36680544.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    description: 'The 108MP camera is INSANE! Watch this low-light test #smartphone #camera',
  },
  {
    id: 'v3',
    title: 'Styling the Classic Denim Jacket',
    product: products[2],
    likes: 23100,
    comments: 876,
    shares: 234,
    liked: false,
    thumbnail: 'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    description: '3 ways to style your denim jacket this season #fashion #ootd',
  },
  {
    id: 'v4',
    title: 'Luxury Watch Review - ChronoLux',
    product: products[3],
    likes: 67500,
    comments: 2100,
    shares: 890,
    liked: false,
    thumbnail: 'https://images.pexels.com/photos/30077330/pexels-photo-30077330.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    description: 'Is this the best watch under ₹10,000? #watches #review',
  },
  {
    id: 'v5',
    title: 'Running Sneakers - 30 Day Test',
    product: products[4],
    likes: 34200,
    comments: 1567,
    shares: 445,
    liked: false,
    thumbnail: 'https://images.pexels.com/photos/33597709/pexels-photo-33597709.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    description: 'I ran 200km in these sneakers. Here is what happened #sneakers #running',
  },
  {
    id: 'v6',
    title: 'Skincare Routine with GlowRadiance',
    product: products[5],
    likes: 52100,
    comments: 2890,
    shares: 1100,
    liked: false,
    thumbnail: 'https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    description: 'My 3-step glow up routine that actually works #skincare #beauty',
  },
];

export function formatPrice(price: number): string {
  return '₹' + price.toLocaleString('en-IN');
}

export function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}
