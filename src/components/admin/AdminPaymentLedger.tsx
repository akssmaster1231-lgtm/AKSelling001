import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Eye,
  X,
  CreditCard,
  QrCode,
  Phone,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { subscribeToPaymentLedger, updatePaymentStatusInFirestore } from '@/firebase';
import type { PaymentLedgerEntry } from '@/types';

export function AdminPaymentLedger() {
  const [ledgerEntries, setLedgerEntries] = useState<PaymentLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'direct_upi' | 'card'>('all');
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<PaymentLedgerEntry | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToPaymentLedger((entries) => {
      setLedgerEntries(entries);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedUtr(id);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await updatePaymentStatusInFirestore(id, newStatus);
      setLedgerEntries(prev => prev.map(e => e.id === id || e.orderId === id ? { ...e, status: newStatus } : e));
    } catch (err) {
      console.warn('Failed to update payment status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered entries
  const filteredEntries = ledgerEntries.filter(entry => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || (
      entry.customerName?.toLowerCase().includes(q) ||
      entry.customerPhone?.includes(q) ||
      entry.orderId?.toLowerCase().includes(q) ||
      entry.utrNumber?.toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;

    if (statusFilter === 'verified') return entry.status === 'verified';
    if (statusFilter === 'pending') return entry.status === 'pending';
    if (statusFilter === 'direct_upi') return entry.paymentMethod?.toLowerCase().includes('upi') || entry.paymentMode?.toLowerCase().includes('upi');
    if (statusFilter === 'card') return entry.paymentMethod?.toLowerCase().includes('card') || entry.paymentMode?.toLowerCase().includes('card');

    return true;
  });

  // Analytics Stats
  const totalVolume = ledgerEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const verifiedCount = ledgerEntries.filter(e => e.status === 'verified').length;
  const pendingCount = ledgerEntries.filter(e => e.status !== 'verified').length;

  const handleExportCsv = () => {
    if (ledgerEntries.length === 0) return;
    const headers = ['Order ID', 'UTR / Ref', 'Customer Name', 'Phone', 'Amount (INR)', 'Payment Mode', 'Status', 'Date Time', 'Screenshot URL'];
    const rows = ledgerEntries.map(e => [
      e.orderId,
      e.utrNumber,
      `"${e.customerName || ''}"`,
      `"${e.customerPhone || ''}"`,
      e.amount,
      `"${e.paymentMethod || e.paymentMode || ''}"`,
      e.status,
      `"${e.createdAt || ''}"`,
      `"${e.screenshotUrl || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `akselling_payments_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header & Overview Stats */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0a192f] to-slate-950 text-white rounded-2xl p-4 shadow-xl border border-amber-400/20">
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Payment & Order Ledger</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-400/40">
                  Real-time Live Sync
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Live audit radar for 12-digit UTRs, Direct UPI, & Card transactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={ledgerEntries.length === 0}
              className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-white/15"
              title="Download CSV Spreadsheet"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Volume</span>
            <div className="text-base sm:text-lg font-black text-amber-400 flex items-baseline gap-0.5">
              <span>₹</span>
              <span>{totalVolume.toLocaleString('en-IN')}</span>
            </div>
            <span className="text-[9px] text-slate-400">{ledgerEntries.length} transactions</span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Verified</span>
            <div className="text-base sm:text-lg font-black text-emerald-400">
              {verifiedCount}
            </div>
            <span className="text-[9px] text-emerald-300">100% Confirmed</span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Under Audit</span>
            <div className="text-base sm:text-lg font-black text-yellow-400">
              {pendingCount}
            </div>
            <span className="text-[9px] text-yellow-300">Needs review</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Strip */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-gray-200 space-y-2.5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, order ID, or UTR..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-amber-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({ledgerEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
              statusFilter === 'verified'
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('direct_upi')}
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
              statusFilter === 'direct_upi'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Direct UPI
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('card')}
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
              statusFilter === 'card'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Debit / Credit Card
          </button>
        </div>
      </div>

      {/* Ledger Entries List */}
      <div className="space-y-3">
        {loading && ledgerEntries.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
            <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-bold">Synchronizing real-time payment ledger...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
            <ShieldCheck size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-600">No payment records matching your filter.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Incoming customer orders and UTRs will populate automatically.</p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isVerified = entry.status === 'verified';
            const isCard = entry.paymentMethod?.toLowerCase().includes('card') || entry.paymentMode?.toLowerCase().includes('card');
            const cleanPhone = (entry.customerPhone || '').replace(/\D/g, '').slice(-10);

            return (
              <div
                key={entry.id || entry.orderId}
                className={`bg-white rounded-2xl p-4 shadow-card border transition-all ${
                  isVerified ? 'border-gray-200 hover:border-emerald-300' : 'border-amber-300 bg-amber-50/20'
                }`}
              >
                {/* Top Row: Customer & Order ID */}
                <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-black text-gray-900">{entry.customerName || 'Customer'}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                        {entry.orderId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                      {cleanPhone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-emerald-600" />
                          <a href={`tel:+91${cleanPhone}`} className="text-blue-600 hover:underline font-bold">
                            +91 {cleanPhone}
                          </a>
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(entry.customerName || '')},%20regarding%20your%20order%20${entry.orderId}%20on%20AKSelling`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                          >
                            WhatsApp
                          </a>
                        </div>
                      ) : (
                        <span>Phone: Not Provided</span>
                      )}
                    </div>
                  </div>

                  {/* Amount Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-xs text-gray-400 block font-medium">Amount Paid</span>
                    <span className="text-base font-black text-emerald-700">₹{entry.amount}</span>
                  </div>
                </div>

                {/* Middle Row: UTR Verification & Payment Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                      {isCard ? 'Card Reference Ref' : '12-Digit UTR Number'}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {entry.utrNumber || 'N/A'}
                      </span>
                      {entry.utrNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy(entry.utrNumber, entry.id)}
                          className="p-1 text-gray-500 hover:text-slate-900 bg-white rounded border border-gray-200 cursor-pointer"
                          title="Copy UTR"
                        >
                          {copiedUtr === entry.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Payment Mode</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {isCard ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          <CreditCard size={12} /> Debit/Credit Card
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <QrCode size={12} /> Direct UPI (ANOJKUMAR)
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-medium">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Actions, Receipt Screenshot & Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 size={13} /> Verified & Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <Clock size={13} /> Under Audit Review
                      </span>
                    )}

                    {/* Screenshot Preview Button */}
                    {entry.screenshotUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReceiptUrl(entry.screenshotUrl || null);
                          setSelectedEntry(entry);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-blue-200"
                      >
                        <Eye size={12} />
                        <span>View Receipt</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Action Toggle */}
                  <div className="flex items-center gap-1.5">
                    {isVerified ? (
                      <button
                        type="button"
                        disabled={updatingId === entry.id}
                        onClick={() => handleStatusChange(entry.id, 'pending')}
                        className="text-[11px] text-slate-500 hover:text-slate-700 font-bold px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        Mark Unverified
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={updatingId === entry.id}
                        onClick={() => handleStatusChange(entry.id, 'verified')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        {updatingId === entry.id ? 'Updating...' : 'Approve & Verify'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full-Screen Receipt Screenshot Modal */}
      {selectedReceiptUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setSelectedReceiptUrl(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black flex items-center gap-1.5 text-white">
                  <span>Customer Payment Screenshot</span>
                  {selectedEntry && (
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded font-mono">
                      {selectedEntry.orderId}
                    </span>
                  )}
                </h3>
                {selectedEntry && (
                  <p className="text-[11px] text-slate-300">
                    {selectedEntry.customerName} • ₹{selectedEntry.amount} • UTR: {selectedEntry.utrNumber}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptUrl(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 overflow-y-auto flex items-center justify-center bg-slate-950 min-h-[300px]">
              <img
                src={selectedReceiptUrl}
                alt="Payment Receipt Screenshot"
                className="max-h-[65vh] object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <a
                href={selectedReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink size={13} />
                <span>Open original image</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedReceiptUrl(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-1.5 rounded-xl cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminPaymentLedger;
