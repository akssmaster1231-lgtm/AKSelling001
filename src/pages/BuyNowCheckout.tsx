import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  MapPin,
  User,
  Phone,
  Loader2,
  CheckCircle2,
  Tag,
  Zap,
  Shield,
  Truck,
  CreditCard,
  Check,
  ChevronRight,
  Building,
  Navigation,
  Globe,
  Mail,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { formatPrice } from '@/data';
import DirectUpiPaymentModal, { DirectUpiPaymentResult } from '@/components/payment/DirectUpiPaymentModal';
import { getOwnerPaymentSettings } from '@/config/ownerPaymentConfig';
import { saveOrderToFirestore, deductProductInventory, savePaymentTransactionToFirestore, type FirestoreOrder } from '@/firebase';
import { INDIAN_STATES_AND_UTS } from '@/shiprocket-api';
import { useI18n } from '@/i18n';
import { useAuth } from '@/auth-context';
import { recordPlacedOrder } from '@/utils/orderSync';
import { lookupPincode } from '@/utils/pincode';
import { awardOrderCashback, deductWalletBalanceForOrder, getLocalWalletCache } from '@/utils/walletService';
import { grantBonusSpin } from '@/utils/gamificationService';
import { MilestoneCelebrationModal } from '@/components/MilestoneCelebrationModal';
import { ScratchCardModal } from '@/components/ScratchCardModal';
import TrustBadges from '@/components/trust/TrustBadges';
import type { Product } from '@/types';

interface BuyNowCheckoutProps {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  onBack: () => void;
  onSuccess: () => void;
}

type Step = 'address' | 'payment' | 'review';
type State = 'form' | 'processing' | 'success';

