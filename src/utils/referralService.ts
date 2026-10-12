import { doc, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/firebase';
import { getLocalWalletCache, setLocalWalletCache } from './walletService';
import { MAX_WALLET_ACCUMULATION_CAP } from './cashbackEngine';
import type { UserProfile } from '@/auth-context';

/**
 * Locked Referral Constants
 * Reward is strictly ₹30 per friend's completed order.
 * Minimum withdrawal limit is ₹100; Maximum is ₹500.
 */
export const REFERRAL_REWARD_AMOUNT = 30; // Strictly ₹30 Cash per valid referred friend order
export const MIN_WITHDRAWAL_LIMIT = 100; // Minimum withdrawal limit is ₹100
export const MAX_WITHDRAWAL_LIMIT = 500; // Maximum withdrawal limit is ₹500

const REFERRER_CODE_STORAGE_KEY = 'akselling_referred_by_code';
const REFERRER_UID_STORAGE_KEY = 'akselling_referred_by_uid';

/**
 * Generates or returns a deterministic referral code for the user
 */
export function getUserReferralCode(user?: UserProfile | null): string {
  if (!user || !user.id || user.id === 'guest') {
    return 'AKSELL30';
  }
  const clean = user.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `AK${clean || '30'}`;
}

/**
 * Builds a shareable product or app referral URL with both code and referrer UID
 */
export function getReferralShareUrl(productId?: string, user?: UserProfile | null): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const refCode = getUserReferralCode(user);
  const refUid = user?.id && user.id !== 'guest' ? user.id : '';

  const params = new URLSearchParams();
  if (productId) params.set('productId', productId);
  params.set('ref', refCode);
  if (refUid) params.set('refUid', refUid);

  return `${origin}/?${params.toString()}`;
}

/**
 * Captures referral parameters from URL (?ref=AKXXXX&refUid=USER_ID) on initial app load
 */
export function captureReferralFromUrl(): { code: string | null; uid: string | null } {
  if (typeof window === 'undefined') return { code: null, uid: null };
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('referral');
    const refUid = params.get('refUid') || params.get('referrer');

    let cleanRef: string | null = null;
    let cleanUid: string | null = null;

    if (ref && ref.trim()) {
      cleanRef = ref.trim().toUpperCase();
      localStorage.setItem(REFERRER_CODE_STORAGE_KEY, cleanRef);
    }
    if (refUid && refUid.trim()) {
      cleanUid = refUid.trim();
      localStorage.setItem(REFERRER_UID_STORAGE_KEY, cleanUid);
    }

    return { code: cleanRef, uid: cleanUid };
  } catch {
    return { code: null, uid: null };
  }
}

/**
 * Gets currently tracked referrer code and UID from local storage
 */
export function getTrackedReferral(): { code: string | null; uid: string | null } {
  try {
    return {
      code: localStorage.getItem(REFERRER_CODE_STORAGE_KEY),
      uid: localStorage.getItem(REFERRER_UID_STORAGE_KEY),
    };
  } catch {
    return { code: null, uid: null };
  }
}

/**
 * STRICT BUSINESS RULE:
 * Referral reward (₹30) is ONLY credited to the referrer's verified cash balance
 * AFTER a referred friend successfully completes a valid, paid product order.
 * Prevents any arbitrary, pre-order, or unearned balance credits.
 */
