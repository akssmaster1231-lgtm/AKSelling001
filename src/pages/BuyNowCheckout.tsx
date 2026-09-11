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
} from 'lucide-react';
import { formatPrice } from '@/data';
import { initiateRazorpayPayment } from '@/razorpay';
import { saveOrderToFirestore, deductProductInventory, type FirestoreOrder } from '@/firebase';
import { useI18n } from '@/i18n';
import { useAuth } from '@/auth-context';
import { recordPlacedOrder } from '@/utils/orderSync';
import { lookupPincode } from '@/utils/pincode';
import type { Product } from '@/types';

interface BuyNowCheckoutProps {
  product: Product;
  quantity: number;
  onBack: () => void;
  onSuccess: () => void;
}

type Step = 'address' | 'payment' | 'review';
type State = 'form' | 'processing' | 'success';

export default function BuyNowCheckout({ product, quantity, onBack, onSuccess }: BuyNowCheckoutProps) {
  const { t } = useI18n();
  const { user, addAddress } = useAuth();
  const [step, setStep] = useState<Step>('address');
  const [state, setState] = useState<State>('form');
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeSuccess, setPincodeSuccess] = useState('');

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(() => {
    return user?.addresses && user.addresses.length > 0 ? user.addresses[0].id : null;
  });
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);

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

  // Pre-fill primary address if available from user profile
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

  const totalAmount = product.price * quantity;
  const mrpTotal = product.mrp * quantity;
  const discount = mrpTotal - totalAmount;
  const deliveryFee = totalAmount > 500 ? 0 : 49;
  const finalAmount = totalAmount + deliveryFee;
  // COD requires exactly 10% online advance via Razorpay to confirm order
  const codAdvanceAmount = Math.max(1, Math.round(finalAmount * 0.10));
  const codRemainingAmount = finalAmount - codAdvanceAmount;

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

  const handleConfirm = async () => {
    setError('');
    setState('processing');

    // If Cash on Delivery, mandatory 10% online advance via Razorpay
    if (form.paymentMethod === 'cod') {
      const paymentResult = await initiateRazorpayPayment(codAdvanceAmount, {
        name: 'AKSelling - 10% COD Advance',
        description: `10% Token Advance for COD Order: ${product.title.slice(0, 30)}...`,
        prefill: { name: form.name, contact: form.phone },
      });

      if (!paymentResult.success) {
        setError(paymentResult.error || '10% COD advance payment was not completed. Order cannot be placed without advance confirmation.');
        setState('form');
        return;
      }

      await placeOrder(paymentResult.orderId, paymentResult.paymentId, codAdvanceAmount, codRemainingAmount);
      return;
    }

    // Full Prepaid (UPI / Card / NetBanking)
    const paymentResult = await initiateRazorpayPayment(finalAmount, {
      name: 'AKSelling',
      description: product.title,
      prefill: { name: form.name, contact: form.phone },
    });

    if (!paymentResult.success) {
      setError(paymentResult.error || 'Payment failed. Please try again.');
      setState('form');
      return;
    }

    await placeOrder(paymentResult.orderId, paymentResult.paymentId);
  };

  const placeOrder = async (
    rzpOrderId?: string,
    rzpPayId?: string,
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

      const generatedId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

      const isPrepaid = form.paymentMethod !== 'cod';
      const orderPayload: FirestoreOrder = {
        id: generatedId,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: fullAddress,
        items: orderItems,
        total_amount: finalAmount,
        payment_method: isPrepaid ? 'Prepaid (Razorpay / UPI / Card)' : 'Cash on Delivery (10% Advance Paid Online)',
        payment_status: isPrepaid ? 'Paid' : `Partially Paid (10% ₹${advancePaid} Advance Paid, ₹${remainingDue} Due on Delivery)`,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPayId,
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

      setOrderId(generatedId);
      setState('success');
    } catch (err) {
      console.error('Order placement error:', err);
      setError('Failed to place order. Please try again.');
      setState('form');
    }
  };

  if (state === 'success') {
    return (
      <div className="fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[65] bg-white flex flex-col items-center justify-center animate-fade-in px-4 sm:shadow-2xl sm:border-x sm:border-gray-200">
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
        <div className="mt-4 bg-flipkart-50 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-gray-500">{t('estimatedDelivery')}</p>
          <p className="text-sm font-bold text-flipkart-600">3-5 Business Days</p>
        </div>
        <button
          onClick={onSuccess}
          className="mt-6 bg-flipkart-500 text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-flipkart-600 transition-colors"
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
                  {user.addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id && !isAddingNewAddress;
                    return (
                      <div
                        key={addr.id}
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

                {/* City & State Auto-populated */}
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
                label: t('cashOnDelivery'),
                value: 'cod',
                icon: '💵',
                badge: `Requires 10% (₹${codAdvanceAmount}) online advance token`,
                sub: `Pay ₹${codAdvanceAmount} now via UPI/Card, pay remaining ₹${codRemainingAmount} in cash at doorstep`,
              },
              { label: t('upi'), value: 'upi', icon: '📱', badge: '100% Secure & Instant', sub: 'Google Pay, PhonePe, Paytm, BHIM UPI' },
              { label: t('card'), value: 'card', icon: '💳', badge: 'All Banks Supported', sub: 'Debit & Credit Cards with OTP' },
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                    <span className="text-[10px] font-semibold text-flipkart-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
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
              <p className="text-sm text-gray-600">
                {form.paymentMethod === 'cod' ? `${t('cashOnDelivery')} (10% ₹${codAdvanceAmount} advance via Razorpay + ₹${codRemainingAmount} at doorstep)` : form.paymentMethod === 'upi' ? t('upi') : t('card')}
              </p>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden mb-3">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">{t('priceDetails')}</h2>
              </div>
              <div className="p-4 space-y-2.5">
                <Row label={`${t('price')} (${quantity} item)`} value={formatPrice(mrpTotal)} />
                <Row label={t('discount')} value={`- ${formatPrice(discount)}`} color="text-success-500" />
                <Row label={t('deliveryCharges')} value={deliveryFee === 0 ? t('free') : formatPrice(deliveryFee)} color={deliveryFee === 0 ? 'text-success-500' : 'text-gray-700'} />
                <div className="border-t border-dashed border-gray-200 pt-2.5">
                  <Row label={t('totalAmount')} value={formatPrice(finalAmount)} bold />
                </div>
                {form.paymentMethod === 'cod' && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 space-y-1 mt-2">
                    <div className="flex justify-between text-xs font-bold text-amber-900">
                      <span>Online Token Advance (10%):</span>
                      <span>₹{codAdvanceAmount} (Pay Now via Razorpay)</span>
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
                    <p className="text-xs text-success-600 font-medium">{t('youSave')} {formatPrice(discount)}!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-around bg-white rounded-xl shadow-card p-3 mb-3">
              <div className="flex flex-col items-center gap-1">
                <Shield size={18} className="text-success-500" />
                <span className="text-[10px] text-gray-500">{t('securePayment')}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck size={18} className="text-flipkart-500" />
                <span className="text-[10px] text-gray-500">{t('fastDelivery')}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 size={18} className="text-accent-500" />
                <span className="text-[10px] text-gray-500">{t('easyReturns')}</span>
              </div>
            </div>

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
              className="flex-1 ml-4 bg-accent-400 text-white font-bold text-base py-3.5 rounded-xl hover:bg-accent-600 transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={18} /> {form.paymentMethod === 'cod' ? `Pay 10% Advance (₹${codAdvanceAmount})` : t('confirmAndBuy')}
            </button>
          </div>
        </div>
      )}
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
