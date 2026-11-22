export interface PointerOffset {
  x: number;
  y: number;
}

export interface MotionInput {
  pointer: PointerOffset;
  scrollProgress: number;
  baseRotationY: number;
}

export interface StudioMotionTargets {
  rigRotationY: number;
  rigRotationX: number;
  rigPositionY: number;
  lensRingRotationZ: number;
  clapperArmRotationZ: number;
  dustRotationY: number;
  dustPositionY: number;
  cameraFov: number;
  keyLightOffsetX: number;
  keyLightOffsetY: number;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeHeroScrollProgress(scrollY: number, heroHeight: number): number {
  const safeHeight = Math.max(heroHeight, 480);
  return clampNumber(scrollY / safeHeight, 0, 1.4);
}

export function normalizePointerToViewport(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): PointerOffset {
  const w = Math.max(rect.width, 1);
  const h = Math.max(rect.height, 1);
  const x = clampNumber(((clientX - rect.left) / w) * 2 - 1, -1, 1) || 0;
  const y = clampNumber(-(((clientY - rect.top) / h) * 2 - 1), -1, 1) || 0;
  return { x, y };
}

export function computeStudioMotionTargets(input: MotionInput): StudioMotionTargets {
  const px = clampNumber(input.pointer.x, -1, 1);
  const py = clampNumber(input.pointer.y, -1, 1);
  const scroll = clampNumber(input.scrollProgress, 0, 1.4);

  return {
    rigRotationY: input.baseRotationY + px * 0.26 + scroll * 0.62,
    rigRotationX: -py * 0.08 - scroll * 0.12,
    rigPositionY: -scroll * 0.3,
    lensRingRotationZ: px * 0.7 + scroll * 1.45,
    clapperArmRotationZ: 0.22 + Math.abs(px) * 0.14 + Math.min(scroll, 1) * 0.18,
    dustRotationY: px * 0.14 + scroll * 0.35,
    dustPositionY: scroll * 0.42,
    cameraFov: 40 - Math.min(scroll, 1) * 4.5,
    keyLightOffsetX: px * 1.85,
    keyLightOffsetY: py * 1.05,
  };
}

export function computeResponsiveViewOffset(
  width: number,
  height: number,
  lang: 'ar' | 'en',
): { offsetX: number; offsetY: number } {
  if (width >= 1024) {
    // Shift camera sub-window toward the text side so the 3D rig frames in the open side:
    // RTL ('ar'): text is on the right (+X), so positive offsetX places the 3D rig on the left.
    // LTR ('en'): text is on the left (-X), so negative offsetX places the 3D rig on the right.
    const ratioX = lang === 'ar' ? 0.22 : -0.22;
    return {
      offsetX: Math.round(width * ratioX),
      offsetY: 0,
    };
  }
  return {
    offsetX: 0,
    offsetY: Math.round(-height * 0.24),
  };
}
