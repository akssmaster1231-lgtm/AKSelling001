import type { CashbackBreakdownItem, OrderCashbackCalculationResult } from '@/types/wallet';

/**
 * AKSelling Rewards & Cashback System Constants
 * Zero Free Rewards Policy: No rewards or wallet credits are given without a confirmed, successful product payment.
 */
export const SIGNUP_BONUS_FLAT = 0; // Strictly ₹0 free signup rewards
export const REPEAT_ORDER_INCREMENT = 2; // +₹2 per repeat order
export const MILESTONE_3RD_ORDER_BONUS = 20; // Flat ₹20 extra on 3rd order
export const MIN_WITHDRAWAL_AMOUNT = 100; // Minimum withdrawal is ₹100
export const MAX_WALLET_ACCUMULATION_CAP = 500; // Maximum wallet accumulation cap is ₹500

export const MILESTONE_CELEBRATION_MESSAGE =
  'Congratulations! You have completed 3 shopping orders with AKSelling. Enjoy a special flat ₹20 cashback!';

export interface ProductCashbackSlab {
  minPrice: number;
  maxPrice: number;
  baseCashback: number;
  initialCashback: number;
  repeatIncrement: number;
  maxCap: number;
  label: string;
}

/**
 * Strict product price slabs and progressive caps as specified for production:
 * - ₹299 products: Starts at ₹10, +₹2 increment, max cap ₹20.
 * - ₹399 & ₹449 products: Starts at ₹30, +₹2 increment, max cap ₹35.
 * - ₹500 products: Starts at ₹30, +₹2 increment, max cap ₹50.
 * - ₹600 / ₹700 products: Starts at ₹40, +₹5 increment, max cap ₹60.
 */
export function getProductCashbackSlab(price: number): ProductCashbackSlab {
  const p = Math.round(Number(price) || 0);

  // ₹299 products: Starts at ₹10, +₹2 increment, max cap ₹20
  if (p <= 299) {
    return {
      minPrice: 0,
      maxPrice: 299,
      baseCashback: 10,
      initialCashback: 10,
      repeatIncrement: 2,
      maxCap: 20,
      label: '₹299 Slab (Starts ₹10, +₹2/order, Max ₹20)',
    };
  }

  // ₹399 & ₹449 products: Starts at ₹30, +₹2 increment, max cap ₹35
  if (p <= 449) {
    return {
      minPrice: 300,
      maxPrice: 449,
      baseCashback: 30,
      initialCashback: 30,
      repeatIncrement: 2,
      maxCap: 35,
      label: '₹399 & ₹449 Slab (Starts ₹30, +₹2/order, Max ₹35)',
    };
  }

  // ₹500 products (covers 450 to 550): Starts at ₹30, +₹2 increment, max cap ₹50
  if (p <= 550) {
    return {
      minPrice: 450,
      maxPrice: 550,
      baseCashback: 30,
      initialCashback: 30,
      repeatIncrement: 2,
      maxCap: 50,
      label: '₹500 Slab (Starts ₹30, +₹2/order, Max ₹50)',
    };
  }

  // ₹600 / ₹700 & higher products: Starts at ₹40, +₹5 increment, max cap ₹60
  return {
    minPrice: 551,
    maxPrice: 999999,
    baseCashback: 40,
    initialCashback: 40,
    repeatIncrement: 5,
    maxCap: 60,
    label: '₹600/₹700 Slab (Starts ₹40, +₹5/order, Max ₹60)',
  };
}

/**
 * Calculates item cashback based on item price and customer's repeat order count.
 * repeatOrderCount: 0 for 1st order, 1 for 2nd order, 2 for 3rd order, etc.
 */
export function calculateItemCashback(
  price: number,
  repeatOrderCount: number
): CashbackBreakdownItem {
  const slab = getProductCashbackSlab(price);
  const safeRepeatCount = Math.max(0, repeatOrderCount);
  const repeatBonus = safeRepeatCount * slab.repeatIncrement;
  const calculated = slab.baseCashback + repeatBonus;
  // Repeat bonus can NEVER exceed these caps:
  const finalCashback = Math.min(slab.maxCap, calculated);

  return {
    price,
    baseCashback: slab.baseCashback,
    repeatBonus,
    maxCap: slab.maxCap,
    finalCashback,
    slabLabel: slab.label,
  };
}

/**
 * Calculates total order cashback for an array of ordered products.
 * Handles repeat order increment (+₹2 per repeat order), per-slab caps, and 3rd-order milestone.
 */
export function calculateOrderCashback(
  items: Array<{ id?: string; title?: string; price: number; quantity?: number }>,
  previousSuccessfulOrdersCount: number,
  milestoneAlreadyClaimed: boolean = false
): OrderCashbackCalculationResult {
  const safeRepeatCount = Math.max(0, previousSuccessfulOrdersCount);
  const nextOrderNumber = safeRepeatCount + 1;

  const breakdown: CashbackBreakdownItem[] = [];
  let rawCashbackSum = 0;

  if (items.length === 0) {
    return {
      totalCashback: 0,
      breakdown: [],
      repeatOrderCount: safeRepeatCount,
      milestoneEligible: false,
      milestoneBonus: 0,
    };
  }

  // Calculate cashback for each distinct item in order
  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1);
    const itemCalc = calculateItemCashback(item.price, safeRepeatCount);
    // Cap at the highest slab cap if quantity is > 1
    const totalItemCashback = Math.min(itemCalc.maxCap, itemCalc.finalCashback * qty);

    breakdown.push({
      productId: item.id,
      title: item.title,
      price: item.price,
      baseCashback: itemCalc.baseCashback,
      repeatBonus: itemCalc.repeatBonus,
      maxCap: itemCalc.maxCap,
      finalCashback: totalItemCashback,
      slabLabel: itemCalc.slabLabel,
    });

    rawCashbackSum += totalItemCashback;
  }

  // Cap the single order cashback to the absolute maximum cap (₹60) to prevent abuse
  const orderCashback = Math.min(60, rawCashbackSum);

  // Check 3rd Order Milestone:
  // "The moment a customer completes their 3rd successful order, automatically add an extra flat ₹20 cashback"
  const is3rdOrder = nextOrderNumber === 3 && !milestoneAlreadyClaimed;
  const milestoneBonus = is3rdOrder ? MILESTONE_3RD_ORDER_BONUS : 0;

  return {
    totalCashback: orderCashback,
    breakdown,
    repeatOrderCount: safeRepeatCount,
    milestoneEligible: is3rdOrder,
    milestoneBonus,
  };
}
