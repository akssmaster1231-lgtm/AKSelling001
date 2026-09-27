import { safeLocalStorageGetItem, safeLocalStorageSetItem } from '@/utils/storageHelper';

export interface OwnerPaymentSettings {
  beneficiaryName: string;
  businessName: string;
  upiId: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  supportPhone: string;
  supportEmail: string;
}

export const DEFAULT_OWNER_PAYMENT: OwnerPaymentSettings = {
  beneficiaryName: 'ANOJKUMAR',
  businessName: 'AK YADAV PRINTS (ANOJKUMAR)',
  upiId: '7290894907@ybl',
  accountNumber: '7290894907',
  ifscCode: 'AIRP0000001',
  bankName: 'Airtel payment Bank',
  branchName: 'Airtel Payments Bank Main Branch',
  supportPhone: '+91 7290894907',
  supportEmail: 'support.akselling@gmail.com',
};

const PAYMENT_SETTINGS_KEY = 'akselling_owner_payment_settings';

export function getOwnerPaymentSettings(): OwnerPaymentSettings {
  try {
    const raw = safeLocalStorageGetItem(PAYMENT_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If previous version had old placeholder or different upi, upgrade to active details
      if (!parsed.upiId || parsed.upiId === 'akyadav.prints@hdfcbank' || parsed.accountNumber === '50200049281948') {
        const upgraded = { ...DEFAULT_OWNER_PAYMENT, ...parsed, upiId: '7290894907@ybl', accountNumber: '7290894907', ifscCode: 'AIRP0000001', bankName: 'Airtel payment Bank', beneficiaryName: 'ANOJKUMAR' };
        safeLocalStorageSetItem(PAYMENT_SETTINGS_KEY, JSON.stringify(upgraded));
        return upgraded;
      }
      return { ...DEFAULT_OWNER_PAYMENT, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_OWNER_PAYMENT;
}

export function saveOwnerPaymentSettings(settings: Partial<OwnerPaymentSettings>): OwnerPaymentSettings {
  const current = getOwnerPaymentSettings();
  const updated = { ...current, ...settings };
  try {
    safeLocalStorageSetItem(PAYMENT_SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  // Also sync to server settings if available
  try {
    fetch('/api/owner/payment-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});
  } catch {
    // ignore
  }
  return updated;
}

/**
 * Builds a universal UPI deep link for Google Pay, PhonePe, Paytm, BHIM, etc.
 */
export function generateUpiUri(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  orderId?: string;
  note?: string;
  app?: 'phonepe' | 'gpay' | 'paytm';
}): string {
  const { upiId, payeeName, amount, orderId, note, app } = params;
  const tn = note || (orderId ? `AKSelling Order ${orderId}` : 'AKSelling Payment');
  const baseQuery = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(tn)}`;

  if (app === 'phonepe') {
    return `phonepe://pay?${baseQuery}`;
  }
  if (app === 'paytm') {
    return `paytmmp://pay?${baseQuery}`;
  }
  if (app === 'gpay') {
    return `tez://upi/pay?${baseQuery}`;
  }

  return `upi://pay?${baseQuery}`;
}

/**
 * Generates an SVG QR Code URL using standard QR API with high error tolerance
 */
export function generateQrCodeUrl(upiUri: string, size = 260): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiUri)}&margin=10`;
}
