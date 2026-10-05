import React from 'react';
import { X, Printer, Download, ShieldCheck, MapPin, Phone, Mail, FileText } from 'lucide-react';
import type { FirestoreOrder } from '@/firebase';
import { formatPrice } from '@/data';

interface OrderInvoiceModalProps {
  order: FirestoreOrder;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderInvoiceModal({ order, isOpen, onClose }: OrderInvoiceModalProps) {
  if (!isOpen) return null;

  const invoiceNumber = `INV-${(order.id || '').replace(/^ORD-/, '').toUpperCase()}`;
  const invoiceDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const items = Array.isArray(order.items) ? order.items : [];
  const isCod = (order.payment_method || '').toLowerCase().includes('cod') ||
                (order.payment_status || '').toLowerCase().includes('partially') ||
                (order.payment_status || '').toLowerCase().includes('10%');

  const advancePaid = typeof order.advance_paid === 'number'
    ? order.advance_paid
    : (isCod ? Math.max(1, Math.round(order.total_amount * 0.10)) : order.total_amount);

  const balanceDue = typeof order.balance_due === 'number'
    ? order.balance_due
    : (isCod ? Math.max(0, order.total_amount - advancePaid) : 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-amber-400" />
            <span className="font-bold text-sm">Tax Invoice: {invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div id="akselling-printable-invoice" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-[#1b365d]">AKSelling</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                  Official Store
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Garment & Apparel Direct Factory Hub</p>
              <p className="text-[11px] text-slate-500">Indore Textile Industrial Cluster, Madhya Pradesh - 452001</p>
              <p className="text-[11px] text-slate-500 font-mono">GSTIN: 23AABCA9842F1Z6 • HSN: 6109 (Apparel)</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block bg-slate-100 text-slate-800 text-[11px] font-black uppercase px-3 py-1 rounded-full border border-slate-200">
                GST Tax Invoice
              </span>
              <div className="mt-2 space-y-0.5 text-xs">
                <p><span className="text-slate-400">Invoice No:</span> <strong className="font-mono text-slate-900">{invoiceNumber}</strong></p>
                <p><span className="text-slate-400">Order ID:</span> <strong className="font-mono text-slate-900">{order.id}</strong></p>
                <p><span className="text-slate-400">Date:</span> <strong>{invoiceDate}</strong></p>
              </div>
            </div>
          </div>

          {/* Billing & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-1">Customer / Billed To:</p>
              <p className="text-sm font-bold text-slate-900">{order.customer_name || 'Customer'}</p>
              <p className="text-slate-600 mt-0.5 flex items-start gap-1">
                <MapPin size={12} className="text-red-500 shrink-0 mt-0.5" />
                <span>{order.customer_address}</span>
              </p>
              <p className="text-slate-600 mt-1 flex items-center gap-1">
                <Phone size={12} className="text-slate-400 shrink-0" />
                <span>+91 {order.customer_phone}</span>
              </p>
              {order.customer_email && (
                <p className="text-slate-600 flex items-center gap-1">
                  <Mail size={12} className="text-slate-400 shrink-0" />
                  <span>{order.customer_email}</span>
                </p>
              )}
            </div>

            <div>
              <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-1">Payment & Logistics:</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-semibold text-slate-800">{order.payment_method || (isCod ? 'Cash on Delivery' : 'Direct UPI')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isCod
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {isCod ? 'COD (10% Paid)' : 'Paid (Verified Direct UPI)'}
                  </span>
                </div>
                {order.upi_utr && (
                  <p className="text-[11px] font-mono text-slate-600">
                    UPI UTR: <strong className="text-slate-900">{order.upi_utr}</strong>
                  </p>
                )}
                {order.awb_code && (
                  <p className="text-[11px] font-mono text-slate-600">
                    Courier AWB: <strong className="text-slate-900">{order.awb_code}</strong> ({order.courier_name || 'Express Logistics'})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-2 text-center">HSN</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const lineTotal = (item.price || 0) * (item.quantity || 1);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{item.product_title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.size ? `Size: ${item.size}` : ''}
                          {item.color ? ` • Color: ${item.color}` : ''}
                          {item.fabric ? ` • ${item.fabric}` : ''}
                        </p>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-500">6109</td>
                      <td className="py-3 px-2 text-center font-bold text-slate-800">{item.quantity || 1}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">{formatPrice(item.price)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{formatPrice(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Amount Breakdown & COD Calculation */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="space-y-1.5 text-xs text-slate-500 max-w-sm">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                <ShieldCheck size={14} />
                <span>GST Tax compliant computer-generated invoice. No physical signature required.</span>
              </div>
              <p className="text-[11px]">
                7-Day Hassle-Free Returns & Exchange valid on all orders from date of delivery.
              </p>
              <p className="text-[10px] text-slate-400">
                Support: support.akselling@gmail.com • WhatsApp Helpline Available
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (Integrated 5%):</span>
                <span>Included (₹{Math.round(order.total_amount * 0.05)})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee:</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>Total Invoice Value:</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>

              {isCod && (
                <div className="mt-2 pt-2 border-t border-dashed border-amber-300 bg-amber-50/80 -mx-1.5 p-2 rounded-xl space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-amber-900">
                    <span>10% Advance Paid (UPI):</span>
                    <span>₹{advancePaid} (Received)</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black text-amber-800">
                    <span>Balance Due on Cash Delivery:</span>
                    <span>₹{balanceDue} (Pay to Courier)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#1b365d] hover:bg-slate-900 text-amber-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer border border-amber-400/40"
          >
            <Download size={14} className="text-amber-400" />
            <span>Download / Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
