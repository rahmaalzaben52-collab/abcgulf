import React, { useEffect, useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  Youtube,
  Instagram,
  Linkedin,
  Facebook,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Globe,
  Lock,
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
  const DirectionalChevron = lang === 'ar' ? ChevronLeft : ChevronRight;
  const displayName = lang === 'ar' ? profile.nameAr : profile.nameEn;
  const displayLocation = lang === 'ar' ? profile.contact.locationAr : profile.contact.locationEn;

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
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  const socialItems = [
    { name: 'YouTube', url: profile.socials.youtube, icon: Youtube },
    { name: 'Instagram', url: profile.socials.instagram, icon: Instagram },
    { name: 'LinkedIn', url: profile.socials.linkedin, icon: Linkedin },
    { name: 'Facebook', url: profile.socials.facebook, icon: Facebook },
  ];

  return (
    <>
      {/* Contact Section */}
      <section
        id="contact"
        aria-labelledby="contact-heading"
        className="py-20 sm:py-28 border-t border-white/8 bg-[#0D0F15]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-semibold tracking-wide text-[#DFAF5A] mb-2">{t.kicker}</p>
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
              <div className="rounded-2xl border border-white/10 bg-[#12151E] p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-[#F8F9FA]">{t.directTitle}</h3>

                <div className="space-y-5">
                  <a
                    href={`tel:${profile.contact.phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-11 h-11 rounded-full border border-[#DFAF5A]/50 bg-[#DFAF5A]/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-[#DFAF5A]" />
                    </div>
                    <div>
                      <div
                        dir="ltr"
                        className="text-base font-bold font-code text-[#F8F9FA] group-hover:text-[#DFAF5A] transition-colors rtl:text-right ltr:text-left"
                      >
                        {profile.contact.phone}
                      </div>
                      <div className="text-xs text-[#9CA3AF]">{t.phoneHint}</div>
                    </div>
                  </a>

                  <a
                    href={`mailto:${profile.contact.email}`}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-11 h-11 rounded-full border border-[#DFAF5A]/50 bg-[#DFAF5A]/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[#DFAF5A]" />
                    </div>
                    <div>
                      <div
                        dir="ltr"
                        className="text-base font-bold font-code text-[#F8F9FA] group-hover:text-[#DFAF5A] transition-colors rtl:text-right ltr:text-left"
                      >
                        {profile.contact.email}
                      </div>
                      <div className="text-xs text-[#9CA3AF]">{t.emailHint}</div>
                    </div>
                  </a>

                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full border border-[#DFAF5A]/50 bg-[#DFAF5A]/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#DFAF5A]" />
                    </div>
                    <div>
                      <div dir="ltr" className="text-base font-bold text-[#F8F9FA] rtl:text-right ltr:text-left">
                        {displayLocation}
                      </div>
                      <div className="text-xs text-[#9CA3AF]">{t.locationHint}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-white/10">
                  <p className="text-xs font-semibold text-[#C5C9D3] mb-3">{t.socialHeading}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {socialItems.map((item) => {
                      const SocialIcon = item.icon;
                      return (
                        <a
                          key={item.name}
                          href={sanitizeExternalUrl(item.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={item.name}
                          className="w-10 h-10 rounded-full border border-[#DFAF5A]/45 bg-[#191C26] hover:bg-[#DFAF5A] text-[#DFAF5A] hover:text-[#0B0C10] flex items-center justify-center transition-colors"
                        >
                          <SocialIcon className="w-4 h-4" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-white/10 bg-[#12151E] p-6 sm:p-8">
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
                        className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3.5 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:border-[#DFAF5A] focus:outline-none"
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
                        className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3.5 py-2.5 text-sm font-code text-white placeholder:text-[#6B7280] text-left focus:border-[#DFAF5A] focus:outline-none"
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
                      className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3.5 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:border-[#DFAF5A] focus:outline-none"
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
                      className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3.5 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:border-[#DFAF5A] focus:outline-none"
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-rose-400">{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#DFAF5A] hover:bg-[#ECC578] text-[#0B0C10] px-6 py-2.5 text-sm font-bold transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.submitBtn}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Location Map Card */}
          <div className="mt-12 rounded-2xl border border-white/10 bg-[#12151E] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 aspect-[3/2] lg:aspect-auto lg:min-h-[320px] bg-[#0B0C10]">
              <StudioArt
                variant="amman-map"
                alt={
                  lang === 'ar'
                    ? 'خريطة موقع شركة الخليج للإنتاج الفني في أربيل بوليفارد'
                    : 'Abc Gulf Productions location map at Erbil Boulevard'
                }
                className="h-full"
              />
            </div>
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-center space-y-3">
              <p className="text-xs font-semibold text-[#DFAF5A]">{t.ourLocation}</p>
              <h3 dir="ltr" className="text-2xl font-bold text-[#F8F9FA] rtl:text-right ltr:text-left">
                {displayLocation}
              </h3>
              <p className="text-sm text-[#A9AFBE] leading-relaxed">{t.locationDesc}</p>
              <div className="pt-2">
                <a
                  href={sanitizeExternalUrl(profile.contact.mapsUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#DFAF5A]/55 px-4 py-2 text-xs font-semibold text-[#F6DDA7] hover:bg-[#DFAF5A] hover:text-[#0B0C10] transition-colors"
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
      <footer className="border-t border-white/8 bg-[#07080B] py-10">
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

          <div className="flex items-center gap-3">
            {socialItems.map((item) => {
              const SocialIcon = item.icon;
              return (
                <a
                  key={`footer-${item.name}`}
                  href={sanitizeExternalUrl(item.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  className="w-9 h-9 rounded-full bg-[#F4F5F7] text-[#0B0C10] hover:bg-[#DFAF5A] flex items-center justify-center transition-colors"
                >
                  <SocialIcon className="w-4 h-4" />
                </a>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#9CA3AF]">
            <span>{f.tagline}</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onToggleLanguage(lang === 'ar' ? 'en' : 'ar')}
              className="inline-flex items-center gap-1.5 text-[#C5C9D3] hover:text-[#DFAF5A] font-medium cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#DFAF5A]" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>
            {isAdmin && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onOpenCustomizer}
                  className="inline-flex items-center gap-1.5 text-[#DFAF5A] hover:text-[#F6DDA7] font-medium cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{f.customize}</span>
                </button>
              </>
            )}
            <button
              type="button"
              data-testid="admin-portal-btn"
              onClick={onOpenAdminAuth}
              aria-label={lang === 'en' ? 'Admin Portal' : 'دخول الإدارة'}
              title={lang === 'en' ? 'Admin Portal' : 'دخول الإدارة'}
              className="p-1.5 rounded-md text-[#4B5563] hover:text-[#DFAF5A] transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};
