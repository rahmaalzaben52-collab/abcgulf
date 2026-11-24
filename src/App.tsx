/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Film,
  Globe,
  LogOut,
  Pause,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
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

  // Video hero state & refs
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(false);
  const [heroVideoMuted, setHeroVideoMuted] = useState(true);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);

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

  // UI/UX Pro Max: IntersectionObserver — pause video when hero scrolls out of view
  useEffect(() => {
    const video = heroVideoRef.current;
    const hero = heroSectionRef.current;
    if (!video || !hero) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return; // honour accessibility preference — keep paused

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
            setHeroVideoPlaying(true);
          } else {
            video.pause();
            setHeroVideoPlaying(false);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroVideoReady]);

  const toggleHeroVideo = () => {
    const v = heroVideoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setHeroVideoPlaying(true);
    } else {
      v.pause();
      setHeroVideoPlaying(false);
    }
  };

  const toggleHeroMute = () => {
    const v = heroVideoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setHeroVideoMuted(v.muted);
  };

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
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'ku' ? 'bg-[#DFAF5A] text-[#0B0C10]' : 'text-[#C5C9D3] hover:text-white'
              }`}
            >
              کوردی
            </button>
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
        {/* ═══════════════════════════════════════════════════════════════
            Cinematic Heritage Hero — Drone footage of historic fortress
            UI/UX Pro Max: Dark OLED + Gold accents, 7:1+ contrast text,
            IntersectionObserver auto-pause, prefers-reduced-motion safe,
            accessible play/mute controls (44×44 px min touch targets).
        ═══════════════════════════════════════════════════════════════ */}
        <section
          ref={heroSectionRef}
          id="hero"
          aria-labelledby="hero-heading"
          className="relative overflow-hidden bg-[#070605] min-h-[680px] sm:min-h-[760px] lg:min-h-[820px] flex flex-col justify-center items-center"
        >
          {/* ── Bright, Crystal-Clear Video Background Layer ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* Static image fallback shown while video loads */}
            <img
              src="/images/erbil-cinema-theme.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ opacity: heroVideoReady ? 0 : 0.75, transition: 'opacity 0.8s ease' }}
            />

            {/* High-clarity warm cinema grading matching reference lighting */}
            <video
              ref={heroVideoRef}
              src="/videos/historic-fortress-cinema.mp4"
              poster="/images/erbil-cinema-theme.jpg"
              muted
              loop
              playsInline
              preload="auto"
              onCanPlay={() => {
                setHeroVideoReady(true);
                const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (!prefersReduced) {
                  heroVideoRef.current?.play().catch(() => {});
                  setHeroVideoPlaying(true);
                }
              }}
              className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700"
              style={{
                opacity: heroVideoReady ? 0.94 : 0,
                filter: 'contrast(1.10) saturate(1.18) brightness(1.08)',
              }}
            />

            {/* Subtle top/bottom fade & targeted center radial scrim for crystal-clear text */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#070605]/70 via-transparent to-[#070605]/95" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 68% 58% at 50% 50%, rgba(7,6,5,0.78) 0%, rgba(7,6,5,0.42) 55%, rgba(7,6,5,0.14) 100%)',
              }}
            />
          </div>

          {/* ── Top-End Compact Audio & Playback Control Pill ── */}
          <div
            className="absolute top-6 end-6 z-20 hidden sm:flex items-center gap-1.5 rounded-full border border-[#DDA146]/45 bg-[#070605]/80 backdrop-blur-md px-3.5 py-1.5 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            role="group"
            aria-label={lang === 'en' ? 'Video playback controls' : lang === 'ku' ? 'کۆنتڕۆڵی ڤیدیۆ' : 'أدوات تشغيل الفيديو'}
          >
            <span className="w-2 h-2 rounded-full bg-[#DDA146] shadow-[0_0_8px_#DDA146] animate-pulse" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-[#F6DDA7] select-none px-1">
              {heroVideoMuted
                ? lang === 'en'
                  ? 'Audio: Muted'
                  : lang === 'ku'
                    ? 'دەنگ: بێدەنگ'
                    : 'الصوت السينمائي: مكتوم'
                : lang === 'en'
                  ? 'Audio: On'
                  : lang === 'ku'
                    ? 'دەنگ: کراوە'
                    : 'الصوت السينمائي: مفعل'}
            </span>

            <button
              type="button"
              onClick={toggleHeroVideo}
              aria-label={heroVideoPlaying
                ? (lang === 'en' ? 'Pause background video' : lang === 'ku' ? 'وەستاندنی ڤیدیۆ' : 'إيقاف الفيديو')
                : (lang === 'en' ? 'Play background video' : lang === 'ku' ? 'لێدانی ڤیدیۆ' : 'تشغيل الفيديو')
              }
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#DDA146] hover:text-[#F3C067] hover:bg-[#DDA146]/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA146] cursor-pointer"
            >
              {heroVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={toggleHeroMute}
              aria-label={heroVideoMuted
                ? (lang === 'en' ? 'Unmute video' : lang === 'ku' ? 'دەنگ کردنەوە' : 'تشغيل الصوت')
                : (lang === 'en' ? 'Mute video' : lang === 'ku' ? 'بێدەنگکردن' : 'كتم الصوت')
              }
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#DDA146] hover:text-[#F3C067] hover:bg-[#DDA146]/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA146] cursor-pointer"
            >
              {heroVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* ── Centered Hero Content (High Contrast & Cinematic Polish) ── */}
          <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
            <div className="w-full max-w-4xl rounded-3xl bg-[#070605]/40 backdrop-blur-[3px] border border-[#DDA146]/20 px-5 py-8 sm:px-10 sm:py-11 shadow-[0_12px_60px_rgba(0,0,0,0.65)] flex flex-col items-center space-y-6">
              {/* Top Channel Pill Badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#DDA146]/55 bg-[#070605]/85 px-5 py-2 shadow-[0_4px_24px_rgba(221,161,70,0.2)] backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DDA146] shadow-[0_0_6px_#DDA146]" aria-hidden="true" />
                <span className="text-[11px] sm:text-xs font-latin font-bold tracking-[0.16em] uppercase text-[#F9E4B0]">
                  ABC GULF CHANNEL FOR ARTISTIC PRODUCTION
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#DDA146] shadow-[0_0_6px_#DDA146]" aria-hidden="true" />
              </div>

              {/* Two-Tone Centered Headline */}
              <div className="space-y-3">
                <h1
                  id="hero-heading"
                  className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.22] text-balance tracking-tight"
                >
                  <span className="block text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                    {lang === 'en'
                      ? t.hero.companyName
                      : lang === 'ku'
                        ? profile.nameKu || t.hero.companyName
                        : profile.nameAr}
                  </span>
                  <span className="block mt-3 text-2xl sm:text-4xl lg:text-[2.75rem] bg-gradient-to-r from-[#FFF0C2] via-[#F3C067] to-[#DDA146] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                    {lang === 'en'
                      ? 'Turning Ideas Into Unforgettable Visuals'
                      : lang === 'ku'
                        ? 'بیرۆکەکان دەگۆڕین بۆ ئەزموونی بینراوی لەبیرنەکراو'
                        : 'نحوّل الأفكار إلى تجارب بصرية لا تُنسى'}
                  </span>
                </h1>
              </div>

              {/* Subtle Gold Divider Accent */}
              <div className="w-28 h-[2px] bg-gradient-to-r from-transparent via-[#DDA146] to-transparent opacity-80" aria-hidden="true" />

              {/* Clean Centered Tagline */}
              <p className="text-base sm:text-lg text-[#F9FAFB] leading-relaxed max-w-2xl font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                {t.hero.tagline}
              </p>

              {/* Centered Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigateToSection('services')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#DDA146] to-[#F3C067] hover:brightness-110 hover:-translate-y-0.5 text-[#070605] px-7 py-3.5 text-sm font-extrabold transition-all shadow-[0_0_28px_rgba(221,161,70,0.45)] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{t.hero.ctaServices}</span>
                  <DirectionalChevron className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSection('contact')}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-[#070605]/85 hover:border-[#DDA146] hover:bg-[#14110C] hover:-translate-y-0.5 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-white transition-all whitespace-nowrap shrink-0 shadow-lg cursor-pointer"
                >
                  <span>{t.nav.contact}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Bottom Center Scroll Indicator ── */}
          <button
            type="button"
            onClick={() => navigateToSection('services')}
            aria-label={lang === 'en' ? 'Scroll to explore' : lang === 'ku' ? 'بۆ خوارەوە ڕابکێشە' : 'اسحب للاستكشاف'}
            className="relative z-10 pb-6 flex flex-col items-center gap-2 text-xs font-medium text-[#E5E7EB]/90 hover:text-[#F6DDA7] transition-colors cursor-pointer drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
          >
            <span>
              {lang === 'en' ? 'Scroll to explore' : lang === 'ku' ? 'بۆ خوارەوە ڕابکێشە' : 'اسحب للاستكشاف'}
            </span>
            <span className="w-5 h-8 rounded-full border-2 border-[#DDA146]/70 flex items-start justify-center p-1 bg-[#070605]/50">
              <span className="w-1 h-2 rounded-full bg-[#DDA146] animate-bounce" />
            </span>
          </button>
        </section>

        {/* Luminous Gold Laser Ribbon Divider */}
        <div className="gold-laser-ribbon" />

        {/* Signature 4 Floating Gold-Framed Video Cards (Pure Visuals, No Captions) */}
        <section aria-label="Erbil Cinema Heritage Video Showcase" className="relative z-10 py-10 sm:py-14 bg-[#070605]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {[
                { src: '/videos/card-erbil-alpine.mp4', title: 'Erbil Alpine', offset: '' },
                { src: '/videos/card-erbil-korek-snow.mp4', title: 'Korek Snow', offset: 'lg:-translate-y-3' },
                { src: '/videos/card-erbil-hawler.mp4', title: 'Erbil Hawler', offset: 'lg:-translate-y-3' },
                { src: '/videos/card-erbil-iraq-places.mp4', title: 'Erbil Heritage', offset: '' },
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

        {/* UI/UX Pro Max: High-Impact Cinema Production Metrics & Trust Grid */}
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
