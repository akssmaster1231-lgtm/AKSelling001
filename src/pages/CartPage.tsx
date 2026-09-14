import { useState, useEffect } from 'react';
import {
  Trash2,
  Heart,
  Zap,
  Tag,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Package,
  Loader2,
  MapPin,
  User,
  Phone,
  ChevronLeft,
  Building,
  Navigation,
} from 'lucide-react';
import { useCart } from '@/cart-context';
import { useAuth } from '@/auth-context';
import { formatPrice } from '@/data';
import { initiateRazorpayPayment } from '@/razorpay';
import { saveOrderToFirestore, deductProductInventory, type FirestoreOrder } from '@/firebase';
import { recordPlacedOrder } from '@/utils/orderSync';
import { lookupPincode } from '@/utils/pincode';
import { awardOrderCashback } from '@/utils/walletService';
import { MilestoneCelebrationModal } from '@/components/MilestoneCelebrationModal';
import { ScratchCardModal } from '@/components/ScratchCardModal';
import type { Product, CartItem } from '@/types';

interface CartPageProps {
  onProductClick: (product: Product) => void;
  onContinueShopping: () => void;
  onBuyNow?: (product: Product, size?: string, color?: string) => void;
}

type CheckoutState = 'cart' | 'checkout' | 'processing' | 'success';

