import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/firebase';
import { setLocalWalletCache, getLocalWalletCache } from './walletService';

export interface DailyStreakState {
  currentStreak: number;
  lastCheckInDate: string; // YYYY-MM-DD
  coinsBalance: number;    // Shopping Coins Balance (100 Coins = ₹5 INR)
  totalCoinsEarned: number;
  lastSpinDate: string;    // YYYY-MM-DD for strictly 1 spin per day
  lastSpinTimestamp?: number; // Exact timestamp in ms of last spin for 24-hour countdown
  spinsAvailable: number;  // Bonus spins earned via Day 5 streak
}

export interface SpinDiscountCoupon {
  couponCode: string;
  discountPercent: number;
  rewardType: 'discount' | 'cash' | 'voucher';
  label: string;
  wonAt: number;
  expiresAt: number;
}

const STREAK_STORAGE_KEY = 'akselling_daily_streak_data';
export const ACTIVE_SPIN_DISCOUNT_KEY = 'akselling_active_spin_discount';

// Locked Business Rule: 100 Coins = ₹5 INR Cash
export const COINS_PER_FIVE_RUPEES = 100;
export const RUPEES_PER_HUNDRED_COINS = 5;

export function convertCoinsToCash(coins: number): number {
  if (coins < COINS_PER_FIVE_RUPEES) return 0;
  return Math.floor(coins / COINS_PER_FIVE_RUPEES) * RUPEES_PER_HUNDRED_COINS;
}

// 7-day Daily Check-in streak rewards
export const STREAK_REWARDS = [
  { day: 1, label: 'Day 1', rewardType: 'coins', amount: 20, description: '20 Shopping Coins' },
  { day: 2, label: 'Day 2', rewardType: 'coins', amount: 40, description: '40 Shopping Coins' },
  { day: 3, label: 'Day 3', rewardType: 'coins', amount: 60, description: '60 Shopping Coins' },
  { day: 4, label: 'Day 4', rewardType: 'coins', amount: 80, description: '80 Shopping Coins' },
  { day: 5, label: 'Day 5', rewardType: 'spin', amount: 1, bonusCoins: 50, description: '1x Free Lucky Spin + 50 Coins' },
  { day: 6, label: 'Day 6', rewardType: 'coins', amount: 100, description: '100 Shopping Coins (= ₹5 Cash)' },
  { day: 7, label: 'Day 7', rewardType: 'jackpot', amount: 10, bonusCoins: 100, description: '₹10 Cash Jackpot + 100 Coins!' },
];

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getStreakData(): DailyStreakState {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currentStreak: Number(parsed.currentStreak) || 0,
        lastCheckInDate: parsed.lastCheckInDate || '',
        coinsBalance: typeof parsed.coinsBalance === 'number' ? parsed.coinsBalance : (Number(parsed.totalCoinsEarned) || 0),
        totalCoinsEarned: Number(parsed.totalCoinsEarned) || 0,
        lastSpinDate: parsed.lastSpinDate || '',
        lastSpinTimestamp: typeof parsed.lastSpinTimestamp === 'number' ? parsed.lastSpinTimestamp : undefined,
        spinsAvailable: typeof parsed.spinsAvailable === 'number' ? parsed.spinsAvailable : 0,
      };
    }
  } catch {
    // fallback
  }
  return {
    currentStreak: 0,
    lastCheckInDate: '',
    coinsBalance: 0,
    totalCoinsEarned: 0,
    lastSpinDate: '',
    lastSpinTimestamp: undefined,
    spinsAvailable: 0,
  };
}

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function getTimeUntilNextSpin(state?: DailyStreakState): number {
  const current = state || getStreakData();
  const lastTs = current.lastSpinTimestamp || 0;
  if (!lastTs) {
    if (current.lastSpinDate === getTodayDateString()) {
      return 12 * 60 * 60 * 1000;
    }
    return 0;
  }
  const elapsed = Date.now() - lastTs;
  return Math.max(0, TWENTY_FOUR_HOURS_MS - elapsed);
}

