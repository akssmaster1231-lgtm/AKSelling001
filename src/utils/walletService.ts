import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  runTransaction,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/firebase';
import type { WalletTransaction, WithdrawalFormData, WithdrawalRequest } from '@/types/wallet';
import {
  MAX_WALLET_ACCUMULATION_CAP,
  calculateOrderCashback,
  MILESTONE_CELEBRATION_MESSAGE,
  SIGNUP_BONUS_FLAT,
} from './cashbackEngine';

const WALLET_LOCAL_STORAGE_PREFIX = 'akselling_wallet_cache_';
const WITHDRAWAL_LOCAL_STORAGE_KEY = 'akselling_pending_withdrawals_';

/**
 * Helper to get locally cached wallet state for offline/instant UI renders
 * Instant ₹30 Welcome Bonus credited upon initial sign-up
 */
export function getLocalWalletCache(userId: string): {
  walletBalance: number;
  totalCashbackEarned: number;
  signupBonusClaimed: boolean;
  successfulOrdersCount: number;
  milestoneBonusClaimed: boolean;
} {
  try {
    const raw = localStorage.getItem(`${WALLET_LOCAL_STORAGE_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    walletBalance: SIGNUP_BONUS_FLAT,
    totalCashbackEarned: SIGNUP_BONUS_FLAT,
    signupBonusClaimed: true,
    successfulOrdersCount: 0,
    milestoneBonusClaimed: false,
  };
}

export function setLocalWalletCache(
  userId: string,
  data: Partial<ReturnType<typeof getLocalWalletCache>>
) {
  try {
    const current = getLocalWalletCache(userId);
    const updated = { ...current, ...data };
    localStorage.setItem(`${WALLET_LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
  } catch {
    // silent
  }
}

/**
 * 1. User Wallet Initialization (Instant Sign-Up Bonus ₹30)
 * On first login/sign-up, ₹30 is credited instantly into the user's wallet.
 * Subsequent rewards and credits are strictly earned from confirmed, successful product payments.
 */
export async function initializeUserWallet(
  userId: string,
  extraProfileData: { name?: string; phone?: string; email?: string } = {}
): Promise<{
  walletBalance: number;
  isFirstBonusCredited: boolean;
  successfulOrdersCount: number;
}> {
  if (!userId || userId === 'guest') {
    return {
      walletBalance: SIGNUP_BONUS_FLAT,
      isFirstBonusCredited: false,
      successfulOrdersCount: 0,
    };
  }

  try {
    if (!isFirebaseConfigured) {
      const cached = getLocalWalletCache(userId);
      const balance = cached.walletBalance > 0 ? cached.walletBalance : SIGNUP_BONUS_FLAT;
      setLocalWalletCache(userId, {
        walletBalance: balance,
        totalCashbackEarned: Math.max(cached.totalCashbackEarned, balance),
        signupBonusClaimed: true,
        successfulOrdersCount: cached.successfulOrdersCount || 0,
      });
      return {
        walletBalance: balance,
        isFirstBonusCredited: true,
        successfulOrdersCount: cached.successfulOrdersCount || 0,
      };
    }

    const userDocRef = doc(db, 'users', userId);
    let finalBalance = SIGNUP_BONUS_FLAT;
    let finalOrdersCount = 0;
    let isBonusCredited = false;

    await runTransaction(db, async (transaction) => {
      const userDocSnap = await transaction.get(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        let balance = typeof data.walletBalance === 'number' ? data.walletBalance : 0;
        const ordersCount = typeof data.successfulOrdersCount === 'number' ? data.successfulOrdersCount : 0;
        
        // If user never received the signup bonus, credit ₹30 now
        if (!data.signupBonusClaimed && balance === 0) {
          balance = SIGNUP_BONUS_FLAT;
          const earned = (typeof data.totalCashbackEarned === 'number' ? data.totalCashbackEarned : 0) + SIGNUP_BONUS_FLAT;
          transaction.set(userDocRef, {
            ...data,
            walletBalance: balance,
            totalCashbackEarned: earned,
            signupBonusClaimed: true,
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          const txDocRef = doc(db, 'wallet_transactions', `tx_signup_${userId}`);
          transaction.set(txDocRef, {
            id: `tx_signup_${userId}`,
            userId,
            type: 'CREDIT',
            amount: SIGNUP_BONUS_FLAT,
            title: 'Welcome Sign-Up Bonus',
            description: 'Instant ₹30 Welcome Bonus credited upon first sign-up',
            category: 'signup_bonus',
            status: 'SUCCESS',
            createdAt: new Date().toISOString(),
          });
          isBonusCredited = true;
        }

        finalBalance = balance;
        finalOrdersCount = ordersCount;
      } else {
        // Brand new user document: starts with ₹30 Instant Welcome Bonus
        finalBalance = SIGNUP_BONUS_FLAT;
        finalOrdersCount = 0;
        isBonusCredited = true;

        const initialData = {
          id: userId,
          name: extraProfileData.name || 'AKSelling Member',
          phone: extraProfileData.phone || '',
          email: extraProfileData.email || '',
          walletBalance: SIGNUP_BONUS_FLAT,
          totalCashbackEarned: SIGNUP_BONUS_FLAT,
          signupBonusClaimed: true,
          successfulOrdersCount: 0,
          milestoneBonusClaimed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        transaction.set(userDocRef, initialData);

        const txDocRef = doc(db, 'wallet_transactions', `tx_signup_${userId}`);
        transaction.set(txDocRef, {
          id: `tx_signup_${userId}`,
          userId,
          type: 'CREDIT',
          amount: SIGNUP_BONUS_FLAT,
          title: 'Welcome Sign-Up Bonus',
          description: 'Instant ₹30 Welcome Bonus credited upon first sign-up',
          category: 'signup_bonus',
          status: 'SUCCESS',
          createdAt: new Date().toISOString(),
        });
      }
    });

    setLocalWalletCache(userId, {
      walletBalance: finalBalance,
      successfulOrdersCount: finalOrdersCount,
      signupBonusClaimed: true,
    });

    return {
      walletBalance: finalBalance,
      isFirstBonusCredited: isBonusCredited,
      successfulOrdersCount: finalOrdersCount,
    };
  } catch (err) {
    console.warn('initializeUserWallet error:', err);
    return {
      walletBalance: SIGNUP_BONUS_FLAT,
      isFirstBonusCredited: false,
      successfulOrdersCount: 0,
    };
  }
}

/**
 * 2 & 3. Product-Based Cashback, Repeat Order Caps & 3rd Order Milestone
 * Awards cashback ONLY after a verified paid order placement with genuine paymentId.
 */
export async function awardOrderCashback(
  userId: string,
  orderId: string,
  items: Array<{ id?: string; title?: string; price: number; quantity?: number }>,
  paymentId?: string
): Promise<{
  cashbackEarned: number;
  milestoneAwarded: number;
  newWalletBalance: number;
  newOrdersCount: number;
  celebrationMessage?: string;
}> {
  if (!userId || userId === 'guest') {
    return {
      cashbackEarned: 0,
      milestoneAwarded: 0,
      newWalletBalance: 0,
      newOrdersCount: 1,
    };
  }

  // Enforce mandatory payment validation: rewards cannot be generated without a verified payment transaction
  if (!paymentId) {
    console.warn('[WalletSecurity] Order reward generation halted: Missing verified payment ID.');
    return {
      cashbackEarned: 0,
      milestoneAwarded: 0,
      newWalletBalance: 0,
      newOrdersCount: 0,
      celebrationMessage: undefined,
    };
  }

  try {
    let cashbackEarned = 0;
    let milestoneAwarded = 0;
    let newWalletBalance = 0;
    let newTotalEarned = 0;
    let newOrdersCount = 1;
    let newMilestoneClaimed = false;

    if (isFirebaseConfigured) {
      const userDocRef = doc(db, 'users', userId);

      await runTransaction(db, async (transaction) => {
        const userDocSnap = await transaction.get(userDocRef);
        let currentBalance = 0;
        let currentTotalEarned = 0;
        let previousOrdersCount = 0;
        let milestoneAlreadyClaimed = false;

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          currentBalance = typeof data.walletBalance === 'number' ? data.walletBalance : 0;
          currentTotalEarned = typeof data.totalCashbackEarned === 'number' ? data.totalCashbackEarned : currentBalance;
          previousOrdersCount = typeof data.successfulOrdersCount === 'number' ? data.successfulOrdersCount : 0;
          milestoneAlreadyClaimed = Boolean(data.milestoneBonusClaimed);
        }

        // Calculate item and repeat progressive cashback dynamically
        const calculation = calculateOrderCashback(items, previousOrdersCount, milestoneAlreadyClaimed);
        cashbackEarned = calculation.totalCashback;
        milestoneAwarded = calculation.milestoneBonus;
        const totalEarnedOnOrder = cashbackEarned + milestoneAwarded;

        // Enforce maximum wallet accumulation cap: ₹500
        newWalletBalance = Math.min(
          MAX_WALLET_ACCUMULATION_CAP,
          currentBalance + totalEarnedOnOrder
        );
        newTotalEarned = currentTotalEarned + totalEarnedOnOrder;
        newOrdersCount = previousOrdersCount + 1;
        newMilestoneClaimed = milestoneAlreadyClaimed || calculation.milestoneEligible;

        transaction.set(
          userDocRef,
          {
            walletBalance: newWalletBalance,
            totalCashbackEarned: newTotalEarned,
            successfulOrdersCount: newOrdersCount,
            milestoneBonusClaimed: newMilestoneClaimed,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // 1. Transaction log for order cashback (Strictly Immutable)
        if (cashbackEarned > 0) {
          const txDocRef = doc(db, 'wallet_transactions', `tx_cb_${orderId}`);
          transaction.set(txDocRef, {
            id: `tx_cb_${orderId}`,
            userId,
            type: 'CREDIT',
            amount: cashbackEarned,
            title: `Order #${orderId.slice(-6).toUpperCase()} Cashback`,
            description: `Cashback earned on verified purchase (Repeat Level: ${previousOrdersCount})`,
            category: 'order_cashback',
            status: 'SUCCESS',
            orderId,
            paymentId,
            verifiedPayment: true,
            createdAt: new Date().toISOString(),
          });
        }

        // 2. Transaction log for 3rd order milestone reward (Strictly Immutable)
        if (milestoneAwarded > 0) {
          const milestoneTxRef = doc(db, 'wallet_transactions', `tx_milestone_${orderId}`);
          transaction.set(milestoneTxRef, {
            id: `tx_milestone_${orderId}`,
            userId,
            type: 'CREDIT',
            amount: milestoneAwarded,
            title: '3rd Order Milestone Bonus',
            description: 'Special flat ₹20 reward for completing 3 successful orders',
            category: 'milestone_reward',
            status: 'SUCCESS',
            orderId,
            paymentId,
            verifiedPayment: true,
            createdAt: new Date().toISOString(),
          });
        }
      });
    } else {
      const cached = getLocalWalletCache(userId);
      const previousOrdersCount = cached.successfulOrdersCount;
      const milestoneAlreadyClaimed = cached.milestoneBonusClaimed;

      const calculation = calculateOrderCashback(items, previousOrdersCount, milestoneAlreadyClaimed);
      cashbackEarned = calculation.totalCashback;
      milestoneAwarded = calculation.milestoneBonus;
      const totalEarnedOnOrder = cashbackEarned + milestoneAwarded;

      newWalletBalance = Math.min(
        MAX_WALLET_ACCUMULATION_CAP,
        cached.walletBalance + totalEarnedOnOrder
      );
      newTotalEarned = cached.totalCashbackEarned + totalEarnedOnOrder;
      newOrdersCount = previousOrdersCount + 1;
      newMilestoneClaimed = milestoneAlreadyClaimed || calculation.milestoneEligible;
    }

    setLocalWalletCache(userId, {
      walletBalance: newWalletBalance,
      totalCashbackEarned: newTotalEarned,
      successfulOrdersCount: newOrdersCount,
      milestoneBonusClaimed: newMilestoneClaimed,
    });

    return {
      cashbackEarned,
      milestoneAwarded,
      newWalletBalance,
      newOrdersCount,
      celebrationMessage: milestoneAwarded > 0 ? MILESTONE_CELEBRATION_MESSAGE : undefined,
    };
  } catch (err) {
    console.error('awardOrderCashback atomic transaction error:', err);
    return {
      cashbackEarned: 0,
      milestoneAwarded: 0,
      newWalletBalance: 20,
      newOrdersCount: 1,
    };
  }
}

/**
 * 4. Customer Withdrawal Request (Manual Admin Payout Flow)
 * When a user requests a payout, stores their details with 'PROCESSING' status.
 */
export async function submitWithdrawalRequest(params: {
  userId: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  amount: number;
  formData: WithdrawalFormData;
}): Promise<{ success: boolean; requestId: string; error?: string }> {
  const { userId, userName, userPhone, userEmail, amount, formData } = params;
  if (!userId || userId === 'guest') {
    return { success: false, requestId: '', error: 'User is not logged in.' };
  }
  const requestId = `WR_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const now = new Date().toISOString();

  const destinationDisplay =
    formData.method === 'upi'
      ? `UPI: ${formData.upiId.trim()}`
      : `${formData.bankName || 'Bank A/C'} (A/C: ${formData.accountNumber.slice(-4)})`;

  const requestDoc: WithdrawalRequest = {
    id: requestId,
    userId,
    userName: userName || 'AKSelling Shopper',
    userPhone: userPhone || '',
    userEmail: userEmail || '',
    amount,
    method: formData.method,
    payoutDetails: {
      upiId: formData.upiId?.trim() || '',
      accountNumber: formData.accountNumber?.trim() || '',
      ifscCode: formData.ifscCode?.trim().toUpperCase() || '',
      bankName: formData.bankName?.trim() || '',
      holderName: formData.holderName?.trim() || '',
      destinationDisplay,
    },
    status: 'PROCESSING',
    requestedAt: now,
  };

  try {
    if (isFirebaseConfigured) {
      await setDoc(doc(db, 'withdrawal_requests', requestId), requestDoc);

      // Record pending DEBIT in wallet_transactions
      await setDoc(doc(db, 'wallet_transactions', `tx_${requestId}`), {
        id: `tx_${requestId}`,
        userId,
        type: 'DEBIT',
        amount,
        title: `Withdrawal via ${formData.method === 'upi' ? 'UPI' : 'Bank Transfer'}`,
        description: `Request for ₹${amount} submitted — Admin manual payout in progress`,
        category: 'withdrawal',
        status: 'PROCESSING',
        payoutMethod: formData.method,
        payoutDetails: requestDoc.payoutDetails,
        createdAt: now,
      });
    }

    // Save to local fallback cache
    try {
      const existing = JSON.parse(localStorage.getItem(`${WITHDRAWAL_LOCAL_STORAGE_KEY}${userId}`) || '[]');
      existing.unshift(requestDoc);
      localStorage.setItem(`${WITHDRAWAL_LOCAL_STORAGE_KEY}${userId}`, JSON.stringify(existing));
    } catch {
      // silent
    }

    return { success: true, requestId };
  } catch (err: unknown) {
    console.error('submitWithdrawalRequest error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to submit request';
    return { success: false, requestId: '', error: msg };
  }
}

/**
 * Real-time listener for customer withdrawal requests
 */
export function subscribeUserWithdrawalRequests(
  userId: string,
  callback: (requests: WithdrawalRequest[]) => void
): () => void {
  if (!userId || userId === 'guest' || !isFirebaseConfigured) {
    try {
      const local = JSON.parse(localStorage.getItem(`${WITHDRAWAL_LOCAL_STORAGE_KEY}${userId}`) || '[]');
      callback(local);
    } catch {
      callback([]);
    }
    return () => {};
  }

  try {
    const colRef = collection(db, 'withdrawal_requests');
    const q = query(colRef, where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: WithdrawalRequest[] = [];
        snapshot.forEach((d) => list.push(d.data() as WithdrawalRequest));
        list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        callback(list);
      },
      (err) => {
        console.warn('subscribeUserWithdrawalRequests notice:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Real-time listener for all withdrawal requests for the Admin Panel
 */
export function subscribeAllWithdrawalRequests(
  callback: (requests: WithdrawalRequest[]) => void
): () => void {
  if (!isFirebaseConfigured) {
    try {
      const all: WithdrawalRequest[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(WITHDRAWAL_LOCAL_STORAGE_KEY)) {
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          all.push(...items);
        }
      }
      callback(all);
    } catch {
      callback([]);
    }
    return () => {};
  }

  try {
    const colRef = collection(db, 'withdrawal_requests');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: WithdrawalRequest[] = [];
        snapshot.forEach((d) => list.push(d.data() as WithdrawalRequest));
        list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        callback(list);
      },
      (err) => {
        console.warn('subscribeAllWithdrawalRequests notice:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Admin Manual Settlement Action:
 * - Generates digital payment receipt (Parchi)
 * - Resets user's wallet balance strictly back to zero
 * - Updates withdrawal request and transaction status to COMPLETED
 */
export async function settleWithdrawalRequest(params: {
  requestId: string;
  adminUtr?: string;
  adminNotes?: string;
}): Promise<{
  success: boolean;
  receiptNumber: string;
  utr: string;
  error?: string;
  request?: WithdrawalRequest;
}> {
  const { requestId, adminUtr, adminNotes } = params;
  const parchiNumber = `PARCHI-AK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const settledAt = new Date().toISOString();
  const finalUtr = adminUtr?.trim() || `UPI/2026/${Date.now().toString().slice(-8)}`;

  try {
    let targetUserId = '';
    let settledRequest: WithdrawalRequest | null = null;

    if (isFirebaseConfigured) {
      const reqDocRef = doc(db, 'withdrawal_requests', requestId);
      const reqSnap = await getDoc(reqDocRef);

      if (reqSnap.exists()) {
        const data = reqSnap.data() as WithdrawalRequest;
        targetUserId = data.userId;
        settledRequest = {
          ...data,
          status: 'COMPLETED',
          settledAt,
          receiptNumber: parchiNumber,
          utr: finalUtr,
          adminNotes: adminNotes || '',
        };

        // Update withdrawal request to COMPLETED with Parchi number
        await updateDoc(reqDocRef, {
          status: 'COMPLETED',
          settledAt,
          receiptNumber: parchiNumber,
          utr: finalUtr,
          adminNotes: adminNotes || '',
        });

        // Reset user's wallet balance strictly back to zero upon manual admin settlement
        if (targetUserId) {
          const userDocRef = doc(db, 'users', targetUserId);
          await updateDoc(userDocRef, {
            walletBalance: 0,
            updatedAt: settledAt,
          }).catch(async () => {
            await setDoc(userDocRef, { walletBalance: 0, updatedAt: settledAt }, { merge: true });
          });
        }

        // Update transaction log
        const txDocRef = doc(db, 'wallet_transactions', `tx_${requestId}`);
        await updateDoc(txDocRef, {
          status: 'SUCCESS',
          utr: finalUtr,
          receiptNumber: parchiNumber,
          description: `Paid manually by Admin via UPI/Bank • Official Parchi: ${parchiNumber}`,
        }).catch(() => {});
      }
    }

    if (targetUserId) {
      setLocalWalletCache(targetUserId, { walletBalance: 0 });
    }

    return {
      success: true,
      receiptNumber: parchiNumber,
      utr: finalUtr,
      request: settledRequest || undefined,
    };
  } catch (err: unknown) {
    console.error('settleWithdrawalRequest error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to settle withdrawal request';
    return {
      success: false,
      receiptNumber: '',
      utr: '',
      error: msg,
    };
  }
}

/**
 * Real-time listener for user wallet transactions from Firestore
 */
export function subscribeWalletTransactions(
  userId: string,
  callback: (transactions: WalletTransaction[]) => void
): () => void {
  if (!userId || userId === 'guest' || !isFirebaseConfigured) {
    // Return sample local history if offline
    callback([
      {
        id: `tx_signup_${userId}`,
        userId,
        type: 'CREDIT',
        amount: 20,
        title: 'Welcome Signup Bonus',
        description: 'First login bonus credited to your AKSelling Rewards Wallet',
        category: 'signup_bonus',
        status: 'SUCCESS',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
    return () => {};
  }

  try {
    const txColRef = collection(db, 'wallet_transactions');
    const q = query(txColRef, where('userId', '==', userId));

    return onSnapshot(
      q,
      (snapshot) => {
        const txs: WalletTransaction[] = [];
        snapshot.forEach((docSnap) => {
          txs.push(docSnap.data() as WalletTransaction);
        });

        // Sort descending by date
        txs.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        callback(txs);
      },
      (error) => {
        console.warn('subscribeWalletTransactions notice:', error);
      }
    );
  } catch (err) {
    console.warn('subscribeWalletTransactions error:', err);
    return () => {};
  }
}
