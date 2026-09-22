import { setLocalWalletCache, getLocalWalletCache } from './walletService';

export interface DailyStreakState {
  currentStreak: number;
  lastCheckInDate: string; // YYYY-MM-DD
  totalCoinsEarned: number;
  spinsAvailable: number;
}

const STREAK_STORAGE_KEY = 'akselling_daily_streak_data';

export const STREAK_REWARDS = [
  { day: 1, label: 'Day 1', rewardType: 'coins', amount: 5, description: '₹5 Shopping Coins' },
  { day: 2, label: 'Day 2', rewardType: 'coins', amount: 10, description: '₹10 Shopping Coins' },
  { day: 3, label: 'Day 3', rewardType: 'coins', amount: 15, description: '₹15 Shopping Coins' },
  { day: 4, label: 'Day 4', rewardType: 'coins', amount: 20, description: '₹20 Shopping Coins' },
  { day: 5, label: 'Day 5', rewardType: 'spin', amount: 1, description: '1x Free Lucky Spin' },
  { day: 6, label: 'Day 6', rewardType: 'coins', amount: 25, description: '₹25 Shopping Coins' },
  { day: 7, label: 'Day 7', rewardType: 'jackpot', amount: 50, description: '₹50 Jackpot Cash!' },
];

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getStreakData(): DailyStreakState {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    currentStreak: 0,
    lastCheckInDate: '',
    totalCoinsEarned: 0,
    spinsAvailable: 1, // 1 complimentary welcome spin for all users!
  };
}

export function saveStreakData(data: DailyStreakState): void {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('akselling_streak_updated', { detail: data }));
  } catch {
    // ignore
  }
}

export function canCheckInToday(): boolean {
  const current = getStreakData();
  const today = getTodayDateString();
  return current.lastCheckInDate !== today;
}

export function claimTodayStreakReward(userId = 'guest'): {
  success: boolean;
  reward: (typeof STREAK_REWARDS)[0];
  newStreak: number;
} {
  const today = getTodayDateString();
  const current = getStreakData();

  if (current.lastCheckInDate === today) {
    // already checked in today
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
      // Missed a day -> reset to 1
      newStreak = 1;
    }
  }

  const rewardIndex = (newStreak - 1) % 7;
  const reward = STREAK_REWARDS[rewardIndex];

  let addedSpins = current.spinsAvailable;
  if (reward.rewardType === 'spin') {
    addedSpins += reward.amount;
  } else {
    // Add cash/coins directly to the wallet balance
    const wallet = getLocalWalletCache(userId);
    const newBal = wallet.walletBalance + reward.amount;
    setLocalWalletCache(userId, {
      walletBalance: newBal,
      totalCashbackEarned: wallet.totalCashbackEarned + reward.amount,
    });
    window.dispatchEvent(new Event('akselling_wallet_updated'));
  }

  const updatedState: DailyStreakState = {
    currentStreak: newStreak,
    lastCheckInDate: today,
    totalCoinsEarned: current.totalCoinsEarned + (reward.rewardType !== 'spin' ? reward.amount : 0),
    spinsAvailable: addedSpins,
  };

  saveStreakData(updatedState);

  return {
    success: true,
    reward,
    newStreak,
  };
}

export function deductSpinChance(): boolean {
  const current = getStreakData();
  if (current.spinsAvailable > 0) {
    saveStreakData({
      ...current,
      spinsAvailable: current.spinsAvailable - 1,
    });
    return true;
  }
  return false;
}

export function grantBonusSpin(): void {
  const current = getStreakData();
  saveStreakData({
    ...current,
    spinsAvailable: current.spinsAvailable + 1,
  });
}