export function saveStreakData(data: DailyStreakState, userId = 'guest'): void {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('akselling_streak_updated', { detail: data }));

    // Sync streak and coins to Firestore if logged in
    if (userId && userId !== 'guest' && isFirebaseConfigured) {
      const userRef = doc(db, 'users', userId);
      updateDoc(userRef, {
        currentStreak: data.currentStreak,
        lastCheckInDate: data.lastCheckInDate,
        coinsBalance: data.coinsBalance,
        totalCoinsEarned: data.totalCoinsEarned,
        lastSpinDate: data.lastSpinDate,
        lastSpinTimestamp: data.lastSpinTimestamp || Date.now(),
        updatedAt: new Date().toISOString(),
      }).catch(() => {
        setDoc(userRef, {
          currentStreak: data.currentStreak,
          lastCheckInDate: data.lastCheckInDate,
          coinsBalance: data.coinsBalance,
          totalCoinsEarned: data.totalCoinsEarned,
          lastSpinDate: data.lastSpinDate,
          lastSpinTimestamp: data.lastSpinTimestamp || Date.now(),
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(() => {});
      });
    }
  } catch {
    // ignore
  }
}

export function canCheckInToday(): boolean {
  const current = getStreakData();
  const today = getTodayDateString();
  return current.lastCheckInDate !== today;
}

/**
 * Strictly enforce 1 spin per user per 24 hours.
 * User can spin IF 24 hours have elapsed OR if they have earned bonus spins.
 */
export function canSpinToday(): boolean {
  const current = getStreakData();
  const msLeft = getTimeUntilNextSpin(current);
  if (msLeft === 0) return true;
  return (current.spinsAvailable || 0) > 0;
}

export function getRemainingDailySpins(): number {
  const current = getStreakData();
  const msLeft = getTimeUntilNextSpin(current);
  const freeDailyLeft = msLeft === 0 ? 1 : 0;
  return freeDailyLeft + (current.spinsAvailable || 0);
}

export function claimTodayStreakReward(userId = 'guest'): {
  success: boolean;
  reward: (typeof STREAK_REWARDS)[0];
  newStreak: number;
} {
  const today = getTodayDateString();
  const current = getStreakData();

  if (current.lastCheckInDate === today) {
    const currentDayIdx = Math.max(0, (current.currentStreak - 1) % 7);
    return {
      success: false,
      reward: STREAK_REWARDS[currentDayIdx],
      newStreak: current.currentStreak,
    };
  }

  // Calculate new streak
  let newStreak = 1;
  if (current.lastCheckInDate) {
    const lastDate = new Date(current.lastCheckInDate);
    const currentDate = new Date(today);
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      newStreak = current.currentStreak + 1;
    } else if (diffDays === 0) {
      newStreak = current.currentStreak;
    } else {
      newStreak = 1;
    }
  }

  const rewardIndex = (newStreak - 1) % 7;
  const reward = STREAK_REWARDS[rewardIndex];

  let addedSpins = current.spinsAvailable;
  let newCoins = current.coinsBalance;
  let newTotalCoins = current.totalCoinsEarned;

  if (reward.rewardType === 'spin') {
    addedSpins += reward.amount;
    if (reward.bonusCoins) {
      newCoins += reward.bonusCoins;
      newTotalCoins += reward.bonusCoins;
    }
  } else if (reward.rewardType === 'jackpot') {
    // Add jackpot cash directly to the Cash Wallet Balance
    const wallet = getLocalWalletCache(userId);
    const newBal = wallet.walletBalance + reward.amount;
    setLocalWalletCache(userId, {
      walletBalance: newBal,
      totalCashbackEarned: wallet.totalCashbackEarned + reward.amount,
    });
    window.dispatchEvent(new Event('akselling_wallet_updated'));

    if (reward.bonusCoins) {
      newCoins += reward.bonusCoins;
      newTotalCoins += reward.bonusCoins;
    }
  } else {
    // Standard coins reward: strictly goes to Coins Balance
    newCoins += reward.amount;
    newTotalCoins += reward.amount;
  }

  const updatedState: DailyStreakState = {
    currentStreak: newStreak,
    lastCheckInDate: today,
    coinsBalance: newCoins,
    totalCoinsEarned: newTotalCoins,
    lastSpinDate: current.lastSpinDate,
    spinsAvailable: addedSpins,
  };

  saveStreakData(updatedState, userId);

  return {
    success: true,
    reward,
    newStreak,
  };
}

/**
 * Deducts 1 spin chance and marks today's spin as consumed
 */
