import React, { useEffect, useRef } from 'react';

interface HeroImage3DProps {
  src: string;
  baseSrc?: string;
  alt: string;
}

interface FloatingLayerSpec {
  id: string;
  cx: number; // %
  cy: number; // %
  rx: number; // %
  ry: number; // %
  ampX: number; // px
  ampY: number; // px
  ampRot: number; // deg
  speed: number;
  phase: number;
  parallax: number;
}

const FLOATING_CLOUDS_AND_CAMERAS: FloatingLayerSpec[] = [
  { id: 'cam-top-left', cx: 20.5, cy: 19.5, rx: 17.5, ry: 19.5, ampX: 7, ampY: 8, ampRot: 1.1, speed: 0.75, phase: 0.0, parallax: 16 },
  { id: 'cam-low-left', cx: 32.8, cy: 39.0, rx: 8.2, ry: 9.2, ampX: 5, ampY: 6, ampRot: 0.9, speed: 0.95, phase: 1.4, parallax: 10 },
  { id: 'cam-mid-left', cx: 41.8, cy: 30.5, rx: 9.6, ry: 10.2, ampX: 6, ampY: 7, ampRot: 1.0, speed: 0.85, phase: 2.7, parallax: 12 },
  { id: 'cam-mid-right', cx: 70.0, cy: 25.8, rx: 9.6, ry: 10.8, ampX: 6, ampY: 6, ampRot: 1.0, speed: 0.8, phase: 3.9, parallax: 12 },
  { id: 'dish-top-right', cx: 84.2, cy: 20.0, rx: 13.2, ry: 18.8, ampX: 5, ampY: 8, ampRot: 0.8, speed: 0.68, phase: 5.1, parallax: 15 },
  { id: 'cam-far-right', cx: 92.2, cy: 39.8, rx: 8.4, ry: 9.4, ampX: 5, ampY: 6, ampRot: 1.1, speed: 0.92, phase: 2.1, parallax: 10 },
];

/**
 * Keeps the city, Erbil Citadel, minaret, and ground 100% static
 * while animating only the floating clouds, sky cameras, and satellite dish in 3D space.
 */
export const HeroImage3D: React.FC<HeroImage3DProps> = ({
  src,
  baseSrc = '/images/hero-erbil-base.jpg',
  alt,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let pointerX = 0;
    let pointerY = 0;
    let smoothPX = 0;
    let smoothPY = 0;
    let rafId = 0;
    const startTime = performance.now();

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    };

    const handlePointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    const tick = (now: number) => {
      const t = (now - startTime) * 0.001;
      smoothPX += (pointerX - smoothPX) * 0.05;
      smoothPY += (pointerY - smoothPY) * 0.05;

      FLOATING_CLOUDS_AND_CAMERAS.forEach((spec, idx) => {
        const el = layerRefs.current[idx];
        if (!el) return;

        const dx = Math.sin(t * spec.speed + spec.phase) * spec.ampX - smoothPX * spec.parallax;
        const dy = Math.cos(t * (spec.speed * 0.85) + spec.phase) * spec.ampY - smoothPY * (spec.parallax * 0.7);
        const rotZ = Math.sin(t * (spec.speed * 0.6) + spec.phase) * spec.ampRot;
        const rotY = smoothPX * 3.5;
        const rotX = -smoothPY * 2.5;

        el.style.transform = `perspective(1000px) translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;
      });

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-h-[82vh] overflow-hidden bg-[#070605] flex items-center justify-center select-none"
    >
      {/* Exact 16:9 stage so percentage masks align 1:1 with base image */}
      <div className="relative w-full aspect-[16/9]">
        {/* Static Base Image: Erbil Citadel, Minaret, City & Foreground Stay Still */}
        <img
          src={baseSrc}
          alt={alt}
          draggable={false}
          className="w-full h-full object-cover block"
        />

        {/* Independent Floating 3D Cloud + Camera Layers */}
        {FLOATING_CLOUDS_AND_CAMERAS.map((spec, idx) => {
          const mask = `radial-gradient(ellipse ${spec.rx}% ${spec.ry}% at ${spec.cx}% ${spec.cy}%, #000 58%, rgba(0,0,0,0.6) 76%, transparent 96%)`;
          return (
            <div
              key={spec.id}
              ref={(el) => {
                layerRefs.current[idx] = el;
              }}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 will-change-transform"
              style={{
                transformOrigin: `${spec.cx}% ${spec.cy}%`,
                WebkitMaskImage: mask,
                maskImage: mask,
              }}
            >
              <img
                src={src}
                alt=""
                draggable={false}
                className="w-full h-full object-cover block"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
