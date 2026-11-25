import React, { useEffect, useRef } from 'react';

interface HeroFramePlayerProps {
  alt: string;
  frameCount?: number;
  fps?: number;
}

const formatFrameUrl = (index: number) =>
  `/hero-frames/frame-${String(index).padStart(3, '0')}.webp`;

/**
 * Plays a sequence of WebP frames smoothly on an HTML5 canvas at 24fps
 * while displaying frame 1 immediately for instant first paint.
 */
export const HeroFramePlayer: React.FC<HeroFramePlayerProps> = ({
  alt,
  frameCount = 60,
  fps = 15,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let cancelled = false;
    let isVisible = true;
    let currentFrame = 0;
    let lastDrawTime = 0;
    let rafId = 0;
    const frameInterval = 1000 / fps;

    const frames: (HTMLImageElement | null)[] = new Array(frameCount).fill(null);

    const drawFrame = (idx: number) => {
      const img = frames[idx];
      if (!img || !img.complete || img.naturalWidth === 0) return false;
      if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return true;
    };

    const loadBatch = (start: number, concurrency: number) => {
      if (cancelled || start >= frameCount) return;
      let nextToStart = start;
      let active = 0;

      const startNext = () => {
        if (cancelled) return;
        while (active < concurrency && nextToStart < frameCount) {
          const idx = nextToStart++;
          active++;
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            if (cancelled) return;
            frames[idx] = img;
            if (idx === 0) {
              drawFrame(0);
            }
            active--;
            startNext();
          };
          img.onerror = () => {
            active--;
            startNext();
          };
          img.src = formatFrameUrl(idx + 1);
        }
      };

      startNext();
    };

    loadBatch(0, 12);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(container);

    const tick = (now: number) => {
      if (!cancelled) {
        if (isVisible && now - lastDrawTime >= frameInterval) {
          const nextIdx = (currentFrame + 1) % frameCount;
          if (drawFrame(nextIdx)) {
            currentFrame = nextIdx;
            lastDrawTime = now;
          }
        }
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [frameCount, fps]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-h-[82vh] overflow-hidden bg-[#070605] flex items-center justify-center"
    >
      <img
        src="/hero-frames/frame-001.webp"
        alt={alt}
        fetchPriority="high"
        className="w-full h-auto max-h-[82vh] object-cover object-center block pointer-events-none select-none"
        style={{
          filter: 'saturate(1.5) contrast(1.14) brightness(1.06)',
        }}
      />

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        style={{
          filter: 'saturate(1.5) contrast(1.14) brightness(1.06)',
        }}
      />
    </div>
  );
};

