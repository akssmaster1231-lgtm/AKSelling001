import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Language = 'English' | 'Hindi' | 'Tamil' | 'Telugu' | 'Kannada' | 'Bengali' | 'Marathi' | 'Gujarati';

type TranslationKey =
  | 'home' | 'play' | 'categories' | 'account' | 'cart'
  | 'searchPlaceholder' | 'myCart' | 'placeOrder' | 'addToCart' | 'buyNow'
  | 'topDeals' | 'bestOf' | 'trendingNow' | 'lightningDeals' | 'becomeSeller'
  | 'orders' | 'wishlist' | 'coupons' | 'help' | 'manageDevices' | 'editProfile'
  | 'savedCards' | 'savedAddresses' | 'selectLanguage' | 'notificationSettings'
  | 'privacyCenter' | 'reviews' | 'qa' | 'terms' | 'policies' | 'faqs'
  | 'logout' | 'login' | 'orderPlaced' | 'continueShopping' | 'priceDetails'
  | 'totalAmount' | 'deliveryCharges' | 'discount' | 'price' | 'free'
  | 'remove' | 'saveForLater' | 'buyThisNow' | 'moveToCart' | 'savedForLater'
  | 'myOrders' | 'delivered' | 'inTransit' | 'processing' | 'placed'
  | 'deliveryDetails' | 'paymentMethod' | 'cashOnDelivery' | 'upi' | 'card'
  | 'confirmOrder' | 'fullName' | 'phoneNumber' | 'address' | 'city' | 'pincode'
  | 'sellOnAKSelling' | 'sellerDashboard' | 'addProduct' | 'bankAccount'
  | 'returns' | 'sellerVideos' | 'totalOrders' | 'availableStock'
  | 'liveProducts' | 'views' | 'analytics' | 'adminPanel' | 'manageBanners'
  | 'noOrders' | 'orderTracking' | 'estimatedDelivery' | 'securePayment'
  | 'fastDelivery' | 'easyReturns' | 'youSave' | 'qty' | 'backToCart'
  | 'confirmAndBuy' | 'step1Address' | 'step2Payment' | 'step3Review'
  | 'businessName' | 'gstNumber' | 'panNumber' | 'aadharNumber' | 'mobileNumber'
  | 'email' | 'submitRegistration' | 'registrationSuccess';

type Translations = Record<TranslationKey, string>;

