import React from 'react';
import { ShieldCheck, Lock, LogIn, LogOut, X, AlertCircle } from 'lucide-react';
import type { Language } from '../utils/i18n';

interface AdminAuthModalProps {
  open: boolean;
  lang: Language;
  loading: boolean;
  userEmail: string | null;
  isAdmin: boolean;
  errorMsg: string | null;
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  open,
  lang,
  loading,
  userEmail,
  isAdmin,
  errorMsg,
  onClose,
  onSignIn,
  onSignOut,
}) => {
  if (!open) return null;

  const isEn = lang === 'en';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/12 bg-[#14161E] p-6 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#DFAF5A]/15 border border-[#DFAF5A]/35 flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#DFAF5A]" />
            </div>
            <h2 id="admin-auth-title" className="text-lg font-bold text-[#F8F9FA]">
              {isEn ? 'Admin Portal Sign-In' : 'بوابة وضع الأدمن'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'إغلاق'}
            className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/8 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3.5 text-xs text-rose-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isAdmin && userEmail ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-200">
                    {isEn ? 'Admin Mode Active' : 'وضع الأدمن مفعل'}
                  </p>
                  <p className="text-emerald-200/80 font-code mt-0.5" dir="ltr">
                    {userEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/14 bg-[#0D0E13] hover:bg-white/6 px-4 py-2.5 text-sm font-semibold text-[#F4F5F7] cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#DFAF5A]" />
                <span>{isEn ? 'Exit Admin Mode' : 'تسجيل الخروج من وضع الأدمن'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-[#A9AFBE] leading-relaxed">
                {isEn
                  ? 'Sign in with the authorized Google administrator account to manage licenses, contact details, social links, logo, and 3D assets.'
                  : 'سجّل الدخول بحساب الإدارة المعتمد (Google) للوصول إلى تعديل التراخيص، روابط التواصل الاجتماعي، الشعار، وملف العرض ثلاثي الأبعاد.'}
              </p>

              {userEmail && !isAdmin && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 space-y-2">
                  <p>
                    {isEn
                      ? `Signed in as ${userEmail}, which does not have administrator privileges.`
                      : `تم تسجيل الدخول بالحساب (${userEmail}) وهو لا يملك صلاحيات الأدمن.`}
                  </p>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="text-[#DFAF5A] underline font-semibold cursor-pointer"
                  >
                    {isEn ? 'Sign out & switch account' : 'تسجيل الخروج وتبديل الحساب'}
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={onSignIn}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#DFAF5A] hover:bg-[#ECC578] disabled:opacity-60 text-[#0B0C10] px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {loading
                    ? isEn
                      ? 'Verifying...'
                      : 'جاري التحقق...'
                    : isEn
                      ? 'Sign in with Google (Admin)'
                      : 'تسجيل الدخول بحساب Google (أدمن)'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