export default function BuyNowCheckout({ product, quantity, selectedSize, selectedColor, onBack, onSuccess }: BuyNowCheckoutProps) {
  const { t } = useI18n();
  const { user, addAddress } = useAuth();
  const [step, setStep] = useState<Step>('address');
  const [state, setState] = useState<State>('form');
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeSuccess, setPincodeSuccess] = useState('');
  const [earnedReward, setEarnedReward] = useState<{
    cashback: number;
    milestone: number;
    newBalance: number;
    message?: string;
  } | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState<boolean>(false);
  const [showScratchCard, setShowScratchCard] = useState<boolean>(true);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(() => {
    return user?.addresses && user.addresses.length > 0 ? user.addresses[0].id : null;
  });
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
  const [isPaymentAuthorizing, setIsPaymentAuthorizing] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone?.replace(/\D/g, '').slice(-10) || '',
    houseNo: '',
    street: '',
    landmark: '',
    city: '',
    state: 'Madhya Pradesh',
    country: 'India',
    pincode: '',
    addressType: 'Home' as 'Home' | 'Work' | 'Other',
    paymentMethod: 'cod',
  });

  // Pre-fill primary address if available from user profile
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const active = (selectedAddressId && user.addresses.find(a => a.id === selectedAddressId)) || user.addresses[0];
      if (active) {
        setSelectedAddressId(active.id);
        setForm((prev) => ({
          ...prev,
          name: active.name || prev.name || user.name || '',
          email: prev.email || user.email || '',
          phone: active.phone || prev.phone || user.phone || '',
          street: active.address || prev.street || '',
          city: active.city || prev.city || '',
          pincode: active.pincode || prev.pincode || '',
          addressType: (active.label as 'Home' | 'Work' | 'Other') || 'Home',
        }));
      }
    }
  }, [user, selectedAddressId]);

  // Smart 6-digit Pincode Auto-Fill
  const handlePincodeChange = async (pincodeVal: string) => {
    const cleanPin = pincodeVal.replace(/\D/g, '').slice(0, 6);
    setForm((prev) => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      setPincodeLoading(true);
      setPincodeSuccess('');
      try {
        const info = await lookupPincode(cleanPin);
        if (info) {
          setForm((prev) => ({
            ...prev,
            city: info.city,
            state: info.state,
          }));
          setPincodeSuccess(`${info.city}, ${info.state}`);
        }
      } catch {
        // silent
      } finally {
        setPincodeLoading(false);
      }
    } else {
      setPincodeSuccess('');
    }
  };

  const ownerPayment = getOwnerPaymentSettings();
  const [activeGroupBuy] = useState<{
    productId?: string;
    discountPercent?: number;
    discountAmount?: number;
    code?: string;
  } | null>(() => {
    try {
      const raw = localStorage.getItem('akselling_active_group_buy');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.productId === product.id || !parsed.productId)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const groupDiscount = activeGroupBuy ? Math.round((product.price * quantity * 15) / 100) : 0;
  const baseTotalAmount = product.price * quantity;
  const totalAmount = Math.max(1, baseTotalAmount - groupDiscount);
  const mrpTotal = product.mrp * quantity;
  const discount = (mrpTotal - baseTotalAmount) + groupDiscount;
  const deliveryFee = totalAmount > 500 ? 0 : 49;

  // Wallet Rewards Balance & Redemption (Retaining ₹30+ Welcome Rewards & Earned Cashback)
  const userWalletBalance = user?.id ? (getLocalWalletCache(user.id).walletBalance ?? user.walletBalance ?? 30) : 30;
  const [applyWalletBalance, setApplyWalletBalance] = useState(true);
  const maxApplicableWalletDiscount = Math.min(userWalletBalance, Math.max(0, totalAmount - 1));
  const walletDiscount = applyWalletBalance ? maxApplicableWalletDiscount : 0;
  const finalAmount = Math.max(1, totalAmount - walletDiscount + deliveryFee);

  // COD requires 10% direct UPI advance token
  const codAdvanceAmount = Math.max(1, Math.round(finalAmount * 0.10));
  const codRemainingAmount = finalAmount - codAdvanceAmount;

  const [isDirectUpiModalOpen, setIsDirectUpiModalOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState('');

  const handleAddressNext = () => {
    setError('');
    if (!form.name.trim() || !form.phone.trim() || (!form.houseNo.trim() && !form.street.trim()) || !form.pincode.trim() || !form.city.trim()) {
      setError('Please fill in your complete delivery address (Name, Phone, House/Street, City, Pincode).');
      return;
    }
    if (form.phone.trim().length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (form.pincode.trim().length !== 6) {
      setError('Please enter a valid 6-digit delivery pincode.');
      return;
    }
    setStep('payment');
  };

  const handlePaymentNext = () => {
    setStep('review');
  };

  const handleConfirm = () => {
    setError('');
    const genId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    setPendingOrderId(genId);
    setIsDirectUpiModalOpen(true);
  };

  const handleDirectUpiPaymentConfirm = async (result: DirectUpiPaymentResult) => {
    setIsPaymentAuthorizing(true);
    setError('');
    try {
      // 1. Verify and record direct UPI transaction on server
      const verifyResp = await fetch('/api/orders/direct-upi-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: pendingOrderId,
          utrNumber: result.utrNumber,
          amount: result.amountPaid,
          customerName: form.name,
          customerPhone: form.phone,
          paymentMode: result.paymentMode,
          screenshotUrl: result.screenshotUrl,
        }),
      });

      if (!verifyResp.ok) {
        const errJson = await verifyResp.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server could not record UPI transaction reference.');
      }

      // Record in Firebase Payment Ledger in real-time
      savePaymentTransactionToFirestore({
        id: `tx_${Date.now()}_${result.utrNumber.slice(-4)}`,
        orderId: pendingOrderId,
        utrNumber: result.utrNumber,
        amount: result.amountPaid,
        currency: 'INR',
        customerName: form.name,
        customerPhone: form.phone,
        paymentMethod: result.paymentMode === 'card' ? 'Debit/Credit Card' : 'Direct UPI',
        paymentMode: result.paymentMode,
        status: 'verified',
        screenshotUrl: result.screenshotUrl,
        createdAt: new Date().toISOString(),
      }).catch(() => {});

      // 2. Deduct wallet balance if redeemed
      if (walletDiscount > 0 && user?.id) {
        await deductWalletBalanceForOrder(user.id, pendingOrderId, walletDiscount);
      }

      // 3. Place order
      const isCod = form.paymentMethod === 'cod';
      await placeOrder(
        pendingOrderId,
        result.utrNumber,
        result.screenshotUrl,
        isCod ? codAdvanceAmount : finalAmount,
        isCod ? codRemainingAmount : 0
      );
      setIsDirectUpiModalOpen(false);
    } catch (err: unknown) {
      setIsPaymentAuthorizing(false);
      const errMsg = err instanceof Error ? err.message : 'Payment confirmation failed';
      setError(errMsg);
      throw err;
    }
  };

  const placeOrder = async (
    orderIdToUse: string,
    utrNumber: string,
    screenshotUrl?: string,
    advancePaid?: number,
    remainingDue?: number
  ) => {
    setState('processing');
    try {
      const orderItems = [{
        product_id: product.id,
        product_title: product.title,
        product_image: product.images[0],
        quantity,
        price: product.price,
        size: selectedSize || product.sizes?.[0] || 'Standard',
        color: selectedColor || product.colors?.[0] || 'Default',
        design: product.printDesign || product.pattern || 'Original Design',
        fabric: product.fabric || 'Premium Cotton',
        brand: product.brand || 'AKSelling Fashion',
      }];

      const parts = [
        form.houseNo.trim(),
        form.street.trim(),
        form.landmark ? `Near ${form.landmark.trim()}` : '',
        form.city.trim(),
        form.state.trim(),
        form.pincode.trim(),
      ].filter(Boolean);
      const fullAddress = parts.join(', ');

      const generatedId = orderIdToUse;
      const customerEmailToUse = form.email.trim() || user?.email || undefined;
      const isPrepaid = form.paymentMethod !== 'cod';
      const orderPayload: FirestoreOrder = {
        id: generatedId,
        customer_name: form.name,
        customer_email: customerEmailToUse,
        customer_phone: form.phone,
        customer_address: fullAddress,
        user_id: user?.id,
        items: orderItems,
        total_amount: finalAmount,
        payment_method: isPrepaid ? 'Direct Personal UPI & QR (Owner Bank)' : 'Cash on Delivery (10% Direct UPI Advance Paid)',
        payment_status: isPrepaid ? `Paid via Direct UPI (UTR: ${utrNumber})` : `Partially Paid (10% ₹${advancePaid} Advance Paid via Direct UPI UTR: ${utrNumber}, ₹${remainingDue} Due on Delivery)`,
        upi_utr: utrNumber,
        upi_id: getOwnerPaymentSettings().upiId || '7290894907@ybl',
        transaction_id: `upi_${utrNumber}`,
        payment_screenshot: screenshotUrl,
        wallet_discount_applied: walletDiscount,
        advance_paid: advancePaid,
        balance_due: remainingDue,
        status: 'Placed',
        created_at: new Date().toISOString(),
      };

      // 0. Auto-save fresh delivery address to user's real profile
      if (saveAddressToProfile && (isAddingNewAddress || !selectedAddressId) && addAddress && user) {
        try {
          await addAddress({
            label: form.addressType,
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: [form.houseNo, form.street, form.landmark].filter(Boolean).join(', '),
            city: form.city.trim(),
            pincode: form.pincode.trim(),
          });
        } catch {
          // silent
        }
      }

      // 1. Record in Firebase Firestore in real-time
      await saveOrderToFirestore(orderPayload);

      // 2. Automatically deduct inventory in catalog
      await deductProductInventory([{ product_id: product.id, quantity }]);

      // 3. Record in customer local history AND dispatch to Seller Dashboard Orders Tab
      recordPlacedOrder(orderPayload);

      // 4. Trigger automated instant email notifications (Seller alert to anojkumaryadav7290@gmail.com + Customer confirmation)
      fetch('/api/notifications/send-order-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: orderPayload,
          customerEmail: customerEmailToUse,
          sellerEmail: 'anojkumaryadav7290@gmail.com',
        }),
      }).catch((e) => console.warn('Email notification dispatch notice:', e));

      // 5. Award Product-Based Cashback & 3rd Order Milestone to Firebase Wallet with verified paymentId
      try {
        const rewardResult = await awardOrderCashback(
          user?.id || 'guest',
          generatedId,
          [
            {
              id: product.id,
              title: product.title,
              price: product.price,
              quantity,
            },
          ],
          `upi_${utrNumber}`
        );
        setEarnedReward({
          cashback: rewardResult.cashbackEarned,
          milestone: rewardResult.milestoneAwarded,
          newBalance: rewardResult.newWalletBalance,
          message: rewardResult.celebrationMessage,
        });
        if (rewardResult.milestoneAwarded > 0) {
          setShowMilestoneModal(true);
        }
      } catch (rErr) {
        console.warn('Cashback award notice:', rErr);
      }

      // Grant post-checkout Lucky Spin bonus & clear one-time group buy code
      grantBonusSpin();
      try {
        localStorage.removeItem('akselling_active_group_buy');
      } catch (err) {
        console.debug('Active group buy cleanup notice:', err);
      }

      setOrderId(generatedId);
      setState('success');
    } catch (err) {
      console.warn('Order placement notice:', err);
      setError('Failed to place order. Please try again.');
      setState('form');
    }
  };

  if (state === 'success') {
    return (
      <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[65] bg-white flex flex-col items-center justify-center animate-fade-in px-4 sm:shadow-2xl sm:border-x sm:border-gray-200">
        {/* Order-Linked Scratch Card (Strictly on confirmed paid order) */}
        <ScratchCardModal
          isOpen={showScratchCard}
          cashbackAmount={earnedReward?.cashback ?? 30}
          milestoneAmount={earnedReward?.milestone ?? 0}
          orderId={orderId}
          onDismiss={() => setShowScratchCard(false)}
        />

        {showMilestoneModal && (
          <MilestoneCelebrationModal
            isOpen={showMilestoneModal}
            onClose={() => setShowMilestoneModal(false)}
            milestoneBonus={earnedReward?.milestone}
            message={earnedReward?.message}
          />
        )}
        <div className="w-20 h-20 rounded-full bg-success-500 flex items-center justify-center mb-4 animate-scale-in">
          <CheckCircle2 size={48} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">{t('orderPlaced')}</h2>
        <p className="text-sm text-gray-500 mt-2 text-center">
          Your {product.title} will be delivered soon.
        </p>
        {orderId && (
          <p className="text-xs text-gray-400 mt-1">Order ID: {orderId.slice(0, 8).toUpperCase()}</p>
        )}

        {/* Real-time Cashback Earned Announcement Card */}
        {earnedReward && (earnedReward.cashback > 0 || earnedReward.milestone > 0) && (
          <div className="mt-4 w-full max-w-sm rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-4 text-white shadow-lg border border-indigo-700/40 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                Cashback Earned!
              </span>
              <span className="text-[10px] font-semibold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                CREDITED TO WALLET
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">
                +₹{earnedReward.cashback + earnedReward.milestone}
              </span>
              <span className="text-xs text-blue-200">
                (New Balance: ₹{earnedReward.newBalance})
              </span>
            </div>
            <p className="text-[11px] text-blue-200 mt-1">
              {earnedReward.milestone > 0
                ? `Includes ₹${earnedReward.cashback} order cashback and ₹${earnedReward.milestone} 3rd order milestone reward!`
                : 'Available for immediate automated UPI or Bank withdrawal.'}
            </p>
          </div>
        )}

        {/* Lucky Spin Unlocked Card */}
        <div className="mt-3 w-full max-w-sm rounded-xl bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-200 p-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
              🎰
            </div>
            <div>
              <p className="text-xs font-bold text-purple-900">1x Free Lucky Spin Unlocked!</p>
              <p className="text-[10px] text-purple-700">Spin on the home screen to win up to ₹200 extra cash</p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full">
            READY
          </span>
        </div>

        <div className="mt-4 bg-flipkart-50 rounded-xl px-4 py-3 text-center w-full max-w-sm">
          <p className="text-xs text-gray-500">{t('estimatedDelivery')}</p>
          <p className="text-sm font-bold text-flipkart-600">3-5 Business Days</p>
        </div>
        <button
          onClick={onSuccess}
          className="mt-6 bg-flipkart-500 text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-flipkart-600 transition-colors shadow-md"
        >
          {t('continueShopping')}
        </button>
      </div>
    );
  }

  if (state === 'processing') {
    return (
      <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[65] bg-white flex flex-col items-center justify-center animate-fade-in sm:shadow-2xl sm:border-x sm:border-gray-200">
        <Loader2 size={40} className="animate-spin text-flipkart-500 mb-4" />
        <h2 className="text-lg font-bold text-gray-800">Placing your order...</h2>
        <p className="text-sm text-gray-500 mt-1">Please wait while we confirm your order</p>
      </div>
    );
  }

  const steps: { id: Step; label: string }[] = [
    { id: 'address', label: t('step1Address') },
    { id: 'payment', label: t('step2Payment') },
    { id: 'review', label: t('step3Review') },
  ];
  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[65] bg-gray-50 overflow-y-auto sm:shadow-2xl sm:border-x sm:border-gray-200">
      <div className="sticky top-0 bg-white shadow-sm px-3 py-2.5 flex items-center gap-3 z-10">
        <button onClick={onBack} className="p-1 text-gray-700">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-accent-400" />
          <h1 className="text-base font-bold text-gray-800">{t('buyNow')}</h1>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= currentStepIndex ? 'bg-flipkart-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < currentStepIndex ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-[10px] ${i <= currentStepIndex ? 'text-flipkart-600 font-medium' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-flipkart-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 py-4 pb-28">
        {/* Product Summary (always visible) */}
        <div className="bg-white rounded-xl shadow-card p-3 flex gap-3 mb-4">
          <img src={product.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />
          <div className="flex-1">
            <p className="text-xs text-gray-400 uppercase">{product.brand}</p>
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{product.title}</h3>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</span>
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</span>
              <span className="text-xs font-bold text-success-500">{product.discount}% off</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{t('qty')}: {quantity}</p>
            {(selectedSize || selectedColor) && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-600">
                {selectedSize && (
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">Size: {selectedSize}</span>
                )}
                {selectedColor && (
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">Color: {selectedColor}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 1: Address */}
        {step === 'address' && (
          <div className="bg-white rounded-xl shadow-card p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-flipkart-500" />
                <h2 className="text-sm font-bold text-gray-800">Complete Delivery Address</h2>
              </div>
              <span className="text-[11px] font-semibold text-flipkart-600 bg-flipkart-50 px-2.5 py-1 rounded-full">
                Fast Delivery
              </span>
            </div>

            {/* Real Saved Addresses from User Profile */}
            {user?.addresses && user.addresses.length > 0 && (
              <div className="space-y-2.5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Saved Addresses in Your Profile</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewAddress(true);
                      setSelectedAddressId(null);
                    }}
                    className={`text-xs font-semibold ${isAddingNewAddress ? 'text-gray-400' : 'text-flipkart-600 hover:underline'}`}
                  >
                    + Add Different Address
                  </button>
                </div>

                <div className="space-y-2">
                  {user.addresses.map((addr, addrIdx) => {
                    const isSelected = selectedAddressId === addr.id && !isAddingNewAddress;
                    return (
                      <div
                        key={addr.id || `addr_${addrIdx}`}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setIsAddingNewAddress(false);
                          setForm((prev) => ({
                            ...prev,
                            name: addr.name || prev.name,
                            phone: addr.phone || prev.phone,
                            street: addr.address || prev.street,
                            city: addr.city || prev.city,
                            pincode: addr.pincode || prev.pincode,
                            addressType: (addr.label as 'Home' | 'Work' | 'Other') || 'Home',
                          }));
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-flipkart-500 bg-flipkart-50/40 ring-1 ring-flipkart-500 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-flipkart-600 bg-flipkart-600' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs font-bold text-gray-900">{addr.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                              {addr.label || 'Home'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">+91 {addr.phone}</span>
                        </div>
                        <p className="text-xs text-gray-600 pl-6 line-clamp-2">
                          {addr.address}, {addr.city} - {addr.pincode}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Address Input Form (Shown when adding a new address OR if no saved address exists) */}
            {(!user?.addresses?.length || isAddingNewAddress) && (
              <div className="space-y-3 pt-1 border-t border-gray-100">
                {user?.addresses && user.addresses.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">Enter New Delivery Address</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewAddress(false);
                        if (user.addresses[0]) {
                          setSelectedAddressId(user.addresses[0].id);
                          setForm((prev) => ({
                            ...prev,
                            name: user.addresses[0].name || prev.name,
                            phone: user.addresses[0].phone || prev.phone,
                            street: user.addresses[0].address || prev.street,
                            city: user.addresses[0].city || prev.city,
                            pincode: user.addresses[0].pincode || prev.pincode,
                            addressType: (user.addresses[0].label as 'Home' | 'Work' | 'Other') || 'Home',
                          }));
                        }
                      }}
                      className="text-xs font-semibold text-flipkart-600 hover:underline"
                    >
                      Use Saved Address
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-1.5">
                      <User size={14} className="text-gray-400" /> {t('fullName')} *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Recipient full name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-1.5">
                      <Phone size={14} className="text-gray-400" /> {t('phoneNumber')} *
                    </label>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-flipkart-500">
                      <span className="px-2.5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-600 border-r border-gray-200">+91</span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className="w-full px-3 py-2.5 text-sm outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Email for Instant Order Confirmation Notifications */}
                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} className="text-amber-500" /> Email for Order Confirmation & Updates
                    </span>
                    <span className="text-[11px] text-amber-600 font-medium">Notification on Order Confirmation</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter your email (e.g. customer@gmail.com)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white"
                  />
                </div>

                {/* Smart Pincode Lookup Field */}
                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Navigation size={14} className="text-gray-400" /> Delivery Pincode *
                    </span>
                    {pincodeLoading && (
                      <span className="text-[11px] text-flipkart-600 flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Detecting city & state...
                      </span>
                    )}
                    {pincodeSuccess && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Auto-filled: {pincodeSuccess}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={e => handlePincodeChange(e.target.value)}
                    placeholder="Enter 6-digit delivery pincode (e.g. 110001)"
                    maxLength={6}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 font-medium tracking-wide bg-white"
                  />
                </div>

                {/* City, State & Country Auto-populated */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">City / District *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Indore"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">State / UT *</label>
                    <select
                      value={form.state || 'Madhya Pradesh'}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white font-medium"
                    >
                      {INDIAN_STATES_AND_UTS.map(st => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Country *</label>
                    <div className="relative">
                      <select
                        value={form.country || 'India'}
                        onChange={e => setForm({ ...form, country: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white font-medium"
                      >
                        <option value="India">India</option>
                      </select>
                      <Globe size={14} className="absolute left-2.5 top-3 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* House No / Building & Street */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-1.5">
                      <Building size={14} className="text-gray-400" /> Flat / House / Building *
                    </label>
                    <input
                      type="text"
                      value={form.houseNo}
                      onChange={e => setForm({ ...form, houseNo: e.target.value })}
                      placeholder="e.g. Flat 302, Royal Apt"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Street / Road / Colony *</label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={e => setForm({ ...form, street: e.target.value })}
                      placeholder="e.g. MG Road, Sector 14"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Famous Landmark (Optional)</label>
                  <input
                    type="text"
                    value={form.landmark}
                    onChange={e => setForm({ ...form, landmark: e.target.value })}
                    placeholder="e.g. Near City Hospital / Metro Station"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white"
                  />
                </div>

                {/* Address Type */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Address Type</label>
                  <div className="flex gap-2">
                    {(['Home', 'Work', 'Other'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, addressType: type })}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                          form.addressType === type
                            ? 'border-flipkart-500 bg-flipkart-50 text-flipkart-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {user && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveAddressToProfile}
                      onChange={e => setSaveAddressToProfile(e.target.checked)}
                      className="w-4 h-4 rounded text-flipkart-600 focus:ring-flipkart-500 border-gray-300"
                    />
                    <span className="text-xs text-gray-700 font-medium">Save this address to my profile for future orders</span>
                  </label>
                )}
              </div>
            )}

            {error && <p className="text-sm text-error-500 bg-error-50 rounded-lg px-3 py-2">{error}</p>}
            <button
              onClick={handleAddressNext}
              className="w-full bg-flipkart-500 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-flipkart-600 transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              Deliver to this Address <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 'payment' && (
          <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={18} className="text-flipkart-500" />
              <h2 className="text-sm font-bold text-gray-800">{t('step2Payment')}</h2>
            </div>
            {[
              {
                label: 'Direct Personal UPI & QR Code',
                value: 'upi',
                icon: '📱',
                badge: '0% Fees • Pay Direct to Owner Bank',
                sub: 'Scan QR or Pay via Google Pay, PhonePe, Paytm, BHIM with 0% gateway commission',
              },
              {
                label: t('cashOnDelivery'),
                value: 'cod',
                icon: '💵',
                badge: `Requires 10% (₹${codAdvanceAmount}) Direct UPI token`,
                sub: `Pay ₹${codAdvanceAmount} advance via Direct UPI QR, remaining ₹${codRemainingAmount} in cash at doorstep`,
              },
              {
                label: 'Direct Bank Transfer (IMPS / NEFT)',
                value: 'card',
                icon: '🏦',
                badge: `Direct to ${ownerPayment.bankName || 'Airtel payment Bank'}`,
                sub: `Direct Account Transfer to ${ownerPayment.beneficiaryName || 'ANOJKUMAR'} (A/C: ${ownerPayment.accountNumber || '7290894907'}, IFSC: ${ownerPayment.ifscCode || 'AIRP0000001'})`,
              },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm({ ...form, paymentMethod: opt.value })}
                className={`w-full flex items-start gap-3 px-3 py-3.5 rounded-lg border transition-colors ${
                  form.paymentMethod === opt.value ? 'border-flipkart-500 bg-flipkart-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl mt-0.5">{opt.icon}</span>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 ${
                  form.paymentMethod === opt.value ? 'border-flipkart-500' : 'border-gray-300'
                }`}>
                  {form.paymentMethod === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-flipkart-500" />}
                </div>
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep('address')}
                className="px-4 text-sm text-gray-500 font-medium rounded-lg hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handlePaymentNext}
                className="flex-1 bg-flipkart-500 text-white font-bold text-sm py-3 rounded-xl hover:bg-flipkart-600 transition-colors flex items-center justify-center gap-2"
              >
                Continue to Review <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <>
            {/* Saved Address Summary */}
            <div className="bg-white rounded-xl shadow-card p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-flipkart-500" />
                  <h3 className="text-sm font-bold text-gray-700">{t('deliveryDetails')}</h3>
                  <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {form.addressType}
                  </span>
                </div>
                <button onClick={() => setStep('address')} className="text-xs text-flipkart-500 font-medium">Edit</button>
              </div>
              <p className="text-sm font-semibold text-gray-800">{form.name}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {[form.houseNo, form.street, form.landmark ? `Near ${form.landmark}` : '', `${form.city}, ${form.state}`, form.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Phone size={12} className="text-gray-400" /> +91 {form.phone}
              </p>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-xl shadow-card p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-flipkart-500" />
                  <h3 className="text-sm font-bold text-gray-700">{t('paymentMethod')}</h3>
                </div>
                <button onClick={() => setStep('payment')} className="text-xs text-flipkart-500 font-medium">Edit</button>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                {form.paymentMethod === 'cod'
                  ? `Cash on Delivery (10% ₹${codAdvanceAmount} advance via Direct UPI + ₹${codRemainingAmount} at doorstep)`
                  : form.paymentMethod === 'upi'
                  ? 'Direct Personal UPI & QR (100% Prepaid directly to Owner Bank)'
                  : `Direct Bank Transfer (IMPS / NEFT to Owner ${ownerPayment.bankName || 'Airtel payment Bank'})`}
              </p>
            </div>

            {/* Wallet Reward Deduction Box */}
            {userWalletBalance > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-3">
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={applyWalletBalance}
                      onChange={(e) => setApplyWalletBalance(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                        <Sparkles size={14} className="text-amber-500 fill-amber-400 shrink-0" />
                        <span>Use Wallet Balance (₹{userWalletBalance} available)</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        {applyWalletBalance
                          ? `₹${walletDiscount} redeemed from your ₹30+ Welcome/Cashback reward!`
                          : 'Select to apply your reward balance discount'}
                      </p>
                    </div>
                  </label>
                  <span className="text-xs font-black text-emerald-800 bg-white px-2 py-1 rounded-lg border border-emerald-200 shrink-0">
                    -₹{applyWalletBalance ? walletDiscount : 0}
                  </span>
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden mb-3">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">{t('priceDetails')}</h2>
              </div>
              <div className="p-4 space-y-2.5">
                <Row label={`${t('price')} (${quantity} item)`} value={formatPrice(mrpTotal)} />
                <Row label={t('discount')} value={`- ${formatPrice(discount)}`} color="text-success-500" />
                {walletDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <span className="flex items-center gap-1">🎁 Wallet Reward Discount</span>
                    <span>- {formatPrice(walletDiscount)}</span>
                  </div>
                )}
                {groupDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <span className="flex items-center gap-1">👥 Saath Mein Khareedo Discount (15%)</span>
                    <span>- {formatPrice(groupDiscount)}</span>
                  </div>
                )}
                <Row label={t('deliveryCharges')} value={deliveryFee === 0 ? t('free') : formatPrice(deliveryFee)} color={deliveryFee === 0 ? 'text-success-500' : 'text-gray-700'} />
                <div className="border-t border-dashed border-gray-200 pt-2.5">
                  <Row label={t('totalAmount')} value={formatPrice(finalAmount)} bold />
                </div>
                {form.paymentMethod === 'cod' && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 space-y-1 mt-2">
                    <div className="flex justify-between text-xs font-bold text-amber-900">
                      <span>Direct UPI Token Advance (10%):</span>
                      <span>₹{codAdvanceAmount} (Pay to Owner Bank)</span>
                    </div>
                    <div className="flex justify-between text-xs text-amber-800">
                      <span>Due on Cash Delivery:</span>
                      <span>₹{codRemainingAmount} (To Courier Rider)</span>
                    </div>
                  </div>
                )}
                {discount > 0 && (
                  <div className="bg-success-50 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Tag size={14} className="text-success-500" />
                    <p className="text-xs text-success-600 font-medium">{t('youSave')} {formatPrice(discount + walletDiscount)}!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Prominent Trust Badges */}
            <TrustBadges variant="checkout" className="mb-3" />

            {error && <p className="text-sm text-error-500 bg-error-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
          </>
        )}
      </div>

      {/* Bottom Action */}
      {step === 'review' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 max-w-md mx-auto w-full shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{t('totalAmount')}</p>
              <p className="text-lg font-bold text-gray-900">{formatPrice(finalAmount)}</p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={isPaymentAuthorizing}
              className={`flex-1 ml-4 ${
                isPaymentAuthorizing ? 'bg-accent-400/80 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white font-bold text-base py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer`}
            >
              {isPaymentAuthorizing ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Confirming Payment...
                </>
              ) : (
                <>
                  <QrCode size={18} /> {form.paymentMethod === 'cod' ? `Pay 10% Advance (₹${codAdvanceAmount}) via UPI` : `Pay ₹${finalAmount} via Direct UPI / QR`}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Direct Personal UPI & QR Payment Modal */}
      <DirectUpiPaymentModal
        isOpen={isDirectUpiModalOpen}
        onClose={() => setIsDirectUpiModalOpen(false)}
        onConfirmPayment={handleDirectUpiPaymentConfirm}
        orderId={pendingOrderId}
        amount={form.paymentMethod === 'cod' ? codAdvanceAmount : finalAmount}
        payableAmount={form.paymentMethod === 'cod' ? codAdvanceAmount : finalAmount}
        isCodAdvance={form.paymentMethod === 'cod'}
        totalOrderAmount={finalAmount}
        paymentMode={form.paymentMethod === 'cod' ? 'cod_advance' : 'direct_upi_full'}
        customerName={form.name}
        customerPhone={form.phone}
      />
    </div>
  );
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'font-medium'} ${color || 'text-gray-700'}`}>{value}</span>
    </div>
  );
}
