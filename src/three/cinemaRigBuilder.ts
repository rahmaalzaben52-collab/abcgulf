import * as THREE from 'three';

export interface StudioSceneAssets {
  root: THREE.Group;
  subjectGroup: THREE.Group;
  rigGroup: THREE.Group;
  clapperTopArm: THREE.Mesh;
  lensRing: THREE.Mesh;
  dustPoints: THREE.Points;
  disposables: Array<{ dispose: () => void }>;
}

function createMonitorScreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.55, '#1e293b');
    grad.addColorStop(1, '#2d2214');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    // Subtle studio subject silhouette on the monitor screen
    const glow = ctx.createRadialGradient(256, 155, 16, 256, 155, 145);
    glow.addColorStop(0, 'rgba(223, 175, 90, 0.42)');
    glow.addColorStop(0.6, 'rgba(59, 130, 246, 0.14)');
    glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 512, 320);

    // Center silhouette figure
    ctx.fillStyle = 'rgba(11, 12, 16, 0.85)';
    ctx.beginPath();
    ctx.arc(256, 128, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(212, 164, 88, 95, 28);
    ctx.fill();

    // Cinema framing rule-of-thirds & safe guides
    ctx.strokeStyle = 'rgba(223, 175, 90, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, 24, 464, 272);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(178, 24);
    ctx.lineTo(178, 296);
    ctx.moveTo(334, 24);
    ctx.lineTo(334, 296);
    ctx.moveTo(24, 114);
    ctx.lineTo(488, 114);
    ctx.moveTo(24, 206);
    ctx.lineTo(488, 206);
    ctx.stroke();

    // Center crosshair
    ctx.strokeStyle = 'rgba(223, 175, 90, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(244, 160);
    ctx.lineTo(268, 160);
    ctx.moveTo(256, 148);
    ctx.lineTo(256, 172);
    ctx.stroke();

    // Telemetry strip on monitor
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(46, 46, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('REC  4K 60FPS  RAW', 62, 52);

    ctx.fillStyle = '#dfaf5a';
    ctx.font = '14px monospace';
    ctx.fillText('ISO 800   f/1.8   24mm', 34, 282);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createClapperTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#14161d';
    ctx.fillRect(0, 0, 512, 384);

    // Top diagonal gold & charcoal stripes
    ctx.fillStyle = '#dfaf5a';
    for (let x = -64; x < 580; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 32, 0);
      ctx.lineTo(x + 6, 68);
      ctx.lineTo(x - 26, 68);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(223, 175, 90, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 88, 472, 272);

    ctx.beginPath();
    ctx.moveTo(20, 175);
    ctx.lineTo(492, 175);
    ctx.moveTo(20, 265);
    ctx.lineTo(492, 265);
    ctx.moveTo(256, 175);
    ctx.lineTo(256, 360);
    ctx.stroke();

    ctx.fillStyle = '#f4f5f7';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('ABC GULF PRODUCTIONS', 66, 142);

    ctx.fillStyle = '#dfaf5a';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SCENE: 01', 42, 226);
    ctx.fillText('TAKE:  04', 282, 226);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('CAM A  4K', 42, 322);
    ctx.fillText('DIR: STUDIO', 282, 322);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createBrushedBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 2) {
      const shade = 112 + ((y * 37) % 32);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, 256, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createStagePoolTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(256, 256, 18, 256, 256, 250);
    grad.addColorStop(0, 'rgba(223, 175, 90, 0.14)');
    grad.addColorStop(0.32, 'rgba(22, 26, 38, 0.42)');
    grad.addColorStop(0.7, 'rgba(9, 10, 14, 0.18)');
    grad.addColorStop(1, 'rgba(9, 10, 14, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createDustSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 240, 205, 0.95)');
    grad.addColorStop(0.4, 'rgba(223, 175, 90, 0.45)');
    grad.addColorStop(1, 'rgba(223, 175, 90, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildCinemaStudioScene(
  isSoftwareGl: boolean,
  maxAnisotropy: number,
): StudioSceneAssets {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const root = new THREE.Group();
  const subjectGroup = new THREE.Group();
  const rigGroup = new THREE.Group();
  subjectGroup.add(rigGroup);
  root.add(subjectGroup);

  const bumpTex = track(createBrushedBumpTexture());
  const monitorTex = track(createMonitorScreenTexture(maxAnisotropy));
  const clapperTex = track(createClapperTexture(maxAnisotropy));
  const contactShadowTex = track(createContactShadowTexture());
  const stagePoolTex = track(createStagePoolTexture());
  const dustTex = track(createDustSpriteTexture());

  // Materials with calibrated roughness/metalness contrast
  const matteCarbonMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1b1e26,
      roughness: 0.72,
      metalness: 0.22,
      bumpMap: bumpTex,
      bumpScale: 0.004,
    }),
  );

  const darkAnodizedMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x2a2e39,
      roughness: 0.38,
      metalness: 0.82,
      bumpMap: bumpTex,
      bumpScale: 0.003,
    }),
  );

  const brushedGoldMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xdfaf5a,
      roughness: 0.22,
      metalness: 0.94,
      anisotropy: 0.75,
      anisotropyRotation: 0.25,
      clearcoat: 0.2,
    }),
  );

  const lensGlassMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x8cc8ff,
      roughness: 0.04,
      metalness: 0.05,
      ior: 1.54,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transmission: isSoftwareGl ? 0 : 0.88,
      thickness: 0.6,
      attenuationColor: new THREE.Color(0x38bdf8),
      attenuationDistance: 1.2,
      transparent: true,
      opacity: isSoftwareGl ? 0.42 : 1.0,
    }),
  );

  const monitorScreenMat = track(
    new THREE.MeshStandardMaterial({
      map: monitorTex,
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveMap: monitorTex,
      emissiveIntensity: 0.55,
      roughness: 0.15,
      metalness: 0.05,
    }),
  );

  const ringAccentMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xdfaf5a,
      emissive: 0x8a6121,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.85,
      transparent: true,
      opacity: 0.72,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );

  const outerRingMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xdfaf5a,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );

  // 1. Seamless Transparent Studio Stage Pool & Calibration Rings (blends smoothly into page background)
  const stagePoolGeo = track(new THREE.CircleGeometry(4.4, 64));
  stagePoolGeo.rotateX(-Math.PI / 2);
  const stagePoolMat = track(
    new THREE.MeshBasicMaterial({
      map: stagePoolTex,
      transparent: true,
      depthWrite: false,
    }),
  );
  const stagePoolMesh = new THREE.Mesh(stagePoolGeo, stagePoolMat);
  stagePoolMesh.position.y = 0.002;
  subjectGroup.add(stagePoolMesh);

  const stageRingGeo = track(new THREE.RingGeometry(2.05, 2.09, 64));
  stageRingGeo.rotateX(-Math.PI / 2);
  const stageRingMesh = new THREE.Mesh(stageRingGeo, ringAccentMat);
  stageRingMesh.position.y = 0.02;
  subjectGroup.add(stageRingMesh);

  const outerRingGeo = track(new THREE.RingGeometry(2.58, 2.595, 64));
  outerRingGeo.rotateX(-Math.PI / 2);
  const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRingMesh.position.y = 0.018;
  subjectGroup.add(outerRingMesh);

  const contactGeo = track(new THREE.CircleGeometry(1.75, 48));
  contactGeo.rotateX(-Math.PI / 2);
  const contactMat = track(
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    }),
  );
  const contactShadow = new THREE.Mesh(contactGeo, contactMat);
  contactShadow.position.y = 0.015;
  subjectGroup.add(contactShadow);

  // 2. Heavy-Duty Tripod Assembly (grounded at y = 0)
  const legGeo = track(new THREE.CylinderGeometry(0.036, 0.024, 1.48, 12));
  const footGeo = track(new THREE.CylinderGeometry(0.048, 0.058, 0.05, 16));
  const tripodTopY = 1.24;
  const legRadius = 0.72;

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const footX = Math.cos(angle) * legRadius;
    const footZ = Math.sin(angle) * legRadius;

    const foot = new THREE.Mesh(footGeo, brushedGoldMat);
    foot.position.set(footX, 0.025, footZ);
    foot.castShadow = true;
    rigGroup.add(foot);

    const start = new THREE.Vector3(footX, 0.04, footZ);
    const end = new THREE.Vector3(Math.cos(angle) * 0.14, tripodTopY, Math.sin(angle) * 0.14);
    const mid = start.clone().add(end).multiplyScalar(0.5);

    const leg = new THREE.Mesh(legGeo, matteCarbonMat);
    leg.position.copy(mid);
    leg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      end.clone().sub(start).normalize(),
    );
    leg.castShadow = true;
    rigGroup.add(leg);
  }

  // Tripod Spider & Fluid Head
  const spiderGeo = track(new THREE.CylinderGeometry(0.2, 0.22, 0.1, 24));
  const spider = new THREE.Mesh(spiderGeo, darkAnodizedMat);
  spider.position.y = tripodTopY;
  spider.castShadow = true;
  rigGroup.add(spider);

  const fluidHeadGeo = track(new THREE.BoxGeometry(0.32, 0.22, 0.36));
  const fluidHead = new THREE.Mesh(fluidHeadGeo, darkAnodizedMat);
  fluidHead.position.set(0, tripodTopY + 0.16, 0);
  fluidHead.castShadow = true;
  rigGroup.add(fluidHead);

  const panArmGeo = track(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 12));
  panArmGeo.rotateX(Math.PI / 2.6);
  const panArm = new THREE.Mesh(panArmGeo, brushedGoldMat);
  panArm.position.set(-0.2, tripodTopY + 0.1, -0.34);
  panArm.castShadow = true;
  rigGroup.add(panArm);

  // 3. Cinema Camera Chassis (Beveled ExtrudeGeometry)
  const cameraY = tripodTopY + 0.48;
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.34, -0.2);
  bodyShape.lineTo(0.36, -0.2);
  bodyShape.lineTo(0.36, 0.22);
  bodyShape.lineTo(0.24, 0.28);
  bodyShape.lineTo(-0.3, 0.28);
  bodyShape.lineTo(-0.34, 0.18);
  bodyShape.closePath();

  const bodyGeo = track(
    new THREE.ExtrudeGeometry(bodyShape, {
      depth: 0.44,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.022,
      bevelSegments: 3,
    }),
  );
  bodyGeo.center();
  bodyGeo.rotateY(Math.PI / 2);

  const cameraBody = new THREE.Mesh(bodyGeo, matteCarbonMat);
  cameraBody.position.set(0, cameraY, -0.05);
  cameraBody.castShadow = true;
  cameraBody.receiveShadow = true;
  rigGroup.add(cameraBody);

  // Brushed Gold Side Accent Badge & V-Mount Battery
  const sidePlateGeo = track(new THREE.BoxGeometry(0.025, 0.22, 0.38));
  const sidePlateL = new THREE.Mesh(sidePlateGeo, brushedGoldMat);
  sidePlateL.position.set(-0.245, cameraY, -0.04);
  rigGroup.add(sidePlateL);

  const sidePlateR = new THREE.Mesh(sidePlateGeo, brushedGoldMat);
  sidePlateR.position.set(0.245, cameraY, -0.04);
  rigGroup.add(sidePlateR);

  const batteryGeo = track(new THREE.BoxGeometry(0.32, 0.34, 0.16));
  const battery = new THREE.Mesh(batteryGeo, darkAnodizedMat);
  battery.position.set(0, cameraY - 0.02, -0.49);
  battery.castShadow = true;
  rigGroup.add(battery);

  // Top Handle
  const handleBarGeo = track(new THREE.BoxGeometry(0.11, 0.055, 0.54));
  const handleBar = new THREE.Mesh(handleBarGeo, darkAnodizedMat);
  handleBar.position.set(0, cameraY + 0.38, -0.03);
  handleBar.castShadow = true;
  rigGroup.add(handleBar);

  const riserGeo = track(new THREE.BoxGeometry(0.08, 0.12, 0.07));
  const riserF = new THREE.Mesh(riserGeo, brushedGoldMat);
  riserF.position.set(0, cameraY + 0.3, 0.17);
  const riserB = new THREE.Mesh(riserGeo, brushedGoldMat);
  riserB.position.set(0, cameraY + 0.3, -0.22);
  rigGroup.add(riserF, riserB);

  // 4. Stepped Cinema Prime Lens (LatheGeometry) & Matte Box
  const lathePoints = [
    new THREE.Vector2(0.14, 0.0),
    new THREE.Vector2(0.17, 0.03),
    new THREE.Vector2(0.17, 0.18),
    new THREE.Vector2(0.195, 0.21),
    new THREE.Vector2(0.195, 0.44),
    new THREE.Vector2(0.215, 0.48),
    new THREE.Vector2(0.215, 0.62),
    new THREE.Vector2(0.175, 0.62),
    new THREE.Vector2(0.165, 0.56),
  ];
  const lensGeo = track(new THREE.LatheGeometry(lathePoints, 32));
  lensGeo.rotateX(Math.PI / 2);
  const lensBarrel = new THREE.Mesh(lensGeo, darkAnodizedMat);
  lensBarrel.position.set(0, cameraY, 0.32);
  lensBarrel.castShadow = true;
  rigGroup.add(lensBarrel);

  // Gold Knurled Focus Ring
  const focusRingGeo = track(new THREE.CylinderGeometry(0.208, 0.208, 0.09, 32));
  focusRingGeo.rotateX(Math.PI / 2);
  const lensRing = new THREE.Mesh(focusRingGeo, brushedGoldMat);
  lensRing.position.set(0, cameraY, 0.64);
  rigGroup.add(lensRing);

  // Optical Glass Front Element
  const glassGeo = track(new THREE.SphereGeometry(0.175, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.35));
  glassGeo.rotateX(Math.PI / 2);
  const lensGlass = new THREE.Mesh(glassGeo, lensGlassMat);
  lensGlass.position.set(0, cameraY, 0.81);
  lensGlass.renderOrder = 2;
  rigGroup.add(lensGlass);

  // Matte Box Hood & French Flag
  const hoodGeo = track(new THREE.CylinderGeometry(0.32, 0.24, 0.2, 4, 1, true));
  hoodGeo.rotateY(Math.PI / 4);
  hoodGeo.rotateX(Math.PI / 2);
  const hoodMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x16181f,
      roughness: 0.78,
      metalness: 0.18,
      side: THREE.DoubleSide,
    }),
  );
  const matteBox = new THREE.Mesh(hoodGeo, hoodMat);
  matteBox.position.set(0, cameraY, 1.02);
  matteBox.castShadow = true;
  rigGroup.add(matteBox);

  const flagGeo = track(new THREE.BoxGeometry(0.46, 0.015, 0.22));
  const frenchFlag = new THREE.Mesh(flagGeo, matteCarbonMat);
  frenchFlag.position.set(0, cameraY + 0.24, 1.14);
  frenchFlag.rotation.x = -0.35;
  frenchFlag.castShadow = true;
  rigGroup.add(frenchFlag);

  // 5. Director's 7-inch Field Monitor
  const monitorMount = new THREE.Group();
  monitorMount.position.set(0.18, cameraY + 0.56, -0.08);
  monitorMount.rotation.y = -0.28;
  monitorMount.rotation.x = -0.14;

  const armGeo = track(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 12));
  const armMesh = new THREE.Mesh(armGeo, brushedGoldMat);
  armMesh.position.set(-0.08, -0.11, 0);
  armMesh.rotation.z = -0.5;
  monitorMount.add(armMesh);

  const frameGeo = track(new THREE.BoxGeometry(0.54, 0.34, 0.04));
  const monitorFrame = new THREE.Mesh(frameGeo, darkAnodizedMat);
  monitorFrame.castShadow = true;
  monitorMount.add(monitorFrame);

  const screenGeo = track(new THREE.PlaneGeometry(0.49, 0.29));
  const screenMesh = new THREE.Mesh(screenGeo, monitorScreenMat);
  screenMesh.position.z = 0.022;
  monitorMount.add(screenMesh);

  rigGroup.add(monitorMount);

  // 6. Grounded Film Clapperboard Prop (positioned cleanly inside gold ring)
  const clapperGroup = new THREE.Group();
  clapperGroup.position.set(0.95, 0.0, 0.55);
  clapperGroup.rotation.y = -0.35;

  const clapBoardGeo = track(new THREE.BoxGeometry(0.56, 0.42, 0.032));
  const clapFaceMat = track(
    new THREE.MeshStandardMaterial({
      map: clapperTex,
      color: 0xffffff,
      roughness: 0.45,
      metalness: 0.1,
    }),
  );
  const clapBody = new THREE.Mesh(clapBoardGeo, [
    matteCarbonMat,
    matteCarbonMat,
    matteCarbonMat,
    matteCarbonMat,
    clapFaceMat,
    matteCarbonMat,
  ]);
  clapBody.position.y = 0.21;
  clapBody.castShadow = true;
  clapBody.receiveShadow = true;
  clapperGroup.add(clapBody);

  const clapArmGeo = track(new THREE.BoxGeometry(0.56, 0.065, 0.034));
  const clapperTopArm = new THREE.Mesh(clapArmGeo, brushedGoldMat);
  clapperTopArm.position.set(0, 0.445, 0);
  clapperTopArm.rotation.z = 0.22;
  clapperTopArm.castShadow = true;
  clapperGroup.add(clapperTopArm);

  rigGroup.add(clapperGroup);

  // 7. Studio Softbox Key Stand (framed cleanly to the left-back corner)
  const standGroup = new THREE.Group();
  standGroup.position.set(-1.9, 0, -1.35);
  standGroup.rotation.y = 0.85;

  const standPoleGeo = track(new THREE.CylinderGeometry(0.025, 0.032, 2.05, 12));
  const standPole = new THREE.Mesh(standPoleGeo, darkAnodizedMat);
  standPole.position.y = 1.025;
  standPole.castShadow = true;
  standGroup.add(standPole);

  const standBaseGeo = track(new THREE.CylinderGeometry(0.32, 0.36, 0.04, 16));
  const standBase = new THREE.Mesh(standBaseGeo, matteCarbonMat);
  standBase.position.y = 0.02;
  standGroup.add(standBase);

  const softboxHousingGeo = track(new THREE.BoxGeometry(0.75, 0.56, 0.22));
  const diffuserMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfff3d6,
      emissive: 0xffd28a,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    }),
  );
  const softboxMesh = new THREE.Mesh(softboxHousingGeo, [
    matteCarbonMat,
    matteCarbonMat,
    matteCarbonMat,
    matteCarbonMat,
    diffuserMat,
    matteCarbonMat,
  ]);
  softboxMesh.position.set(0, 2.02, 0.06);
  softboxMesh.rotation.x = 0.24;
  softboxMesh.castShadow = true;
  standGroup.add(softboxMesh);

  rigGroup.add(standGroup);

  // 8. Subtle Atmospheric Cinema Dust Particles for Full-Viewport 3D Parallax
  const particleCount = 110;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const angle = (i * 2.39996) % (Math.PI * 2);
    const radius = 1.6 + ((i * 73) % 100) * 0.032;
    particlePositions[i * 3] = Math.cos(angle) * radius;
    particlePositions[i * 3 + 1] = 0.25 + ((i * 47) % 100) * 0.034;
    particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const dustMat = track(
    new THREE.PointsMaterial({
      size: 0.075,
      map: dustTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  root.add(dustPoints);

  return {
    root,
    subjectGroup,
    rigGroup,
    clapperTopArm,
    lensRing,
    dustPoints,
    disposables,
  };
}

export function disposeObject3DTree(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial;
        std.map?.dispose();
        std.bumpMap?.dispose();
        std.emissiveMap?.dispose();
        m.dispose();
      }
    }
  });
}
