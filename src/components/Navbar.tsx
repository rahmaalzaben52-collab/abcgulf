import React, { useState } from 'react';
import { Menu, X, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { DEFAULT_LOGO_URL, type CompanyProfile } from '../utils/siteStore';
import { UI_COPY, type Language } from '../utils/i18n';

interface NavbarProps {
  profile: CompanyProfile;
  activeSection: string;
  lang: Language;
  onNavigate: (sectionId: string) => void;
  onToggleLanguage: (lang: Language) => void;
}

export const BrandLogoMark: React.FC<{ logoDataUrl: string | null; alt: string }> = ({
  logoDataUrl,
  alt,
}) => {
  const src = logoDataUrl || DEFAULT_LOGO_URL;
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className="h-10 sm:h-11 w-auto max-w-[140px] object-contain shrink-0"
    />
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeSection,
  lang,
  onNavigate,
  onToggleLanguage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = UI_COPY[lang].nav;
  const displayName =
    lang === 'en'
      ? profile.nameEn
      : lang === 'ku'
        ? profile.nameKu || 'ئەی بی سی خەلیج بۆ بەرهەمهێنانی هونەری'
        : profile.nameAr;
  const DirectionalChevron = lang === 'en' ? ChevronRight : ChevronLeft;

  const navLinks = [
    { id: 'hero', label: t.hero },
    {
      id: 'cinema-suite',
      label:
        lang === 'en'
          ? 'Cinema Suite'
          : lang === 'ku'
            ? 'سویتە سینەمایی'
            : 'المعرض السينمائي',
    },
    { id: 'services', label: t.services },
    { id: 'about', label: t.about },
    { id: 'licenses', label: t.licenses },
  ];

  const handleLinkClick = (id: string) => {
    setMobileMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070605]/95 border-b border-[#DDA146]/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('hero');
          }}
          className="flex items-center gap-3 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA146] rounded-lg"
        >
          <BrandLogoMark logoDataUrl={profile.logoDataUrl} alt={displayName} />
          <span className="text-base sm:text-lg font-bold tracking-tight text-[#F8F9FA]">
            {displayName}
          </span>
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Main Navigation'}
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#A9AFBE]"
        >
          {navLinks.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.id);
                }}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA146] rounded ${
                  isActive ? 'text-[#F3C067]' : 'hover:text-[#F3C067]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#DDA146] shadow-[0_0_8px_rgba(221,161,70,0.8)] rounded-full"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary CTA button + Mobile menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleLinkClick('contact')}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#DDA146] to-[#F3C067] hover:brightness-110 text-[#070605] px-4 py-2 text-xs sm:text-sm font-bold transition-all shadow-[0_0_12px_rgba(221,161,70,0.3)] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3C067]"
          >
            <span>{t.contact}</span>
            <DirectionalChevron className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#DDA146]/30 text-[#F4F5F7] hover:bg-[#DDA146]/10 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DDA146]/20 bg-[#0C0A07]/98 px-4 py-4 space-y-2 backdrop-blur-md">
          {navLinks.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item.id);
              }}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-[#DDA146]/15 text-[#F3C067] border border-[#DDA146]/30'
                  : 'text-[#C5C9D3] hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}

          <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#DDA146]/20">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF]">
              <Globe className="w-3.5 h-3.5 text-[#DDA146]" />
              <span>{lang === 'en' ? 'Language' : lang === 'ku' ? 'زمان' : 'اللغة'}</span>
            </span>
            <div className="inline-flex rounded-lg border border-[#DDA146]/30 bg-[#070605] p-0.5">
              <button
                type="button"
                onClick={() => {
                  onToggleLanguage('ku');
                  setMobileMenuOpen(false);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  lang === 'ku' ? 'bg-[#DDA146] text-[#070605]' : 'text-[#C5C9D3]'
                }`}
              >
                کوردی
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleLanguage('ar');
                  setMobileMenuOpen(false);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  lang === 'ar' ? 'bg-[#DDA146] text-[#070605]' : 'text-[#C5C9D3]'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleLanguage('en');
                  setMobileMenuOpen(false);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  lang === 'en' ? 'bg-[#DDA146] text-[#070605]' : 'text-[#C5C9D3]'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleLinkClick('contact')}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#DDA146] to-[#F3C067] text-[#070605] px-4 py-2.5 text-sm font-bold cursor-pointer"
          >
            <span>{t.contact}</span>
            <DirectionalChevron className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
