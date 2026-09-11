import React from 'react';
import { Lock, ShieldAlert, Mail, ArrowRight, X, UserCheck } from 'lucide-react';
import { WHITELISTED_SELLER_EMAIL, OFFICIAL_SUPPORT_EMAIL } from '@/utils/sellerWhitelist';

interface SellerLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
  onLoginPrompt?: () => void;
  onSwitchAccount?: () => void;
}

export default function SellerLockedModal({
  isOpen,
  onClose,
  currentUserEmail,
  onLoginPrompt,
  onSwitchAccount,
}: SellerLockedModalProps) {
  if (!isOpen) return null;

  const hasEmail = Boolean(currentUserEmail && currentUserEmail.trim());

  return (
    <div
      id="seller-locked-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="seller-locked-modal"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative animate-scale-up"
      >
        {/* Close Button */}
        <button
          id="seller-locked-close-btn"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Icon & Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Lock size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
              <ShieldAlert size={11} /> Invite-Only Onboarding
            </span>
            <h3 className="text-base font-bold text-gray-900 mt-0.5 leading-snug">
              Public Seller Registrations Temporarily Locked
            </h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
          <p>
            Merchant onboarding and real KYC document verification are currently restricted to pre-authorized partners.
            Public sign-ups are paused to ensure quality compliance and logistics capacity.
          </p>

          {hasEmail ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-left">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Current Logged-in Account
              </span>
              <div className="flex items-center justify-between text-gray-900 font-medium">
                <span className="truncate">{currentUserEmail}</span>
                <span className="text-rose-600 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0 ml-2">
                  Not Whitelisted
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 text-[11px]">
              <div className="flex items-start gap-2">
                <UserCheck size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Please sign in with the authorized owner email (
                  <strong className="font-semibold text-blue-950">{WHITELISTED_SELLER_EMAIL}</strong>) to access registration and KYC verification.
                </span>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-slate-600 flex items-center gap-2">
            <Mail size={14} className="text-slate-400 shrink-0" />
            <p className="text-[11px]">
              For onboarding inquiries or partnership access, contact vendor support at{' '}
              <a
                href={`mailto:${OFFICIAL_SUPPORT_EMAIL}`}
                className="font-bold text-flipkart-600 hover:underline"
              >
                {OFFICIAL_SUPPORT_EMAIL}
              </a>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          {!hasEmail && onLoginPrompt && (
            <button
              id="seller-locked-login-btn"
              type="button"
              onClick={() => {
                onClose();
                onLoginPrompt();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Sign In with Whitelisted Email</span>
              <ArrowRight size={14} />
            </button>
          )}

          {hasEmail && onSwitchAccount && (
            <button
              id="seller-locked-switch-btn"
              type="button"
              onClick={() => {
                onClose();
                onSwitchAccount();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Switch to Whitelisted Account</span>
              <ArrowRight size={14} />
            </button>
          )}

          <button
            id="seller-locked-dismiss-btn"
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer text-center"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
