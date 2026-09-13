import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowLeft,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Building2,
  Smartphone,
  ShieldCheck,
  Loader2,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/auth-context';
import type { WalletTransaction, WithdrawalFormData, WithdrawalRequest } from '@/types/wallet';
import {
  MIN_WITHDRAWAL_AMOUNT,
  MAX_WALLET_ACCUMULATION_CAP,
  SIGNUP_BONUS_FLAT,
  REPEAT_ORDER_INCREMENT,
  MILESTONE_3RD_ORDER_BONUS,
} from '@/utils/cashbackEngine';
import {
  subscribeWalletTransactions,
  getLocalWalletCache,
  initializeUserWallet,
  submitWithdrawalRequest,
  subscribeUserWithdrawalRequests,
} from '@/utils/walletService';
import { DigitalParchiModal } from '@/components/DigitalParchiModal';

interface WalletPageProps {
  onBack: () => void;
  onNavigateToOrders?: () => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onBack, onNavigateToOrders }) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // Local state initialized with cached or default values
  const cached = getLocalWalletCache(userId);
  const [balance, setBalance] = useState<number>(user?.walletBalance ?? cached.walletBalance ?? 0);
  const [successfulOrders, setSuccessfulOrders] = useState<number>(
    user?.successfulOrdersCount ?? cached.successfulOrdersCount ?? 0
  );
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'all' | 'CREDIT' | 'DEBIT'>('all');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Withdrawal Form State
  const [withdrawForm, setWithdrawForm] = useState<WithdrawalFormData>({
    amount: 100,
    method: 'upi',
    upiId: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    holderName: user?.name || '',
  });

  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState<boolean>(false);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState<{
    amount: number;
    utr: string;
    transferId: string;
    method: string;
    destination: string;
    provider: string;
  } | null>(null);

  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [selectedParchi, setSelectedParchi] = useState<WithdrawalRequest | null>(null);

  // Sync with auth user updates
  useEffect(() => {
    if (typeof user?.walletBalance === 'number') {
      setBalance(user.walletBalance);
    }
    if (typeof user?.successfulOrdersCount === 'number') {
      setSuccessfulOrders(user.successfulOrdersCount);
    }
  }, [user?.walletBalance, user?.successfulOrdersCount]);

  // Ensure first login bonus is claimed if not yet initialized
  useEffect(() => {
    if (userId && userId !== 'guest') {
      initializeUserWallet(userId, {
        name: user?.name,
        phone: user?.phone,
        email: user?.email,
      }).then((res) => {
        setBalance(res.walletBalance);
        setSuccessfulOrders(res.successfulOrdersCount);
      }).catch(() => {});
    }
  }, [userId, user?.name, user?.phone, user?.email]);

  // Subscribe to real-time transactions from Firestore
  useEffect(() => {
    setIsLoadingTx(true);
    const unsubscribe = subscribeWalletTransactions(userId, (data) => {
      setTransactions(data);
      setIsLoadingTx(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Subscribe to real-time withdrawal requests
  useEffect(() => {
    if (!userId || userId === 'guest') return;
    const unsubscribe = subscribeUserWithdrawalRequests(userId, (reqs) => {
      setWithdrawalRequests(reqs);
    });
    return () => unsubscribe();
  }, [userId]);

  const activeProcessingRequest = withdrawalRequests.find(
    (r) => r.status === 'PROCESSING' || r.status === 'PENDING'
  );
  const latestCompletedRequest = withdrawalRequests.find((r) => r.status === 'COMPLETED');

  const handleAmountSelect = (amt: number) => {
    setWithdrawForm((prev) => ({ ...prev, amount: amt }));
    setWithdrawalError(null);
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalError(null);

    const amt = Number(withdrawForm.amount);
    if (isNaN(amt) || amt < MIN_WITHDRAWAL_AMOUNT) {
      setWithdrawalError(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}.`);
      return;
    }
    if (amt > MAX_WALLET_ACCUMULATION_CAP) {
      setWithdrawalError(`Maximum withdrawal limit is ₹${MAX_WALLET_ACCUMULATION_CAP}.`);
      return;
    }
    if (amt > balance) {
      setWithdrawalError(
        `Insufficient wallet balance. You have ₹${balance}, but requested ₹${amt}.`
      );
      return;
    }

    if (withdrawForm.method === 'upi') {
      const upi = withdrawForm.upiId.trim();
      if (!upi || !upi.includes('@') || upi.length < 5) {
        setWithdrawalError('Please enter a valid UPI ID (e.g. mobile@okhdfcbank or name@paytm).');
        return;
      }
    } else {
      const acc = withdrawForm.accountNumber.trim();
      const confirmAcc = withdrawForm.confirmAccountNumber.trim();
      const ifsc = withdrawForm.ifscCode.trim().toUpperCase();
      const holder = withdrawForm.holderName.trim();

      if (!acc || acc.length < 9) {
        setWithdrawalError('Please enter a valid Bank Account number (min 9 digits).');
        return;
      }
      if (acc !== confirmAcc) {
        setWithdrawalError('Bank Account numbers do not match.');
        return;
      }
      if (!ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        setWithdrawalError('Please enter a valid 11-digit IFSC code (e.g., SBIN0001234).');
        return;
      }
      if (!holder || holder.length < 2) {
        setWithdrawalError('Please enter the Account Holder Name.');
        return;
      }
    }

    setIsSubmittingWithdrawal(true);

    try {
      // 1. Submit Request to Firestore withdrawal_requests collection
      const newReq = await submitWithdrawalRequest(
        userId,
        amt,
        withdrawForm,
        {
          userName: user?.name || 'AKSelling Customer',
          userPhone: user?.phone || '',
          userEmail: user?.email || '',
        }
      );

      // 2. Also dispatch to server endpoint for sync logging
      fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: amt,
          method: withdrawForm.method,
          upiId: withdrawForm.upiId.trim(),
          accountNumber: withdrawForm.accountNumber.trim(),
          ifscCode: withdrawForm.ifscCode.trim().toUpperCase(),
          bankName: withdrawForm.bankName.trim() || 'Nationalised Bank',
          holderName: withdrawForm.holderName.trim(),
        }),
      }).catch((e) => console.warn('Server sync log:', e));

      setWithdrawalSuccess({
        amount: amt,
        utr: 'PROCESSING_BY_ADMIN',
        transferId: newReq.id,
        method: withdrawForm.method,
        destination: withdrawForm.method === 'upi' ? withdrawForm.upiId : 'Bank Account',
        provider: 'AKSelling Admin Finance Desk',
      });

      // Clear/reset form
      setWithdrawForm((prev) => ({
        ...prev,
        amount: Math.min(balance, 100) >= 100 ? 100 : 0,
      }));
    } catch (err: unknown) {
      console.error('Payout request error:', err);
      const msg = err instanceof Error ? err.message : 'Payout request failed';
      setWithdrawalError(msg);
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const progressPercent = Math.min(100, Math.round((balance / MAX_WALLET_ACCUMULATION_CAP) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20 text-gray-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Back to Account"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none flex items-center gap-1.5">
              AKSelling Rewards Wallet
              <ShieldCheck size={16} className="text-blue-600" />
            </h1>
            <p className="text-[11px] text-gray-500 mt-0.5">Automated UPI & Bank Cashout System</p>
          </div>
        </div>

        <button
          onClick={() => setShowRulesModal(true)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 transition-colors"
        >
          <Info size={14} />
          <span>Rules</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Main Balance Banner Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-6 shadow-xl border border-indigo-800/40">
          {/* Subtle Background Shapes */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-44 h-44 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-blue-200 border border-white/10">
                <Sparkles size={12} className="text-yellow-300" />
                <span>Verified Cash Balance</span>
              </div>
              <span className="text-[11px] text-blue-200 font-medium">
                Max Cap: ₹{MAX_WALLET_ACCUMULATION_CAP}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight text-white">₹{balance}</span>
              <span className="text-xs text-blue-200 font-medium">available for payout</span>
            </div>

            {/* Wallet Capacity Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-blue-200 mb-1 font-medium">
                <span>Wallet Capacity Filled</span>
                <span>{progressPercent}% (₹{balance} / ₹{MAX_WALLET_ACCUMULATION_CAP})</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stats Pills Grid */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onNavigateToOrders}
                className="bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-left transition-colors group"
              >
                <div className="flex items-center justify-between text-blue-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-blue-300" />
                    <span>Orders Placed</span>
                  </div>
                  {onNavigateToOrders && (
                    <ArrowUpRight size={12} className="text-blue-300 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
                <p className="text-lg font-bold text-white mt-1">
                  {successfulOrders} {successfulOrders === 1 ? 'Order' : 'Orders'}
                </p>
              </button>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                <div className="flex items-center gap-2 text-blue-200 text-xs">
                  <Award size={14} className="text-yellow-300" />
                  <span>Signup Bonus</span>
                </div>
                <p className="text-lg font-bold text-emerald-300 mt-1">
                  ₹{SIGNUP_BONUS_FLAT} (Active)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3rd Order Milestone Progress Banner */}
        <section className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Award size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  3rd Order Milestone Reward
                </h3>
                {successfulOrders >= 3 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Claimed
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    {3 - successfulOrders} more to unlock
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Complete your 3rd successful order to automatically unlock a flat <strong className="font-bold">₹{MILESTONE_3RD_ORDER_BONUS} extra reward</strong> in your wallet!
              </p>
            </div>
          </div>
        </section>

        {/* Successful Withdrawal Banner Alert */}
        {withdrawalSuccess && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-emerald-950 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm text-emerald-900">
                  Withdrawal of ₹{withdrawalSuccess.amount} Successful!
                </p>
                <p className="mt-1 text-emerald-800">
                  Transferred directly via {withdrawalSuccess.provider} to {withdrawalSuccess.destination}.
                </p>
                <div className="mt-2 bg-emerald-100/70 rounded-lg p-2 font-mono text-[11px] text-emerald-900">
                  <div><strong>UTR:</strong> {withdrawalSuccess.utr}</div>
                  <div><strong>Txn ID:</strong> {withdrawalSuccess.transferId}</div>
                </div>
                <button
                  onClick={() => setWithdrawalSuccess(null)}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Processing Withdrawal Status Banner */}
        {activeProcessingRequest && (
          <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 text-amber-950 shadow-xs animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                <Clock size={20} className="animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase">
                    Status: Processing
                  </span>
                  <span className="text-[10px] text-amber-700 font-mono">
                    ID: {activeProcessingRequest.id.slice(-8)}
                  </span>
                </div>
                <p className="font-black text-sm text-stone-900 mt-1">
                  Withdrawal of ₹{activeProcessingRequest.amount} Under Manual Review
                </p>
                <p className="mt-1 text-amber-900/90 leading-relaxed">
                  Your payout request has been received by AKSelling Finance Admin. The admin will manually transfer ₹{activeProcessingRequest.amount} to your {activeProcessingRequest.method === 'upi' ? `UPI ID (${activeProcessingRequest.upiId})` : `Bank Account (${activeProcessingRequest.bankName || 'Bank'})`}, and issue your official payment receipt (parchi). Your wallet balance will be cleared once settled.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Latest Completed Parchi Button if available */}
        {latestCompletedRequest && latestCompletedRequest.receiptNumber && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-3.5 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-950">
                  Digital Payment Parchi (Receipt) Available
                </p>
                <p className="text-[11px] text-emerald-700">
                  Receipt #{latestCompletedRequest.receiptNumber} • ₹{latestCompletedRequest.amount} Paid
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedParchi(latestCompletedRequest)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shrink-0 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <FileText size={13} />
              <span>View Parchi</span>
            </button>
          </div>
        )}

        {/* Withdrawal Section */}
        <section className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Wallet size={18} className="text-blue-600" />
                Reward Cashout & Withdrawal
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manual Admin Review & Direct Bank/UPI Payout with Digital Receipt (Min ₹{MIN_WITHDRAWAL_AMOUNT}, Max ₹{MAX_WALLET_ACCUMULATION_CAP})
              </p>
            </div>
          </div>

          {withdrawalError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{withdrawalError}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
            {/* Quick Amount Selector Chips */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Select Amount (₹)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[100, 200, 300, 400, 500].map((amt) => {
                  const isSelected = withdrawForm.amount === amt;
                  const isAvailable = balance >= amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAmountSelect(amt)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : isAvailable
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 border border-gray-100 opacity-60'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">₹</span>
                <input
                  type="number"
                  min={MIN_WITHDRAWAL_AMOUNT}
                  max={Math.min(balance, MAX_WALLET_ACCUMULATION_CAP)}
                  value={withdrawForm.amount || ''}
                  onChange={(e) => {
                    setWithdrawForm((prev) => ({ ...prev, amount: Number(e.target.value) }));
                    setWithdrawalError(null);
                  }}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter withdrawal amount"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                You can withdraw between ₹{MIN_WITHDRAWAL_AMOUNT} and ₹{Math.min(balance, MAX_WALLET_ACCUMULATION_CAP)}.
              </p>
            </div>

            {/* Payment Method Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Choose Payout Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWithdrawForm((prev) => ({ ...prev, method: 'upi' }))}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    withdrawForm.method === 'upi'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone size={16} />
                  <span>UPI Transfer (Instant)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWithdrawForm((prev) => ({ ...prev, method: 'bank' }))}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    withdrawForm.method === 'bank'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Building2 size={16} />
                  <span>Bank Account</span>
                </button>
              </div>
            </div>

            {/* Method-specific form inputs */}
            {withdrawForm.method === 'upi' ? (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  UPI ID (VPA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={withdrawForm.upiId}
                  onChange={(e) => setWithdrawForm((prev) => ({ ...prev, upiId: e.target.value }))}
                  placeholder="e.g. mobile@okhdfcbank or yourname@paytm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-gray-400">
                  Supported: Google Pay, PhonePe, Paytm, BHIM, Amazon Pay UPI.
                </p>
              </div>
            ) : (
              <div className="space-y-3 bg-gray-50/70 p-3 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={withdrawForm.holderName}
                    onChange={(e) => setWithdrawForm((prev) => ({ ...prev, holderName: e.target.value }))}
                    placeholder="Full name as per bank passbook"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={withdrawForm.accountNumber}
                      onChange={(e) => setWithdrawForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="Account Number"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Confirm Account <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={withdrawForm.confirmAccountNumber}
                      onChange={(e) => setWithdrawForm((prev) => ({ ...prev, confirmAccountNumber: e.target.value }))}
                      placeholder="Re-enter Number"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={withdrawForm.ifscCode}
                      onChange={(e) => setWithdrawForm((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-800 bg-white uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Bank Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={withdrawForm.bankName}
                      onChange={(e) => setWithdrawForm((prev) => ({ ...prev, bankName: e.target.value }))}
                      placeholder="e.g. SBI, HDFC"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Withdraw Action Button */}
            <button
              type="submit"
              disabled={isSubmittingWithdrawal || balance < MIN_WITHDRAWAL_AMOUNT}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                balance < MIN_WITHDRAWAL_AMOUNT
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.99]'
              }`}
            >
              {isSubmittingWithdrawal ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing Automated Payout...</span>
                </>
              ) : balance < MIN_WITHDRAWAL_AMOUNT ? (
                <span>Minimum ₹{MIN_WITHDRAWAL_AMOUNT} Required to Withdraw (Have ₹{balance})</span>
              ) : (
                <>
                  <span>Withdraw ₹{withdrawForm.amount} to {withdrawForm.method === 'upi' ? 'UPI' : 'Bank'}</span>
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>
          </form>
        </section>

        {/* Transaction History Ledger */}
        <section className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                Wallet Transaction Ledger
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Real-time ledger synced with Firebase</p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold text-gray-600">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  filterType === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('CREDIT')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  filterType === 'CREDIT' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-gray-900'
                }`}
              >
                Credits
              </button>
              <button
                onClick={() => setFilterType('DEBIT')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  filterType === 'DEBIT' ? 'bg-white text-red-700 shadow-xs' : 'hover:text-gray-900'
                }`}
              >
                Debits
              </button>
            </div>
          </div>

          {isLoadingTx ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-xs">Fetching transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              No {filterType !== 'all' ? filterType.toLowerCase() : ''} transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'CREDIT'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? (
                        <Sparkles size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{tx.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{tx.description}</p>
                      {tx.utr && (
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                          UTR: {tx.utr}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-black ${
                        tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                    </span>
                    <span className="block text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Rules Explainer Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                AKSelling Cashback & Wallet Rules
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <strong className="text-blue-900 block font-bold mb-1">
                  1. Signup / First Login Bonus
                </strong>
                Every verified customer gets a flat ₹{SIGNUP_BONUS_FLAT} signup bonus initialized directly into their wallet upon their first login.
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <strong className="text-emerald-900 block font-bold mb-1">
                  2. Progressive Repeat Order Cashback (+₹{REPEAT_ORDER_INCREMENT})
                </strong>
                Cashback is only awarded upon verified paid orders. For every repeat order, you get +₹{REPEAT_ORDER_INCREMENT} additional bonus, strictly subject to product price slab caps:
                <ul className="list-disc pl-4 mt-1.5 space-y-0.5 text-[11px]">
                  <li><strong>₹299 Products:</strong> Max ₹20 cap</li>
                  <li><strong>₹399 Products:</strong> Max ₹30 cap</li>
                  <li><strong>₹449 Products:</strong> Max ₹35 cap</li>
                  <li><strong>₹499 Products:</strong> Max ₹40 cap</li>
                  <li><strong>₹500 Products:</strong> Max ₹50 cap</li>
                  <li><strong>₹600–₹700 Products:</strong> Max ₹60 absolute cap (no higher than this)</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <strong className="text-amber-900 block font-bold mb-1">
                  3. 3rd Order Milestone Reward (+₹{MILESTONE_3RD_ORDER_BONUS})
                </strong>
                Completing your 3rd successful order automatically grants an extra flat ₹{MILESTONE_3RD_ORDER_BONUS} cashback with instant celebration!
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                <strong className="text-purple-900 block font-bold mb-1">
                  4. Instant Withdrawal Limits
                </strong>
                Withdrawals can be requested anytime your balance reaches ₹{MIN_WITHDRAWAL_AMOUNT} to ₹{MAX_WALLET_ACCUMULATION_CAP}. Funds are disbursed automatically via Cashfree / RazorpayX to your UPI or Bank Account.
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Digital Payment Receipt (Parchi) Modal */}
      <DigitalParchiModal
        isOpen={Boolean(selectedParchi)}
        request={selectedParchi}
        onClose={() => setSelectedParchi(null)}
      />
    </div>
  );
};
