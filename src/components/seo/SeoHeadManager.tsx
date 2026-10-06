import { useEffect } from 'react';
import type { Product } from '@/types';
import type { TabId } from '@/components/BottomNav';
import { updatePageSeo } from '@/utils/seoManager';

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

export default function SeoHeadManager({
  appMode,
  activeTab,
  selectedProduct,
  buyNowProduct,
  showOrders,
  showAdmin,
  showSellerReg,
  showAuth,
  searchQuery,
  showNotifications,
  hasSubScreen,
}: SeoHeadManagerProps) {
  useEffect(() => {
    // ------------------------------------------------------------------------
    // CASE 1: PRIVATE ROUTES (STRICTLY BLOCKED FROM SEARCH ENGINES & GOOGLE)
    // ------------------------------------------------------------------------
    if (buyNowProduct) {
      updatePageSeo({
        title: 'Secure Checkout',
        description: 'Direct UPI & COD 10% advance payment checkout. Private customer session.',
        isPrivate: true,
      });
      return;
    }

    if (showOrders) {
      updatePageSeo({
        title: 'My Orders & Real-Time Tracking',
        description: 'Customer order history, live parcel tracking, and invoice downloads.',
        isPrivate: true,
      });
      return;
    }

    if (showAdmin) {
      updatePageSeo({
        title: 'Admin Master Control Panel',
        description: 'Authorized store owner administrative panel.',
        isPrivate: true,
      });
      return;
    }

    if (appMode === 'selling') {
      updatePageSeo({
        title: 'Seller Hub Dashboard',
        description: 'Verified seller inventory and order fulfillment dashboard.',
        isPrivate: true,
      });
      return;
    }

    if (showSellerReg) {
      updatePageSeo({
        title: 'Seller Registration',
        description: 'Join AKSelling as a verified factory supplier with 0% commission.',
        isPrivate: true,
      });
      return;
    }

    if (showAuth) {
      updatePageSeo({
        title: 'Sign In / Account Registration',
        description: 'Login to AKSelling to view orders, wallet rewards and fast checkout.',
        isPrivate: true,
      });
      return;
    }

    if (showNotifications) {
      updatePageSeo({
        title: 'Notifications & Order Alerts',
        description: 'Customer notification inbox and order dispatch tracking.',
        isPrivate: true,
      });
      return;
    }

    if (activeTab === 'cart') {
      updatePageSeo({
        title: 'Shopping Cart',
        description: 'Review your selected factory direct apparel items before checkout.',
        isPrivate: true,
      });
      return;
    }

    if (activeTab === 'account' || hasSubScreen) {
      updatePageSeo({
        title: 'My Profile & Account Settings',
        description: 'Manage personal profile, delivery addresses, rewards wallet, and notifications.',
        isPrivate: true,
      });
      return;
    }

    // ------------------------------------------------------------------------
    // CASE 2: PUBLIC ROUTES (INDEXED WITH RICH PRODUCT & STORE SCHEMA)
    // ------------------------------------------------------------------------
    if (selectedProduct) {
      // Individual Product Detail Page
      const priceText = `₹${selectedProduct.price}`;
      updatePageSeo({
        title: `${selectedProduct.title} (${priceText}) - Factory Direct 180 GSM Cotton`,
        description: selectedProduct.description
          ? `${selectedProduct.description.slice(0, 150)}... Buy at ${priceText} with Cash on Delivery & Free Shipping.`
          : `Buy ${selectedProduct.title} online at factory direct price ${priceText}. 100% pure combed 180 GSM bio-wash cotton, pre-shrunk, 7-day doorstep replacement.`,
        isPrivate: false,
        pageType: 'product',
        product: selectedProduct,
      });
      return;
    }

    if (activeTab === 'categories') {
      updatePageSeo({
        title: 'Shop by Categories - 180 GSM Bio-Wash Cotton & Apparel Collections',
        description: 'Explore pure combed 180 GSM cotton tees, heavyweight 240+ GSM streetwear, and custom HD DTF graphic prints at factory direct prices.',
        isPrivate: false,
        pageType: 'website',
      });
      return;
    }

    if (activeTab === 'deals') {
      updatePageSeo({
        title: 'Flash Drops & Best Factory Deals - Up to 60% Off',
        description: 'Limited-time discounts on premium streetwear and factory direct 180 GSM bio-wash cotton t-shirts. 0% middlemen margin.',
        isPrivate: false,
        pageType: 'website',
      });
      return;
    }

    // Default: Home Page
    const homeTitle = searchQuery
      ? `Search results for "${searchQuery}" - AKSelling Store`
      : 'AKSelling - 180 GSM Bio-Wash Cotton & Streetwear Factory Store';
    const homeDesc =
      'Direct factory e-commerce store connecting buyers with authentic 180 GSM bio-wash cotton & heavyweight streetwear apparel from Indore hub. COD with 10% advance available.';

    updatePageSeo({
      title: homeTitle,
      description: homeDesc,
      isPrivate: false,
      pageType: 'website',
    });
  }, [
    appMode,
    activeTab,
    selectedProduct,
    buyNowProduct,
    showOrders,
    showAdmin,
    showSellerReg,
    showAuth,
    searchQuery,
    showNotifications,
    hasSubScreen,
  ]);

  return null;
}
