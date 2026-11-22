import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeHeroScrollProgress,
  computeResponsiveViewOffset,
  computeStudioMotionTargets,
  normalizePointerToViewport,
} from './studioMotion';

test('normalizePointerToViewport maps coordinates into clamped [-1, 1] space', () => {
  const center = normalizePointerToViewport(500, 300, {
    left: 0,
    top: 0,
    width: 1000,
    height: 600,
  });
  assert.equal(center.x, 0);
  assert.equal(center.y, 0);

  const clamped = normalizePointerToViewport(2500, -400, {
    left: 0,
    top: 0,
    width: 1000,
    height: 600,
  });
  assert.equal(clamped.x, 1);
  assert.equal(clamped.y, 1);
});

test('computeHeroScrollProgress clamps cleanly from 0 to 1.4', () => {
  assert.equal(computeHeroScrollProgress(0, 700), 0);
  assert.equal(computeHeroScrollProgress(350, 700), 0.5);
  assert.equal(computeHeroScrollProgress(2500, 700), 1.4);
});

test('computeStudioMotionTargets responds to mouse movement and scroll down', () => {
  const idle = computeStudioMotionTargets({
    pointer: { x: 0, y: 0 },
    scrollProgress: 0,
    baseRotationY: 0,
  });
  const hovered = computeStudioMotionTargets({
    pointer: { x: 0.8, y: 0.5 },
    scrollProgress: 0,
    baseRotationY: 0,
  });
  const scrolled = computeStudioMotionTargets({
    pointer: { x: 0, y: 0 },
    scrollProgress: 0.75,
    baseRotationY: 0,
  });

  assert.ok(hovered.rigRotationY > idle.rigRotationY);
  assert.ok(hovered.lensRingRotationZ > idle.lensRingRotationZ);
  assert.ok(hovered.keyLightOffsetX > idle.keyLightOffsetX);

  assert.ok(scrolled.rigRotationY > idle.rigRotationY);
  assert.ok(scrolled.rigPositionY < idle.rigPositionY);
  assert.ok(scrolled.cameraFov < idle.cameraFov);
  assert.ok(scrolled.clapperArmRotationZ > idle.clapperArmRotationZ);
});

test('computeResponsiveViewOffset frames 3D rig opposite the text column in AR/EN desktop and below on mobile', () => {
  const arDesktop = computeResponsiveViewOffset(1440, 680, 'ar');
  const enDesktop = computeResponsiveViewOffset(1440, 680, 'en');
  const mobile = computeResponsiveViewOffset(390, 720, 'ar');

  assert.ok(arDesktop.offsetX > 0);
  assert.ok(enDesktop.offsetX < 0);
  assert.equal(arDesktop.offsetY, 0);
  assert.equal(mobile.offsetX, 0);
  assert.ok(mobile.offsetY < 0);
});
