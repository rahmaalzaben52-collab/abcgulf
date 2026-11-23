import React, { useState } from 'react';
import type { ArtVariant } from '../utils/siteStore';

interface StudioArtProps {
  variant: ArtVariant | 'about-studio' | 'amman-map';
  alt?: string;
  className?: string;
}

const PHOTO_ASSETS: Partial<Record<StudioArtProps['variant'], { src: string; alt: string }>> = {
  clapper: {
    src: '/src/assets/images/service_commercial_film_1795364637343.jpg',
    alt: 'Commercial and marketing film production set',
  },
  'tv-studio': {
    src: '/src/assets/images/service_tv_broadcast_1795364639497.jpg',
    alt: 'Television broadcast and short film soundstage',
  },
  'cinema-cam': {
    src: '/src/assets/images/service_cinema_camera_1795364638579.jpg',
    alt: '6K cinema camera rig and prime lens',
  },
  'podcast-mic': {
    src: '/src/assets/images/service_podcast_studio_1795364637467.jpg',
    alt: 'Acoustic podcast and interview studio',
  },
  'editing-suite': {
    src: '/src/assets/images/service_post_editing_1795364637668.jpg',
    alt: 'Color grading and post-production suite',
  },
  'drone-aerial': {
    src: '/src/assets/images/service_aerial_drone_1795364638710.jpg',
    alt: 'Cinema drone aerial filming at golden hour',
  },
  'about-studio': {
    src: '/assets/aistudio/a11b8692-2948-42ee-911f-ca42aaa8cbc6_8d81ffbb.jpg',
    alt: 'Abc Gulf Productions broadcast and interview studio',
  },
  'amman-map': {
    src: '/assets/aistudio/13b4429d-a925-40a6-88a6-8178ab48b7a3_3b02471d.jpg',
    alt: 'Erbil Boulevard studio location aerial map',
  },
};

