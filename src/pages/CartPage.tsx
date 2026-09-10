import { useState, useEffect } from 'react';
import {
  Trash2,
  Heart,
  Zap,
  Tag,
  ShoppingCart,
  ChevronDown,
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
import type { Product, CartItem } from '@/types';

interface CartPageProps {
  onProductClick: (product: Product) => void;
  onContinueShopping: () => void;
}

type CheckoutState = 'cart' | 'checkout' | 'processing' | 'success';

export default function CartPage({ onProductClick, onContinueShopping }: CartPageProps) {
  const { items, removeFromCart, updateQuantity, saveForLater, moveToCart, cartTotal, cartCount, savedItems, clearCart } = useCart();
  const { user } = useAuth();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('cart');
  const [openQty, setOpenQty] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  const [orderError, setOrderError] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeSuccess, setPincodeSuccess] = useState('');

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

  // Pre-fill user primary address when user is available
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const primary = user.addresses[0];
      setForm((prev) => ({
        ...prev,
        name: prev.name || primary.name || user.name || '',
        phone: prev.phone || primary.phone || user.phone || '',
        street: prev.street || primary.address || '',
        city: prev.city || primary.city || '',
        pincode: prev.pincode || primary.pincode || '',
      }));
    } else if (user?.name || user?.phone) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone?.replace(/\D/g, '').slice(-10) || '',
      }));
    }
  }, [user]);

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

  const activeItems = items.filter(item => !item.savedForLater);
  const mrpTotal = activeItems.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0);
  const discount = mrpTotal - cartTotal;
  const deliveryFee = cartTotal > 500 ? 0 : 49;
  const totalAmount = cartTotal + deliveryFee;
  // COD requires 10% online advance via Razorpay
  const codAdvanceAmount = Math.max(1, Math.round(totalAmount * 0.10));
  const codRemainingAmount = totalAmount - codAdvanceAmount;

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

    let rzpOrderId: string | undefined;
    let rzpPaymentId: string | undefined;

    setCheckoutState('processing');

    if (form.paymentMethod === 'cod') {
      // 10% Online Advance via Razorpay for COD order
      const paymentResult = await initiateRazorpayPayment(codAdvanceAmount, {
        name: 'AKSelling - 10% COD Advance',
        description: `10% Token Advance for Cart Order (${cartCount} items)`,
        prefill: { name: form.name, contact: form.phone },
      });

      if (!paymentResult.success) {
        setOrderError(paymentResult.error || '10% COD advance payment was not completed. Order cannot be placed without advance confirmation.');
        setCheckoutState('checkout');
        return;
      }
      rzpOrderId = paymentResult.orderId;
      rzpPaymentId = paymentResult.paymentId;
      await placeOrderInDb(rzpOrderId, rzpPaymentId, codAdvanceAmount, codRemainingAmount);
      return;
    }

    // Full Prepaid (UPI / Card / NetBanking)
    const paymentResult = await initiateRazorpayPayment(totalAmount, {
      name: 'AKSelling',
      description: `Order of ${cartCount} item(s)`,
      prefill: { name: form.name, contact: form.phone },
    });

    if (!paymentResult.success) {
      setOrderError(paymentResult.error || 'Payment failed. Please try again.');
      setCheckoutState('checkout');
      return;
    }
    rzpOrderId = paymentResult.orderId;
    rzpPaymentId = paymentResult.paymentId;

    await placeOrderInDb(rzpOrderId, rzpPaymentId);
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

    // 1. Save to Firebase Firestore in real-time
    await saveOrderToFirestore(orderPayload);

    // 2. Automatically deduct inventory in product catalog
    await deductProductInventory(
      orderItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity }))
    );

    // 3. Save to customer local orders AND Supplier Dashboard
    recordPlacedOrder(orderPayload);

    setOrderId(generatedId);
    clearCart();
    setCheckoutState('success');
  };

  if (checkoutState === 'success') {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center animate-fade-in px-4">
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
        <div className="mt-4 bg-flipkart-50 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Estimated Delivery</p>
          <p className="text-sm font-bold text-flipkart-600">3-5 Business Days</p>
        </div>
        <button
          onClick={() => {
            setCheckoutState('cart');
            onContinueShopping();
          }}
          className="mt-6 bg-flipkart-500 text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-flipkart-600 transition-colors"
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
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Recipient & Address</span>
              <span className="text-[11px] font-semibold text-flipkart-600 bg-flipkart-50 px-2.5 py-1 rounded-full">
                Step 1 of 2
              </span>
            </div>

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
              className="flex-1 ml-4 bg-accent-400 text-white font-bold text-base py-3.5 rounded-xl hover:bg-accent-600 transition-colors"
            >
              {form.paymentMethod === 'cod' ? `Pay 10% Advance (₹${codAdvanceAmount})` : 'Confirm Order'}
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
            {activeItems.map((item, idx) => (
              <div
                key={item.product.id}
                className={`p-3 ${idx !== activeItems.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex gap-3">
                  <button
                    onClick={() => onProductClick(item.product)}
                    className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-50"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => onProductClick(item.product)} className="text-left">
                      <p className="text-xs text-gray-400 uppercase">{item.product.brand}</p>
                      <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                        {item.product.title}
                      </h3>
                    </button>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrice(item.product.price)}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(item.product.mrp)}
                      </span>
                      <span className="text-xs font-bold text-success-500">
                        {item.product.discount}% off
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenQty(openQty === item.product.id ? null : item.product.id)
                          }
                          className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-gray-700"
                        >
                          Qty: {item.quantity}
                          <ChevronDown size={14} />
                        </button>
                        {openQty === item.product.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenQty(null)}
                            />
                            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
                              {[1, 2, 3, 4, 5].map(qty => (
                                <button
                                  key={qty}
                                  onClick={() => {
                                    updateQuantity(item.product.id, qty);
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
                      <p className="text-xs text-gray-400">{item.product.delivery}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="flex items-center gap-1 text-xs font-bold text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                  <button
                    onClick={() => saveForLater(item.product.id)}
                    className="flex items-center gap-1 text-xs font-bold text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Heart size={14} /> Save for later
                  </button>
                  <button
                    onClick={() => onProductClick(item.product)}
                    className="flex items-center gap-1 text-xs font-bold text-flipkart-500 px-3 py-1.5 rounded-lg hover:bg-flipkart-50 transition-colors ml-auto"
                  >
                    <Zap size={14} /> Buy this now
                  </button>
                </div>
              </div>
            ))}

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
            {savedItems.map((item, idx) => (
              <div
                key={item.product.id}
                className={`p-3 ${idx !== savedItems.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex gap-3">
                  <button
                    onClick={() => onProductClick(item.product)}
                    className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-50"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => onProductClick(item.product)} className="text-left">
                      <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                        {item.product.title}
                      </h3>
                    </button>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrice(item.product.price)}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(item.product.mrp)}
                      </span>
                    </div>
                    <button
                      onClick={() => moveToCart(item.product.id)}
                      className="flex items-center gap-1 text-xs font-bold text-flipkart-500 px-3 py-1.5 rounded-lg hover:bg-flipkart-50 transition-colors mt-2 border border-flipkart-200"
                    >
                      <ShoppingCart size={14} /> Move to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