const en: Translations = {
  home: 'Home', play: 'Play', categories: 'Categories', account: 'Account', cart: 'Cart',
  searchPlaceholder: 'Search for products, brands and more',
  myCart: 'My Cart', placeOrder: 'Place Order', addToCart: 'Add to Cart', buyNow: 'Buy Now',
  topDeals: 'Top Deals', bestOf: 'Best of AKSelling', trendingNow: 'Trending Now',
  lightningDeals: 'Lightning Deals', becomeSeller: 'Become a Seller',
  orders: 'Orders', wishlist: 'Wishlist', coupons: 'Coupons', help: 'Help',
  manageDevices: 'Manage Devices', editProfile: 'Edit Profile',
  savedCards: 'Saved Credit/Debit & Gift Cards', savedAddresses: 'Saved Addresses',
  selectLanguage: 'Select Language', notificationSettings: 'Notification Settings',
  privacyCenter: 'Privacy Center', reviews: 'Reviews', qa: 'Questions & Answers',
  terms: 'Terms', policies: 'Policies and Licenses', faqs: 'Browse FAQs',
  logout: 'Logout', login: 'Login / Sign Up',
  orderPlaced: 'Order Placed Successfully!', continueShopping: 'Continue Shopping',
  priceDetails: 'Price Details', totalAmount: 'Total Amount',
  deliveryCharges: 'Delivery Charges', discount: 'Discount', price: 'Price', free: 'FREE',
  remove: 'Remove', saveForLater: 'Save for later', buyThisNow: 'Buy this now',
  moveToCart: 'Move to Cart', savedForLater: 'Saved for Later',
  myOrders: 'My Orders', delivered: 'Delivered', inTransit: 'In Transit',
  processing: 'Processing', placed: 'Placed',
  deliveryDetails: 'Delivery Details', paymentMethod: 'Payment Method',
  cashOnDelivery: 'Cash on Delivery', upi: 'UPI / Wallet', card: 'Credit / Debit Card',
  confirmOrder: 'Confirm Order', fullName: 'Full Name', phoneNumber: 'Phone Number',
  address: 'Delivery Address', city: 'City', pincode: 'Pincode',
  sellOnAKSelling: 'Sell on AKSelling', sellerDashboard: 'Seller Dashboard',
  addProduct: 'Add Product', bankAccount: 'Bank Account', returns: 'Returns',
  sellerVideos: 'Seller Videos', totalOrders: 'Total Orders', availableStock: 'Available Stock',
  liveProducts: 'Live Products', views: 'Views', analytics: 'Analytics',
  adminPanel: 'Admin Panel', manageBanners: 'Manage Banners',
  noOrders: 'No orders yet', orderTracking: 'Order Tracking',
  estimatedDelivery: 'Estimated Delivery', securePayment: 'Secure Payment',
  fastDelivery: 'Fast Delivery', easyReturns: 'Easy Returns', youSave: 'You save',
  qty: 'Qty', backToCart: 'Back to Cart', confirmAndBuy: 'Confirm & Buy',
  step1Address: 'Delivery Address', step2Payment: 'Payment', step3Review: 'Review & Confirm',
  businessName: 'Business Name', gstNumber: 'GST Number', panNumber: 'PAN Card Number',
  aadharNumber: 'Aadhar Card Number', mobileNumber: 'Mobile Number',
  email: 'Email', submitRegistration: 'Submit Registration',
  registrationSuccess: 'Registration Submitted!',
};

