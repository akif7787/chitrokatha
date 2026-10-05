import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, ArrowLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface OtpVerificationViewProps {
  email: string;
  purpose: 'signup' | 'login';
  onVerify: (otp: string) => Promise<{ success: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
  cooldownSeconds?: number;
}

export const OtpVerificationView: React.FC<OtpVerificationViewProps> = ({
  email,
  purpose,
  onVerify,
  onResend,
  onBack,
  cooldownSeconds = 60
}) => {
  const { language } = useLanguage();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(cooldownSeconds);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto focus first box
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    setErrorMsg(null);
    const cleaned = value.replace(/\D/g, '');

    // Single digit input
    if (cleaned.length <= 1) {
      const nextDigits = [...digits];
      nextDigits[index] = cleaned;
      setDigits(nextDigits);

      if (cleaned && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // If full 6 digits filled, trigger auto-submit
      if (cleaned && index === 5 && nextDigits.every((d) => d !== '')) {
        handleCompleteSubmit(nextDigits.join(''));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setDigits(nextDigits);

    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === 6) {
      handleCompleteSubmit(pasted);
    }
  };

  const handleCompleteSubmit = async (code: string) => {
    if (code.length !== 6) {
      setErrorMsg(
        language === 'bn'
          ? 'দয়া করে ৬ সংখ্যার সম্পূর্ণ ওটিপি কোডটি লিখুন।'
          : 'Please enter the complete 6-digit OTP code.'
      );
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const res = await onVerify(code);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendClick = async () => {
    if (timeLeft > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await onResend();
      if (res.success) {
        setTimeLeft(60);
        setSuccessMsg(
          language === 'bn'
            ? 'নতুন ভেরিফিকেশন কোড পাঠানো হয়েছে।'
            : 'A fresh verification code has been dispatched.'
        );
        // Clear digits and focus first
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
      {/* Icon & Heading */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-rose-950/40">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white font-cinzel uppercase tracking-wider">
          {purpose === 'signup'
            ? language === 'bn'
              ? 'ইমেইল যাচাই করুন'
              : 'VERIFY YOUR EMAIL'
            : language === 'bn'
            ? 'লগইন যাচাইকরণ'
            : 'TWO-STEP LOGIN VERIFICATION'}
        </h3>
        <p className="text-xs text-zinc-400">
          {language === 'bn'
            ? 'আমরা ৬ সংখ্যার একটি ভেরিফিকেশন কোড পাঠিয়েছি:'
            : 'We sent a 6-digit verification code to:'}
        </p>
        <p className="text-xs text-zinc-200 font-semibold flex items-center justify-center gap-1.5 flex-wrap">
          <Mail className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-rose-300 font-mono tracking-wide">{email}</span>
        </p>
      </div>

      {/* Error / Success Feedback */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium">
          {successMsg}
        </div>
      )}

      {/* 6-Digit OTP Input Boxes */}
      <div className="flex justify-center items-center gap-2 sm:gap-2.5 my-3">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            disabled={isVerifying}
            className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl bg-black/60 border transition-all duration-150 focus:outline-none ${
              digit
                ? 'border-rose-500 text-white shadow-md shadow-rose-950/30'
                : 'border-white/10 text-zinc-400 focus:border-amber-400'
            }`}
          />
        ))}
      </div>

      {/* Primary Verification Action */}
      <button
        type="button"
        onClick={() => handleCompleteSubmit(digits.join(''))}
        disabled={isVerifying || digits.some((d) => !d)}
        className="w-full py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying Code...'}</span>
          </>
        ) : (
          <span>{language === 'bn' ? 'যাচাই করুন (Verify)' : 'Verify'}</span>
        )}
      </button>

      {/* Resend Cooldown & Change Email */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onBack}
          disabled={isVerifying}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'ইমেইল পরিবর্তন করুন' : 'Change Email'}</span>
        </button>

        <button
          type="button"
          onClick={handleResendClick}
          disabled={timeLeft > 0 || isResending || isVerifying}
          className={`flex items-center gap-1.5 transition-colors font-medium ${
            timeLeft > 0
              ? 'text-zinc-500 cursor-not-allowed'
              : 'text-amber-400 hover:text-amber-300 cursor-pointer'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          {timeLeft > 0 ? (
            <span>
              {language === 'bn' ? `পুনরায় পাঠান (${timeLeft}s)` : `Resend in ${timeLeft}s`}
            </span>
          ) : (
            <span>{language === 'bn' ? 'কোড পুনরায় পাঠান' : 'Resend Code'}</span>
          )}
        </button>
      </div>
    </div>
  );
};