export async function processReferralRewardOnOrder(
  buyerId: string,
  buyerName: string,
  orderId: string,
  orderAmount: number
): Promise<{ success: boolean; rewardedAmount: number; referrerCode: string | null }> {
  // Validate order existence and non-zero amount
  if (!orderId || !orderAmount || orderAmount <= 0) {
    return { success: false, rewardedAmount: 0, referrerCode: null };
  }

  const { code: refCode, uid: refUid } = getTrackedReferral();
  if (!refCode && !refUid) {
    return { success: false, rewardedAmount: 0, referrerCode: null };
  }

  // Prevent self-referral: buyer cannot refer themselves
  const buyerCode = getUserReferralCode({ id: buyerId } as UserProfile);
  if ((refCode && refCode === buyerCode) || (refUid && refUid === buyerId)) {
    try {
      localStorage.removeItem(REFERRER_CODE_STORAGE_KEY);
      localStorage.removeItem(REFERRER_UID_STORAGE_KEY);
    } catch {
      // ignore
    }
    return { success: false, rewardedAmount: 0, referrerCode: null };
  }

  const rewardAmount = REFERRAL_REWARD_AMOUNT; // Strictly ₹30 capped
  const targetReferrerId = refUid || refCode || '';

  try {
    // 1. Idempotency Check in Firestore: prevent duplicate payout for the same order
    if (isFirebaseConfigured) {
      const refRecordRef = doc(db, 'referral_rewards', `ref_${orderId}`);
      const existingSnap = await getDoc(refRecordRef);
      if (existingSnap.exists()) {
        console.warn(`[ReferralEngine] Reward for order #${orderId} already processed.`);
        return { success: false, rewardedAmount: 0, referrerCode: refCode };
      }

      // 2. Record referral event in Firestore (Immutable Audit)
      await setDoc(refRecordRef, {
        id: `ref_${orderId}`,
        referrerId: targetReferrerId,
        referrerCode: refCode,
        buyerId: buyerId || 'guest_buyer',
        buyerName: buyerName || 'Referred Friend',
        orderId,
        orderAmount,
        rewardAmount,
        status: 'CREDITED',
        createdAt: new Date().toISOString(),
      });

      // 3. Atomically credit the Referrer's verified wallet balance in Firestore
      if (targetReferrerId) {
        const referrerUserRef = doc(db, 'users', targetReferrerId);
        try {
          await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(referrerUserRef);
            if (userSnap.exists()) {
              const uData = userSnap.data();
              const currentBal = typeof uData.walletBalance === 'number' ? uData.walletBalance : 0;
              const currentTotal = typeof uData.totalCashbackEarned === 'number' ? uData.totalCashbackEarned : currentBal;
              const newBal = Math.min(MAX_WALLET_ACCUMULATION_CAP, currentBal + rewardAmount);
              const newTotal = currentTotal + rewardAmount;

              transaction.update(referrerUserRef, {
                walletBalance: newBal,
                totalCashbackEarned: newTotal,
                updatedAt: new Date().toISOString(),
              });
            }
          });
        } catch (txErr) {
          console.warn('[ReferralEngine] User transaction notice:', txErr);
        }

        // 4. Create immutable wallet_transactions log for Referrer
        const txDocRef = doc(db, 'wallet_transactions', `tx_ref_${orderId}`);
        await setDoc(txDocRef, {
          id: `tx_ref_${orderId}`,
          userId: targetReferrerId,
          type: 'CREDIT',
          amount: rewardAmount,
          title: 'Referral Order Cash Reward',
          description: `₹${rewardAmount} credited! Friend (${buyerName || 'Shopper'}) placed Order #${orderId}`,
          category: 'referral_bonus',
          status: 'SUCCESS',
          orderId,
          verifiedOrderAmount: orderAmount,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 5. Update local wallet if the referrer matches active local session
    if (targetReferrerId) {
      const currentCached = getLocalWalletCache(targetReferrerId);
      const newBal = Math.min(MAX_WALLET_ACCUMULATION_CAP, (currentCached.walletBalance || 0) + rewardAmount);
      setLocalWalletCache(targetReferrerId, {
        walletBalance: newBal,
        totalCashbackEarned: (currentCached.totalCashbackEarned || 0) + rewardAmount,
      });
    }

    // 6. Clear tracked referral data after successful reward to avoid duplicate payouts
    try {
      localStorage.removeItem(REFERRER_CODE_STORAGE_KEY);
      localStorage.removeItem(REFERRER_UID_STORAGE_KEY);
    } catch {
      // ignore
    }

    return { success: true, rewardedAmount: rewardAmount, referrerCode: refCode };
  } catch (err) {
    console.warn('Referral reward process error:', err);
    return { success: false, rewardedAmount: 0, referrerCode: refCode };
  }
}