const hi: Translations = {
  home: 'होम', play: 'प्ले', categories: 'श्रेणियाँ', account: 'खाता', cart: 'कार्ट',
  searchPlaceholder: 'उत्पाद, ब्रांड और अधिक खोजें',
  myCart: 'मेरा कार्ट', placeOrder: 'ऑर्डर करें', addToCart: 'कार्ट में डालें', buyNow: 'अभी खरीदें',
  topDeals: 'टॉप डील्स', bestOf: 'AKSelling का बेस्ट', trendingNow: 'अभी ट्रेंडिंग',
  lightningDeals: 'लाइटनिंग डील्स', becomeSeller: 'विक्रेता बनें',
  orders: 'ऑर्डर', wishlist: 'विशलिस्ट', coupons: 'कूपन', help: 'सहायता',
  manageDevices: 'डिवाइस प्रबंधित करें', editProfile: 'प्रोफाइल संपादित करें',
  savedCards: 'सहेजे गए कार्ड', savedAddresses: 'सहेजे गए पते',
  selectLanguage: 'भाषा चुनें', notificationSettings: 'सूचना सेटिंग्स',
  privacyCenter: 'गोपनीयता केंद्र', reviews: 'समीक्षाएं', qa: 'प्रश्न और उत्तर',
  terms: 'नियम', policies: 'नीतियां और लाइसेंस', faqs: 'सामान्य प्रश्न',
  logout: 'लॉगआउट', login: 'लॉगिन / साइन अप',
  orderPlaced: 'ऑर्डर सफलतापूर्वक दिया गया!', continueShopping: 'खरीदारी जारी रखें',
  priceDetails: 'मूल्य विवरण', totalAmount: 'कुल राशि',
  deliveryCharges: 'डिलीवरी शुल्क', discount: 'छूट', price: 'मूल्य', free: 'मुफ़्त',
  remove: 'हटाएं', saveForLater: 'बाद के लिए सहेजें', buyThisNow: 'अभी खरीदें',
  moveToCart: 'कार्ट में ले जाएं', savedForLater: 'बाद के लिए सहेजा गया',
  myOrders: 'मेरे ऑर्डर', delivered: 'डिलीवर हो गया', inTransit: 'रास्ते में',
  processing: 'प्रसंस्करण', placed: 'दिया गया',
  deliveryDetails: 'डिलीवरी विवरण', paymentMethod: 'भुगतान विधि',
  cashOnDelivery: 'कैश ऑन डिलीवरी', upi: 'UPI / वॉलेट', card: 'क्रेडिट / डेबिट कार्ड',
  confirmOrder: 'ऑर्डर की पुष्टि करें', fullName: 'पूरा नाम', phoneNumber: 'फ़ोन नंबर',
  address: 'डिलीवरी पता', city: 'शहर', pincode: 'पिनकोड',
  sellOnAKSelling: 'AKSelling पर बेचें', sellerDashboard: 'विक्रेता डैशबोर्ड',
  addProduct: 'उत्पाद जोड़ें', bankAccount: 'बैंक खाता', returns: 'रिटर्न',
  sellerVideos: 'विक्रेता वीडियो', totalOrders: 'कुल ऑर्डर', availableStock: 'उपलब्ध स्टॉक',
  liveProducts: 'लाइव उत्पाद', views: 'व्यूज', analytics: 'एनालिटिक्स',
  adminPanel: 'एडमिन पैनल', manageBanners: 'बैनर प्रबंधित करें',
  noOrders: 'अभी तक कोई ऑर्डर नहीं', orderTracking: 'ऑर्डर ट्रैकिंग',
  estimatedDelivery: 'अनुमानित डिलीवरी', securePayment: 'सुरक्षित भुगतान',
  fastDelivery: 'तेज़ डिलीवरी', easyReturns: 'आसान रिटर्न', youSave: 'आप बचाते हैं',
  qty: 'मात्रा', backToCart: 'कार्ट पर वापस', confirmAndBuy: 'पुष्टि करें और खरीदें',
  step1Address: 'डिलीवरी पता', step2Payment: 'भुगतान', step3Review: 'समीक्षा और पुष्टि',
  businessName: 'व्यवसाय नाम', gstNumber: 'GST नंबर', panNumber: 'PAN कार्ड नंबर',
  aadharNumber: 'आधार कार्ड नंबर', mobileNumber: 'मोबाइल नंबर',
  email: 'ईमेल', submitRegistration: 'पंजीकरण सबमिट करें',
  registrationSuccess: 'पंजीकरण सबमिट हो गया!',
};

const ta: Translations = {
  ...en,
  home: 'முகப்பு', play: 'விளையாடு', categories: 'வகைகள்', account: 'கணக்கு', cart: 'வண்டி',
  searchPlaceholder: 'தயாரிப்புகள், பிராண்டுகள் தேடவும்',
  myCart: 'என் வண்டி', placeOrder: 'ஆர்டர் செய்', addToCart: 'வண்டியில் சேர்', buyNow: 'இப்போது வாங்கு',
  topDeals: 'சிறந்த ஒப்பந்தங்கள்', bestOf: 'AKSelling சிறந்தவை', trendingNow: 'இப்போது டிரெண்டிங்',
  lightningDeals: 'மின்னல் ஒப்பந்தங்கள்', becomeSeller: 'விற்பனையாளர் ஆகுங்கள்',
  orders: 'ஆர்டர்கள்', wishlist: 'விருப்பப் பட்டியல்', coupons: 'கூப்பன்கள்', help: 'உதவி',
  manageDevices: 'சாதனங்களை நிர்வகி', editProfile: 'சுயவிவரத்தைத் திருத்து',
  savedCards: 'சேமித்த அட்டைகள்', savedAddresses: 'சேமித்த முகவரிகள்',
  selectLanguage: 'மொழி தேர்ந்தெடு', notificationSettings: 'அறிவிப்பு அமைப்புகள்',
  privacyCenter: 'தனியுரிமை மையம்', reviews: 'விமர்சனங்கள்', qa: 'கேள்விகள் & பதில்கள்',
  terms: 'விதிகள்', policies: 'கொள்கைகள்', faqs: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
  logout: 'வெளியேறு', login: 'உள்நுழைய / பதிவு',
  myOrders: 'என் ஆர்டர்கள்', sellOnAKSelling: 'AKSelling-ல் விற்கவும்',
  sellerDashboard: 'விற்பனையாளர் டாஷ்போர்டு', returns: 'திரும்பப் பெறுதல்கள்',
};

