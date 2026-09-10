import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  ChevronLeft,
  Loader2,
  ShieldCheck,
  X,
  CheckCircle2,
  RotateCcw,
  Mail,
  Lock,
  Zap,
  Phone,
  User,
} from 'lucide-react';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { useAuth } from '@/auth-context';
import { setupRecaptcha } from '@/firebase';

interface AuthPageProps {
  onClose?: () => void;
  onSuccess: () => void;
  isStrictGate?: boolean;
}

export default function AuthPage({ onClose, onSuccess, isStrictGate = false }: AuthPageProps) {
  const {
    sendPhoneOTP,
    confirmPhoneOTP,
    signInWithGoogle,
  } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const getOrCreateRecaptcha = (): RecaptchaVerifier => {
    const verifier = setupRecaptcha('firebase-auth-recaptcha-container', 'invisible');
    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanedDigits = phone.replace(/\D/g, '');
    if (cleanedDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const fullPhone = '+91' + cleanedDigits.slice(-10);

    setIsSendingOtp(true);
    try {
      const appVerifier = getOrCreateRecaptcha();
      const res = await sendPhoneOTP(fullPhone, appVerifier);
      if (res.error) {
        setError(res.error);
        setIsSendingOtp(false);
        return;
      }
      if (res.confirmationResult) {
        setConfirmationResult(res.confirmationResult);
      }
      setStep('otp');
      setCountdown(60);
      setCanResend(false);
      setOtp('');
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || 'Failed to send SMS OTP. Please check your connection or Firebase settings.';
      setError(errMsg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    const cleanedDigits = phone.replace(/\D/g, '');
    const fullPhone = '+91' + cleanedDigits.slice(-10);

    setIsSendingOtp(true);
    try {
      const appVerifier = getOrCreateRecaptcha();
      const res = await sendPhoneOTP(fullPhone, appVerifier);
      if (res.error) {
        setError(res.error);
      } else {
        setCountdown(60);
        setCanResend(false);
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to resend OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (otp.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    const fullPhone = '+91' + phone.replace(/\D/g, '').slice(-10);

    try {
      if (!confirmationResult) {
        setError('Verification session expired. Please request a new OTP code.');
        setIsVerifyingOtp(false);
        return;
      }

      const { error: verifyError } = await confirmPhoneOTP(
        confirmationResult,
        otp,
        fullPhone,
        name.trim()
      );
      if (verifyError) {
        setError(verifyError);
        setIsVerifyingOtp(false);
        return;
      }
      setIsVerifyingOtp(false);
      onSuccess();
    } catch (err: unknown) {
      setIsVerifyingOtp(false);
      setError((err as Error)?.message || 'Invalid OTP code. Please enter the correct code.');
    }
  };

  const handleGoogle = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const { error: googleError } = await signInWithGoogle(false);
      setIsGoogleLoading(false);
      if (googleError) {
        setError(googleError);
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      setIsGoogleLoading(false);
      setError((err as Error)?.message || 'Google Sign-In failed. Please try again or check Firebase settings.');
    }
  };

  const isAnyLoading = isGoogleLoading || isSendingOtp || isVerifyingOtp;

  return (
    <div
      className={`bg-white flex flex-col ${
        isStrictGate
          ? 'min-h-screen'
          : 'fixed inset-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[480px] sm:w-full z-[80] sm:shadow-2xl sm:border-x sm:border-gray-200 animate-slide-up'
      }`}
    >
      {/* Invisible container for Firebase Phone Auth Recaptcha */}
      <div id="firebase-auth-recaptcha-container" />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white sticky top-0 z-10">
        {step === 'otp' ? (
          <button
            onClick={() => setStep('phone')}
            className="p-1.5 -ml-1 text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
        ) : !isStrictGate && onClose ? (
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2874f0]">
            <Lock size={14} />
            <span>AKSelling Security</span>
          </div>
        )}

        <h1 className="text-base font-bold text-gray-800">
          {step === 'phone' ? 'Login or Sign Up' : 'Verify Mobile OTP'}
        </h1>

        {!isStrictGate && onClose ? (
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 text-gray-400 hover:bg-gray-100 rounded-full cursor-pointer"
          >
            <X size={20} />
          </button>
        ) : (
          <div className="w-6" />
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-md mx-auto w-full flex flex-col justify-between">
        <div>
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2874f0] to-blue-600 shadow-md shadow-blue-500/20 flex items-center justify-center mb-3">
              <span className="text-2xl font-black text-white tracking-wider">AK</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Welcome to AKSelling</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              {step === 'phone'
                ? 'Get instant access to your orders, cart, seller dashboard, and live Shiprocket tracking.'
                : `Enter the 6-digit OTP code sent to +91 ${phone}`}
            </p>
          </div>

          {/* Error Notice if any */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4 flex items-center gap-2">
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {step === 'phone' ? (
            <div className="space-y-4">
              {/* Phone Login Form */}
              <form onSubmit={handleSendOTP} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <User size={13} className="text-gray-500" />
                    <span>Your Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full text-xs font-medium text-gray-900 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2874f0]/20 focus:border-[#2874f0] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Phone size={13} className="text-gray-500" />
                    <span>Mobile Number</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700">
                      <span>🇮🇳 +91</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit mobile"
                      maxLength={10}
                      className="flex-1 text-sm font-semibold text-gray-900 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2874f0]/20 focus:border-[#2874f0] outline-none tracking-wide"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAnyLoading || phone.length < 10}
                  className="w-full bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending SMS OTP...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Continue with Mobile Number</span>
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-gray-200" />
                <span className="px-3 text-[11px] font-bold text-gray-400 uppercase">OR</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={isAnyLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs py-3 px-4 rounded-xl border border-gray-300 shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                {isGoogleLoading ? (
                  <Loader2 size={16} className="animate-spin text-[#2874f0]" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Continue with Google Account</span>
              </button>
            </div>
          ) : (
            /* OTP Verification Screen */
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-xs text-[#2874f0] font-bold hover:underline cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>

                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  autoFocus
                  disabled={isAnyLoading}
                  className="w-full text-center text-2xl font-bold tracking-[0.4em] py-3.5 border-2 border-gray-300 rounded-xl focus:border-[#2874f0] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-500">Didn&apos;t receive SMS?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isSendingOtp}
                    className="text-[#2874f0] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isSendingOtp ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                    <span>{isSendingOtp ? 'Sending...' : 'Resend OTP'}</span>
                  </button>
                ) : (
                  <span className="text-gray-400 font-mono">Resend in {countdown}s</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otp.length < 6}
                className="w-full bg-[#2874f0] hover:bg-[#1a65dc] text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying OTP &amp; Logging In...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify &amp; Enter AKSelling</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Bottom Trust & Support Badge */}
        <div className="mt-8 pt-4 border-t border-gray-100 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck size={15} className="text-emerald-600" />
            <span>100% Safe &amp; Secure Cloud Firestore Login</span>
          </div>
          <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
            <Mail size={12} className="text-gray-400" />
            <span>Official Seller Support: </span>
            <span className="font-semibold text-gray-600">support.akselling@gmail.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
