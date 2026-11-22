/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  LogOut,
  Play,
  ShieldCheck,
  SlidersHorizontal,
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
import { Navbar } from './components/Navbar';
import { HeroStudio3D } from './components/HeroStudio3D';
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
  const DirectionalChevron = lang === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen bg-[#090A0E] text-[#F4F5F7] flex flex-col">
      {/* Slim Non-Sticky Top Bar */}
      <div className="border-b border-white/8 bg-[#07080B] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-10 flex items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-2 truncate">
            <span className="truncate font-latin" dir="ltr">
              {lang === 'ar' ? profile.contact.locationAr : profile.contact.locationEn}
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
              data-testid="lang-btn-ar"
              aria-pressed={lang === 'ar'}
              onClick={() => setLang('ar')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'ar' ? 'bg-[#DFAF5A] text-[#0B0C10]' : 'text-[#C5C9D3] hover:text-white'
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              data-testid="lang-btn-en"
              aria-pressed={lang === 'en'}
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded text-xs font-semibold font-latin transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'en' ? 'bg-[#DFAF5A] text-[#0B0C10]' : 'text-[#C5C9D3] hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      <Navbar
        profile={profile}
        activeSection={activeSection}
        lang={lang}
        onNavigate={navigateToSection}
        onToggleLanguage={setLang}
      />

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
                {lang === 'en' ? 'Admin Mode Active' : 'وضع الأدمن مفعل'}
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
                  {lang === 'en' ? 'Edit Contact, Socials & Logo' : 'تعديل التواصل والشعار والملفات'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleAdminSignOut()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0B0C10] hover:bg-white/6 text-[#E5E7EB] px-3 py-1.5 font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#DFAF5A]" />
                <span>{lang === 'en' ? 'Exit Admin' : 'خروج'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="relative overflow-hidden bg-[#090A0E] studio-hairline-grid min-h-[780px] sm:min-h-[760px] lg:min-h-[680px] flex items-start lg:items-center"
        >
          <div className="absolute inset-0">
            <HeroStudio3D
              lang={lang}
              isAdmin={isAdmin}
              customModelName={pendingModelName}
              pendingModelBuffer={pendingModelBuffer}
              onModelLoaded={handleModelLoaded}
              onUploadFileRequest={handleUpload3DFile}
            />
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute -top-28 start-1/4 w-[580px] h-[580px] rounded-full bg-[#DFAF5A]/10 blur-3xl z-[1]" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-[#090A0E] from-15% via-[#090A0E]/85 via-45% to-transparent lg:bg-none" />
          <div aria-hidden="true" className="pointer-events-none hidden lg:block absolute inset-0 z-[2] rtl:bg-gradient-to-l ltr:bg-gradient-to-r from-[#090A0E]/92 via-[#090A0E]/45 to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-[2] bg-gradient-to-t from-[#090A0E] to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-80 sm:pb-80 lg:py-20 pointer-events-none">
            <div className="lg:w-[46%] xl:w-[44%] flex flex-col justify-center space-y-6 pointer-events-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-px bg-[#DFAF5A]" aria-hidden="true" />
                  <p className="text-xs sm:text-sm font-latin tracking-wider text-[#DFAF5A] font-semibold">
                    {lang === 'ar' ? profile.nameEn : profile.nameAr}
                  </p>
                </div>
                <h1 id="hero-heading" className="text-3xl sm:text-5xl font-bold text-[#F8F9FA] leading-[1.18] text-balance">
                  {lang === 'ar' ? profile.nameAr : t.hero.companyName}
                </h1>
                <p className="text-base sm:text-lg text-[#D1D5DB] leading-relaxed">{t.hero.tagline}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigateToSection('services')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#DFAF5A] hover:bg-[#ECC578] text-[#0B0C10] px-6 py-3 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{t.hero.ctaServices}</span>
                  <DirectionalChevron className="w-4 h-4" />
                </button>

                <a
                  href={profile.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#12151E]/90 hover:border-[#DFAF5A]/50 px-4 py-3 text-sm font-medium text-[#F4F5F7] transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4 text-[#DFAF5A]" />
                  <span>{t.hero.ctaYoutube}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

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
