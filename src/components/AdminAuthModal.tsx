import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  LogOut,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import type { Language } from '../utils/i18n';
import {
  DEFAULT_ADMIN_PIN,
  getStoredAdminPin,
  setStoredAdminPin,
  verifyAdminPin,
} from '../utils/siteStore';

interface AdminAuthModalProps {
  open: boolean;
  lang: Language;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  onSignOut: () => void;
  onOpenCustomizer?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  open,
  lang,
  isAdmin,
  onClose,
  onSuccess,
  onSignOut,
  onOpenCustomizer,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State for changing PIN
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  if (!open) return null;

  const isEn = lang === 'en';

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pinInput.trim()) {
      setErrorMsg(isEn ? 'Please enter the admin PIN code.' : 'يرجى إدخال الرقم السري.');
      return;
    }

    const enteredPin = pinInput.trim();
    if (verifyAdminPin(enteredPin)) {
      setPinInput('');
      setErrorMsg(null);
      onSuccess(enteredPin);
    } else {
      setErrorMsg(
        isEn
          ? 'Incorrect PIN code. Default is 2030.'
          : 'الرقم السري غير صحيح. الرقم الافتراضي هو 2030.',
      );
    }
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.trim().length < 4) {
      setErrorMsg(
        isEn
          ? 'PIN must be at least 4 characters.'
          : 'يجب أن يتكون الرقم السري من 4 خانات على الأقل.',
      );
      return;
    }
    setStoredAdminPin(newPin);
    setNewPin('');
    setPinChangeSuccess(true);
    setTimeout(() => setPinChangeSuccess(false), 4000);
  };

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
              {isAdmin ? (
                <Unlock className="w-4 h-4 text-[#DFAF5A]" />
              ) : (
                <Lock className="w-4 h-4 text-[#DFAF5A]" />
              )}
            </div>
            <h2 id="admin-auth-title" className="text-lg font-bold text-[#F8F9FA]">
              {isEn ? 'Admin Passcode Access' : 'بوابة الإدارة بالرقم السري'}
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

          {pinChangeSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <Check className="w-4 h-4 shrink-0" />
              <span>
                {isEn ? 'PIN code updated successfully!' : 'تم تغيير الرقم السري بنجاح!'}
              </span>
            </div>
          )}

          {isAdmin ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-200">
                    {isEn ? 'Admin Mode is Active' : 'وضع الأدمن مفعّل بنجاح'}
                  </p>
                  <p className="text-emerald-200/80 mt-0.5">
                    {isEn
                      ? 'You can now add/edit licenses and edit contact information.'
                      : 'يمكنك الآن إضافة وتعديل التراخيص ومعلومات التواصل والشعار بحرية.'}
                  </p>
                </div>
              </div>

              {onOpenCustomizer && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCustomizer();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#DFAF5A] hover:bg-[#ECC578] text-[#0B0C10] px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>
                    {isEn
                      ? 'Edit Contact & Company Info'
                      : 'تعديل بيانات التواصل والشركة'}
                  </span>
                </button>
              )}

              {/* Toggle change PIN section */}
              <div className="pt-2 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => setChangePinOpen(!changePinOpen)}
                  className="text-xs text-[#DFAF5A] hover:underline font-medium cursor-pointer"
                >
                  {changePinOpen
                    ? isEn
                      ? 'Cancel changing PIN'
                      : 'إلغاء تغيير الرقم السري'
                    : isEn
                      ? 'Change Secret PIN Code'
                      : 'تغيير الرقم السري للإدارة'}
                </button>

                {changePinOpen && (
                  <form onSubmit={handleUpdatePin} className="mt-3 space-y-3">
                    <input
                      type="text"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder={isEn ? 'Enter new PIN (e.g. 2030)' : 'أدخل الرقم السري الجديد'}
                      className="w-full rounded-lg border border-white/14 bg-[#0D0E13] px-3.5 py-2 text-sm text-white focus:border-[#DFAF5A] focus:outline-none font-code text-center tracking-widest"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/16 text-white text-xs font-bold cursor-pointer"
                    >
                      {isEn ? 'Save New PIN' : 'حفظ الرقم السري الجديد'}
                    </button>
                  </form>
                )}
              </div>

              <button
                type="button"
                onClick={onSignOut}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/14 bg-[#0D0E13] hover:bg-white/6 px-4 py-2 text-xs font-semibold text-[#D1D5DB] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>{isEn ? 'Exit Admin Mode' : 'الخروج من وضع الأدمن'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <p className="text-xs sm:text-sm text-[#A9AFBE] leading-relaxed">
                {isEn
                  ? 'Enter the secret administrator PIN to unlock editing for licenses, phone, email, addresses, and social links.'
                  : 'أدخل الرقم السري للإدارة لتعديل التراخيص، أرقام الهواتف، البريد الإلكتروني، العناوين، وروابط التواصل الاجتماعي.'}
              </p>

              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-[#8E95A5]">
                  <Key className="w-4 h-4 text-[#DFAF5A]" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={
                    isEn
                      ? 'Enter PIN (Default: 2030)'
                      : 'أدخل الرقم السري (الافتراضي: 2030)'
                  }
                  className="w-full rounded-xl border border-white/14 bg-[#0D0E13] ps-10 pe-11 py-3 text-base text-white placeholder:text-[#6B7280] focus:border-[#DFAF5A] focus:outline-none font-code tracking-widest text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-[#8E95A5] hover:text-white cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#DFAF5A] hover:bg-[#ECC578] text-[#0B0C10] px-4 py-3 text-sm font-bold transition-colors cursor-pointer shadow-lg shadow-[#DFAF5A]/15"
              >
                <Unlock className="w-4 h-4" />
                <span>{isEn ? 'Unlock Admin Mode' : 'تأكيد ودخول وضع الأدمن'}</span>
              </button>

              <p className="text-[11px] text-center text-[#7E8597]">
                {isEn
                  ? 'Default secret PIN is 2030. You can change it anytime once signed in.'
                  : 'الرقم السري الافتراضي هو 2030 (ويمكنك تغييره لأي رقم آخر بعد الدخول).'}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
