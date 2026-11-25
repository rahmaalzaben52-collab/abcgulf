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
      <section aria-label={t.expertiseStripTitle} className="border-y border-[#DDA146]/20 bg-[#0C0A07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="h-px flex-1 max-w-[140px] bg-gradient-to-l from-[#DDA146]/55 to-transparent" />
            <h2 className="text-base sm:text-lg font-bold tracking-wide text-[#F3C067] text-center">
              {t.expertiseStripTitle}
            </h2>
            <span className="h-px flex-1 max-w-[140px] bg-gradient-to-r from-[#DDA146]/55 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x rtl:divide-x-reverse divide-[#DDA146]/15">
            {localizedServices.map((srv) => {
              const Icon = SERVICE_ICONS[srv.id] || Video;
              return (
                <div
                  key={srv.id}
                  className="flex flex-col items-start text-start px-5 py-4"
                >
                  <div className="flex items-center mb-3">
                    <Icon className="w-5 h-5 text-[#DDA146]" />
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
      <section id="about" aria-labelledby="about-heading" className="py-20 sm:py-28 bg-[#070605] relative overflow-hidden">
        {/* Warm glow background accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 start-1/4 w-[420px] h-[420px] rounded-full bg-[#DDA146]/5 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden gold-card-frame bg-[#120F0A] min-h-[300px] lg:min-h-[440px] group">
              <img
                src="/images/about-abc-studio.jpg"
                alt={
                  lang === 'en'
                    ? 'Abc Gulf Productions Broadcast & Cinema Soundstage Studio'
                    : lang === 'ku'
                      ? 'ستۆدیۆی کۆمپانیای ئەی بی سی خەلیج بۆ بەرهەمهێنانی هونەری و سینەمایی'
                      : 'استوديو أي بي سي الخليج للإنتاج الفني والسينمائي'
                }
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070605]/80 via-transparent to-transparent"
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="space-y-2.5">
                <p className="text-xs font-semibold tracking-wide text-[#DDA146]">{t.about.kicker}</p>
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

              <a
                href="https://www.youtube.com/watch?si=cmOiuPFxhrPYSI3w&v=bFmnpyVmANk&feature=youtu.be"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-[#DDA146]/25 bg-[#120F0A] hover:border-[#DDA146] hover:bg-[#17130C] p-5 sm:p-6 flex items-start gap-4 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA146]"
              >
                <div className="w-10 h-10 rounded-lg bg-[#DDA146]/12 border border-[#DDA146]/30 flex items-center justify-center shrink-0 group-hover:bg-[#DDA146]/20 transition-colors">
                  <Users className="w-5 h-5 text-[#DDA146]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-[#F3C067] group-hover:text-[#FFF0C2] transition-colors">
                      {t.about.teamTitle}
                    </h3>
                    <Play className="w-3.5 h-3.5 text-[#DDA146] fill-[#DDA146]/30 shrink-0 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-sm text-[#A9AFBE] leading-relaxed">
                    {lang === 'en'
                      ? t.about.teamBody
                      : lang === 'ku'
                        ? profile.teamSummaryKu || t.about.teamBody
                        : profile.teamSummary}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Services Showcase + Production Process (Static informational cards) */}
      <section
        id="services"
        aria-labelledby="services-heading"
        className="py-20 sm:py-28 border-t border-[#DDA146]/20 bg-[#0C0A07]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-[#DDA146] mb-2">
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
                  className={`${colSpanClass} relative rounded-2xl border border-[#DDA146]/25 bg-[#120F0A] hover:border-[#DDA146]/70 hover:shadow-[0_0_22px_rgba(221,161,70,0.22)] transition-all overflow-hidden flex flex-col select-text`}
                >
                  <div className="relative h-52 sm:h-60 overflow-hidden bg-[#070605]">
                    <StudioArt
                      variant={srv.artVariant}
                      alt={srv.title}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120F0A] via-[#120F0A]/35 to-transparent"
                    />
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-5 h-5 text-[#DDA146] shrink-0" />
                        <h3 className="text-lg font-bold text-[#F8F9FA] leading-snug">
                          {srv.title}
                        </h3>
                      </div>
                      <p className="text-sm text-[#A9AFBE] leading-relaxed">{srv.shortDesc}</p>
                    </div>

                    <div className="pt-3 border-t border-[#DDA146]/15 text-xs text-[#9CA3AF]">
                      {srv.deliverables.join(' · ')}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 4-Step Production Process */}
          <div className="mt-20 pt-14 border-t border-[#DDA146]/20">
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-[#DDA146]/50 to-transparent" />
              <h3 className="text-lg sm:text-xl font-bold text-[#F8F9FA]">{t.services.processTitle}</h3>
              <span className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-[#DDA146]/50 to-transparent" />
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.services.steps.map((st, idx) => {
                const StepIcon = PROCESS_STEP_ICONS[idx] || Lightbulb;
                return (
                  <div
                    key={st.step}
                    className="flex flex-col items-center text-center p-6 rounded-xl border border-[#DDA146]/20 bg-[#120F0A] hover:border-[#DDA146]/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full border border-[#DDA146]/55 bg-[#DDA146]/10 flex items-center justify-center mb-4">
                      <StepIcon className="w-5 h-5 text-[#DDA146]" />
                    </div>
                    <div className="text-xs font-code text-[#DDA146] mb-1">{st.step}</div>
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
