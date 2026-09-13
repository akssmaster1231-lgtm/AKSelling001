import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
  FileText,
  AlertCircle,
  Loader2,
  Search,
} from 'lucide-react';
import type { WithdrawalRequest } from '@/types/wallet';
import { subscribeAllWithdrawalRequests, settleWithdrawalRequest } from '@/utils/walletService';
import { DigitalParchiModal } from '@/components/DigitalParchiModal';

export const AdminWithdrawalManager: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settlement Confirmation Dialog
  const [settlingRequest, setSettlingRequest] = useState<WithdrawalRequest | null>(null);
  const [utrInput, setUtrInput] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [settleError, setSettleError] = useState<string | null>(null);

  // Digital Parchi Modal
  const [parchiRequest, setParchiRequest] = useState<WithdrawalRequest | null>(null);

  // Copy feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Subscribe to real-time withdrawal requests
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAllWithdrawalRequests((data) => {
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenSettle = (req: WithdrawalRequest) => {
    setSettlingRequest(req);
    // Generate an automatic default UTR format if admin doesn't type custom
    const defaultUtr = `UPI/2026/${Math.floor(10000000 + Math.random() * 90000000)}`;
    setUtrInput(defaultUtr);
    setAdminNotes('Manual cashout transfer completed by Admin');
    setSettleError(null);
  };

  const handleConfirmSettlement = async () => {
    if (!settlingRequest) return;
    setIsSettling(true);
    setSettleError(null);

    try {
      const finalUtr = utrInput.trim() || `MANUAL/SETTLED/${Date.now()}`;
      const result = await settleWithdrawalRequest(
        settlingRequest.id,
        settlingRequest.userId,
        settlingRequest.amount,
        finalUtr,
        adminNotes.trim()
      );

      // Create completed object with receipt for immediate Parchi display
      const completedReq: WithdrawalRequest = {
        ...settlingRequest,
        status: 'COMPLETED',
        utr: finalUtr,
        receiptNumber: result.receiptNumber,
        settledAt: Date.now(),
        adminNotes: adminNotes.trim(),
      };

      setSettlingRequest(null);
      // Automatically show generated digital receipt (Parchi)
      setParchiRequest(completedReq);
    } catch (err: unknown) {
      console.error('Settlement error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to settle request';
      setSettleError(msg);
    } finally {
      setIsSettling(false);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'PENDING'
        ? r.status === 'PROCESSING' || r.status === 'PENDING'
        : r.status === 'COMPLETED';

    if (!matchesFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.userName && r.userName.toLowerCase().includes(q)) ||
      (r.userPhone && r.userPhone.includes(q)) ||
      (r.payoutDetails.upiId && r.payoutDetails.upiId.toLowerCase().includes(q)) ||
      (r.payoutDetails.accountNumber && r.payoutDetails.accountNumber.includes(q)) ||
      (r.id && r.id.toLowerCase().includes(q))
    );
  });

  const pendingCount = requests.filter(
    (r) => r.status === 'PROCESSING' || r.status === 'PENDING'
  ).length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="space-y-4">
      {/* Summary KPI header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Pending Payouts
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Needs manual bank/UPI transfer</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Settled / Paid
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{completedCount}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Digital parchis issued</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Requests
            </span>
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-stone-800 mt-1">{requests.length}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Live Firestore queue</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex rounded-xl bg-stone-100 p-1 text-xs font-bold text-stone-600">
            <button
              type="button"
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filter === 'PENDING'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'hover:text-stone-900'
              }`}
            >
              <span>Pending Action</span>
              {pendingCount > 0 && (
                <span className="bg-amber-950 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'hover:text-stone-900'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'ALL'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'hover:text-stone-900'
              }`}
            >
              All Records ({requests.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, phone, UPI..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-stone-50"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-stone-200">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-stone-500">Loading payout queue...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-stone-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-stone-800">No Withdrawal Requests Found</h4>
          <p className="text-xs text-stone-400 mt-1">
            {filter === 'PENDING'
              ? 'All customer cashouts are settled! When a user requests withdrawal, it will appear here instantly.'
              : 'No records matching the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'PROCESSING' || req.status === 'PENDING';
            const dateStr = new Date(req.requestedAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
                  isPending ? 'border-amber-300 ring-1 ring-amber-300/60' : 'border-stone-200'
                }`}
              >
                {/* Header: Amount + Status Badge */}
                <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-stone-900">
                        ₹{req.amount}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {isPending ? (
                          <>
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>PROCESSING</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>COMPLETED</span>
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Requested on {dateStr} • Ref: <span className="font-mono">{req.id.slice(-6).toUpperCase()}</span>
                    </p>
                  </div>

                  {/* Top Action: View Parchi if completed */}
                  {!isPending && (
                    <button
                      type="button"
                      onClick={() => setParchiRequest(req)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl border border-stone-200 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>View Parchi</span>
                    </button>
                  )}
                </div>

                {/* Body: User Details & Destination Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 text-xs">
                  {/* Customer Info */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Customer Profile
                    </span>
                    <p className="font-bold text-stone-800">{req.userName || 'AKSelling Member'}</p>
                    {req.userPhone && (
                      <p className="text-stone-600 flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-stone-400" />
                        <span>+91 {req.userPhone}</span>
                      </p>
                    )}
                    {req.userEmail && (
                      <p className="text-stone-500 text-[11px] truncate">{req.userEmail}</p>
                    )}
                  </div>

                  {/* Payment Details (UPI ID / Bank Account) */}
                  <div className="space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                      <span>{req.method === 'upi' ? 'UPI Transfer Destination' : 'Bank Account Destination'}</span>
                      <span className="font-mono text-[9px] uppercase px-1 rounded bg-stone-200 text-stone-700">
                        {req.method}
                      </span>
                    </span>

                    {req.method === 'upi' ? (
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="font-mono font-bold text-stone-900 text-xs truncate">
                          {req.payoutDetails.upiId}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(req.payoutDetails.upiId || '', `upi_${req.id}`)}
                            className="p-1 rounded bg-white hover:bg-stone-200 text-stone-600 border border-stone-200 transition-colors"
                            title="Copy UPI ID"
                          >
                            {copiedText === `upi_${req.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <a
                            href={`upi://pay?pa=${encodeURIComponent(req.payoutDetails.upiId || '')}&pn=${encodeURIComponent(req.userName || 'Customer')}&am=${req.amount}&cu=INR`}
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                            title="Open UPI App"
                          >
                            <span>Pay App</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-stone-900">
                            A/C: {req.payoutDetails.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                `A/C: ${req.payoutDetails.accountNumber}\nIFSC: ${req.payoutDetails.ifscCode}\nName: ${req.payoutDetails.holderName}`,
                                `bank_${req.id}`
                              )
                            }
                            className="p-1 rounded bg-white hover:bg-stone-200 text-stone-600 border border-stone-200 transition-colors"
                            title="Copy Bank Details"
                          >
                            {copiedText === `bank_${req.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-stone-600 font-mono text-[10px]">
                          IFSC: {req.payoutDetails.ifscCode}
                        </p>
                        <p className="text-stone-600 truncate">
                          Name: {req.payoutDetails.holderName || req.userName} ({req.payoutDetails.bankName || 'Bank'})
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action: Continue / Send Button (Required User Workflow) */}
                {isPending && (
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-stone-500">
                      Transfer <strong className="text-stone-800">₹{req.amount}</strong> via external UPI/banking, then click:
                    </p>
                    <button
                      type="button"
                      id={`continue-send-btn-${req.id}`}
                      onClick={() => handleOpenSettle(req)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Continue / Send</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {!isPending && req.receiptNumber && (
                  <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                    <span>Receipt No: <strong className="font-mono text-stone-700">{req.receiptNumber}</strong></span>
                    <span className="font-mono">UTR: {req.utr}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Settlement Modal (Admin confirms payout & generates Parchi) */}
      {settlingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Confirm Payout & Issue Parchi</h3>
                  <p className="text-[11px] text-stone-500">Manual Cashout Settlement Workflow</p>
                </div>
              </div>
              <span className="text-xl font-black text-emerald-700">
                ₹{settlingRequest.amount}
              </span>
            </div>

            {/* Recipient summary */}
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs space-y-1">
              <p className="text-stone-700">
                <span className="font-semibold text-stone-500">Pay to: </span>
                <strong className="text-stone-900">{settlingRequest.userName}</strong> (+91 {settlingRequest.userPhone})
              </p>
              <p className="text-stone-700 font-mono text-[11px]">
                <span className="font-semibold text-stone-500">Destination: </span>
                {settlingRequest.method === 'upi'
                  ? `UPI: ${settlingRequest.payoutDetails.upiId}`
                  : `Bank A/C: ${settlingRequest.payoutDetails.accountNumber} (${settlingRequest.payoutDetails.ifscCode})`}
              </p>
            </div>

            {/* Input UTR Number & Remarks */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Bank / UPI Transaction Reference (UTR)
                </label>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. UPI/2026/89341209"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Enter UTR from your PhonePe/GPay/Banking app or keep the generated reference.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Admin Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Disbursed via SBI UPI to customer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Wallet impact notification */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight">
                  Clicking <strong>Confirm Payout</strong> will mark this request as completed, reset the customer&apos;s wallet balance back to <strong>₹0.00</strong>, and immediately generate the official digital payment receipt (Parchi).
                </p>
              </div>

              {settleError && (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-xl">
                  {settleError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={isSettling}
                onClick={() => setSettlingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSettling}
                onClick={handleConfirmSettlement}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isSettling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Issuing Parchi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Payout & Issue Parchi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Parchi (Receipt) Modal */}
      <DigitalParchiModal
        isOpen={Boolean(parchiRequest)}
        request={parchiRequest}
        onClose={() => setParchiRequest(null)}
      />
    </div>
  );
};