const te: Translations = {
  ...en,
  home: 'హోమ్', play: 'ప్లే', categories: 'వర్గాలు', account: 'ఖాతా', cart: 'కార్ట్',
  searchPlaceholder: 'ఉత్పత్తులు, బ్రాండ్‌లను శోధించండి',
  myCart: 'నా కార్ట్', placeOrder: 'ఆర్డర్ చేయి', addToCart: 'కార్ట్‌లో చేర్చు', buyNow: 'ఇప్పుడే కొను',
  topDeals: 'టాప్ డీల్స్', bestOf: 'AKSelling బెస్ట్', trendingNow: 'ఇప్పుడు ట్రెండింగ్',
  lightningDeals: 'లైట్నింగ్ డీల్స్', becomeSeller: 'సెల్లర్ అవ్వండి',
  orders: 'ఆర్డర్లు', wishlist: 'విష్‌లిస్ట్', coupons: 'కూపన్‌లు', help: 'సహాయం',
  logout: 'లాగ్అవుట్', login: 'లాగిన్ / సైన్ అప్',
  myOrders: 'నా ఆర్డర్లు', sellOnAKSelling: 'AKSellingలో అమ్మండి',
  sellerDashboard: 'సెల్లర్ డాష్‌బోర్డ్', returns: 'రిటర్న్‌లు',
};

const kn: Translations = {
  ...en,
  home: 'ಮುಖಪುಟ', play: 'ಆಡು', categories: 'ವರ್ಗಗಳು', account: 'ಖಾತೆ', cart: 'ಕಾರ್ಟ್',
  searchPlaceholder: 'ಉತ್ಪನ್ನಗಳು, ಬ್ರಾಂಡ್‌ಗಳನ್ನು ಹುಡುಕಿ',
  myCart: 'ನನ್ನ ಕಾರ್ಟ್', placeOrder: 'ಆದೇಶಿಸಿ', addToCart: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ', buyNow: 'ಈಗಲೇ ಖರೀದಿಸಿ',
  topDeals: 'ಟಾಪ್ ಡೀಲ್‌ಗಳು', bestOf: 'AKSelling ಅತ್ಯುತ್ತಮ', trendingNow: 'ಈಗ ಟ್ರೆಂಡಿಂಗ್',
  lightningDeals: 'ಲೈಟ್ನಿಂಗ್ ಡೀಲ್‌ಗಳು', becomeSeller: 'ಮಾರಾಟಗಾರರಾಗಿ',
  orders: 'ಆದೇಶಗಳು', wishlist: 'ವಿಶ್‌ಲಿಸ್ಟ್', coupons: 'ಕೂಪನ್‌ಗಳು', help: 'ಸಹಾಯ',
  logout: 'ಲಾಗ್ಔಟ್', login: 'ಲಾಗಿನ್ / ಸೈನ್ ಅಪ್',
  myOrders: 'ನನ್ನ ಆದೇಶಗಳು', sellOnAKSelling: 'AKSellingನಲ್ಲಿ ಮಾರಾಟ ಮಾಡಿ',
  sellerDashboard: 'ಮಾರಾಟಗಾರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', returns: 'ಹಿಂದಿರುಗಿಸುವಿಕೆಗಳು',
};

