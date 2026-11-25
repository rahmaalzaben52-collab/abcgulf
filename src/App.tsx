/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Film,
  Globe,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  deriveAndStoreAdminToken,
  clearAdminToken,
  saveSiteConfig,
  upsertLicense,
  deleteLicense,
  subscribeToSiteData,
} from './cloudflareApi';
import {
  DEFAULT_LICENSES,
  DEFAULT_PROFILE,
  isAdminRouteTriggered,
  loadStoredConfig,
  loadStoredLanguage,
  saveStoredConfig,
  saveStoredLanguage,
  STORAGE_KEY,
  type CompanyProfile,
  type LicenseRecord,
} from './utils/siteStore';
import { getDirection, UI_COPY, type Language } from './utils/i18n';
import { HeroFramePlayer } from './components/HeroFramePlayer';
import { ServicesAndAbout } from './components/ServicesAndAbout';
import { LicensesSection } from './components/LicensesSection';
import { ContactAndFooter } from './components/ContactAndFooter';
import { StudioCustomizerModal } from './components/StudioCustomizerModal';
import { AdminAuthModal } from './components/AdminAuthModal';

export default function App() {
  const [lang, setLang] = useState<Language>(() => loadStoredLanguage());
  const [profile, setProfile] = useState<CompanyProfile>(() => {
    const stored = loadStoredConfig();
    return stored.profile || DEFAULT_PROFILE;
  });
  const [cloudLicenses, setCloudLicenses] = useState<LicenseRecord[]>(() => {
    const stored = loadStoredConfig();
    return stored.licenses && stored.licenses.length > 0 ? stored.licenses : DEFAULT_LICENSES;
  });
  // True when admin has saved data → always use cloudLicenses for display
  const [localLicensesEdited, setLocalLicensesEdited] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!window.localStorage.getItem(STORAGE_KEY);
  });
  const [cloudLoaded, setCloudLoaded] = useState(false);

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('abc_admin_active') === 'true';
    }
    return false;
  });
  const [adminModalOpen, setAdminModalOpen] = useState(() =>
    typeof window !== 'undefined'
      ? isAdminRouteTriggered(window.location.hash, window.location.search)
      : false,
  );

  const [activeSection, setActiveSection] = useState<string>('hero');
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const [pendingModelBuffer, setPendingModelBuffer] = useState<ArrayBuffer | null>(null);
  const [pendingModelName, setPendingModelName] = useState<string | null>(null);

  // Language persistence & RTL/LTR direction
  useEffect(() => {
    saveStoredLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = getDirection(lang);
  }, [lang]);

  // Listen for #admin URL trigger & restore session PIN token
  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('abc_admin_active') === 'true') {
      const pin = window.sessionStorage.getItem('abc_admin_pin') || '2030';
      void deriveAndStoreAdminToken(pin);
    }

    const checkRoute = () => {
      if (isAdminRouteTriggered(window.location.hash, window.location.search)) {
        setAdminModalOpen(true);
      }
    };
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  // Subscribe to live data from Cloudflare KV (via Worker API)
  useEffect(() => {
    const unsub = subscribeToSiteData({
      onConfig: (cfg, exists) => {
        if (exists) {
          setProfile(cfg);
          setPendingModelName(cfg.customModelName);
        }
        setCloudLoaded(true);
      },
      onLicenses: (lics, isEmpty) => {
        if (!isEmpty) {
          setCloudLicenses(lics);
          setLocalLicensesEdited(true); // cloud has data → use it
        }
      },
    });
    return () => unsub();
  }, []);

  // Update active navigation indicator on scroll
  useEffect(() => {
    const sectionIds = ['hero', 'services', 'about', 'licenses', 'contact'];
    const handleScroll = () => {
      const scrollY = window.scrollY + 140;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Displayed licenses: cloud/edited data, or DEFAULT_LICENSES if nothing saved yet
  const displayedLicenses =
    cloudLicenses && cloudLicenses.length > 0 ? cloudLicenses : DEFAULT_LICENSES;

  const navigateToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Called by AdminAuthModal after PIN verified — receives the raw PIN
  const handleAdminSuccess = useCallback(async (pin: string) => {
    setIsAdmin(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('abc_admin_active', 'true');
      window.sessionStorage.setItem('abc_admin_pin', pin);
    }
    // Derive admin token from PIN for Worker API auth
    await deriveAndStoreAdminToken(pin);
    setAdminModalOpen(false);
  }, []);

  const handleAdminSignOut = useCallback(() => {
    setIsAdmin(false);
    clearAdminToken();
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('abc_admin_active');
      window.sessionStorage.removeItem('abc_admin_pin');
    }
    setCustomizerOpen(false);
    setAdminModalOpen(false);
    if (isAdminRouteTriggered(window.location.hash, window.location.search)) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleUpload3DFile = useCallback(
    (file: File) => {
      if (!isAdmin) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          setPendingModelName(file.name);
          setPendingModelBuffer(reader.result);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [isAdmin],
  );

  const handleModelLoaded = useCallback(
    (fileName: string | null) => {
      if (!isAdmin) return;
      setPendingModelName(fileName);
      setProfile((prev) => {
        const next = { ...prev, customModelName: fileName };
        saveStoredConfig(next, displayedLicenses);
        void saveSiteConfig(next).catch((e) => console.warn('Config save error:', e));
        return next;
      });
    },
    [isAdmin, displayedLicenses],
  );

  const handleSaveProfile = useCallback(
    async (updated: CompanyProfile) => {
      if (!isAdmin) return;
      setProfile(updated);
      saveStoredConfig(updated, displayedLicenses);
      try {
        await saveSiteConfig(updated);
      } catch (err) {
        console.warn('Cloudflare live sync notice:', err);
      }
    },
    [isAdmin, displayedLicenses],
  );

  const handleImportConfig = useCallback(
    async (importedProfile: CompanyProfile, importedLicenses: LicenseRecord[]) => {
      if (!isAdmin) return;
      setProfile(importedProfile);
      setCloudLicenses(importedLicenses);
      setLocalLicensesEdited(true);
      saveStoredConfig(importedProfile, importedLicenses);
      try {
        await saveSiteConfig(importedProfile);
        await Promise.all(importedLicenses.map((lic) => upsertLicense(lic)));
      } catch (err) {
        console.warn('Cloudflare live sync notice:', err);
      }
    },
    [isAdmin],
  );

  const handleAddLicense = useCallback(
    async (record: LicenseRecord) => {
      if (!isAdmin) return;
      setCloudLicenses((prev) => {
        const base = prev === DEFAULT_LICENSES ? [...DEFAULT_LICENSES] : prev;
        const next = [record, ...base];
        saveStoredConfig(profile, next);
        return next;
      });
      setLocalLicensesEdited(true);
      try {
        await upsertLicense(record);
      } catch (err) {
        console.warn('Cloudflare live sync notice:', err);
      }
    },
    [isAdmin, profile],
  );

  const handleUpdateLicense = useCallback(
    async (record: LicenseRecord) => {
      if (!isAdmin) return;
      setCloudLicenses((prev) => {
        const base = prev === DEFAULT_LICENSES ? [...DEFAULT_LICENSES] : prev;
        const next = base.map((item) => (item.id === record.id ? record : item));
        saveStoredConfig(profile, next);
        return next;
      });
      setLocalLicensesEdited(true);
      try {
        await upsertLicense(record);
      } catch (err) {
        console.warn('Cloudflare live sync notice:', err);
      }
    },
    [isAdmin, profile],
  );

  const handleDeleteLicense = useCallback(
    async (id: string) => {
      if (!isAdmin) return;
      setCloudLicenses((prev) => {
        const base = prev === DEFAULT_LICENSES ? [...DEFAULT_LICENSES] : prev;
        const next = base.filter((item) => item.id !== id);
        saveStoredConfig(profile, next);
        return next;
      });
      setLocalLicensesEdited(true);
      try {
        await deleteLicense(id);
      } catch (err) {
        console.warn('Cloudflare live sync notice:', err);
      }
    },
    [isAdmin, profile],
  );

  const t = UI_COPY[lang];
  const DirectionalChevron = lang === 'en' ? ChevronRight : ChevronLeft;

  return (
    <div className="min-h-screen bg-[#090A0E] text-[#F4F5F7] flex flex-col">
      {/* Slim Non-Sticky Top Bar */}
      <div className="border-b border-white/8 bg-[#07080B] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-10 flex items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-2 truncate">
            <span className="truncate font-latin" dir="ltr">
              {lang === 'en'
                ? profile.contact.locationEn
                : lang === 'ku'
                  ? profile.contact.locationKu || profile.contact.locationAr
                  : profile.contact.locationAr}
            </span>
            <span className="hidden sm:inline text-white/20" aria-hidden="true">·</span>
            <a
              href={`tel:${profile.contact.phone.replace(/\s+/g, '')}`}
              dir="ltr"
              className="hidden sm:inline font-code text-[#C5C9D3] hover:text-[#DFAF5A] transition-colors"
            >
              {profile.contact.phone}
            </a>
          </div>

          <div
            data-testid="lang-switcher"
            role="group"
            aria-label={t.hero.langLabel}
            className="inline-flex items-center gap-1 shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-[#DFAF5A]" aria-hidden="true" />
            <button
              type="button"
              data-testid="lang-btn-ku"
              aria-pressed={lang === 'ku'}
              onClick={() => setLang('ku')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${lang === 'ku' ? 'bg-[#DFAF5A] text-[#0B0C10]' : 'text-[#C5C9D3] hover:text-white'
                }`}
            >
              کوردی
            </button>
            <button
              type="button"
              data-testid="lang-btn-ar"
              aria-pressed={lang === 'ar'}
              onClick={() => setLang('ar')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${lang === 'ar' ? 'bg-[#DFAF5A] text-[#0B0C10]' : 'text-[#C5C9D3] hover:text-white'
                }`}
            >
              العربية
            </button>
            <button
              type="button"
              data-testid="lang-btn-en"
              aria-pressed={lang === 'en'}
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded text-xs font-semibold font-latin transition-colors whitespace-nowrap shrink-0 cursor-pointer ${lang === 'en' ? 'bg-[#DFAF5A] text-[#0B0C10]' : 'text-[#C5C9D3] hover:text-white'
                }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Admin Mode Bar */}
      {isAdmin && (
        <div
          data-testid="admin-mode-bar"
          className="border-b border-[#DFAF5A]/30 bg-[#141720] px-4 sm:px-6 lg:px-8 py-2.5"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#F6DDA7]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">
                {lang === 'en'
                  ? 'Admin Mode Active'
                  : lang === 'ku'
                    ? 'دۆخی بەڕێوەبەر چالاکە'
                    : 'وضع الأدمن مفعل'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCustomizerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#DFAF5A] hover:bg-[#ECC578] text-[#0B0C10] px-3 py-1.5 font-bold transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  {lang === 'en'
                    ? 'Edit Contact, Socials & Logo'
                    : lang === 'ku'
                      ? 'دەستکاری پەیوەندی، لۆگۆ و فایلەکان'
                      : 'تعديل التواصل والشعار والملفات'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleAdminSignOut()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0B0C10] hover:bg-white/6 text-[#E5E7EB] px-3 py-1.5 font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#DFAF5A]" />
                <span>{lang === 'en' ? 'Exit Admin' : lang === 'ku' ? 'دەرچوون' : 'خروج'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <section id="hero" aria-labelledby="hero-heading" className="bg-[#070605]">
          <HeroFramePlayer
            alt={lang === 'en' ? profile.nameEn : profile.nameAr}
            frameCount={60}
            fps={15}
          />

          <div className="gold-laser-ribbon" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 text-center flex flex-col items-center space-y-4">
            <div className="space-y-2">
              <h1
                id="hero-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight bg-gradient-to-r from-[#FFF0C2] via-[#F3C067] to-[#DDA146] bg-clip-text text-transparent"
              >
                {lang === 'en'
                  ? t.hero.companyName
                  : lang === 'ku'
                    ? profile.nameKu || t.hero.companyName
                    : profile.nameAr}
              </h1>

              <p className="text-xs sm:text-sm font-latin font-bold tracking-[0.18em] uppercase text-[#DDA146]">
                {lang === 'en' ? profile.nameAr : 'ABC GULF CHANNEL FOR ARTISTIC PRODUCTION'}
              </p>
            </div>

            <p className="text-sm sm:text-base lg:text-lg text-[#D1D5DB] leading-relaxed max-w-2xl">
              {t.hero.tagline}
            </p>
          </div>
        </section>

        {/* Luminous Gold Laser Ribbon Divider */}
        <div className="gold-laser-ribbon" />

        {/* UI/UX Pro Max: High-Impact Cinema Production Metrics & Trust Grid (Placed Above Video Cards) */}
        <section
          aria-label="Production Accreditations & Scale"
          className="relative py-12 sm:py-16 bg-gradient-to-b from-[#070605] via-[#0B0907] to-[#070605] border-y border-[#DDA146]/20"
        >
          {/* Subtle Ambient Studio Stage in Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
            <img
              src="/images/studio-stage.jpg"
              alt=""
              className="w-full h-full object-cover object-bottom"
            />
            <div className="absolute inset-0 bg-[#070605]/85" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {/* Stat 1 */}
              <div className="group rounded-2xl border border-[#DDA146]/25 bg-[#0E0C09]/90 backdrop-blur-md p-5 sm:p-6 text-center transition-all duration-300 hover:border-[#DDA146] hover:shadow-[0_0_25px_rgba(221,161,70,0.25)] hover:-translate-y-1">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#DDA146]/10 border border-[#DDA146]/30 flex items-center justify-center text-[#DDA146] group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#F8F9FA] tracking-tight font-latin">
                  15+
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-[#C5BBAA]">
                  {lang === 'en'
                    ? 'Years Production Legacy'
                    : lang === 'ku'
                      ? 'ساڵ ئەزموونی بەرهەمهێنان'
                      : 'عاماً من الخبرة الإنتاجية'}
                </div>
              </div>

              {/* Stat 2 */}
              <div className="group rounded-2xl border border-[#DDA146]/25 bg-[#0E0C09]/90 backdrop-blur-md p-5 sm:p-6 text-center transition-all duration-300 hover:border-[#DDA146] hover:shadow-[0_0_25px_rgba(221,161,70,0.25)] hover:-translate-y-1">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#DDA146]/10 border border-[#DDA146]/30 flex items-center justify-center text-[#DDA146] group-hover:scale-110 transition-transform">
                  <Film className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#F8F9FA] tracking-tight font-latin">
                  500+
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-[#C5BBAA]">
                  {lang === 'en'
                    ? 'Films & Commercial Campaigns'
                    : lang === 'ku'
                      ? 'پڕۆژە و بەرهەمی سەرکەوتوو'
                      : 'عمل سينمائي وحملة إعلانية'}
                </div>
              </div>

              {/* Stat 3 */}
              <div className="group rounded-2xl border border-[#DDA146]/25 bg-[#0E0C09]/90 backdrop-blur-md p-5 sm:p-6 text-center transition-all duration-300 hover:border-[#DDA146] hover:shadow-[0_0_25px_rgba(221,161,70,0.25)] hover:-translate-y-1">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#DDA146]/10 border border-[#DDA146]/30 flex items-center justify-center text-[#DDA146] group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#F8F9FA] tracking-tight font-latin">
                  5
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-[#C5BBAA]">
                  {lang === 'en'
                    ? 'Official Certified Accreditations'
                    : lang === 'ku'
                      ? 'مۆڵەتی فەرمی پەسەندکراو'
                      : 'تراخيص رسمية معتمدة'}
                </div>
              </div>

              {/* Stat 4 */}
              <div className="group rounded-2xl border border-[#DDA146]/25 bg-[#0E0C09]/90 backdrop-blur-md p-5 sm:p-6 text-center transition-all duration-300 hover:border-[#DDA146] hover:shadow-[0_0_25px_rgba(221,161,70,0.25)] hover:-translate-y-1">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#DDA146]/10 border border-[#DDA146]/30 flex items-center justify-center text-[#DDA146] group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#F8F9FA] tracking-tight font-latin">
                  4K / 6K
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-[#C5BBAA]">
                  {lang === 'en'
                    ? 'Cinema Standard Resolution'
                    : lang === 'ku'
                      ? 'ستانداردی سینەمایی و کوالیتی'
                      : 'معايير الدقة السينمائية'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Luminous Gold Laser Ribbon Divider */}
        <div className="gold-laser-ribbon" />

        {/* Signature 4 Floating Gold-Framed Video Cards (Pure Visuals, No Captions) */}
        <section aria-label="Erbil Cinema Heritage Video Showcase" className="relative z-10 py-10 sm:py-14 bg-[#070605]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {[
                { src: '/videos/card-erbil-hawler.mp4', title: 'Erbil Hawler', offset: '' },
                { src: '/videos/card-erbil-iraq-places.mp4', title: 'Erbil Heritage', offset: 'lg:-translate-y-3' },
                { src: '/videos/card-erbil-alpine.mp4', title: 'Erbil Alpine', offset: 'lg:-translate-y-3' },
                { src: '/videos/card-erbil-korek-snow.mp4', title: 'Korek Snow', offset: '' },
              ].map((video) => (
                <div
                  key={video.src}
                  className={`group relative rounded-2xl overflow-hidden gold-card-frame bg-[#0E0C09] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(221,161,70,0.55)] ${video.offset}`}
                >
                  <div className="aspect-[4/5] overflow-hidden bg-black">
                    <video
                      src={video.src}
                      aria-label={video.title}
                      autoPlay
                      muted
                      loop
                      playsInline
                      disablePictureInPicture
                      preload="auto"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                      style={{ filter: 'contrast(1.08) saturate(1.15) brightness(1.03)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Luminous Gold Laser Ribbon Divider */}
        <div className="gold-laser-ribbon" />

        <ServicesAndAbout profile={profile} lang={lang} />

        <section aria-label={t.goldBanner.cta} className="gold-gradient-banner py-7 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
            <h2 className="text-lg sm:text-2xl font-bold text-[#0B0C10]">{t.goldBanner.title}</h2>
            <button
              type="button"
              onClick={() => navigateToSection('contact')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B0C10] hover:bg-[#191C26] text-[#F8F9FA] px-5 py-2.5 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{t.goldBanner.cta}</span>
              <DirectionalChevron className="w-4 h-4" />
            </button>
          </div>
        </section>

        <LicensesSection
          licenses={displayedLicenses}
          lang={lang}
          isAdmin={isAdmin}
          onAddLicense={handleAddLicense}
          onUpdateLicense={handleUpdateLicense}
          onDeleteLicense={handleDeleteLicense}
          onOpenCustomizer={() => setCustomizerOpen(true)}
        />

        <ContactAndFooter
          profile={profile}
          lang={lang}
          isAdmin={isAdmin}
          onOpenCustomizer={() => setCustomizerOpen(true)}
          onOpenAdminAuth={() => setAdminModalOpen(true)}
          onToggleLanguage={setLang}
        />
      </main>

      {isAdmin && (
        <StudioCustomizerModal
          open={customizerOpen}
          isAdmin={isAdmin}
          lang={lang}
          profile={profile}
          licenses={displayedLicenses}
          onClose={() => setCustomizerOpen(false)}
          onSaveProfile={handleSaveProfile}
          onImportConfig={handleImportConfig}
          onUpload3DFile={handleUpload3DFile}
        />
      )}

      <AdminAuthModal
        open={adminModalOpen}
        lang={lang}
        isAdmin={isAdmin}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
        onSignOut={handleAdminSignOut}
        onOpenCustomizer={() => setCustomizerOpen(true)}
      />
    </div>
  );
}
