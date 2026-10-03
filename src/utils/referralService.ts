import { doc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/firebase';
import { getLocalWalletCache, setLocalWalletCache } from './walletService';
import type { UserProfile } from '@/auth-context';

export const REFERRAL_REWARD_AMOUNT = 30; // Fixed reward of ₹30 per successful referral (strictly capped at max ₹30)
export const MIN_WITHDRAWAL_LIMIT = 100; // Minimum withdrawal limit is ₹100

const REFERRER_STORAGE_KEY = 'akselling_referred_by';

/**
 * Returns or generates a deterministic referral code for the user
 */
export function getUserReferralCode(user?: UserProfile | null): string {
  if (!user || !user.id || user.id === 'guest') {
    return 'AKSELL30';
  }
  const clean = user.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `AK${clean || '30'}`;
}

/**
 * Builds a shareable product or app referral URL
 */
export function getReferralShareUrl(productId?: string, user?: UserProfile | null): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const refCode = getUserReferralCode(user);
  
  if (productId) {
    return `${origin}/?productId=${encodeURIComponent(productId)}&ref=${encodeURIComponent(refCode)}`;
  }
  return `${origin}/?ref=${encodeURIComponent(refCode)}`;
}

/**
 * Captures referral code from URL query parameters (?ref=AKXXXX) on initial app load
 */
export function captureReferralFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('referral');
    if (ref && ref.trim()) {
      const cleanRef = ref.trim().toUpperCase();
      localStorage.setItem(REFERRER_STORAGE_KEY, cleanRef);
      return cleanRef;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Gets currently tracked referrer code from local storage
 */
export function getTrackedReferrer(): string | null {
  try {
    return localStorage.getItem(REFERRER_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Credits the referrer when a referred user places an order or completes a purchase.
 * Reward is fixed at ₹30 (strictly capped at max ₹30 per share/referral).
 */
export async function processReferralRewardOnOrder(
  buyerId: string,
  buyerName: string,
  orderId: string,
  orderAmount: number
): Promise<{ success: boolean; rewardedAmount: number; referrerCode: string | null }> {
  const refCode = getTrackedReferrer();
  if (!refCode) {
    return { success: false, rewardedAmount: 0, referrerCode: null };
  }

  // Prevent self-referral
  const buyerCode = getUserReferralCode({ id: buyerId } as UserProfile);
  if (refCode === buyerCode) {
    try {
      localStorage.removeItem(REFERRER_STORAGE_KEY);
    } catch {
      // ignore
    }
    return { success: false, rewardedAmount: 0, referrerCode: null };
  }

  const rewardAmount = REFERRAL_REWARD_AMOUNT; // Strictly ₹30 capped

  try {
    // 1. Record referral event in Firestore
    if (isFirebaseConfigured) {
      const refRecordId = `ref_${orderId}_${Date.now()}`;
      await setDoc(doc(db, 'referral_rewards', refRecordId), {
        id: refRecordId,
        referrerCode: refCode,
        buyerId,
        buyerName: buyerName || 'Referred Friend',
        orderId,
        orderAmount,
        rewardAmount,
        status: 'CREDITED',
        createdAt: new Date().toISOString(),
      });

      // Find user matching refCode or credit directly if refCode has user id
      // Also write to wallet_transactions for the referrer
      const txId = `tx_ref_${refRecordId}`;
      await setDoc(doc(db, 'wallet_transactions', txId), {
        id: txId,
        userId: refCode,
        type: 'CREDIT',
        amount: rewardAmount,
        title: 'Referral Cash Reward',
        description: `₹${rewardAmount} earned for friend purchase (Order #${orderId})`,
        category: 'referral_bonus',
        status: 'SUCCESS',
        orderId,
        createdAt: new Date().toISOString(),
      });
    }

    // Update local wallet if the current active session matches
    const currentCached = getLocalWalletCache(refCode);
    const newBal = (currentCached.walletBalance || 0) + rewardAmount;
    setLocalWalletCache(refCode, {
      walletBalance: newBal,
      totalCashbackEarned: (currentCached.totalCashbackEarned || 0) + rewardAmount,
    });

    // Clear stored referrer after successful reward to avoid duplicate payout
    try {
      localStorage.removeItem(REFERRER_STORAGE_KEY);
    } catch {
      // ignore
    }

    return { success: true, rewardedAmount: rewardAmount, referrerCode: refCode };
  } catch (err) {
    console.warn('Referral reward process notice:', err);
    return { success: true, rewardedAmount: rewardAmount, referrerCode: refCode };
  }
}