const bn: Translations = {
  ...en,
  home: 'হোম', play: 'প্লে', categories: 'বিভাগ', account: 'অ্যাকাউন্ট', cart: 'কার্ট',
  searchPlaceholder: 'পণ্য, ব্র্যান্ড খুঁজুন',
  myCart: 'আমার কার্ট', placeOrder: 'অর্ডার করুন', addToCart: 'কার্টে যোগ করুন', buyNow: 'এখনই কিনুন',
  topDeals: 'শীর্ষ ডিল', bestOf: 'AKSelling সেরা', trendingNow: 'এখন ট্রেন্ডিং',
  lightningDeals: 'লাইটনিং ডিল', becomeSeller: 'বিক্রেতা হোন',
  orders: 'অর্ডার', wishlist: 'উইশলিস্ট', coupons: 'কুপন', help: 'সাহায্য',
  logout: 'লগআউট', login: 'লগইন / সাইন আপ',
  myOrders: 'আমার অর্ডার', sellOnAKSelling: 'AKSelling-এ বিক্রি করুন',
  sellerDashboard: 'বিক্রেতা ড্যাশবোর্ড', returns: 'রিটার্ন',
};

const mr: Translations = {
  ...en,
  home: 'होम', play: 'प्ले', categories: 'श्रेणी', account: 'खाते', cart: 'कार्ट',
  searchPlaceholder: 'उत्पादे, ब्रँड्स शोधा',
  myCart: 'माझा कार्ट', placeOrder: 'ऑर्डर द्या', addToCart: 'कार्टमध्ये टाका', buyNow: 'आता खरेदी करा',
  topDeals: 'टॉप डील्स', bestOf: 'AKSelling उत्तम', trendingNow: 'आता ट्रेंडिंग',
  lightningDeals: 'लाइटनिंग डील्स', becomeSeller: 'विक्रेता व्हा',
  orders: 'ऑर्डर', wishlist: 'विशलिस्ट', coupons: 'कूपन', help: 'मदत',
  logout: 'लॉगआउट', login: 'लॉगिन / साइन अप',
  myOrders: 'माझे ऑर्डर', sellOnAKSelling: 'AKSelling वर विका',
  sellerDashboard: 'विक्रेता डॅशबोर्ड', returns: 'रिटर्न्स',
};

const gu: Translations = {
  ...en,
  home: 'હોમ', play: 'પ્લે', categories: 'શ્રેણીઓ', account: 'એકાઉન્ટ', cart: 'કાર્ટ',
  searchPlaceholder: 'ઉત્પાદનો, બ્રાન્ડ્સ શોધો',
  myCart: 'મારો કાર્ટ', placeOrder: 'ઓર્ડર કરો', addToCart: 'કાર્ટમાં ઉમેરો', buyNow: 'હમણાં ખરીદો',
  topDeals: 'ટોપ ડીલ્સ', bestOf: 'AKSelling શ્રેષ્ઠ', trendingNow: 'હાલમાં ટ્રેન્ડિંગ',
  lightningDeals: 'લાઇટનિંગ ડીલ્સ', becomeSeller: 'વેચાણકાર બનો',
  orders: 'ઓર્ડર', wishlist: 'વિશલિસ્ટ', coupons: 'કૂપન', help: 'મદદ',
  logout: 'લોગઆઉટ', login: 'લોગિન / સાઇન અપ',
  myOrders: 'મારા ઓર્ડર', sellOnAKSelling: 'AKSelling પર વેચો',
  sellerDashboard: 'વેચાણકાર ડેશબોર્ડ', returns: 'રિટર્ન્સ',
};

const translations: Record<Language, Translations> = {
  English: en, Hindi: hi, Tamil: ta, Telugu: te, Kannada: kn,
  Bengali: bn, Marathi: mr, Gujarati: gu,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('English');

  const t = useCallback(
    (key: TranslationKey) => {
      const dict = translations[language] || en;
      return dict[key] || en[key] || key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