export const StudioArt: React.FC<StudioArtProps> = ({ variant, alt, className = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const photo = PHOTO_ASSETS[variant];

  if (photo && !imgFailed) {
    return (
      <img
        src={photo.src}
        alt={alt || photo.alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setImgFailed(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  switch (variant) {
    case 'clapper':
      return (
        <svg viewBox="0 0 400 240" className={`w-full h-full object-cover ${className}`} aria-hidden="true">
          <defs>
            <linearGradient id="clapBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#12141B" />
              <stop offset="60%" stopColor="#1C1914" />
              <stop offset="100%" stopColor="#0C0D12" />
            </linearGradient>
            <radialGradient id="clapGlow" cx="68%" cy="35%" r="55%">
              <stop offset="0%" stopColor="#DFAF5A" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#DFAF5A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="240" fill="url(#clapBg)" />
          <rect width="400" height="240" fill="url(#clapGlow)" />
          <g transform="translate(115, 78)">
            <rect x="0" y="28" width="166" height="106" rx="6" fill="#171922" stroke="#DFAF5A" strokeOpacity="0.45" strokeWidth="1.5" />
            <g transform="rotate(-11, 0, 28)">
              <rect x="0" y="4" width="166" height="22" rx="3" fill="#222530" stroke="#DFAF5A" strokeOpacity="0.6" />
              <polygon points="18,4 36,4 24,26 6,26" fill="#DFAF5A" />
              <polygon points="56,4 74,4 62,26 44,26" fill="#DFAF5A" />
              <polygon points="94,4 112,4 100,26 82,26" fill="#DFAF5A" />
              <polygon points="132,4 150,4 138,26 120,26" fill="#DFAF5A" />
            </g>
          </g>
        </svg>
      );

    case 'concert':
      return (
        <svg viewBox="0 0 400 240" className={`w-full h-full object-cover ${className}`} aria-hidden="true">
          <rect width="400" height="240" fill="#0E1016" />
          <polygon points="200,0 285,210 115,210" fill="#DFAF5A" fillOpacity="0.22" />
        </svg>
      );

    case 'cinema-cam':
      return (
        <svg viewBox="0 0 400 240" className={`w-full h-full object-cover ${className}`} aria-hidden="true">
          <rect width="400" height="240" fill="#0D0E13" />
          <g transform="translate(105, 55)">
            <rect x="52" y="34" width="110" height="72" rx="8" fill="#1B1E28" stroke="#DFAF5A" strokeOpacity="0.45" />
            <circle cx="28" cy="70" r="14" fill="#0F172A" stroke="#DFAF5A" strokeWidth="2" />
          </g>
        </svg>
      );

    case 'city-skyline':
      return (
        <svg viewBox="0 0 400 240" className={`w-full h-full object-cover ${className}`} aria-hidden="true">
          <rect width="400" height="240" fill="#0E0F14" />
          <circle cx="200" cy="128" r="56" fill="#DFAF5A" fillOpacity="0.28" />
        </svg>
      );

    case 'tv-studio':
      return (
        <svg viewBox="0 0 400 240" className={`w-full h-full object-cover ${className}`} aria-hidden="true">
          <rect width="400" height="240" fill="#0E1016" />
          <rect x="115" y="34" width="170" height="92" rx="6" fill="#141824" stroke="#DFAF5A" strokeOpacity="0.45" strokeWidth="2" />
        </svg>
      );

    case 'editing-suite':
      return (
        <svg viewBox="0 0 400 240" className={`w-full h-full object-cover ${className}`} aria-hidden="true">
          <rect width="400" height="240" fill="#0E1016" />
          <rect x="55" y="42" width="136" height="86" rx="6" fill="#151924" stroke="#DFAF5A" strokeOpacity="0.45" />
          <rect x="68" y="92" width="110" height="8" rx="2" fill="#DFAF5A" fillOpacity="0.65" />
        </svg>
      );

    case 'drone-aerial':
      return (
        <img
          src="/gallery/drone-cinema-060.jpg"
          alt={alt}
          className={`w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${className}`}
        />
      );

    case 'podcast-mic':
      return (
        <svg viewBox="0 0 400 240" className={`w-full h-full object-cover ${className}`} aria-hidden="true">
          <rect width="400" height="240" fill="#0E1016" />
          <g transform="translate(200, 114)">
            <rect x="-24" y="-56" width="48" height="82" rx="24" fill="#1E212B" stroke="#DFAF5A" strokeWidth="2" />
          </g>
        </svg>
      );

    case 'about-studio':
      return (
        <svg viewBox="0 0 640 380" className={`w-full h-full object-cover ${className}`} aria-hidden="true">
          <rect width="640" height="380" fill="#12141B" />
          <g transform="translate(320, 178)">
            <rect x="-42" y="-28" width="84" height="46" rx="6" fill="#1C1F29" stroke="#DFAF5A" strokeWidth="2" />
          </g>
        </svg>
      );

    case 'amman-map':
      return (
        <svg viewBox="0 0 560 280" className={`w-full h-full object-cover ${className}`} aria-hidden="true">
          <rect width="560" height="280" fill="#11131A" />
          <g stroke="#252936" strokeWidth="1.5" fill="none">
            <path d="M0,45 Q180,90 320,55 T560,72" />
            <path d="M0,132 Q150,110 290,148 T560,126" />
            <path d="M0,210 Q190,185 360,224 T560,196" />
            <path d="M90,0 Q115,120 82,280" />
            <path d="M210,0 Q240,140 198,280" />
            <path d="M350,0 Q330,150 385,280" />
            <path d="M465,0 Q440,130 480,280" />
          </g>
          <path d="M40,260 Q250,140 520,30" stroke="#DFAF5A" strokeOpacity="0.35" strokeWidth="2.5" fill="none" />
          <g transform="translate(280, 118)">
            <circle cx="0" cy="24" r="34" fill="#DFAF5A" fillOpacity="0.14" />
            <path
              d="M0,-28 C-15,-28 -26,-16 -26,-2 C-26,16 0,38 0,38 C0,38 26,16 26,-2 C26,-16 15,-28 0,-28 Z"
              fill="#DFAF5A"
            />
            <circle cx="0" cy="-3" r="9" fill="#111319" />
          </g>
        </svg>
      );
  }
};
