import React, { useEffect, useRef } from 'react';

interface HeroImage3DProps {
  src: string;
  alt: string;
}

/**
 * Renders the hero image inside a GPU-composited 3D perspective stage
 * with continuous subtle orbital 3D motion and interactive pointer tilt.
 */
export const HeroImage3D: React.FC<HeroImage3DProps> = ({ src, alt }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const plane = planeRef.current;
    const sheen = sheenRef.current;
    if (!container || !plane) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let pointerActive = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;
    const startTime = performance.now();

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
      const ny = ((clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1
      targetX = Math.max(-1, Math.min(1, nx));
      targetY = Math.max(-1, Math.min(1, ny));
      pointerActive = true;
    };

    const handlePointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const handlePointerLeave = () => {
      pointerActive = false;
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    const tick = (now: number) => {
      const t = (now - startTime) * 0.001;

      if (!pointerActive) {
        // Gentle continuous 3D orbital sway when idle
        targetX = Math.sin(t * 0.55) * 0.42;
        targetY = Math.cos(t * 0.42) * 0.35;
      }

      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      const rotateY = currentX * 6.5;
      const rotateX = -currentY * 4.5;
      const translateX = -currentX * 14;
      const translateY = -currentY * 10;

      plane.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg) translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(1.08)`;

      if (sheen) {
        const lx = 50 + currentX * 28;
        const ly = 45 + currentY * 22;
        sheen.style.background = `radial-gradient(circle at ${lx.toFixed(1)}% ${ly.toFixed(1)}%, rgba(243,192,103,0.16) 0%, transparent 55%)`;
      }

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
      className="relative w-full overflow-hidden bg-[#070605] select-none"
      style={{ perspective: '1200px' }}
    >
      <div
        ref={planeRef}
        className="w-full will-change-transform"
        style={{
          transform: 'perspective(1200px) scale(1.08)',
          transformStyle: 'preserve-3d',
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="w-full h-auto max-h-[82vh] object-cover object-center block"
        />
      </div>

      {/* Subtle dynamic 3D specular light reflection (non-blocking) */}
      <div
        ref={sheenRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-soft-light transition-opacity duration-300"
      />
    </div>
  );
};