export function deductSpinChance(userId = 'guest'): boolean {
  const current = getStreakData();
  const today = getTodayDateString();
  const now = Date.now();

  if (!canSpinToday()) return false;

  let newBonusSpins = current.spinsAvailable || 0;
  const msLeft = getTimeUntilNextSpin(current);
  if (msLeft > 0 && newBonusSpins > 0) {
    newBonusSpins -= 1;
  }

  const updated: DailyStreakState = {
    ...current,
    lastSpinDate: today,
    lastSpinTimestamp: now,
    spinsAvailable: newBonusSpins,
  };

  saveStreakData(updated, userId);
  return true;
}

export function grantBonusSpin(userId = 'guest'): void {
  const current = getStreakData();
  saveStreakData({
    ...current,
    spinsAvailable: (current.spinsAvailable || 0) + 1,
  }, userId);
}

/**
 * Converts coins to cash wallet balance: 100 Coins = ₹5 Cash
 */
export function redeemCoinsToCash(
  userId = 'guest',
  coinsToRedeem: number
): { success: boolean; cashAdded: number; remainingCoins: number; message: string } {
  if (coinsToRedeem < COINS_PER_FIVE_RUPEES) {
    return {
      success: false,
      cashAdded: 0,
      remainingCoins: getStreakData().coinsBalance,
      message: `Minimum ${COINS_PER_FIVE_RUPEES} coins required to convert into ₹${RUPEES_PER_HUNDRED_COINS} cash.`,
    };
  }

  const current = getStreakData();
  if (current.coinsBalance < coinsToRedeem) {
    return {
      success: false,
      cashAdded: 0,
      remainingCoins: current.coinsBalance,
      message: `Insufficient coins balance. You have ${current.coinsBalance} coins.`,
    };
  }

  const redeemableBlocks = Math.floor(coinsToRedeem / COINS_PER_FIVE_RUPEES);
  const actualCoinsDeducted = redeemableBlocks * COINS_PER_FIVE_RUPEES;
  const cashAmount = redeemableBlocks * RUPEES_PER_HUNDRED_COINS;

  // Deduct coins
  const remainingCoins = current.coinsBalance - actualCoinsDeducted;
  saveStreakData({
    ...current,
    coinsBalance: remainingCoins,
  }, userId);

  // Credit cash to Cash Wallet
  const wallet = getLocalWalletCache(userId);
  const newBal = (wallet.walletBalance || 0) + cashAmount;
  setLocalWalletCache(userId, {
    walletBalance: newBal,
    totalCashbackEarned: (wallet.totalCashbackEarned || 0) + cashAmount,
  });

  // Record transaction in Firestore
  if (userId && userId !== 'guest' && isFirebaseConfigured) {
    const txId = `tx_coins_${Date.now()}`;
    setDoc(doc(db, 'wallet_transactions', txId), {
      id: txId,
      userId,
      type: 'CREDIT',
      amount: cashAmount,
      title: 'Coins Converted to Cash',
      description: `${actualCoinsDeducted} Shopping Coins converted to ₹${cashAmount} Cash (Rate: 100 Coins = ₹5)`,
      category: 'coin_redemption',
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
    }).catch(() => {});
  }

  window.dispatchEvent(new Event('akselling_wallet_updated'));

  return {
    success: true,
    cashAdded: cashAmount,
    remainingCoins,
    message: `Successfully converted ${actualCoinsDeducted} Coins to ₹${cashAmount} Cash!`,
  };
}

/**
 * Stores active lucky spin discount so it automatically applies on checkout
 */
export function setActiveSpinDiscount(coupon: SpinDiscountCoupon): void {
  try {
    localStorage.setItem(ACTIVE_SPIN_DISCOUNT_KEY, JSON.stringify(coupon));
    window.dispatchEvent(new CustomEvent('akselling_spin_discount_applied', { detail: coupon }));
  } catch {
    // ignore
  }
}

export function getActiveSpinDiscount(): SpinDiscountCoupon | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SPIN_DISCOUNT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.discountPercent === 'number' && parsed.discountPercent > 0) {
        // Valid for 24 hours
        if (Date.now() < (parsed.expiresAt || (parsed.wonAt + 86400000))) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearActiveSpinDiscount(): void {
  try {
    localStorage.removeItem(ACTIVE_SPIN_DISCOUNT_KEY);
    window.dispatchEvent(new Event('akselling_spin_discount_cleared'));
  } catch {
    // ignore
  }
}
