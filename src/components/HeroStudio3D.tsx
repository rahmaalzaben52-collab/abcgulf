import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  RotateCw,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { buildCinemaStudioScene, disposeObject3DTree } from '../three/cinemaRigBuilder';
import {
  computeHeroScrollProgress,
  computeResponsiveViewOffset,
  computeStudioMotionTargets,
  normalizePointerToViewport,
} from '../three/studioMotion';
import { UI_COPY, type Language } from '../utils/i18n';

export type CameraPresetKey = 'cinematic' | 'front' | 'lens' | 'wide';

interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

const CAMERA_PRESETS: Record<CameraPresetKey, CameraPreset> = {
  cinematic: {
    position: [3.45, 2.2, 4.15],
    target: [0.0, 1.05, 0.1],
  },
  front: {
    position: [0.15, 1.8, 4.6],
    target: [0, 1.15, 0.1],
  },
  lens: {
    position: [1.45, 1.85, 2.2],
    target: [0, 1.62, 0.55],
  },
  wide: {
    position: [-4.25, 2.75, 4.5],
    target: [0, 0.98, 0],
  },
};

interface HeroStudio3DProps {
  lang: Language;
  isAdmin: boolean;
  customModelName: string | null;
  pendingModelBuffer: ArrayBuffer | null;
  onModelLoaded: (fileName: string | null) => void;
  onUploadFileRequest: (file: File) => void;
}

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const HeroStudio3D: React.FC<HeroStudio3DProps> = ({
  lang,
  isAdmin,
  customModelName,
  pendingModelBuffer,
  onModelLoaded,
  onUploadFileRequest,
}) => {
  const dockCopy = UI_COPY[lang].dock;
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [autoRotate, setAutoRotate] = useState(true);
  const [webglError, setWebglError] = useState(false);
  const [modelStatus, setModelStatus] = useState<{ kind: 'loaded' | 'error'; fileName?: string } | null>(
    null,
  );

  // Mutable refs for imperative Three.js control without remounting renderer
  const langRef = useRef<Language>(lang);
  langRef.current = lang;
  const requestRenderRef = useRef<(() => void) | null>(null);
  const updateViewFramingRef = useRef<(() => void) | null>(null);
  const setPresetRef = useRef<((key: CameraPresetKey) => void) | null>(null);
  const setAutoRotateRef = useRef<((enabled: boolean) => void) | null>(null);
  const loadGltfBufferRef = useRef<((buffer: ArrayBuffer, name: string) => void) | null>(null);
  const restoreDefaultRigRef = useRef<(() => void) | null>(null);
  const onModelLoadedRef = useRef(onModelLoaded);
  onModelLoadedRef.current = onModelLoaded;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 1280;
    const height = container.clientHeight || 680;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: true,
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.setAttribute('data-testid', 'hero-3d-canvas');
    renderer.domElement.setAttribute('aria-label', '3D Cinema Production Studio');

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090a0e, 0.052);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
    const initial = CAMERA_PRESETS.cinematic;
    camera.position.set(...initial.position);

    const applyViewFraming = () => {
      const w = container.clientWidth || 1280;
      const h = container.clientHeight || 680;
      const { offsetX, offsetY } = computeResponsiveViewOffset(w, h, langRef.current);
      camera.aspect = w / h;
      camera.setViewOffset(w, h, offsetX, offsetY, w, h);
      camera.updateProjectionMatrix();
    };
    applyViewFraming();
    updateViewFramingRef.current = () => {
      applyViewFraming();
      requestRender();
    };

    const isMobileDevice = () =>
      typeof window !== 'undefined' &&
      (window.innerWidth < 1024 || 'ontouchstart' in window || navigator.maxTouchPoints > 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...initial.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    // Allow mouse wheel and touch gestures to scroll the website seamlessly
    controls.enableZoom = false;
    controls.minDistance = 2.0;
    controls.maxDistance = 8.5;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.autoRotate = !isSoftwareGl;
    controls.autoRotateSpeed = 0.45;

    // On mobile/touch devices, disable OrbitControls so swiping over the 3D model scrolls down smoothly
    if (isMobileDevice()) {
      controls.enabled = false;
      controls.enableRotate = false;
    }

    controls.update();

    // Three-point warm/cool studio lighting
    const hemiLight = new THREE.HemisphereLight(0x9ec5ff, 0x1a1510, 0.78);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe1b5, 2.5);
    keyLight.position.set(4.2, 6.2, 4.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdfaf5a, 1.95);
    rimLight.position.set(-4.0, 3.8, -3.5);
    scene.add(rimLight);

    const fillPoint = new THREE.PointLight(0x60a5fa, 1.15, 14, 2);
    fillPoint.position.set(-2.5, 2.2, 2.8);
    scene.add(fillPoint);

    // Build default procedural cinema rig
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const builtAssets = buildCinemaStudioScene(isSoftwareGl, maxAnisotropy);
    scene.add(builtAssets.root);

    let customModelGroup: THREE.Object3D | null = null;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Coalesced render, camera preset transitions, mouse parallax & scroll choreography
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let transitionActive = false;
    let lastTime = performance.now();

    const targetCamPos = new THREE.Vector3(...initial.position);
    const targetLookAt = new THREE.Vector3(...initial.target);

    const targetPointer = { x: 0, y: 0 };
    const currentPointer = { x: 0, y: 0 };
    let targetScroll = computeHeroScrollProgress(window.scrollY, height);
    let currentScroll = targetScroll;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        renderDirty = false;
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        if (transitionActive) {
          if (isSoftwareGl) {
            camera.position.copy(targetCamPos);
            controls.target.copy(targetLookAt);
            transitionActive = false;
          } else {
            const lambda = 6.5;
            camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamPos.x, lambda, delta);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamPos.y, lambda, delta);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamPos.z, lambda, delta);
            controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLookAt.x, lambda, delta);
            controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLookAt.y, lambda, delta);
            controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLookAt.z, lambda, delta);

            if (
              camera.position.distanceToSquared(targetCamPos) < 0.0008 &&
              controls.target.distanceToSquared(targetLookAt) < 0.0008
            ) {
              camera.position.copy(targetCamPos);
              controls.target.copy(targetLookAt);
              transitionActive = false;
            }
          }
        }

        // Smooth mouse parallax & scroll choreography
        let motionSettled = true;
        if (isSoftwareGl) {
          currentPointer.x = targetPointer.x;
          currentPointer.y = targetPointer.y;
          currentScroll = targetScroll;
        } else {
          const motionLambda = 6.0;
          currentPointer.x = THREE.MathUtils.damp(currentPointer.x, targetPointer.x, motionLambda, delta);
          currentPointer.y = THREE.MathUtils.damp(currentPointer.y, targetPointer.y, motionLambda, delta);
          currentScroll = THREE.MathUtils.damp(currentScroll, targetScroll, motionLambda, delta);

          const remaining =
            Math.abs(currentPointer.x - targetPointer.x) +
            Math.abs(currentPointer.y - targetPointer.y) +
            Math.abs(currentScroll - targetScroll);
          motionSettled = remaining < 0.0015;
        }

        const motion = computeStudioMotionTargets({
          pointer: currentPointer,
          scrollProgress: currentScroll,
          baseRotationY: 0,
        });

        builtAssets.subjectGroup.rotation.y = motion.rigRotationY;
        builtAssets.subjectGroup.rotation.x = motion.rigRotationX;
        builtAssets.subjectGroup.position.y = motion.rigPositionY;
        builtAssets.lensRing.rotation.z = motion.lensRingRotationZ;
        builtAssets.clapperTopArm.rotation.z = motion.clapperArmRotationZ;
        builtAssets.dustPoints.rotation.y = motion.dustRotationY;
        builtAssets.dustPoints.position.y = motion.dustPositionY;
        keyLight.position.set(4.2 + motion.keyLightOffsetX, 6.2 + motion.keyLightOffsetY, 4.5);

        if (Math.abs(camera.fov - motion.cameraFov) > 0.005) {
          camera.fov = motion.cameraFov;
          camera.updateProjectionMatrix();
        }

        // Expose reactive transform state for observability
        renderer.domElement.setAttribute('data-scroll-progress', currentScroll.toFixed(3));
        renderer.domElement.setAttribute('data-pointer-x', currentPointer.x.toFixed(3));
        renderer.domElement.setAttribute('data-pointer-y', currentPointer.y.toFixed(3));
        renderer.domElement.setAttribute('data-rig-yaw', motion.rigRotationY.toFixed(3));

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (
            renderDirty ||
            transitionActive ||
            !motionSettled ||
            (!isSoftwareGl && controls.autoRotate)
          ) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    };

    requestRenderRef.current = requestRender;

    const handleControlsStart = () => {
      transitionActive = false;
    };
    const handleControlsChange = () => {
      requestRender();
    };
    controls.addEventListener('start', handleControlsStart);
    controls.addEventListener('change', handleControlsChange);

    // Interactive website mouse parallax (desktop only)
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const next = normalizePointerToViewport(e.clientX, e.clientY, rect);
      targetPointer.x = next.x;
      targetPointer.y = next.y;
      requestRender();
    };

    const handlePointerLeave = () => {
      targetPointer.x = 0;
      targetPointer.y = 0;
      requestRender();
    };

    // Interactive website scroll-down choreography
    const handleScroll = () => {
      const h = container.clientHeight || 680;
      targetScroll = computeHeroScrollProgress(window.scrollY, h);
      requestRender();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });

    setPresetRef.current = (key: CameraPresetKey) => {
      const preset = CAMERA_PRESETS[key];
      targetCamPos.set(...preset.position);
      targetLookAt.set(...preset.target);
      transitionActive = true;
      requestRender();
    };

    setAutoRotateRef.current = (enabled: boolean) => {
      controls.autoRotate = !isSoftwareGl && enabled;
      requestRender();
    };

    loadGltfBufferRef.current = (buffer: ArrayBuffer, fileName: string) => {
      const loader = new GLTFLoader();
      loader.parse(
        buffer,
        '',
        (gltf) => {
          if (customModelGroup) {
            builtAssets.subjectGroup.remove(customModelGroup);
            disposeObject3DTree(customModelGroup);
            customModelGroup = null;
          }
          const loaded = gltf.scene;
          const box = new THREE.Box3().setFromObject(loaded);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z, 0.001);
          const scaleFactor = 2.4 / maxDim;
          loaded.scale.setScalar(scaleFactor);

          loaded.position.x = -center.x * scaleFactor;
          loaded.position.z = -center.z * scaleFactor;
          loaded.position.y = -box.min.y * scaleFactor;

          loaded.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.castShadow = !isSoftwareGl;
              mesh.receiveShadow = true;
            }
          });

          builtAssets.rigGroup.visible = false;
          customModelGroup = loaded;
          builtAssets.subjectGroup.add(loaded);
          onModelLoadedRef.current(fileName);
          setModelStatus({ kind: 'loaded', fileName });
          requestRender();
        },
        () => {
          setModelStatus({ kind: 'error' });
        },
      );
    };

    restoreDefaultRigRef.current = () => {
      if (customModelGroup) {
        builtAssets.subjectGroup.remove(customModelGroup);
        disposeObject3DTree(customModelGroup);
        customModelGroup = null;
      }
      builtAssets.rigGroup.visible = true;
      onModelLoadedRef.current(null);
      setModelStatus(null);
      requestRender();
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1280;
      const h = container.clientHeight || 680;
      applyViewFraming();
      renderer.setSize(w, h);
      const isMobile = w < 1024 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      controls.enabled = !isMobile;
      controls.enableRotate = !isMobile;
      if (isMobile) {
        renderer.domElement.style.touchAction = 'pan-y';
      }
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Initial render
    requestRender();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('scroll', handleScroll);
      controls.removeEventListener('start', handleControlsStart);
      controls.removeEventListener('change', handleControlsChange);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      if (customModelGroup) {
        disposeObject3DTree(customModelGroup);
      }
      builtAssets.disposables.forEach((d) => d.dispose());
      envTarget.dispose();
      renderer.dispose();
      requestRenderRef.current = null;
      updateViewFramingRef.current = null;
      setPresetRef.current = null;
      setAutoRotateRef.current = null;
      loadGltfBufferRef.current = null;
      restoreDefaultRigRef.current = null;
    };
  }, []);

  // Re-frame camera view offset cleanly when switching AR (RTL) <-> EN (LTR)
  useEffect(() => {
    updateViewFramingRef.current?.();
  }, [lang]);

  // Load any pending GLB buffer passed from Studio Customizer
  useEffect(() => {
    if (pendingModelBuffer && customModelName && loadGltfBufferRef.current) {
      loadGltfBufferRef.current(pendingModelBuffer, customModelName);
    }
  }, [pendingModelBuffer, customModelName]);

  const handleAutoRotateToggle = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    setAutoRotateRef.current?.(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadFileRequest(file);
    e.target.value = '';
  };

  return (
    <div className="relative w-full h-full">
      {/* Seamless Full-Bleed Three.js WebGL Stage (zero box frame or border) */}
      <div
        ref={mountRef}
        className="w-full h-full pointer-events-none lg:pointer-events-auto cursor-grab active:cursor-grabbing touch-pan-y"
      />

      {/* Fallback message if WebGL context is unavailable */}
      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090A0E] p-6 text-center z-10">
          <Camera className="w-10 h-10 text-[#DFAF5A] mb-3" />
          <p className="text-sm text-[#E5E7EB] font-semibold">
            {lang === 'ar'
              ? 'تعذر تشغيل محرك العرض ثلاثي الأبعاد على هذا المتصفح.'
              : '3D WebGL renderer could not initialize in this browser.'}
          </p>
        </div>
      )}

      {/* Subtle status notice when a custom model is loaded or fails */}
      {modelStatus && (isAdmin || modelStatus.kind === 'error') && (
        <div className="absolute top-4 end-4 z-20 flex items-center gap-3 rounded-lg bg-[#14161D]/95 border border-[#DFAF5A]/35 px-3 py-2 text-xs text-[#F4F5F7]">
          <span>
            {modelStatus.kind === 'loaded'
              ? `${dockCopy.loadedPrefix} ${modelStatus.fileName ?? ''}`
              : dockCopy.parseError}
          </span>
          {isAdmin && (
            <button
              type="button"
              onClick={() => restoreDefaultRigRef.current?.()}
              className="text-[#DFAF5A] hover:text-[#F6DDA7] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              {dockCopy.restore}
            </button>
          )}
        </div>
      )}

      {/* Hidden file input for .glb / .gltf upload (Admin only) */}
      {isAdmin && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf"
          onChange={handleFileChange}
          className="hidden"
          aria-label={dockCopy.upload}
        />
      )}

      {/* Clean minimal control bar (Auto-rotate & admin upload) without any camera presets or hide button */}
      <div className="absolute bottom-4 inset-x-4 lg:inset-x-auto lg:end-8 z-25 flex items-center justify-end max-w-[94%] mx-auto pointer-events-auto">
        <div className="flex items-center gap-1 rounded-xl bg-[#14161D]/95 border border-white/12 px-2 py-1.5 shadow-2xl">
          <button
            type="button"
            onClick={handleAutoRotateToggle}
            aria-pressed={autoRotate}
            aria-label={dockCopy.rotate}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              autoRotate
                ? 'bg-white/10 text-[#F6DDA7]'
                : 'text-[#9CA3AF] hover:text-white hover:bg-white/6'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{dockCopy.rotate}</span>
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium bg-[#DFAF5A]/15 text-[#F6DDA7] border border-[#DFAF5A]/35 hover:bg-[#DFAF5A]/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{dockCopy.upload}</span>
              </button>

              {customModelName && (
                <button
                  type="button"
                  onClick={() => restoreDefaultRigRef.current?.()}
                  aria-label={dockCopy.restore}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-[#C5C9D3] hover:text-white hover:bg-white/6 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
