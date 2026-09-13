export type TransactionType = 'CREDIT' | 'DEBIT';

export type TransactionCategory =
  | 'signup_bonus'
  | 'order_cashback'
  | 'milestone_reward'
  | 'withdrawal';

export type TransactionStatus = 'SUCCESS' | 'PROCESSING' | 'FAILED';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  title: string;
  description: string;
  category: TransactionCategory;
  status: TransactionStatus;
  orderId?: string;
  payoutMethod?: 'upi' | 'bank';
  payoutDetails?: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    holderName?: string;
  };
  utr?: string;
  createdAt: string;
}

export interface CashbackBreakdownItem {
  productId?: string;
  title?: string;
  price: number;
  baseCashback: number;
  repeatBonus: number;
  maxCap: number;
  finalCashback: number;
  slabLabel: string;
}

export interface OrderCashbackCalculationResult {
  totalCashback: number;
  breakdown: CashbackBreakdownItem[];
  repeatOrderCount: number;
  milestoneEligible: boolean;
  milestoneBonus: number;
}

export interface WithdrawalFormData {
  amount: number;
  method: 'upi' | 'bank';
  upiId: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  holderName: string;
}

export type WithdrawalRequestStatus = 'PROCESSING' | 'COMPLETED' | 'REJECTED';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  amount: number;
  method: 'upi' | 'bank';
  payoutDetails: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    holderName?: string;
    destinationDisplay?: string;
  };
  status: WithdrawalRequestStatus;
  requestedAt: string;
  settledAt?: string;
  receiptNumber?: string; // Parchi No: PARCHI-AK-2026-XXXXXX
  utr?: string;
  adminNotes?: string;
}
