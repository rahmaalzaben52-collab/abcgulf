import React, { useEffect, useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Globe,
} from 'lucide-react';
import {
  sanitizeExternalUrl,
  validateContactDraft,
  type CompanyProfile,
} from '../utils/siteStore';
import { UI_COPY, type Language } from '../utils/i18n';
import { StudioArt } from './StudioArt';
import { BrandLogoMark } from './Navbar';

interface ContactAndFooterProps {
  profile: CompanyProfile;
  lang: Language;
  isAdmin: boolean;
  prefilledSubject?: string;
  onOpenCustomizer: () => void;
  onOpenAdminAuth: () => void;
  onToggleLanguage: (lang: Language) => void;
}

export const ContactAndFooter: React.FC<ContactAndFooterProps> = ({
  profile,
  lang,
  isAdmin,
  prefilledSubject = '',
  onOpenCustomizer,
  onOpenAdminAuth,
  onToggleLanguage,
}) => {
  const t = UI_COPY[lang].contact;
  const f = UI_COPY[lang].footer;
  const DirectionalChevron = lang === 'en' ? ChevronRight : ChevronLeft;
  const displayName =
    lang === 'en'
      ? profile.nameEn
      : lang === 'ku'
        ? profile.nameKu || 'ئەی بی سی خەلیج بۆ بەرهەمهێنانی هونەری'
        : profile.nameAr;
  const displayLocation =
    lang === 'en'
      ? profile.contact.locationEn
      : lang === 'ku'
        ? profile.contact.locationKu || profile.contact.locationAr
        : profile.contact.locationAr;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(prefilledSubject);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedData, setSubmittedData] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (prefilledSubject) {
      setSubject(prefilledSubject);
    }
  }, [prefilledSubject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateContactDraft({ name, email, subject, message }, lang);
    if (!res.ok || !res.data) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    setSubmittedData({ name: res.data.name, email: res.data.email });

    // Open the user's mail client with the form data pre-filled
    const toEmail = profile.contact.email;
    const mailSubject = encodeURIComponent(res.data.subject);
    const mailBody = encodeURIComponent(
      `${lang === 'en' ? 'Name' : lang === 'ku' ? 'ناو' : 'الاسم'}: ${res.data.name}\n${lang === 'en' ? 'Email' : lang === 'ku' ? 'ئیمەیڵ' : 'البريد الإلكتروني'}: ${res.data.email}\n\n${res.data.message ?? message.trim()}`
    );
    window.location.href = `mailto:${toEmail}?subject=${mailSubject}&body=${mailBody}`;

    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <>
      {/* Contact Section */}
      <section
        id="contact"
        aria-labelledby="contact-heading"
        className="py-20 sm:py-28 border-t border-[#DDA146]/20 bg-[#0C0A07]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-semibold tracking-wide text-[#DDA146] mb-2">{t.kicker}</p>
            <h2
              id="contact-heading"
              className="text-2xl sm:text-4xl font-bold text-[#F8F9FA] leading-tight text-balance"
            >
              {t.heading}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#A9AFBE] leading-relaxed">
              {t.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Direct Contact Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-[#DDA146]/25 bg-[#120F0A] p-6 sm:p-8 space-y-6 shadow-xl">
                <h3 className="text-lg font-bold text-[#F8F9FA]">{t.directTitle}</h3>

                <div className="space-y-5">
                  <a
                    href={`tel:${profile.contact.phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-11 h-11 rounded-full border border-[#DDA146]/50 bg-[#DDA146]/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-[#DDA146]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        dir="ltr"
                        className="text-sm sm:text-base font-bold font-code text-[#F8F9FA] group-hover:text-[#DDA146] transition-colors rtl:text-right ltr:text-left"
                      >
                        {profile.contact.phone}
                      </div>
                      <div className="text-xs text-[#9CA3AF]">{t.phoneHint}</div>
                    </div>
                  </a>

                  <a
                    href={`mailto:${profile.contact.email}`}
                    className="flex items-center gap-3 sm:gap-4 group min-w-0"
                  >
                    <div className="w-11 h-11 rounded-full border border-[#DDA146]/50 bg-[#DDA146]/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[#DDA146]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        dir="ltr"
                        className="text-xs sm:text-base font-bold font-code break-all text-[#F8F9FA] group-hover:text-[#DDA146] transition-colors rtl:text-right ltr:text-left"
                      >
                        {profile.contact.email}
                      </div>
                      <div className="text-xs text-[#9CA3AF]">{t.emailHint}</div>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-full border border-[#DDA146]/50 bg-[#DDA146]/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#DDA146]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div dir="ltr" className="text-sm sm:text-base font-bold text-[#F8F9FA] rtl:text-right ltr:text-left">
                        {displayLocation}
                      </div>
                      <div className="text-xs text-[#9CA3AF]">{t.locationHint}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[#DDA146]/25 bg-[#120F0A] p-6 sm:p-8 shadow-xl">
                <h3 className="text-lg font-bold text-[#F8F9FA] mb-5">{t.formTitle}</h3>

                {submittedData && (
                  <div
                    role="status"
                    className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-sm text-emerald-200"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {t.successTitle} {submittedData.name}
                      </p>
                      <p className="text-xs text-emerald-200/80 mt-1">
                        {t.successSub} ({submittedData.email})
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs text-[#C5C9D3] mb-1.5">
                        {t.nameLabel}
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.namePlaceholder}
                        className="w-full rounded-lg border border-[#DDA146]/25 bg-[#070605] px-3.5 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:border-[#DDA146] focus:outline-none"
                      />
                      {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-email" className="block text-xs text-[#C5C9D3] mb-1.5">
                        {t.emailLabel}
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@gmail.com"
                        className="w-full rounded-lg border border-[#DDA146]/25 bg-[#070605] px-3.5 py-2.5 text-sm font-code text-white placeholder:text-[#6B7280] text-left focus:border-[#DDA146] focus:outline-none"
                      />
                      {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-xs text-[#C5C9D3] mb-1.5">
                      {t.subjectLabel}
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t.subjectPlaceholder}
                      className="w-full rounded-lg border border-[#DDA146]/25 bg-[#070605] px-3.5 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:border-[#DDA146] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs text-[#C5C9D3] mb-1.5">
                      {t.messageLabel}
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t.messagePlaceholder}
                      className="w-full rounded-lg border border-[#DDA146]/25 bg-[#070605] px-3.5 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:border-[#DDA146] focus:outline-none"
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-rose-400">{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#DDA146] to-[#F3C067] hover:brightness-110 text-[#070605] shadow-[0_0_15px_rgba(221,161,70,0.3)] px-6 py-2.5 text-sm font-bold transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.submitBtn}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Location Map Card */}
          <div className="mt-12 rounded-2xl border border-[#DDA146]/25 bg-[#120F0A] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-xl">
            <div className="lg:col-span-6 aspect-[3/2] lg:aspect-auto lg:min-h-[320px] bg-[#070605]">
              <StudioArt
                variant="amman-map"
                alt={
                  lang === 'en'
                    ? 'Abc Gulf Productions location map at Erbil Boulevard'
                    : lang === 'ku'
                      ? 'نەخشەی شوێنی کۆمپانیای ئەی بی سی خەلیج لە هەولێر بۆلیڤارد'
                      : 'خريطة موقع شركة أي بي سي الخليج للإنتاج الفني في أربيل بوليفارد'
                }
                className="h-full"
              />
            </div>
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-center space-y-3">
              <p className="text-xs font-semibold text-[#DDA146]">{t.ourLocation}</p>
              <h3 dir="ltr" className="text-2xl font-bold text-[#F8F9FA] rtl:text-right ltr:text-left">
                {displayLocation}
              </h3>
              <p className="text-sm text-[#A9AFBE] leading-relaxed">{t.locationDesc}</p>
              <div className="pt-2">
                <a
                  href={sanitizeExternalUrl(profile.contact.mapsUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#DDA146]/55 px-4 py-2 text-xs font-semibold text-[#F3C067] hover:bg-[#DDA146] hover:text-[#070605] transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{t.openMaps}</span>
                  <DirectionalChevron className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Studio Footer */}
      <footer className="border-t border-[#DDA146]/20 bg-[#050403] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogoMark logoDataUrl={profile.logoDataUrl} alt={displayName} />
            <div>
              <div className="text-sm font-bold text-[#F8F9FA]">{displayName}</div>
              <div className="text-xs font-latin text-[#8E95A5]">
                {lang === 'ar' ? profile.nameEn : profile.nameAr}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#9CA3AF]">
            <span>{f.tagline}</span>
            <span aria-hidden="true">·</span>
            <div className="inline-flex items-center gap-1 rounded-md bg-[#070605] p-0.5 border border-[#DDA146]/25">
              <Globe className="w-3.5 h-3.5 text-[#DDA146] mx-1" />
              {(['ku', 'ar', 'en'] as const).map((code) => {
                const label = code === 'ku' ? 'کوردی' : code === 'ar' ? 'العربية' : 'English';
                const isActive = lang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onToggleLanguage(code)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#DDA146] text-[#070605] font-bold shadow-sm'
                        : 'text-[#C5C9D3] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {isAdmin && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onOpenCustomizer}
                  className="inline-flex items-center gap-1.5 text-[#DDA146] hover:text-[#F3C067] font-medium cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{f.customize}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </>
  );
};