export default function CartPage({ onProductClick, onContinueShopping, onBuyNow }: CartPageProps) {
  const { items, removeFromCart, updateQuantity, saveForLater, moveToCart, cartCount, savedItems, clearCart } = useCart();
  const { user, addAddress } = useAuth();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('cart');
  const [openQty, setOpenQty] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  const [orderError, setOrderError] = useState('');
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
    phone: user?.phone?.replace(/\D/g, '').slice(-10) || '',
    houseNo: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'Home' as 'Home' | 'Work' | 'Other',
    paymentMethod: 'cod',
  });

  // Pre-fill user primary real address from profile
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const active = (selectedAddressId && user.addresses.find(a => a.id === selectedAddressId)) || user.addresses[0];
      if (active) {
        setSelectedAddressId(active.id);
        setForm((prev) => ({
          ...prev,
          name: active.name || prev.name || user.name || '',
          phone: active.phone || prev.phone || user.phone || '',
          street: active.address || prev.street || '',
          city: active.city || prev.city || '',
          pincode: active.pincode || prev.pincode || '',
          addressType: (active.label as 'Home' | 'Work' | 'Other') || 'Home',
        }));
      }
    } else if (user?.name || user?.phone) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone?.replace(/\D/g, '').slice(-10) || '',
      }));
    }
  }, [user, selectedAddressId]);

  // Smart Pincode Auto-Fill for Cart Checkout
  const handlePincodeChange = async (pinVal: string) => {
    const clean = pinVal.replace(/\D/g, '').slice(0, 6);
    setForm((prev) => ({ ...prev, pincode: clean }));

    if (clean.length === 6) {
      setPincodeLoading(true);
      setPincodeSuccess('');
      try {
        const info = await lookupPincode(clean);
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

  const activeItems = items.filter(item => Boolean(item?.product?.id && !item.savedForLater));
  const effectiveCartTotal = activeItems.reduce((sum, item) => sum + (item.product.price || 0) * Math.max(1, item.quantity || 1), 0);
  const mrpTotal = activeItems.reduce((sum, item) => sum + (item.product.mrp || item.product.price || 0) * Math.max(1, item.quantity || 1), 0);
  const discount = Math.max(0, mrpTotal - effectiveCartTotal);
  const deliveryFee = effectiveCartTotal > 500 ? 0 : (effectiveCartTotal > 0 ? 49 : 0);
  const totalAmount = effectiveCartTotal + deliveryFee;
  // COD requires 10% online advance via Razorpay
  const codAdvanceAmount = Math.max(1, Math.round(totalAmount * 0.10));
  const codRemainingAmount = Math.max(0, totalAmount - codAdvanceAmount);

  const handlePlaceOrder = async () => {
    setOrderError('');
    if (!form.name.trim() || !form.phone.trim() || (!form.houseNo.trim() && !form.street.trim()) || !form.pincode.trim() || !form.city.trim()) {
      setOrderError('Please fill in your complete delivery address (Name, Phone, House/Street, City, Pincode).');
      return;
    }
    if (form.phone.trim().length < 10) {
      setOrderError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (form.pincode.trim().length !== 6) {
      setOrderError('Please enter a valid 6-digit delivery pincode.');
      return;
    }

    setIsPaymentAuthorizing(true);

    try {
      let paymentResult;
      const isCod = form.paymentMethod === 'cod';

      if (isCod) {
        // 10% Online Advance via Razorpay for COD order
        paymentResult = await initiateRazorpayPayment(codAdvanceAmount, {
          name: 'AKSelling - 10% COD Advance',
          description: `10% Token Advance for Cart Order (${cartCount} items)`,
          prefill: { name: form.name, contact: form.phone },
        });
      } else {
        // Full Prepaid (UPI / Card / NetBanking)
        paymentResult = await initiateRazorpayPayment(totalAmount, {
          name: 'AKSelling',
          description: `Order of ${cartCount} item(s)`,
          prefill: { name: form.name, contact: form.phone },
        });
      }

      if (!paymentResult.success || !paymentResult.paymentId) {
        setIsPaymentAuthorizing(false);
        setOrderError(
          paymentResult.error ||
          'Payment was not completed. Mandatory pre-payment verification is required before order placement.'
        );
        return;
      }

      // Backend Transaction Validation Middleware: Check server ledger before placing order
      const validateResp = await fetch('/api/orders/validate-and-verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentResult.paymentId,
          order_id: paymentResult.orderId,
          total_amount: totalAmount,
          payment_method: form.paymentMethod,
          required_advance: isCod ? codAdvanceAmount : totalAmount,
        }),
      });

      if (!validateResp.ok) {
        const errPayload = await validateResp.json().catch(() => ({}));
        setIsPaymentAuthorizing(false);
        setOrderError(
          errPayload.error ||
          'Server payment validation failed. Your transaction has not been confirmed on the backend ledger.'
        );
        return;
      }

      // ONLY after verified payment callback and server validation do we transition to order placement
      setIsPaymentAuthorizing(false);
      setCheckoutState('processing');

      if (isCod) {
        await placeOrderInDb(paymentResult.orderId, paymentResult.paymentId, codAdvanceAmount, codRemainingAmount);
      } else {
        await placeOrderInDb(paymentResult.orderId, paymentResult.paymentId);
      }
    } catch (err: unknown) {
      setIsPaymentAuthorizing(false);
      const errMsg = err instanceof Error ? err.message : 'Unexpected payment error';
      setOrderError(`Payment processing failed: ${errMsg}`);
    }
  };

  const placeOrderInDb = async (
    rzpOrderId?: string,
    rzpPaymentId?: string,
    advancePaid?: number,
    remainingDue?: number
  ) => {
    setCheckoutState('processing');

    const orderItems = activeItems.map((item: CartItem) => ({
      product_id: item.product.id,
      product_title: item.product.title,
      product_image: item.product.images[0],
      quantity: item.quantity,
      price: item.product.price,
      size: item.selectedSize,
      color: item.selectedColor,
    }));

    const addressParts = [
      form.houseNo.trim(),
      form.street.trim(),
      form.landmark ? `Near ${form.landmark.trim()}` : '',
      form.city.trim(),
      form.state.trim(),
      form.pincode.trim(),
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    const generatedId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const isPrepaid = form.paymentMethod !== 'cod';
    const orderPayload: FirestoreOrder = {
      id: generatedId,
      customer_name: form.name,
      customer_phone: form.phone,
      customer_address: fullAddress,
      items: orderItems,
      total_amount: totalAmount,
      payment_method: isPrepaid ? 'Prepaid (Razorpay / UPI / Card)' : 'Cash on Delivery (10% Advance Paid Online)',
      payment_status: isPrepaid ? 'Paid' : `Partially Paid (10% ₹${advancePaid} Advance Paid, ₹${remainingDue} Due on Delivery)`,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPaymentId,
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

    // 1. Save to Firebase Firestore in real-time
    await saveOrderToFirestore(orderPayload);

    // 2. Automatically deduct inventory in product catalog
    await deductProductInventory(
      orderItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity }))
    );

    // 3. Save to customer local orders AND Supplier Dashboard
    recordPlacedOrder(orderPayload);

    // 4. Trigger automated instant email notifications (Seller alert to anojkumaryadav7290@gmail.com + Customer confirmation)
    fetch('/api/notifications/send-order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: orderPayload,
        customerEmail: user?.email || undefined,
        sellerEmail: 'anojkumaryadav7290@gmail.com',
      }),
    }).catch((e) => console.warn('Email notification dispatch notice:', e));

    // 5. Award Product-Based Cashback & 3rd Order Milestone to Firebase Wallet with verified paymentId
    try {
      const rewardResult = await awardOrderCashback(
        user?.id || 'guest',
        generatedId,
        orderItems.map((item) => ({
          id: item.product_id,
          title: item.product_title,
          price: item.price,
          quantity: item.quantity,
        })),
        rzpPaymentId
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

    setOrderId(generatedId);
    clearCart();
    setCheckoutState('success');
  };

  if (checkoutState === 'success') {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center animate-fade-in px-4">
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
        <h2 className="text-xl font-bold text-gray-800">Order Placed Successfully!</h2>
        <p className="text-sm text-gray-500 mt-2 text-center">
          Thank you for shopping with AKSelling
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

        <div className="mt-4 bg-flipkart-50 rounded-xl px-4 py-3 text-center w-full max-w-sm">
          <p className="text-xs text-gray-500">Estimated Delivery</p>
          <p className="text-sm font-bold text-flipkart-600">3-5 Business Days</p>
        </div>
        <button
          onClick={() => {
            setCheckoutState('cart');
            onContinueShopping();
          }}
          className="mt-6 bg-flipkart-500 text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-flipkart-600 transition-colors shadow-md"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  if (checkoutState === 'processing') {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center animate-fade-in">
        <Loader2 size={40} className="animate-spin text-flipkart-500 mb-4" />
        <h2 className="text-lg font-bold text-gray-800">Placing your order...</h2>
        <p className="text-sm text-gray-500 mt-1">Please wait while we confirm your order</p>
      </div>
    );
  }

  if (checkoutState === 'checkout') {
    return (
      <div className="pb-28">
        <div className="px-3 pt-3">
          <button
            onClick={() => setCheckoutState('cart')}
            className="flex items-center gap-1 text-sm text-gray-600 font-medium mb-3"
          >
            <ChevronLeft size={18} /> Back to Cart
          </button>
          <div className="bg-white rounded-xl shadow-card px-4 py-3 flex items-center gap-2">
            <MapPin size={18} className="text-flipkart-500" />
            <h1 className="text-base font-bold text-gray-800 flex-1">Delivery Details</h1>
          </div>
        </div>

        <div className="px-3 mt-3">
          <div className="bg-white rounded-xl shadow-card p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Delivery Address</span>
              <span className="text-[11px] font-semibold text-flipkart-600 bg-flipkart-50 px-2.5 py-1 rounded-full">
                Step 1 of 2
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
                      <User size={14} className="text-gray-400" /> Full Name *
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
                      <Phone size={14} className="text-gray-400" /> Phone Number *
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

                {/* Smart Pincode Auto-Fill */}
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

                {/* City & State */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">City / District *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="City"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">State *</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      placeholder="State"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white"
                    />
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
                      placeholder="e.g. Flat 204, Krishna Towers"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-flipkart-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Street / Colony *</label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={e => setForm({ ...form, street: e.target.value })}
                      placeholder="e.g. Station Road, Sector 5"
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
                    placeholder="e.g. Near City Mall / Primary School"
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
          </div>
        </div>

        {/* Payment Method */}
        <div className="px-3 mt-3">
          <div className="bg-white rounded-xl shadow-card p-4">
            <h2 className="text-sm font-bold text-gray-800 mb-3">Payment Method</h2>
            <div className="space-y-2">
              <PaymentOption
                label="Cash on Delivery"
                value="cod"
                selected={form.paymentMethod === 'cod'}
                badge={`10% (₹${codAdvanceAmount}) Advance Online`}
                sub={`Pay ₹${codAdvanceAmount} now via Razorpay, pay ₹${codRemainingAmount} in cash upon delivery`}
                onSelect={() => setForm({ ...form, paymentMethod: 'cod' })}
              />
              <PaymentOption
                label="UPI / Instant Wallet"
                value="upi"
                selected={form.paymentMethod === 'upi'}
                badge="Recommended"
                sub="Google Pay, PhonePe, Paytm, BHIM UPI"
                onSelect={() => setForm({ ...form, paymentMethod: 'upi' })}
              />
              <PaymentOption
                label="Credit / Debit Card / NetBanking"
                value="card"
                selected={form.paymentMethod === 'card'}
                badge="Secure"
                sub="Visa, MasterCard, RuPay, Maestro"
                onSelect={() => setForm({ ...form, paymentMethod: 'card' })}
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="px-3 mt-3">
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Order Summary</h2>
            </div>
            <div className="p-4 space-y-2.5">
              <PriceRow label={`Price (${cartCount} items)`} value={formatPrice(mrpTotal)} />
              <PriceRow label="Discount" value={`- ${formatPrice(discount)}`} color="text-success-500" />
              <PriceRow
                label="Delivery Charges"
                value={deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                color={deliveryFee === 0 ? 'text-success-500' : 'text-gray-700'}
              />
              <div className="border-t border-dashed border-gray-200 pt-2.5">
                <PriceRow label="Total Amount" value={formatPrice(totalAmount)} bold />
              </div>
              {form.paymentMethod === 'cod' && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 space-y-1 mt-2">
                  <div className="flex justify-between text-xs font-bold text-amber-900">
                    <span>Online Token Advance (10%):</span>
                    <span>₹{codAdvanceAmount} (Pay via Razorpay)</span>
                  </div>
                  <div className="flex justify-between text-xs text-amber-800">
                    <span>Balance Due on Cash Delivery:</span>
                    <span>₹{codRemainingAmount} (To Courier Rider)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {orderError && (
          <div className="px-3 mt-3">
            <p className="text-sm text-error-500 bg-error-50 rounded-lg px-3 py-2">{orderError}</p>
          </div>
        )}

        {/* Confirm Order Button */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 max-w-md mx-auto w-full shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-400">Total Amount</p>
              <p className="text-lg font-bold text-gray-900">{formatPrice(totalAmount)}</p>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isPaymentAuthorizing}
              className={`flex-1 ml-4 ${
                isPaymentAuthorizing ? 'bg-accent-400/80 cursor-wait' : 'bg-accent-400 hover:bg-accent-600'
              } text-white font-bold text-base py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2`}
            >
              {isPaymentAuthorizing ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Verifying Payment...
                </>
              ) : (
                <>
                  <Zap size={18} /> {form.paymentMethod === 'cod' ? `Pay 10% Advance (₹${codAdvanceAmount})` : 'Confirm Order'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeItems.length === 0 && savedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-24 h-24 rounded-full bg-flipkart-50 flex items-center justify-center mb-4">
          <ShoppingCart size={40} className="text-flipkart-300" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-sm text-gray-500 mt-1 text-center">
          Browse our wide collection and add items to your cart
        </p>
        <button
          onClick={onContinueShopping}
          className="mt-6 bg-flipkart-500 text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-flipkart-600 transition-colors"
        >
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <div className="px-3 pt-3">
        <div className="bg-white rounded-xl shadow-card px-4 py-3 flex items-center gap-2">
          <ShoppingCart size={18} className="text-flipkart-500" />
          <h1 className="text-base font-bold text-gray-800 flex-1">My Cart ({cartCount})</h1>
        </div>
      </div>

      {activeItems.length > 0 && (
        <div className="px-3 mt-3">
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {activeItems.map((item, idx) => {
              const itemKey = item.id || `${item.product.id}_${item.selectedSize || 'std'}_${item.selectedColor || 'std'}_${idx}`;
              return (
                <div
                  key={itemKey}
                  onClick={() => onProductClick(item.product)}
                  className={`p-3 group cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors ${
                    idx !== activeItems.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onProductClick(item.product);
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 group-hover:border-flipkart-300 transition-colors">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">{item.product.brand}</p>
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-flipkart-600 transition-colors">
                            {item.product.title}
                          </h3>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-flipkart-500 shrink-0 mt-1 transition-colors" />
                      </div>

                      {(item.selectedSize || item.selectedColor) && (
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                          {item.selectedSize && (
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">Size: {item.selectedSize}</span>
                          )}
                          {item.selectedColor && (
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">Color: {item.selectedColor}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(item.product.price)}
                        </span>
                        {item.product.mrp > item.product.price && (
                          <>
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(item.product.mrp)}
                            </span>
                            <span className="text-xs font-bold text-success-500">
                              {item.product.discount}% off
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenQty(openQty === itemKey ? null : itemKey)
                            }
                            className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-gray-700 hover:border-gray-300"
                          >
                            Qty: {item.quantity}
                            <ChevronDown size={14} />
                          </button>
                          {openQty === itemKey && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenQty(null)}
                              />
                              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
                                {[1, 2, 3, 4, 5].map(qty => (
                                  <button
                                    type="button"
                                    key={qty}
                                    onClick={() => {
                                      updateQuantity(item.id || item.product.id, qty, item.selectedSize, item.selectedColor);
                                      setOpenQty(null);
                                    }}
                                    className={`block w-full px-6 py-2 text-sm text-left hover:bg-flipkart-50 ${
                                      qty === item.quantity
                                        ? 'text-flipkart-500 font-bold bg-flipkart-50'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    {qty}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{item.product.delivery || 'Free Delivery'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id || item.product.id, item.selectedSize, item.selectedColor)}
                      className="flex items-center gap-1 text-xs font-bold text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => saveForLater(item.id || item.product.id, item.selectedSize, item.selectedColor)}
                      className="flex items-center gap-1 text-xs font-bold text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Heart size={14} /> Save for later
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onBuyNow) {
                          onBuyNow(item.product, item.selectedSize, item.selectedColor);
                        } else {
                          onProductClick(item.product);
                        }
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-flipkart-600 bg-flipkart-50 hover:bg-flipkart-100 px-3 py-1.5 rounded-lg transition-colors ml-auto border border-flipkart-200"
                    >
                      <Zap size={14} /> Buy this now
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => setCheckoutState('checkout')}
                className="w-full bg-accent-400 text-white font-bold text-base py-3.5 rounded-xl hover:bg-accent-600 transition-colors"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {savedItems.length > 0 && (
        <div className="px-3 mt-4">
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Package size={18} className="text-flipkart-500" />
              <h2 className="text-sm font-bold text-gray-800">
                Saved for Later ({savedItems.length})
              </h2>
            </div>
            {savedItems.map((item, idx) => {
              const savedItemKey = item.id || `${item.product.id}_${item.selectedSize || 'std'}_${item.selectedColor || 'std'}_saved_${idx}`;
              return (
                <div
                  key={savedItemKey}
                  onClick={() => onProductClick(item.product)}
                  className={`p-3 group cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors ${
                    idx !== savedItems.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onProductClick(item.product);
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 group-hover:border-flipkart-300 transition-colors">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-flipkart-600 transition-colors">
                          {item.product.title}
                        </h3>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-flipkart-500 shrink-0 mt-1 transition-colors" />
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(item.product.price)}
                        </span>
                        {item.product.mrp > item.product.price && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(item.product.mrp)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => moveToCart(item.id || item.product.id, item.selectedSize, item.selectedColor)}
                          className="flex items-center gap-1 text-xs font-bold text-flipkart-500 px-3 py-1.5 rounded-lg hover:bg-flipkart-50 transition-colors border border-flipkart-200"
                        >
                          <ShoppingCart size={14} /> Move to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeItems.length > 0 && (
        <div className="px-3 mt-4">
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Price Details</h2>
            </div>
            <div className="p-4 space-y-2.5">
              <PriceRow label={`Price (${cartCount} items)`} value={formatPrice(mrpTotal)} />
              <PriceRow
                label="Discount"
                value={`- ${formatPrice(discount)}`}
                color="text-success-500"
              />
              <PriceRow
                label="Delivery Charges"
                value={deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                color={deliveryFee === 0 ? 'text-success-500' : 'text-gray-700'}
              />
              <div className="border-t border-dashed border-gray-200 pt-2.5">
                <PriceRow label="Total Amount" value={formatPrice(totalAmount)} bold />
              </div>
              {discount > 0 && (
                <div className="bg-success-50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Tag size={14} className="text-success-500" />
                  <p className="text-xs text-success-600 font-medium">
                    You save {formatPrice(discount)} on this order!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PriceRow({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
        {label}
      </span>
      <span
        className={`text-sm ${bold ? 'font-bold text-gray-900' : 'font-medium'} ${
          color || 'text-gray-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PaymentOption({
  label,
  value,
  selected,
  badge,
  sub,
  onSelect,
}: {
  label: string;
  value: string;
  selected: boolean;
  badge?: string;
  sub?: string;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg border transition-colors ${
        selected ? 'border-flipkart-500 bg-flipkart-50' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
          selected ? 'border-flipkart-500' : 'border-gray-300'
        }`}
      >
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-flipkart-500" />}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">{label}</span>
          {badge && (
            <span className="text-[10px] font-semibold text-flipkart-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <input type="hidden" value={value} readOnly />
    </button>
  );
}
