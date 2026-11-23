import React from 'react';
import {
  Video,
  Film,
  Camera,
  Mic,
  Sliders,
  Lightbulb,
  Clapperboard,
  Play,
  Users,
} from 'lucide-react';
import {
  CORE_SERVICES,
  type CompanyProfile,
  type ServiceItem,
} from '../utils/siteStore';
import { SERVICE_COPY, UI_COPY, type Language } from '../utils/i18n';
import { StudioArt } from './StudioArt';

interface ServicesAndAboutProps {
  profile: CompanyProfile;
  lang: Language;
}

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'srv-commercials': Video,
  'srv-films-tv': Film,
  'srv-cinematography': Camera,
  'srv-podcast': Mic,
  'srv-post': Sliders,
};

const PROCESS_STEP_ICONS = [Lightbulb, Clapperboard, Camera, Play];

export const ServicesAndAbout: React.FC<ServicesAndAboutProps> = ({
  profile,
  lang,
}) => {
  const t = UI_COPY[lang];

  const getLocalizedService = (srv: ServiceItem) => {
    if (lang === 'en' && SERVICE_COPY[srv.id]?.en) {
      return {
        ...srv,
        ...SERVICE_COPY[srv.id].en,
      };
    }
    if (lang === 'ku' && SERVICE_COPY[srv.id]?.ku) {
      return {
        ...srv,
        ...SERVICE_COPY[srv.id].ku,
      };
    }
    return srv;
  };

  const localizedServices = CORE_SERVICES.map(getLocalizedService);

  return (
    <>
      {/* Strip 1: Editorial Expertise Strip (Non-interactive showcase) */}
      <section aria-label={t.expertiseStripTitle} className="border-y border-white/8 bg-[#0E1017]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="h-px flex-1 max-w-[140px] bg-gradient-to-l from-[#DFAF5A]/55 to-transparent" />
            <h2 className="text-base sm:text-lg font-bold tracking-wide text-[#F6DDA7] text-center">
              {t.expertiseStripTitle}
            </h2>
            <span className="h-px flex-1 max-w-[140px] bg-gradient-to-r from-[#DFAF5A]/55 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x rtl:divide-x-reverse divide-white/8">
            {localizedServices.map((srv) => {
              const Icon = SERVICE_ICONS[srv.id] || Video;
              return (
                <div
                  key={srv.id}
                  className="flex flex-col items-start text-start px-5 py-4"
                >
                  <div className="flex items-center mb-3">
                    <Icon className="w-5 h-5 text-[#DFAF5A]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#F4F5F7] leading-snug mb-1.5">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">{srv.shortDesc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Company & Team Split */}
      <section id="about" aria-labelledby="about-heading" className="py-20 sm:py-28 bg-[#090A0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-[#DFAF5A]/25 bg-[#12151E] min-h-[280px] lg:min-h-[420px]">
              <StudioArt
                variant="about-studio"
                alt={
                  lang === 'en'
                    ? 'Abc Gulf Productions Broadcast & Interview Studio'
                    : lang === 'ku'
                      ? 'ستۆدیۆی کۆمپانیای ئەی بی سی خەلیج بۆ وێنەگرتن و چاوپێکەوتنی تەلەفزیۆنی'
                      : 'استوديو أي بي سي الخليج للإنتاج الفني للتصوير والمقابلات التلفزيونية'
                }
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090A0E]/65 via-transparent to-transparent"
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="space-y-2.5">
                <p className="text-xs font-semibold tracking-wide text-[#DFAF5A]">{t.about.kicker}</p>
                <h2
                  id="about-heading"
                  className="text-2xl sm:text-4xl font-bold text-[#F8F9FA] leading-[1.2] text-balance"
                >
                  {lang === 'en'
                    ? profile.nameEn
                    : lang === 'ku'
                      ? profile.nameKu || 'ئەی بی سی خەلیج بۆ بەرهەمهێنانی هونەری'
                      : profile.nameAr}
                </h2>
              </div>

              <p className="text-base sm:text-lg text-[#D1D5DB] leading-relaxed">
                {lang === 'en'
                  ? t.about.summary
                  : lang === 'ku'
                    ? profile.aboutSummaryKu || t.about.summary
                    : profile.aboutSummary}
              </p>

              <div className="rounded-xl border border-white/10 bg-[#12151E] p-5 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#DFAF5A]/12 border border-[#DFAF5A]/25 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#DFAF5A]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F6DDA7] mb-1.5">{t.about.teamTitle}</h3>
                  <p className="text-sm text-[#A9AFBE] leading-relaxed">
                    {lang === 'en'
                      ? t.about.teamBody
                      : lang === 'ku'
                        ? profile.teamSummaryKu || t.about.teamBody
                        : profile.teamSummary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Services Showcase + Production Process (Static informational cards) */}
      <section
        id="services"
        aria-labelledby="services-heading"
        className="py-20 sm:py-28 border-t border-white/8 bg-[#0D0F15]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-[#DFAF5A] mb-2">
                {t.services.kicker}
              </p>
              <h2
                id="services-heading"
                className="text-2xl sm:text-4xl font-bold text-[#F8F9FA] leading-tight text-balance"
              >
                {t.services.heading}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#A9AFBE] leading-relaxed">
                {t.services.subheading}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {localizedServices.map((srv, idx) => {
              const Icon = SERVICE_ICONS[srv.id] || Video;
              const colSpanClass =
                idx < 2
                  ? 'md:col-span-6 lg:col-span-6'
                  : idx < 4
                    ? 'md:col-span-6 lg:col-span-4'
                    : 'md:col-span-12 lg:col-span-4';
              return (
                <article
                  key={srv.id}
                  className={`${colSpanClass} relative rounded-2xl border border-white/10 bg-[#131620] overflow-hidden flex flex-col select-text`}
                >
                  <div className="relative h-52 sm:h-60 overflow-hidden bg-[#0E1016]">
                    <StudioArt
                      variant={srv.artVariant}
                      alt={srv.title}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#131620] via-[#131620]/35 to-transparent"
                    />
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-5 h-5 text-[#DFAF5A] shrink-0" />
                        <h3 className="text-lg font-bold text-[#F8F9FA] leading-snug">
                          {srv.title}
                        </h3>
                      </div>
                      <p className="text-sm text-[#A9AFBE] leading-relaxed">{srv.shortDesc}</p>
                    </div>

                    <div className="pt-3 border-t border-white/8 text-xs text-[#9CA3AF]">
                      {srv.deliverables.join(' · ')}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 4-Step Production Process */}
          <div className="mt-20 pt-14 border-t border-white/8">
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-[#DFAF5A]/50 to-transparent" />
              <h3 className="text-lg sm:text-xl font-bold text-[#F8F9FA]">{t.services.processTitle}</h3>
              <span className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-[#DFAF5A]/50 to-transparent" />
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.services.steps.map((st, idx) => {
                const StepIcon = PROCESS_STEP_ICONS[idx] || Lightbulb;
                return (
                  <div
                    key={st.step}
                    className="flex flex-col items-center text-center p-6 rounded-xl border border-white/8 bg-[#12151E]"
                  >
                    <div className="w-12 h-12 rounded-full border border-[#DFAF5A]/55 bg-[#DFAF5A]/10 flex items-center justify-center mb-4">
                      <StepIcon className="w-5 h-5 text-[#DFAF5A]" />
                    </div>
                    <div className="text-xs font-code text-[#DFAF5A] mb-1">{st.step}</div>
                    <h4 className="text-base font-bold text-[#F8F9FA] mb-1.5">{st.title}</h4>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">{st.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
