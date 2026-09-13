import React from 'react';
import { Printer, CheckCircle2, X, Building2, Smartphone, ShieldCheck, ArrowDownCircle } from 'lucide-react';
import type { WithdrawalRequest } from '@/types/wallet';

interface DigitalParchiModalProps {
  isOpen: boolean;
  request: WithdrawalRequest | null;
  onClose: () => void;
}

function numberToWordsINR(amount: number): string {
  const num = Math.round(amount);
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees Only';
  if (num < 20) return `${a[num]} Rupees Only`;
  if (num < 100) return `${b[Math.floor(num / 10)]} ${a[num % 10]} Rupees Only`.trim();
  if (num < 1000) {
    const rem = num % 100;
    const remStr = rem > 0 ? (rem < 20 ? ` and ${a[rem]}` : ` and ${b[Math.floor(rem / 10)]} ${a[rem % 10]}`) : '';
    return `${a[Math.floor(num / 100)]} Hundred${remStr} Rupees Only`.trim();
  }
  return `${num} Rupees Only`;
}

export const DigitalParchiModal: React.FC<DigitalParchiModalProps> = ({
  isOpen,
  request,
  onClose,
}) => {
  if (!isOpen || !request) return null;

  const parchiNumber = request.receiptNumber || `PARCHI-AK-2026-${request.id.slice(-6).toUpperCase()}`;
  const dateFormatted = request.settledAt
    ? new Date(request.settledAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="akselling-parchi-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="akselling-parchi-container"
        className="w-full max-w-lg bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 overflow-hidden relative my-6"
      >
        {/* Top Action Bar (hidden on print) */}
        <div className="bg-stone-900 text-stone-100 px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider uppercase text-amber-300">
              Official Payment Voucher (पर्ची)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Parchi Document */}
        <div id="parchi-printable-content" className="p-6 sm:p-8 space-y-5 bg-[#FCFAF6]">
          {/* Header */}
          <div className="border-b-2 border-dashed border-stone-300 pb-4 text-center relative">
            <div className="inline-block bg-amber-500 text-stone-950 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
              AKSelling Official Cashout Slip
            </div>
            <h1 className="text-2xl font-black tracking-tight text-stone-900">
              AKSELLING E-COMMERCE
            </h1>
            <p className="text-xs text-stone-600 font-medium">
              Rewards Payout & Manual Cash Disbursement Division
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Ref: NPCI / UPI Manual Settlement Protocol
            </p>

            {/* Parchi Number & Date */}
            <div className="mt-3 pt-3 border-t border-stone-200 flex flex-wrap justify-between items-center text-xs text-stone-600">
              <div>
                <span className="font-semibold text-stone-700">Receipt No: </span>
                <span className="font-mono font-bold text-stone-900">{parchiNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-stone-700">Disbursed On: </span>
                <span className="font-medium text-stone-800">{dateFormatted}</span>
              </div>
            </div>
          </div>

          {/* Recipient & Account Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-stone-200">
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Beneficiary Name</p>
              <p className="text-sm font-bold text-stone-900 mt-0.5">{request.userName || 'AKSelling Member'}</p>
              {request.userPhone && (
                <p className="text-stone-600 flex items-center gap-1 mt-0.5">
                  <Smartphone className="w-3 h-3 text-stone-400" />
                  <span>+91 {request.userPhone}</span>
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Disbursement Channel</p>
              <p className="text-sm font-bold text-stone-900 mt-0.5 uppercase flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>{request.method === 'upi' ? 'UPI Transfer' : 'Direct Bank NEFT/IMPS'}</span>
              </p>
              <p className="text-stone-700 font-mono text-[11px] mt-0.5">
                {request.method === 'upi'
                  ? `VPA: ${request.payoutDetails.upiId}`
                  : `A/C: ${request.payoutDetails.accountNumber} (${request.payoutDetails.ifscCode})`}
              </p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border-2 border-amber-500/30 rounded-2xl p-4 text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
              <span>Net Amount Disbursed</span>
            </div>
            <div className="text-4xl font-black text-emerald-800 tracking-tight">
              ₹{Number(request.amount).toFixed(2)}
            </div>
            <p className="text-xs font-semibold text-stone-700 mt-1 italic">
              ({numberToWordsINR(request.amount)})
            </p>
          </div>

          {/* UTR & Transaction References */}
          <div className="space-y-1.5 text-xs text-stone-700 border-t border-stone-200 pt-3">
            <div className="flex justify-between items-center py-1 border-b border-stone-100">
              <span className="font-semibold text-stone-600">Bank / UPI UTR Ref:</span>
              <span className="font-mono font-bold text-stone-900">{request.utr || 'UPI/2026/SETTLED'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-stone-100">
              <span className="font-semibold text-stone-600">Request ID:</span>
              <span className="font-mono text-stone-700">{request.id}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-stone-100">
              <span className="font-semibold text-stone-600">Wallet Impact:</span>
              <span className="font-bold text-emerald-700">Wallet Balance Reset to ₹0.00</span>
            </div>
            {request.adminNotes && (
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-stone-600">Admin Remarks:</span>
                <span className="text-stone-700 italic">{request.adminNotes}</span>
              </div>
            )}
          </div>

          {/* Official Verification Seal & Sign-off */}
          <div className="border-t-2 border-dashed border-stone-300 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <span>PAYMENT SETTLED</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </p>
                <p className="text-[10px] text-stone-500">Verified by Admin Finance Desk</p>
              </div>
            </div>

            <div className="text-right text-xs">
              <p className="font-bold text-stone-800 text-[11px]">AKSelling Disbursement Team</p>
              <p className="text-[10px] text-stone-500 italic">Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Bottom OK button (hidden on print) */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-stone-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm cursor-pointer"
          >
            OK / Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
