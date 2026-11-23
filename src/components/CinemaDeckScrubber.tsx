import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  Camera,
  Compass,
  Film,
  Sparkles,
  Maximize2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Language } from '../utils/i18n';

interface CinemaDeckScrubberProps {
  lang: Language;
}

const TOTAL_FRAMES = 120;
const FPS = 24;

const SCENE_BOOKMARKS = [
  { frame: 1, labelAr: 'الإطلالة الجوية للقلعة', labelEn: 'Aerial Citadel Overview', labelKu: 'دیمەنی ئاسمانی قەڵا' },
  { frame: 35, labelAr: 'الأسوار والأروقة التراثية', labelEn: 'Ancient Bastion & Walls', labelKu: 'شوورە و کۆڵانە دێرینەکان' },
  { frame: 70, labelAr: 'البوابة الملكية والعمق الهندسي', labelEn: 'Grand Heritage Portal', labelKu: 'دەروازەی شکۆداری کۆن' },
  { frame: 110, labelAr: 'الضوء الذهبي والمدى الأفق', labelEn: 'Golden Hour Horizon', labelKu: 'ئاسۆی زێڕینی خۆرئاوابوون' },
];

export const CinemaDeckScrubber: React.FC<CinemaDeckScrubberProps> = ({ lang }) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Preload next and previous frames into memory for ultra-smooth scrubbing
  useEffect(() => {
    const preloadRange = 5;
    for (let i = -preloadRange; i <= preloadRange; i++) {
      const target = ((currentFrame + i - 1 + TOTAL_FRAMES) % TOTAL_FRAMES) + 1;
      const img = new Image();
      img.src = `/frames/thumbs/thumb-${target.toString().padStart(3, '0')}.webp`;
    }
  }, [currentFrame]);

  // Playback loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const interval = 1000 / (FPS * speed);

    const loop = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp;
      const delta = timestamp - lastTickRef.current;

      if (delta >= interval) {
        lastTickRef.current = timestamp;
        setCurrentFrame((prev) => (prev >= TOTAL_FRAMES ? 1 : prev + 1));
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTickRef.current = 0;
    };
  }, [isPlaying, speed]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentFrame(parseInt(e.target.value, 10));
  };

  const handleStep = useCallback((direction: -1 | 1) => {
    setIsPlaying(false);
    setCurrentFrame((prev) => {
      const next = prev + direction;
      if (next < 1) return TOTAL_FRAMES;
      if (next > TOTAL_FRAMES) return 1;
      return next;
    });
  }, []);

  // Keyboard navigation support (Arrow keys to scrub, Space to play/pause)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleStep(lang === 'en' ? 1 : -1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleStep(lang === 'en' ? -1 : 1);
    } else if (e.key === ' ') {
      e.preventDefault();
      setIsPlaying((p) => !p);
    }
  };

  // Timecode calculation
  const seconds = Math.floor(currentFrame / FPS);
  const framesRemainder = currentFrame % FPS;
  const timecode = `00:00:0${seconds}:${framesRemainder.toString().padStart(2, '0')}`;

  const padFrame = currentFrame.toString().padStart(3, '0');
  const mainImageSrc = `/frames/frame-${padFrame}.webp`;
  const thumbImageSrc = `/frames/thumbs/thumb-${padFrame}.webp`;

  const copy = {
    title:
      lang === 'en'
        ? 'Interactive Aerial Cinematography Suite'
        : lang === 'ku'
          ? 'ژووری مۆنتاژ و کۆنتڕۆڵی دیمەنی ئاسمانی 4K'
          : 'منصة التحكم بالمشاهد والتصوير الجوي السينمائي 4K',
    subtitle:
      lang === 'en'
        ? 'Interactive 120-frame aerial drone sequence filmed over historic Erbil Citadel. Scrub, inspect, and analyze cinematic production quality in real-time.'
        : lang === 'ku'
          ? 'تۆمارکراوی دیمەنی 4K بە فڕۆکەی درۆن بەسەر قەڵای دێرینی هەولێر. دەتوانیت بە دەستکاری کات دیمەنەکان لێبدەیتەوە و چاودێری کوالێتی سینەمایی بکەیت.'
          : 'لقطات جوية سينمائية فائقة الدقة 4K تم تصويرها بطائرات الدرون الاحترافية فوق قلعة أربيل التاريخية. اسحب شريط المونتاج واستكشف دقة وتدرج الألوان السينمائية.',
    play: lang === 'en' ? 'Play sequence' : lang === 'ku' ? 'لێدان' : 'تشغيل',
    pause: lang === 'en' ? 'Pause' : lang === 'ku' ? 'ڕاگرتن' : 'إيقاف',
    reset: lang === 'en' ? 'Reset' : lang === 'ku' ? 'دەستپێکردنەوە' : 'إعادة',
    speed: lang === 'en' ? 'Speed' : lang === 'ku' ? 'خێرایی' : 'السرعة',
    landmarks: lang === 'en' ? 'Key Cinema Angles' : lang === 'ku' ? 'گۆشە سەرەکییەکان' : 'أبرز الزوايا السينمائية',
    telemetry: {
      resolution: '4K DCI (4096 × 2160)',
      fps: '24 FPS True Cinema',
      lens: '35mm Cinema Prime · f/1.8',
      iso: 'ISO 100 · 1/50s Shutter',
      color: 'Rec.709 Golden Amber LUT',
    },
  };

  return (
    <section
      id="cinema-suite"
      aria-labelledby="cinema-suite-heading"
      className="py-20 sm:py-28 bg-[#070605] border-t border-[#DDA146]/20 relative overflow-hidden"
    >
      {/* Background flare */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 end-1/4 w-[500px] h-[500px] rounded-full bg-[#DDA146]/6 blur-3xl"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="w-8 h-px bg-[#DDA146]" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-wider text-[#DDA146] uppercase">
              {lang === 'en' ? 'Aerial Drone Cinema' : lang === 'ku' ? 'وێنەگری ئاسمانی درۆن' : 'التصوير الجوي والسينمائي'}
            </span>
          </div>
          <h2
            id="cinema-suite-heading"
            className="text-2xl sm:text-4xl font-bold text-[#F8F9FA] leading-tight text-balance"
          >
            {copy.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#A9AFBE] leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        {/* Master Cinema Scrubber Console */}
        <div
          ref={containerRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label={copy.title}
          className="rounded-2xl border-2 border-[#DDA146]/35 bg-[#0C0A07] shadow-[0_0_35px_rgba(221,161,70,0.18)] overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-[#DDA146]"
        >
          {/* Top Console Deck Bar: Camera Telemetry & Specs */}
          <div className="px-4 sm:px-6 py-3 bg-[#0E0C09] border-b border-[#DDA146]/20 flex flex-wrap items-center justify-between gap-4 text-xs font-code">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600/20 border border-red-500/40 text-red-400 font-bold tracking-wider text-[11px]">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                REC 4K
              </span>
              <span className="text-[#F3C067] font-bold tracking-wider">{timecode}</span>
              <span className="text-[#8E95A5] hidden md:inline">
                FRAME {currentFrame.toString().padStart(3, '0')} / {TOTAL_FRAMES}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-4 text-[#A9AFBE]">
              <span>{copy.telemetry.resolution}</span>
              <span>·</span>
              <span>{copy.telemetry.lens}</span>
              <span>·</span>
              <span>{copy.telemetry.color}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
                aria-label={copy.speed}
                className="px-2.5 py-1 rounded border border-[#DDA146]/30 bg-[#120F0A] hover:border-[#DDA146] text-[#F3C067] text-[11px] font-bold cursor-pointer transition-colors"
              >
                {speed}x
              </button>
            </div>
          </div>

          {/* Main Viewport Stage */}
          <div className="relative aspect-video w-full bg-[#050403] overflow-hidden select-none group">
            {/* Background image loading state */}
            <picture>
              <source srcSet={mainImageSrc} type="image/webp" />
              <img
                src={thumbImageSrc}
                alt={`Drone Cinematography Frame ${currentFrame}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </picture>

            {/* Cinematic Camera Grid Overlay (Rule of Thirds crosshairs) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-20 transition-opacity group-hover:opacity-40"
            >
              <div className="w-full h-full border border-white/20 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            </div>

            {/* Corner Bracket Accents (Cinema Viewfinder Style) */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-4 border border-[#DDA146]/20 rounded-lg">
              <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#DDA146]" />
              <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#DDA146]" />
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#DDA146]" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#DDA146]" />
            </div>

            {/* Telemetry HUD overlay in corners */}
            <div className="absolute top-6 start-6 bg-[#070605]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#DDA146]/30 text-[11px] font-code text-[#F6DDA7]">
              DRONE TELEMETRY · ERBIL CITADEL
            </div>
            <div className="absolute top-6 end-6 bg-[#070605]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#DDA146]/30 text-[11px] font-code text-[#A9AFBE]">
              ALT: 128M · 24.000 FPS
            </div>
          </div>

          {/* Interactive Scrubbing Slider Bar */}
          <div className="px-4 sm:px-6 py-4 bg-[#0E0C09] border-t border-[#DDA146]/20 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-code text-[#8E95A5]">
                <span>TIMELINE 00:00:00:01</span>
                <span className="text-[#DDA146] font-bold">FRAME {currentFrame} / {TOTAL_FRAMES}</span>
                <span>TIMELINE 00:00:05:00</span>
              </div>

              {/* Range Input Slider with Custom Gold Styling */}
              <input
                type="range"
                min="1"
                max={TOTAL_FRAMES}
                value={currentFrame}
                onChange={handleSliderChange}
                aria-label="Cinema timeline scrubber"
                className="w-full h-2 bg-[#1A1610] rounded-lg appearance-none cursor-pointer accent-[#DDA146] focus:outline-none focus:ring-2 focus:ring-[#DDA146]/60"
              />
            </div>

            {/* Playback Controls & Bookmark Jump Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? copy.pause : copy.play}
                  className="w-11 h-11 rounded-xl bg-gradient-to-r from-[#DDA146] to-[#F3C067] hover:brightness-110 text-[#070605] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(221,161,70,0.3)] cursor-pointer transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleStep(-1)}
                  aria-label="Previous frame"
                  className="w-10 h-10 rounded-xl border border-[#DDA146]/30 bg-[#120F0A] hover:border-[#DDA146] text-[#F3C067] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleStep(1)}
                  aria-label="Next frame"
                  className="w-10 h-10 rounded-xl border border-[#DDA146]/30 bg-[#120F0A] hover:border-[#DDA146] text-[#F3C067] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrame(1);
                  }}
                  aria-label={copy.reset}
                  className="w-10 h-10 rounded-xl border border-white/12 bg-[#120F0A] hover:border-[#DDA146] text-[#A9AFBE] hover:text-[#F8F9FA] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Bookmark Quick Jump Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-[#8E95A5] hidden md:inline">{copy.landmarks}:</span>
                {SCENE_BOOKMARKS.map((b) => {
                  const isActive = Math.abs(currentFrame - b.frame) < 15;
                  const label = lang === 'en' ? b.labelEn : lang === 'ku' ? b.labelKu : b.labelAr;
                  return (
                    <button
                      key={b.frame}
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentFrame(b.frame);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#DDA146] bg-[#DDA146]/15 text-[#F3C067] shadow-[0_0_10px_rgba(221,161,70,0.2)]'
                          : 'border-white/10 bg-[#120F0A] text-[#C5C9D3] hover:border-[#DDA146]/40 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
