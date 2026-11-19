(() => {
  'use strict';
  const THREE = window.THREE;
  if (!THREE) {
    console.warn('Three.js belum dimuat.');
    return;
  }

  class SimpleOrbit {
    constructor(camera, domElement) {
      this.camera = camera;
      this.dom = domElement;
      this.target = new THREE.Vector3(0, 0.9, 0);
      this.theta = 0.72;
      this.phi = 1.18;
      this.radius = 3.1;
      this.dragging = false;
      this.lastX = 0;
      this.lastY = 0;

      this._onDown = (e) => {
        this.dragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        if (this.dom.setPointerCapture) {
          try { this.dom.setPointerCapture(e.pointerId); } catch (_) {}
        }
      };
      this._onMove = (e) => {
        if (!this.dragging) return;
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.theta -= dx * 0.01;
        this.phi = THREE.MathUtils.clamp(this.phi - dy * 0.01, 0.25, Math.PI * 0.49);
      };
      this._onUp = () => { this.dragging = false; };
      this._onWheel = (e) => {
        e.preventDefault();
        this.radius = THREE.MathUtils.clamp(this.radius + e.deltaY * 0.0025, 1.3, 5.2);
      };

      this.dom.addEventListener('pointerdown', this._onDown);
      this.dom.addEventListener('pointermove', this._onMove);
      window.addEventListener('pointerup', this._onUp);
      this.dom.addEventListener('wheel', this._onWheel, { passive: false });
    }

    setFromPosition(pos) {
      const off = pos.clone().sub(this.target);
      this.radius = THREE.MathUtils.clamp(off.length(), 1.3, 5.2);
      this.phi = THREE.MathUtils.clamp(Math.acos(THREE.MathUtils.clamp(off.y / this.radius, -1, 1)), 0.25, Math.PI * 0.49);
      this.theta = Math.atan2(off.x, off.z);
    }

    update() {
      const sinP = Math.sin(this.phi);
      this.camera.position.set(
        this.target.x + this.radius * sinP * Math.sin(this.theta),
        this.target.y + this.radius * Math.cos(this.phi),
        this.target.z + this.radius * sinP * Math.cos(this.theta)
      );
      this.camera.lookAt(this.target);
    }

    dispose() {
      this.dom.removeEventListener('pointerdown', this._onDown);
      this.dom.removeEventListener('pointermove', this._onMove);
      window.removeEventListener('pointerup', this._onUp);
      this.dom.removeEventListener('wheel', this._onWheel);
    }
  }

// Analytic 2-bone IK + grounded pose engine for all 60 IronLog rig patterns.
// Units in meters, floor grid at y = 0. Limb segment lengths:
const L_UARM = 0.29;
const L_FARM = 0.28;
const L_THIGH = 0.43;
const L_SHIN = 0.43;
const L_TORSO = 0.48;

const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _vD = new THREE.Vector3();
const _vUp = new THREE.Vector3(0, 1, 0);
const _vDir = new THREE.Vector3();
const _vMid = new THREE.Vector3();

function solveIK(pA, pC, l1, l2, poleHint, outJoint, outEnd) {
  _vA.copy(pA);
  _vC.copy(pC);
  _vD.subVectors(_vC, _vA);
  let d = _vD.length();
  const minD = Math.abs(l1 - l2) + 0.02;
  const maxD = l1 + l2 - 0.006;
  if (d < 1e-5) {
    _vD.set(0, -1, 0);
    d = minD;
  } else {
    _vD.divideScalar(d);
  }
  const clampedD = Math.min(Math.max(d, minD), maxD);
  if (outEnd) {
    outEnd.copy(_vA).addScaledVector(_vD, clampedD);
  }

  const cosAlpha = THREE.MathUtils.clamp(
    (l1 * l1 + clampedD * clampedD - l2 * l2) / (2 * l1 * clampedD),
    -1,
    1
  );
  const sinAlpha = Math.sqrt(Math.max(0, 1 - cosAlpha * cosAlpha));

  // Build bend plane normal from poleHint
  _vB.subVectors(poleHint, _vA);
  const proj = _vB.dot(_vD);
  _vB.addScaledVector(_vD, -proj);
  if (_vB.lengthSq() < 1e-6) {
    _vB.set(0, 0, 1);
    _vB.addScaledVector(_vD, -_vB.dot(_vD));
    if (_vB.lengthSq() < 1e-6) _vB.set(1, 0, 0);
  }
  _vB.normalize();

  outJoint
    .copy(_vA)
    .addScaledVector(_vD, l1 * cosAlpha)
    .addScaledVector(_vB, l1 * sinAlpha);
}

function placeSegment(mesh, p1, p2, targetLen) {
  _vDir.subVectors(p2, p1);
  const len = _vDir.length();
  if (len < 1e-5) return;
  _vDir.divideScalar(len);
  _vMid.addVectors(p1, p2).multiplyScalar(0.5);
  mesh.position.copy(_vMid);
  mesh.quaternion.setFromUnitVectors(_vUp, _vDir);
  if (targetLen) {
    mesh.scale.set(1, len / targetLen, 1);
  }
}

function normalizeMuscleKey(m) {
  const s = String(m || '').toLowerCase();
  if (s.includes('chest')) return 'chest';
  if (s.includes('lat')) return 'lats';
  if (s.includes('upper back') || s.includes('trap')) return 'upper_back';
  if (s.includes('lower back')) return 'lower_back';
  if (s.includes('shoulder')) return 'shoulders';
  if (s.includes('bicep')) return 'biceps';
  if (s.includes('tricep')) return 'triceps';
  if (s.includes('forearm')) return 'forearms';
  if (s.includes('quad')) return 'quads';
  if (s.includes('hamstring')) return 'hamstrings';
  if (s.includes('glute')) return 'glutes';
  if (s.includes('calv')) return 'calves';
  if (s.includes('adductor') || s.includes('abductor')) return 'quads';
  if (s.includes('abdom')) return 'abs';
  if (s.includes('cardio') || s.includes('full')) return 'full';
  return '';
}

function getCameraCoords(preset) {
  if (preset === 'side') return new THREE.Vector3(2.65, 1.15, 0.05);
  if (preset === 'front') return new THREE.Vector3(0.05, 1.2, 2.65);
  return new THREE.Vector3(1.95, 1.45, 2.15); // 'iso' 3/4 view
}

// Compute world-space targets for every pattern
function computePose(pattern, p, equip, exName) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const out = {
    hipCenter: V(0, 0.88, 0),
    shoulderCenter: V(0, 1.36, 0),
    torsoForward: V(0, 0, 1),
    ankleL: V(0.15, 0.04, 0),
    ankleR: V(-0.15, 0.04, 0),
    kneePoleL: V(0.18, 0.48, 0.45),
    kneePoleR: V(-0.18, 0.48, 0.45),
    gripL: V(0.24, 0.82, 0.06),
    gripR: V(-0.24, 0.82, 0.06),
    elbowPoleL: V(0.32, 1.06, -0.20),
    elbowPoleR: V(-0.32, 1.06, -0.20),
    bench: null, // 'flat' | 'incline' | 'decline' | 'seated' | 'preacher' | 'box' | 'row_incline' | 'roman'
    frame: null, // 'pullup' | 'dip' | 'cable_high' | 'cable_low' | 'cable_mid' | 'cable_dual' | 'leg_press' | 'bike' | 'rower' | 'treadmill'
    weightType: 'none', // 'barbell' | 'dumbbells' | 'kettlebell' | 'rope' | 'abwheel' | 'none'
    barPos: null,
    barRotZ: 0,
    barRotY: 0,
    cableAnchor: null,
    cableTargetL: null,
    cableTargetR: null,
    camTarget: V(0, 0.9, 0)
  };

  switch (pattern) {
    case 'bench_bb':
    case 'bench_db': {
      out.bench = 'flat';
      out.hipCenter.set(0, 0.55, 0.22);
      out.shoulderCenter.set(0, 0.55, -0.26);
      out.torsoForward.set(0, 1, 0);
      out.ankleL.set(0.23, 0.04, 0.58);
      out.ankleR.set(-0.23, 0.04, 0.58);
      out.kneePoleL.set(0.24, 0.58, 0.58);
      out.kneePoleR.set(-0.24, 0.58, 0.58);
      const gy = 0.72 + 0.34 * p;
      out.gripL.set(0.28, gy, -0.26);
      out.gripR.set(-0.28, gy, -0.26);
      out.elbowPoleL.set(0.50, 0.46, -0.12);
      out.elbowPoleR.set(-0.50, 0.46, -0.12);
      out.weightType = pattern === 'bench_db' ? 'dumbbells' : 'barbell';
      out.barPos = V(0, gy, -0.26);
      out.camTarget.set(0, 0.62, 0);
      break;
    }
    case 'incline_bb':
    case 'incline_db': {
      out.bench = 'incline';
      out.hipCenter.set(0, 0.52, 0.16);
      out.shoulderCenter.set(0, 0.80, -0.23);
      out.torsoForward.set(0, 0.78, 0.62);
      out.ankleL.set(0.22, 0.04, 0.52);
      out.ankleR.set(-0.22, 0.04, 0.52);
      out.kneePoleL.set(0.22, 0.48, 0.52);
      out.kneePoleR.set(-0.22, 0.48, 0.52);
      const gy = 0.94 + 0.32 * p;
      out.gripL.set(0.28, gy, -0.16);
      out.gripR.set(-0.28, gy, -0.16);
      out.elbowPoleL.set(0.48, 0.70, -0.26);
      out.elbowPoleR.set(-0.48, 0.70, -0.26);
      out.weightType = pattern === 'incline_db' ? 'dumbbells' : 'barbell';
      out.barPos = V(0, gy, -0.16);
      out.camTarget.set(0, 0.75, 0);
      break;
    }
    case 'decline_bb': {
      out.bench = 'decline';
      out.hipCenter.set(0, 0.62, 0.20);
      out.shoulderCenter.set(0, 0.47, -0.26);
      out.torsoForward.set(0, 0.95, -0.31);
      out.ankleL.set(0.18, 0.28, 0.64);
      out.ankleR.set(-0.18, 0.28, 0.64);
      out.kneePoleL.set(0.18, 0.64, 0.56);
      out.kneePoleR.set(-0.18, 0.64, 0.56);
      const gy = 0.65 + 0.32 * p;
      out.gripL.set(0.28, gy, -0.22);
      out.gripR.set(-0.28, gy, -0.22);
      out.elbowPoleL.set(0.48, 0.42, -0.14);
      out.elbowPoleR.set(-0.48, 0.42, -0.14);
      out.weightType = 'barbell';
      out.barPos = V(0, gy, -0.22);
      out.camTarget.set(0, 0.62, 0);
      break;
    }
    case 'fly_db': {
      out.bench = 'flat';
      out.hipCenter.set(0, 0.55, 0.22);
      out.shoulderCenter.set(0, 0.55, -0.26);
      out.torsoForward.set(0, 1, 0);
      out.ankleL.set(0.23, 0.04, 0.58);
      out.ankleR.set(-0.23, 0.04, 0.58);
      out.kneePoleL.set(0.24, 0.58, 0.58);
      out.kneePoleR.set(-0.24, 0.58, 0.58);
      const ang = 0.28 + 1.15 * p; // 0.28 rad (wide) -> 1.43 rad (top)
      const gx = 0.19 + Math.cos(ang) * 0.46;
      const gy = 0.55 + Math.sin(ang) * 0.46;
      out.gripL.set(gx, gy, -0.26);
      out.gripR.set(-gx, gy, -0.26);
      out.elbowPoleL.set(0.48, 0.52, -0.20);
      out.elbowPoleR.set(-0.48, 0.52, -0.20);
      out.weightType = 'dumbbells';
      out.camTarget.set(0, 0.65, 0);
      break;
    }
    case 'cable_fly': {
      out.frame = 'cable_dual';
      out.hipCenter.set(0, 0.88, -0.02);
      out.shoulderCenter.set(0, 1.36, 0.04);
      out.ankleL.set(0.16, 0.04, 0.14);
      out.ankleR.set(-0.16, 0.04, -0.14);
      const gx = 0.62 - 0.50 * p;
      const gz = 0.06 + 0.40 * p;
      const gy = 1.18 - 0.14 * p;
      out.gripL.set(gx, gy, gz);
      out.gripR.set(-gx, gy, gz);
      out.elbowPoleL.set(0.45, 1.24, -0.12);
      out.elbowPoleR.set(-0.45, 1.24, -0.12);
      out.cableTargetL = out.gripL.clone();
      out.cableTargetR = out.gripR.clone();
      break;
    }
    case 'pec_deck':
    case 'chest_press_mach': {
      out.bench = 'seated';
      out.hipCenter.set(0, 0.52, 0.0);
      out.shoulderCenter.set(0, 1.00, -0.04);
      out.ankleL.set(0.18, 0.04, 0.42);
      out.ankleR.set(-0.18, 0.04, 0.42);
      out.kneePoleL.set(0.18, 0.52, 0.42);
      out.kneePoleR.set(-0.18, 0.52, 0.42);
      if (pattern === 'pec_deck') {
        const gx = 0.54 - 0.42 * p;
        const gz = 0.06 + 0.34 * p;
        out.gripL.set(gx, 1.00, gz);
        out.gripR.set(-gx, 1.00, gz);
        out.elbowPoleL.set(0.46, 0.96, -0.12);
        out.elbowPoleR.set(-0.46, 0.96, -0.12);
      } else {
        const gz = 0.14 + 0.34 * p;
        out.gripL.set(0.28, 0.98, gz);
        out.gripR.set(-0.28, 0.98, gz);
        out.elbowPoleL.set(0.46, 0.94, -0.10);
        out.elbowPoleR.set(-0.46, 0.94, -0.10);
      }
      out.weightType = 'handles';
      break;
    }
    case 'pushup':
    case 'plank': {
      const h = pattern === 'plank' ? 0.24 : 0.20 + 0.26 * p;
      const sy = h + 0.08;
      const hy = h * 0.65 + 0.06;
      const dy = sy - hy;
      const dz = Math.sqrt(Math.max(0.04, L_TORSO * L_TORSO - dy * dy));
      // Head toward +Z, feet toward -Z, chest facing down (-Y): cross(tUp, tFwd) = +X
      out.hipCenter.set(0, hy, -0.10);
      out.shoulderCenter.set(0, sy, -0.10 + dz);
      out.torsoForward.set(0, -dz, dy);
      out.ankleL.set(0.12, 0.04, -0.10 - 0.74);
      out.ankleR.set(-0.12, 0.04, -0.10 - 0.74);
      out.kneePoleL.set(0.12, 0.24, -0.10 - 0.42);
      out.kneePoleR.set(-0.12, 0.24, -0.10 - 0.42);
      out.gripL.set(0.24, 0.04, -0.10 + dz);
      out.gripR.set(-0.24, 0.04, -0.10 + dz);
      out.elbowPoleL.set(0.42, sy + 0.06, -0.10 + dz - 0.18);
      out.elbowPoleR.set(-0.42, sy + 0.06, -0.10 + dz - 0.18);
      out.camTarget.set(0, 0.30, 0.05);
      break;
    }
    case 'dip': {
      out.frame = 'dip';
      const drop = 0.28 * p;
      out.hipCenter.set(0, 0.92 - drop, 0);
      out.shoulderCenter.set(0, 1.38 - drop, 0.06);
      out.ankleL.set(0.14, 0.26 - drop * 0.5, -0.26);
      out.ankleR.set(-0.14, 0.26 - drop * 0.5, -0.26);
      out.kneePoleL.set(0.14, 0.56 - drop, 0.12);
      out.kneePoleR.set(-0.14, 0.56 - drop, 0.12);
      out.gripL.set(0.27, 1.02, 0.02);
      out.gripR.set(-0.27, 1.02, 0.02);
      out.elbowPoleL.set(0.36, 1.32 - drop * 0.5, -0.24);
      out.elbowPoleR.set(-0.36, 1.32 - drop * 0.5, -0.24);
      out.camTarget.set(0, 1.0, 0);
      break;
    }
    case 'ohp_bb':
    case 'ohp_seated': {
      const seated = pattern === 'ohp_seated';
      if (seated) {
        out.bench = 'seated';
        out.hipCenter.set(0, 0.52, 0.0);
        out.shoulderCenter.set(0, 1.00, -0.02);
        out.ankleL.set(0.20, 0.04, 0.42);
        out.ankleR.set(-0.20, 0.04, 0.42);
        out.kneePoleL.set(0.20, 0.52, 0.42);
        out.kneePoleR.set(-0.20, 0.52, 0.42);
      }
      const sy = out.shoulderCenter.y;
      const gy = sy + 0.04 + 0.44 * p;
      out.gripL.set(0.26, gy, 0.10);
      out.gripR.set(-0.26, gy, 0.10);
      out.elbowPoleL.set(0.42, sy - 0.18, 0.24);
      out.elbowPoleR.set(-0.42, sy - 0.18, 0.24);
      out.weightType = equip === 'Dumbbell' ? 'dumbbells' : 'barbell';
      out.barPos = V(0, gy, 0.10);
      out.camTarget.set(0, sy + 0.1, 0);
      break;
    }
    case 'lateral_raise': {
      const ang = 0.15 + 1.35 * p;
      const sy = 1.36;
      const r = 0.50;
      const gx = 0.19 + Math.sin(ang) * r;
      const gy = sy - Math.cos(ang) * r;
      out.gripL.set(gx, gy, 0.06);
      out.gripR.set(-gx, gy, 0.06);
      out.elbowPoleL.set(gx, gy + 0.04, -0.14);
      out.elbowPoleR.set(-gx, gy + 0.04, -0.14);
      out.weightType = 'dumbbells';
      break;
    }
    case 'front_raise': {
      const ang = 0.20 + 1.35 * p;
      const r = 0.50;
      const gy = 1.36 - Math.cos(ang) * r;
      const gz = Math.sin(ang) * r;
      out.gripL.set(0.20, gy, gz);
      out.gripR.set(-0.20, gy, gz);
      out.elbowPoleL.set(0.26, gy - 0.08, gz - 0.12);
      out.elbowPoleR.set(-0.26, gy - 0.08, gz - 0.12);
      out.weightType = 'dumbbells';
      break;
    }
    case 'upright_row': {
      const gy = 0.84 + 0.46 * p;
      out.gripL.set(0.14, gy, 0.16);
      out.gripR.set(-0.14, gy, 0.16);
      out.elbowPoleL.set(0.46, gy + 0.14, 0.08);
      out.elbowPoleR.set(-0.46, gy + 0.14, 0.08);
      out.weightType = equip === 'Cable' ? 'handles' : 'barbell';
      out.barPos = V(0, gy, 0.16);
      break;
    }
    case 'squat_back':
    case 'squat_front': {
      const front = pattern === 'squat_front';
      out.ankleL.set(0.17, 0.04, 0.02);
      out.ankleR.set(-0.17, 0.04, 0.02);
      out.hipCenter.set(0, 0.88 - 0.36 * p, -0.20 * p);
      out.shoulderCenter.set(0, out.hipCenter.y + 0.46 - 0.04 * p, 0.03);
      out.kneePoleL.set(0.24, 0.48, 0.46);
      out.kneePoleR.set(-0.24, 0.48, 0.46);
      const bz = front ? out.shoulderCenter.z + 0.14 : out.shoulderCenter.z - 0.11;
      const by = out.shoulderCenter.y + 0.03;
      out.gripL.set(0.32, by - 0.02, bz);
      out.gripR.set(-0.32, by - 0.02, bz);
      out.elbowPoleL.set(0.38, by - 0.24, front ? bz + 0.26 : bz - 0.18);
      out.elbowPoleR.set(-0.38, by - 0.24, front ? bz + 0.26 : bz - 0.18);
      out.weightType = equip === 'Dumbbell' ? 'dumbbells' : 'barbell';
      out.barPos = V(0, by, bz);
      break;
    }
    case 'leg_press': {
      out.frame = 'leg_press';
      out.hipCenter.set(0, 0.44, -0.24);
      out.shoulderCenter.set(0, 0.74, -0.60);
      out.torsoForward.set(0, 0.78, 0.62);
      const ext = 0.21 * p;
      out.ankleL.set(0.16, 0.70 + ext, 0.16 + ext);
      out.ankleR.set(-0.16, 0.70 + ext, 0.16 + ext);
      out.kneePoleL.set(0.16, 1.05, -0.15);
      out.kneePoleR.set(-0.16, 1.05, -0.15);
      out.gripL.set(0.28, 0.44, -0.24);
      out.gripR.set(-0.28, 0.44, -0.24);
      out.elbowPoleL.set(0.36, 0.56, -0.44);
      out.elbowPoleR.set(-0.36, 0.56, -0.44);
      out.barPos = V(0, 0.74 + ext, 0.20 + ext); // Sled plate pos
      out.camTarget.set(0, 0.75, 0);
      break;
    }
    case 'lunge': {
      const drop = 0.22 * p;
      out.ankleL.set(0.13, 0.04, 0.30);
      out.ankleR.set(-0.13, 0.04, -0.32);
      out.hipCenter.set(0, 0.80 - drop, -0.02);
      out.shoulderCenter.set(0, 1.28 - drop, 0.02);
      out.kneePoleL.set(0.14, 0.46, 0.42);
      out.kneePoleR.set(-0.14, 0.28, -0.20);
      out.gripL.set(0.24, 0.74 - drop, 0.04);
      out.gripR.set(-0.24, 0.74 - drop, 0.04);
      out.weightType = 'dumbbells';
      break;
    }
    case 'deadlift': {
      out.ankleL.set(0.15, 0.04, 0.0);
      out.ankleR.set(-0.15, 0.04, 0.0);
      const hy = 0.64 + 0.24 * p;
      const hz = -0.22 * (1 - p);
      out.hipCenter.set(0, hy, hz);
      const ang = 1.05 * (1 - p); // bent forward at p=0 -> upright at p=1
      out.shoulderCenter.set(0, hy + Math.cos(ang) * L_TORSO, hz + Math.sin(ang) * L_TORSO);
      out.torsoForward.set(0, -Math.sin(ang), Math.cos(ang));
      out.kneePoleL.set(0.18, 0.44, 0.32);
      out.kneePoleR.set(-0.18, 0.44, 0.32);
      const gy = 0.36 + 0.46 * p;
      const gz = out.shoulderCenter.z - 0.04;
      out.gripL.set(0.24, gy, gz);
      out.gripR.set(-0.24, gy, gz);
      out.elbowPoleL.set(0.26, gy + 0.24, gz - 0.06);
      out.elbowPoleR.set(-0.26, gy + 0.24, gz - 0.06);
      out.weightType = equip === 'Dumbbell' ? 'dumbbells' : 'barbell';
      out.barPos = V(0, gy, gz);
      break;
    }
    case 'back_ext': {
      out.bench = 'roman';
      out.ankleL.set(0.14, 0.18, -0.44);
      out.ankleR.set(-0.14, 0.18, -0.44);
      out.hipCenter.set(0, 0.82, -0.02);
      const ang = 0.15 + 0.95 * (1 - p); // bent down at p=0, horizontal/up at p=1
      out.shoulderCenter.set(0, 0.82 + Math.cos(ang) * 0.46, Math.sin(ang) * 0.46);
      out.torsoForward.set(0, 0.4, 0.9);
      out.gripL.set(0.16, out.shoulderCenter.y - 0.06, out.shoulderCenter.z + 0.10);
      out.gripR.set(-0.16, out.shoulderCenter.y - 0.06, out.shoulderCenter.z + 0.10);
      break;
    }
    case 'row_bb':
    case 'row_db':
    case 'row_incline':
    case 'rear_delt': {
      if (pattern === 'rear_delt' && equip === 'Machine') {
        out.bench = 'seated';
        out.hipCenter.set(0, 0.52, 0.0);
        out.shoulderCenter.set(0, 1.00, -0.02);
        out.ankleL.set(0.18, 0.04, 0.42);
        out.ankleR.set(-0.18, 0.04, 0.42);
        out.kneePoleL.set(0.18, 0.52, 0.42);
        out.kneePoleR.set(-0.18, 0.52, 0.42);
        const gx = 0.16 + 0.40 * p;
        const gz = 0.44 - 0.42 * p;
        out.gripL.set(gx, 0.98, gz);
        out.gripR.set(-gx, 0.98, gz);
        out.elbowPoleL.set(gx + 0.08, 0.96, gz - 0.14);
        out.elbowPoleR.set(-gx - 0.08, 0.96, gz - 0.14);
        out.weightType = 'handles';
        break;
      }
      if (pattern === 'row_incline') out.bench = 'row_incline';
      out.ankleL.set(0.15, 0.04, -0.06);
      out.ankleR.set(-0.15, 0.04, -0.06);
      out.hipCenter.set(0, 0.80, -0.20);
      out.shoulderCenter.set(0, 1.08, 0.19);
      // Chest faces down-forward (+Z, -Y) so cross(tUp, tFwd) = +X
      out.torsoForward.set(0, -0.81, 0.58);
      out.kneePoleL.set(0.16, 0.44, 0.18);
      out.kneePoleR.set(-0.16, 0.44, 0.18);
      if (pattern === 'rear_delt') {
        const gx = 0.22 + 0.36 * p;
        const gy = 0.62 + 0.42 * p;
        out.gripL.set(gx, gy, 0.20);
        out.gripR.set(-gx, gy, 0.20);
        out.elbowPoleL.set(gx, gy + 0.10, 0.08);
        out.elbowPoleR.set(-gx, gy + 0.10, 0.08);
        out.weightType = 'dumbbells';
      } else if (pattern === 'row_db' && /single|one-arm/i.test(exName || '')) {
        const gy = 0.58 + 0.28 * p;
        const gz = 0.16 - 0.12 * p;
        out.gripL.set(0.20, 0.72, 0.24); // Support hand braced forward
        out.elbowPoleL.set(0.26, 0.92, 0.18);
        out.gripR.set(-0.24, gy, gz); // Active rowing arm
        out.elbowPoleR.set(-0.32, gy + 0.24, gz - 0.14);
        out.weightType = 'dumbbell_single';
      } else {
        const gy = 0.58 + 0.28 * p;
        const gz = 0.16 - 0.12 * p;
        out.gripL.set(0.24, gy, gz);
        out.gripR.set(-0.24, gy, gz);
        out.elbowPoleL.set(0.32, gy + 0.24, gz - 0.14);
        out.elbowPoleR.set(-0.32, gy + 0.24, gz - 0.14);
        out.weightType = pattern === 'row_bb' ? 'barbell' : 'dumbbells';
      }
      out.barPos = V(0, 0.58 + 0.28 * p, 0.16 - 0.12 * p);
      break;
    }
    case 'seated_row':
    case 'face_pull': {
      const fp = pattern === 'face_pull';
      out.frame = fp ? 'cable_high' : 'cable_low';
      if (!fp) {
        out.bench = 'flat';
        out.hipCenter.set(0, 0.54, -0.10);
        out.shoulderCenter.set(0, 1.02, -0.14);
        out.ankleL.set(0.14, 0.22, 0.54);
        out.ankleR.set(-0.14, 0.22, 0.54);
        out.kneePoleL.set(0.14, 0.52, 0.26);
        out.kneePoleR.set(-0.14, 0.52, 0.26);
      }
      const gy = fp ? 1.24 + 0.14 * p : 0.78 + 0.04 * p;
      const gz = (fp ? 0.38 : 0.34) - 0.22 * p;
      const gx = fp ? 0.12 + 0.16 * p : 0.14;
      out.gripL.set(gx, gy, gz);
      out.gripR.set(-gx, gy, gz);
      out.elbowPoleL.set(0.36, gy - 0.06, gz - 0.22);
      out.elbowPoleR.set(-0.36, gy - 0.06, gz - 0.22);
      out.cableAnchor = fp ? V(0, 1.98, 0.52) : V(0, 0.42, 0.66);
      out.cableTargetL = V(0, gy, gz);
      out.weightType = 'handles';
      break;
    }
    case 'inverted_row': {
      out.frame = 'dip';
      out.ankleL.set(0.14, 0.04, 0.64);
      out.ankleR.set(-0.14, 0.04, 0.64);
      const lift = 0.28 * p;
      out.hipCenter.set(0, 0.30 + lift * 0.5, 0.12);
      out.shoulderCenter.set(0, 0.54 + lift, -0.26);
      out.torsoForward.set(0, 0.9, 0.4);
      out.gripL.set(0.28, 1.02, -0.24);
      out.gripR.set(-0.28, 1.02, -0.24);
      out.elbowPoleL.set(0.38, 0.60 + lift * 0.4, -0.34);
      out.elbowPoleR.set(-0.38, 0.60 + lift * 0.4, -0.34);
      out.barPos = V(0, 1.02, -0.24);
      break;
    }
    case 'pullup':
    case 'dead_hang': {
      out.frame = 'pullup';
      const lift = pattern === 'dead_hang' ? 0 : 0.34 * p;
      out.shoulderCenter.set(0, 1.66 + lift, 0);
      out.hipCenter.set(0, 1.18 + lift, 0);
      out.kneePoleL.set(0.16, 0.80 + lift, 0.10);
      out.kneePoleR.set(-0.16, 0.80 + lift, 0.10);
      out.ankleL.set(0.14, 0.46 + lift, -0.26);
      out.ankleR.set(-0.14, 0.46 + lift, -0.26);
      out.gripL.set(0.28, 2.14, 0);
      out.gripR.set(-0.28, 2.14, 0);
      out.elbowPoleL.set(0.42, 1.80 + lift * 0.4, 0.12);
      out.elbowPoleR.set(-0.42, 1.80 + lift * 0.4, 0.12);
      out.camTarget.set(0, 1.25, 0);
      break;
    }
    case 'pulldown': {
      out.frame = 'cable_high';
      out.bench = 'seated';
      out.hipCenter.set(0, 0.52, 0.0);
      out.shoulderCenter.set(0, 1.00, -0.02);
      out.ankleL.set(0.18, 0.04, 0.42);
      out.ankleR.set(-0.18, 0.04, 0.42);
      out.kneePoleL.set(0.18, 0.52, 0.42);
      out.kneePoleR.set(-0.18, 0.52, 0.42);
      const gy = 1.54 - 0.44 * p;
      out.gripL.set(0.34, gy, 0.08);
      out.gripR.set(-0.34, gy, 0.08);
      out.elbowPoleL.set(0.42, gy - 0.14, 0.0);
      out.elbowPoleR.set(-0.42, gy - 0.14, 0.0);
      out.weightType = 'barbell';
      out.barPos = V(0, gy, 0.08);
      out.cableAnchor = V(0, 1.98, 0.10);
      out.cableTargetL = V(0, gy, 0.08);
      out.camTarget.set(0, 1.05, 0);
      break;
    }
    case 'straight_arm_pd': {
      out.frame = 'cable_high';
      const ang = 0.25 + 1.05 * p;
      const gy = 1.36 - Math.sin(ang) * 0.50;
      const gz = Math.cos(ang) * 0.50;
      out.gripL.set(0.22, gy, gz);
      out.gripR.set(-0.22, gy, gz);
      out.elbowPoleL.set(0.24, gy + 0.12, gz - 0.10);
      out.elbowPoleR.set(-0.24, gy + 0.12, gz - 0.10);
      out.cableAnchor = V(0, 1.98, 0.52);
      out.cableTargetL = V(0, gy, gz);
      out.weightType = 'handles';
      break;
    }
    case 'pullover_db': {
      out.bench = 'flat';
      out.hipCenter.set(0, 0.55, 0.22);
      out.shoulderCenter.set(0, 0.55, -0.26);
      out.torsoForward.set(0, 1, 0);
      out.ankleL.set(0.23, 0.04, 0.58);
      out.ankleR.set(-0.23, 0.04, 0.58);
      out.kneePoleL.set(0.24, 0.58, 0.58);
      out.kneePoleR.set(-0.24, 0.58, 0.58);
      const ang = -0.35 + 1.35 * p; // behind head -> above chest
      const gy = 0.55 + Math.cos(ang) * 0.50;
      const gz = -0.26 + Math.sin(ang) * 0.50;
      out.gripL.set(0.08, gy, gz);
      out.gripR.set(-0.08, gy, gz);
      out.elbowPoleL.set(0.22, gy - 0.08, gz);
      out.elbowPoleR.set(-0.22, gy - 0.08, gz);
      out.weightType = 'dumbbells';
      break;
    }
    case 'shrug': {
      const lift = 0.05 * p;
      out.hipCenter.set(0, 0.88 + lift * 0.3, 0);
      out.shoulderCenter.set(0, 1.36 + lift, 0);
      out.gripL.set(0.24, 0.82 + lift, 0.04);
      out.gripR.set(-0.24, 0.82 + lift, 0.04);
      out.weightType = equip === 'Barbell' ? 'barbell' : 'dumbbells';
      out.barPos = V(0, 0.82 + lift, 0.08);
      break;
    }
    case 'curl_bb':
    case 'curl_db':
    case 'curl_cable': {
      if (pattern === 'curl_cable') out.frame = 'cable_low';
      const ang = 0.25 + 1.95 * p; // bottom -> curled up
      const ey = 1.07;
      const ez = 0.04;
      const gy = ey - Math.cos(ang) * 0.26;
      const gz = ez + Math.sin(ang) * 0.26;
      out.gripL.set(0.23, gy, gz);
      out.gripR.set(-0.23, gy, gz);
      out.elbowPoleL.set(0.24, ey, ez - 0.12);
      out.elbowPoleR.set(-0.24, ey, ez - 0.12);
      out.weightType = pattern === 'curl_bb' ? 'barbell' : 'dumbbells';
      out.barPos = V(0, gy, gz);
      if (pattern === 'curl_cable') out.cableTargetL = V(0, gy, gz);
      break;
    }
    case 'preacher_curl': {
      out.bench = 'preacher';
      out.hipCenter.set(0, 0.52, -0.08);
      out.shoulderCenter.set(0, 1.00, 0.02);
      out.ankleL.set(0.20, 0.04, 0.34);
      out.ankleR.set(-0.20, 0.04, 0.34);
      out.kneePoleL.set(0.20, 0.50, 0.34);
      out.kneePoleR.set(-0.20, 0.50, 0.34);
      const ang = 0.55 + 1.55 * p;
      const gy = 0.90 + Math.sin(ang - 0.5) * 0.26;
      const gz = 0.24 + Math.cos(ang - 0.5) * 0.26;
      out.gripL.set(0.20, gy, gz);
      out.gripR.set(-0.20, gy, gz);
      out.elbowPoleL.set(0.20, 0.86, 0.20);
      out.elbowPoleR.set(-0.20, 0.86, 0.20);
      out.weightType = 'barbell';
      out.barPos = V(0, gy, gz);
      break;
    }
    case 'tricep_pushdown': {
      out.frame = 'cable_high';
      const ang = 2.0 - 1.65 * p; // flexed top -> locked bottom
      const gy = 1.07 - Math.cos(ang) * 0.26;
      const gz = 0.06 + Math.sin(ang) * 0.26;
      out.gripL.set(0.21, gy, gz);
      out.gripR.set(-0.21, gy, gz);
      out.elbowPoleL.set(0.23, 1.07, -0.08);
      out.elbowPoleR.set(-0.23, 1.07, -0.08);
      out.cableAnchor = V(0, 1.98, 0.34);
      out.cableTargetL = V(0, gy, gz);
      out.weightType = 'handles';
      break;
    }
    case 'tricep_overhead': {
      const ang = -1.6 + 1.55 * p; // behind neck -> locked overhead
      const ey = 1.58;
      const gy = ey + Math.cos(ang) * 0.26;
      const gz = Math.sin(ang) * 0.26;
      out.gripL.set(0.14, gy, gz);
      out.gripR.set(-0.14, gy, gz);
      out.elbowPoleL.set(0.20, 1.62, 0.14);
      out.elbowPoleR.set(-0.20, 1.62, 0.14);
      out.weightType = 'dumbbells';
      out.camTarget.set(0, 1.15, 0);
      break;
    }
    case 'skullcrusher': {
      out.bench = 'flat';
      out.hipCenter.set(0, 0.55, 0.22);
      out.shoulderCenter.set(0, 0.55, -0.26);
      out.torsoForward.set(0, 1, 0);
      out.ankleL.set(0.23, 0.04, 0.58);
      out.ankleR.set(-0.23, 0.04, 0.58);
      out.kneePoleL.set(0.24, 0.58, 0.58);
      out.kneePoleR.set(-0.24, 0.58, 0.58);
      const ang = -1.75 + 1.70 * p;
      const gy = 0.84 + Math.cos(ang) * 0.26;
      const gz = -0.26 + Math.sin(ang) * 0.26;
      out.gripL.set(0.20, gy, gz);
      out.gripR.set(-0.20, gy, gz);
      out.elbowPoleL.set(0.22, 0.86, -0.24);
      out.elbowPoleR.set(-0.22, 0.86, -0.24);
      out.weightType = 'barbell';
      out.barPos = V(0, gy, gz);
      out.camTarget.set(0, 0.65, -0.1);
      break;
    }
    case 'leg_ext':
    case 'seated_leg_curl': {
      out.bench = 'seated';
      out.hipCenter.set(0, 0.52, -0.06);
      out.shoulderCenter.set(0, 1.00, -0.10);
      const isExt = pattern === 'leg_ext';
      const ang = isExt ? 0.15 + 1.35 * p : 1.50 - 1.35 * p;
      const ay = 0.50 - Math.cos(ang) * 0.42;
      const az = 0.34 + Math.sin(ang) * 0.42;
      out.ankleL.set(0.15, Math.max(0.06, ay), az);
      out.ankleR.set(-0.15, Math.max(0.06, ay), az);
      out.kneePoleL.set(0.15, 0.54, 0.34);
      out.kneePoleR.set(-0.15, 0.54, 0.34);
      out.gripL.set(0.26, 0.48, 0.04);
      out.gripR.set(-0.26, 0.48, 0.04);
      out.elbowPoleL.set(0.28, 0.72, -0.14);
      out.elbowPoleR.set(-0.28, 0.72, -0.14);
      break;
    }
    case 'lying_leg_curl': {
      out.bench = 'flat';
      // Head at +Z, feet at -Z, face down (-Y): cross(tUp, tFwd) = +X
      out.hipCenter.set(0, 0.56, -0.06);
      out.shoulderCenter.set(0, 0.56, 0.42);
      out.torsoForward.set(0, -1, 0);
      const ang = 0.1 + 1.45 * p; // straight -> curled up
      const ay = 0.54 + Math.sin(ang) * 0.40;
      const az = -0.44 - Math.cos(ang) * 0.40;
      out.ankleL.set(0.14, ay, az);
      out.ankleR.set(-0.14, ay, az);
      out.kneePoleL.set(0.14, 0.52, -0.44);
      out.kneePoleR.set(-0.14, 0.52, -0.44);
      out.gripL.set(0.22, 0.42, 0.42);
      out.gripR.set(-0.22, 0.42, 0.42);
      out.elbowPoleL.set(0.32, 0.58, 0.42);
      out.elbowPoleR.set(-0.32, 0.58, 0.42);
      out.camTarget.set(0, 0.6, 0);
      break;
    }
    case 'hip_thrust':
    case 'glute_bridge': {
      const onBench = pattern === 'hip_thrust';
      if (onBench) out.bench = 'box';
      const baseH = onBench ? 0.56 : 0.14;
      const hipY = (onBench ? 0.24 : 0.14) + (onBench ? 0.32 : 0.28) * p;
      out.shoulderCenter.set(0, baseH, -0.34);
      out.hipCenter.set(0, hipY, 0.08);
      out.torsoForward.set(0, 1, 0);
      out.ankleL.set(0.16, 0.04, 0.46);
      out.ankleR.set(-0.16, 0.04, 0.46);
      out.kneePoleL.set(0.16, hipY + 0.16, 0.44);
      out.kneePoleR.set(-0.16, hipY + 0.16, 0.44);
      if (onBench) {
        out.gripL.set(0.28, hipY + 0.12, 0.08);
        out.gripR.set(-0.28, hipY + 0.12, 0.08);
      } else {
        out.gripL.set(0.26, 0.05, 0.02);
        out.gripR.set(-0.26, 0.05, 0.02);
      }
      out.elbowPoleL.set(0.34, baseH + 0.04, -0.18);
      out.elbowPoleR.set(-0.34, baseH + 0.04, -0.18);
      out.weightType = onBench ? 'barbell' : 'none';
      out.barPos = V(0, hipY + 0.13, 0.08);
      out.camTarget.set(0, 0.5, 0);
      break;
    }
    case 'kickback': {
      out.frame = 'cable_low';
      out.hipCenter.set(0, 0.88, -0.06);
      out.shoulderCenter.set(0, 1.32, 0.10);
      out.ankleL.set(0.14, 0.04, 0.02);
      out.ankleR.set(-0.14, 0.06 + 0.38 * p, -0.50 * p);
      out.gripL.set(0.20, 1.06, 0.48);
      out.gripR.set(-0.20, 1.06, 0.48);
      out.cableTargetL = out.ankleR.clone();
      break;
    }
    case 'calf_standing': {
      const lift = 0.08 * p;
      out.ankleL.set(0.14, 0.12 + lift, 0);
      out.ankleR.set(-0.14, 0.12 + lift, 0);
      out.hipCenter.set(0, 0.94 + lift, 0);
      out.shoulderCenter.set(0, 1.42 + lift, 0);
      out.gripL.set(0.24, 0.88 + lift, 0.04);
      out.gripR.set(-0.24, 0.88 + lift, 0.04);
      out.bench = 'step';
      break;
    }
    case 'calf_seated': {
      out.bench = 'seated';
      const lift = 0.07 * p;
      out.hipCenter.set(0, 0.52, -0.06);
      out.shoulderCenter.set(0, 1.00, -0.06);
      out.ankleL.set(0.16, 0.04 + lift, 0.36);
      out.ankleR.set(-0.16, 0.04 + lift, 0.36);
      out.kneePoleL.set(0.16, 0.52 + lift, 0.36);
      out.kneePoleR.set(-0.16, 0.52 + lift, 0.36);
      out.gripL.set(0.20, 0.58 + lift, 0.30);
      out.gripR.set(-0.20, 0.58 + lift, 0.30);
      break;
    }
    case 'cable_crunch': {
      out.frame = 'cable_high';
      out.ankleL.set(0.14, 0.04, -0.44);
      out.ankleR.set(-0.14, 0.04, -0.44);
      out.kneePoleL.set(0.14, 0.06, -0.06);
      out.kneePoleR.set(-0.14, 0.06, -0.06);
      out.hipCenter.set(0, 0.46, -0.08);
      const flex = 0.25 + 0.85 * p;
      out.shoulderCenter.set(0, 0.46 + Math.cos(flex) * 0.48, -0.08 + Math.sin(flex) * 0.48);
      out.gripL.set(0.14, out.shoulderCenter.y + 0.06, out.shoulderCenter.z + 0.08);
      out.gripR.set(-0.14, out.shoulderCenter.y + 0.06, out.shoulderCenter.z + 0.08);
      out.cableAnchor = V(0, 1.98, 0.48);
      out.cableTargetL = V(0, out.shoulderCenter.y + 0.08, out.shoulderCenter.z + 0.10);
      out.camTarget.set(0, 0.65, 0);
      break;
    }
    case 'hanging_leg_raise': {
      out.frame = 'pullup';
      out.shoulderCenter.set(0, 1.66, 0);
      out.hipCenter.set(0, 1.18, 0);
      const ang = 1.4 * p;
      out.ankleL.set(0.13, 1.18 - Math.cos(ang) * 0.78, Math.sin(ang) * 0.78);
      out.ankleR.set(-0.13, 1.18 - Math.cos(ang) * 0.78, Math.sin(ang) * 0.78);
      out.kneePoleL.set(0.13, 1.18, 0.45);
      out.kneePoleR.set(-0.13, 1.18, 0.45);
      out.gripL.set(0.28, 2.14, 0);
      out.gripR.set(-0.28, 2.14, 0);
      out.elbowPoleL.set(0.32, 1.88, 0.10);
      out.elbowPoleR.set(-0.32, 1.88, 0.10);
      out.camTarget.set(0, 1.25, 0);
      break;
    }
    case 'ab_wheel': {
      out.ankleL.set(0.14, 0.12, -0.56);
      out.ankleR.set(-0.14, 0.12, -0.56);
      out.kneePoleL.set(0.14, 0.10, -0.12);
      out.kneePoleR.set(-0.14, 0.10, -0.12);
      out.hipCenter.set(0, 0.52 - 0.06 * p, -0.18 + 0.10 * p);
      out.shoulderCenter.set(0, 0.64 - 0.22 * p, 0.24 + 0.20 * p);
      out.torsoForward.set(0, -1, 0);
      out.gripL.set(0.14, 0.10, 0.24 + 0.42 * p);
      out.gripR.set(-0.14, 0.10, 0.24 + 0.42 * p);
      out.weightType = 'abwheel';
      out.barPos = V(0, 0.10, 0.24 + 0.42 * p);
      out.camTarget.set(0, 0.4, 0);
      break;
    }
    case 'crunch': {
      out.hipCenter.set(0, 0.14, 0.06);
      const curl = 0.15 + 0.65 * p;
      out.shoulderCenter.set(0, 0.14 + Math.sin(curl) * 0.46, 0.06 - Math.cos(curl) * 0.46);
      out.torsoForward.set(0, 1, 0);
      out.ankleL.set(0.14, 0.04, 0.56);
      out.ankleR.set(-0.14, 0.04, 0.56);
      out.kneePoleL.set(0.14, 0.42, 0.36);
      out.kneePoleR.set(-0.14, 0.42, 0.36);
      out.gripL.set(0.16, out.shoulderCenter.y + 0.12, out.shoulderCenter.z);
      out.gripR.set(-0.16, out.shoulderCenter.y + 0.12, out.shoulderCenter.z);
      out.camTarget.set(0, 0.35, 0);
      break;
    }
    case 'bike': {
      out.frame = 'bike';
      out.hipCenter.set(0, 0.78, -0.14);
      out.shoulderCenter.set(0, 1.18, 0.12);
      const th = p * Math.PI * 2;
      out.ankleL.set(0.15, 0.44 + Math.sin(th) * 0.14, 0.06 + Math.cos(th) * 0.14);
      out.ankleR.set(-0.15, 0.44 - Math.sin(th) * 0.14, 0.06 - Math.cos(th) * 0.14);
      out.gripL.set(0.22, 1.04, 0.36);
      out.gripR.set(-0.22, 1.04, 0.36);
      break;
    }
    case 'rowing_mach': {
      out.frame = 'rower';
      const slide = 0.28 * p;
      out.hipCenter.set(0, 0.36, -0.02 - slide);
      out.shoulderCenter.set(0, 0.80, -0.04 - slide * 1.15);
      out.ankleL.set(0.14, 0.28, 0.46);
      out.ankleR.set(-0.14, 0.28, 0.46);
      out.kneePoleL.set(0.14, 0.62 - slide * 0.4, 0.22);
      out.kneePoleR.set(-0.14, 0.62 - slide * 0.4, 0.22);
      out.gripL.set(0.14, 0.72, 0.32 - 0.36 * p);
      out.gripR.set(-0.14, 0.72, 0.32 - 0.36 * p);
      out.cableAnchor = V(0, 0.38, 0.52);
      out.cableTargetL = V(0, 0.72, 0.32 - 0.36 * p);
      out.camTarget.set(0, 0.6, 0);
      break;
    }
    case 'kb_swing': {
      out.hipCenter.set(0, 0.74 + 0.16 * p, -0.18 * (1 - p));
      out.shoulderCenter.set(0, 1.06 + 0.30 * p, 0.20 * (1 - p));
      out.ankleL.set(0.18, 0.04, 0);
      out.ankleR.set(-0.18, 0.04, 0);
      const ang = -0.35 + 1.55 * p;
      const gy = out.shoulderCenter.y - Math.cos(ang) * 0.50;
      const gz = out.shoulderCenter.z + Math.sin(ang) * 0.50;
      out.gripL.set(0.08, gy, gz);
      out.gripR.set(-0.08, gy, gz);
      out.weightType = 'kettlebell';
      out.barPos = V(0, gy, gz);
      break;
    }
    case 'jump_rope':
    case 'treadmill':
    default: {
      if (pattern === 'treadmill') out.frame = 'treadmill';
      const sw = Math.sin(p * Math.PI * 2);
      const lift = pattern === 'jump_rope' ? 0.08 * Math.abs(sw) : 0;
      out.hipCenter.set(0, 0.88 + lift, 0);
      out.shoulderCenter.set(0, 1.36 + lift, 0.04);
      out.ankleL.set(0.14, 0.06 + Math.max(0, sw) * 0.18 + lift, sw * 0.24);
      out.ankleR.set(-0.14, 0.06 + Math.max(0, -sw) * 0.18 + lift, -sw * 0.24);
      out.gripL.set(0.24, 1.04 + lift, 0.16 - sw * 0.12);
      out.gripR.set(-0.24, 1.04 + lift, 0.16 + sw * 0.12);
      break;
    }
  }

  return out;
}

class IronLog3DStage {
  constructor() {
    this.rafId = null;
    this.resizeObs = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.paused = false;
    this.elapsed = 0;
    this.lastTime = 0;
    this.exMeta = null;
    this.pattern = 'squat_back';
    this.gridHelper = null;
  }

  _isLightTheme() {
    return typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light';
  }

  setTheme(theme) {
    if (!this.scene) return;
    const isLight = theme ? theme === 'light' : this._isLightTheme();
    this.scene.background = new THREE.Color(isLight ? 0xeef2f6 : 0x000000);
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
    }
    this.gridHelper = isLight
      ? new THREE.GridHelper(3.6, 12, 0x94a3b8, 0xcbd5e1)
      : new THREE.GridHelper(3.6, 12, 0x2c2c2e, 0x1c1c1e);
    this.scene.add(this.gridHelper);
    if (this.matBody) this.matBody.color.setHex(isLight ? 0x64748b : 0x8e8e93);
    if (this.matLimb) this.matLimb.color.setHex(isLight ? 0x334155 : 0xd1d1d6);
    if (this.matPrimary) {
      this.matPrimary.color.setHex(isLight ? 0x4d7c0f : 0xa6ff00);
      this.matPrimary.emissive.setHex(isLight ? 0x3f6212 : 0x65a30d);
      this.matPrimary.emissiveIntensity = isLight ? 0.3 : 0.7;
    }
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.resizeObs) {
      this.resizeObs.disconnect();
      this.resizeObs = null;
    }
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
  }

  setCameraPreset(preset) {
    if (!this.camera || !this.controls) return;
    this.controls.setFromPosition(getCameraCoords(preset));
    this.controls.update();
  }

  togglePause() {
    this.paused = !this.paused;
    return this.paused;
  }

  mount(containerEl, exMeta) {
    this.stop();
    this.exMeta = exMeta || {};
    this.pattern = window.IRONLOG_ANIMATOR ? window.IRONLOG_ANIMATOR.getPattern(this.exMeta) : 'squat_back';
    this.paused = false;
    this.elapsed = 0;
    this.lastTime = performance.now();

    const w = containerEl.clientWidth || 320;
    const h = containerEl.clientHeight || 320;

    this.scene = new THREE.Scene();
    const isLight = this._isLightTheme();
    this.scene.background = new THREE.Color(isLight ? 0xeef3fa : 0x070d1a);

    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 40);
    this.camera.position.copy(getCameraCoords('iso'));

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    containerEl.appendChild(this.renderer.domElement);

    this.controls = new SimpleOrbit(this.camera, this.renderer.domElement);
    this.controls.setFromPosition(this.camera.position);
    this.controls.update();

    // Lights & Floor
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.78));
    const key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(3, 5, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rim.position.set(-3, 3, -3);
    this.scene.add(rim);
    this.gridHelper = isLight
      ? new THREE.GridHelper(3.6, 12, 0x94a3b8, 0xcbd5e1)
      : new THREE.GridHelper(3.6, 12, 0x263554, 0x162038);
    this.scene.add(this.gridHelper);

    this._buildMannequin();
    this._buildEquipment();
    this._applyMuscleHighlights();
    this.setTheme(isLight ? 'light' : 'dark');

    this.resizeObs = new ResizeObserver(() => {
      if (!this.renderer || !this.camera) return;
      const nw = containerEl.clientWidth;
      const nh = containerEl.clientHeight;
      if (!nw || !nh) return;
      this.camera.aspect = nw / nh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nw, nh);
    });
    this.resizeObs.observe(containerEl);

    const tick = (now) => {
      this.rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      if (!this.paused) this.elapsed += dt;
      this._updateFrame(this.elapsed);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  _buildMannequin() {
    this.matBody = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.55 });
    this.matLimb = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 });
    this.matPrimary = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85, roughness: 0.3 });
    this.matSecondary = new THREE.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x1d4ed8, emissiveIntensity: 0.45, roughness: 0.4 });

    const cap = (r, l, mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 8, 14), mat);
    const sph = (r, mat) => new THREE.Mesh(new THREE.SphereGeometry(r, 14, 14), mat);

    this.torsoPivot = new THREE.Group();
    this.scene.add(this.torsoPivot);

    // Torso segments inside torsoPivot (local +Y = hip->shoulder, +Z = front)
    this.torsoMesh = cap(0.115, 0.28, this.matBody);
    this.torsoMesh.position.set(0, 0.25, 0);
    this.chestOverlay = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.14, 0.08), this.matBody);
    this.chestOverlay.position.set(0, 0.37, 0.08);
    this.backOverlay = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.07), this.matBody);
    this.backOverlay.position.set(0, 0.35, -0.08);
    this.absOverlay = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.07), this.matBody);
    this.absOverlay.position.set(0, 0.19, 0.08);
    this.lumbarOverlay = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.07), this.matBody);
    this.lumbarOverlay.position.set(0, 0.16, -0.08);
    this.pelvisMesh = cap(0.095, 0.12, this.matBody);
    this.pelvisMesh.rotation.z = Math.PI / 2;
    this.pelvisMesh.position.set(0, 0.0, 0);
    this.headMesh = sph(0.105, this.matBody);
    this.headMesh.position.set(0, 0.65, 0);

    this.torsoPivot.add(
      this.torsoMesh, this.chestOverlay, this.backOverlay,
      this.absOverlay, this.lumbarOverlay, this.pelvisMesh, this.headMesh
    );

    // Limb segment meshes (unit cylinder/capsule length = segment length)
    this.shoulderL = sph(0.065, this.matBody);
    this.shoulderR = sph(0.065, this.matBody);
    this.elbowL = sph(0.048, this.matLimb);
    this.elbowR = sph(0.048, this.matLimb);
    this.wristL = sph(0.042, this.matLimb);
    this.wristR = sph(0.042, this.matLimb);
    this.kneeL = sph(0.060, this.matBody);
    this.kneeR = sph(0.060, this.matBody);
    this.ankleL = sph(0.042, this.matLimb);
    this.ankleR = sph(0.042, this.matLimb);

    this.uArmL = cap(0.052, L_UARM - 0.06, this.matLimb);
    this.uArmR = cap(0.052, L_UARM - 0.06, this.matLimb);
    this.fArmL = cap(0.043, L_FARM - 0.06, this.matLimb);
    this.fArmR = cap(0.043, L_FARM - 0.06, this.matLimb);
    this.thighL = cap(0.072, L_THIGH - 0.08, this.matBody);
    this.thighR = cap(0.072, L_THIGH - 0.08, this.matBody);
    this.shinL = cap(0.052, L_SHIN - 0.08, this.matLimb);
    this.shinR = cap(0.052, L_SHIN - 0.08, this.matLimb);

    this.scene.add(
      this.shoulderL, this.shoulderR, this.elbowL, this.elbowR, this.wristL, this.wristR,
      this.kneeL, this.kneeR, this.ankleL, this.ankleR,
      this.uArmL, this.uArmR, this.fArmL, this.fArmR,
      this.thighL, this.thighR, this.shinL, this.shinR
    );
  }

  _buildEquipment() {
    const matEquip = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const matBar = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 });
    const matPlate = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
    const box = (w, h, d, m = matEquip) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

    // Bench variants
    this.benchGroups = {};
    // 1. Flat bench (pad top y = 0.44, width = 0.30)
    const flat = new THREE.Group();
    const fp = box(0.30, 0.08, 1.15); fp.position.set(0, 0.40, 0);
    const fl1 = box(0.07, 0.38, 0.07); fl1.position.set(0, 0.19, 0.42);
    const fl2 = box(0.07, 0.38, 0.07); fl2.position.set(0, 0.19, -0.42);
    flat.add(fp, fl1, fl2);
    this.benchGroups.flat = flat;

    // 2. Incline bench
    const inc = new THREE.Group();
    const is = box(0.30, 0.08, 0.38); is.position.set(0, 0.38, 0.22);
    const ib = box(0.30, 0.08, 0.68); ib.position.set(0, 0.64, -0.14); ib.rotation.x = 0.62;
    const il1 = box(0.07, 0.36, 0.07); il1.position.set(0, 0.18, 0.28);
    const il2 = box(0.07, 0.60, 0.07); il2.position.set(0, 0.30, -0.26);
    inc.add(is, ib, il1, il2);
    this.benchGroups.incline = inc;

    // 3. Decline bench
    const dec = new THREE.Group();
    const db = box(0.30, 0.08, 0.96); db.position.set(0, 0.44, -0.05); db.rotation.x = -0.32;
    const dl1 = box(0.07, 0.56, 0.07); dl1.position.set(0, 0.28, 0.34);
    const dl2 = box(0.07, 0.32, 0.07); dl2.position.set(0, 0.16, -0.36);
    dec.add(db, dl1, dl2);
    this.benchGroups.decline = dec;

    // 4. Seated bench
    const seat = new THREE.Group();
    const sp = box(0.34, 0.08, 0.44); sp.position.set(0, 0.40, 0.02);
    const sb = box(0.32, 0.54, 0.08); sb.position.set(0, 0.72, -0.18);
    const sl = box(0.08, 0.38, 0.08); sl.position.set(0, 0.19, 0.0);
    seat.add(sp, sb, sl);
    this.benchGroups.seated = seat;

    // 5. Preacher bench
    const preach = new THREE.Group();
    const ps = box(0.32, 0.08, 0.36); ps.position.set(0, 0.40, -0.08);
    const pl1 = box(0.08, 0.38, 0.08); pl1.position.set(0, 0.19, -0.08);
    const pp = box(0.40, 0.30, 0.07); pp.position.set(0, 0.84, 0.20); pp.rotation.x = -0.55;
    const pl2 = box(0.08, 0.80, 0.08); pl2.position.set(0, 0.40, 0.22);
    preach.add(ps, pl1, pp, pl2);
    this.benchGroups.preacher = preach;

    // 6. Box / Hip thrust bench & Calf step block
    const bx = new THREE.Group();
    const bxb = box(0.46, 0.46, 0.38); bxb.position.set(0, 0.23, -0.44);
    bx.add(bxb);
    this.benchGroups.box = bx;

    const stp = new THREE.Group();
    const stpb = box(0.44, 0.08, 0.26); stpb.position.set(0, 0.04, 0.02);
    stp.add(stpb);
    this.benchGroups.step = stp;

    // 7. Row incline & Roman chair
    const rInc = new THREE.Group();
    const rib = box(0.30, 0.08, 0.64); rib.position.set(0, 0.90, 0.02); rib.rotation.x = 0.68;
    const ril = box(0.08, 0.88, 0.08); ril.position.set(0, 0.44, 0.04);
    rInc.add(rib, ril);
    this.benchGroups.row_incline = rInc;

    const rom = new THREE.Group();
    const rpad = box(0.34, 0.12, 0.24); rpad.position.set(0, 0.74, 0.0);
    const rpost = box(0.08, 0.72, 0.08); rpost.position.set(0, 0.36, -0.14);
    rom.add(rpad, rpost);
    this.benchGroups.roman = rom;

    Object.values(this.benchGroups).forEach((g) => {
      g.visible = false;
      this.scene.add(g);
    });

    // Frame props
    this.frameGroups = {};
    const pull = new THREE.Group();
    const pL = box(0.06, 2.18, 0.06); pL.position.set(0.62, 1.09, 0);
    const pR = box(0.06, 2.18, 0.06); pR.position.set(-0.62, 1.09, 0);
    const pBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.30, 12), matBar);
    pBar.rotation.z = Math.PI / 2; pBar.position.set(0, 2.14, 0);
    pull.add(pL, pR, pBar);
    this.frameGroups.pullup = pull;

    const dip = new THREE.Group();
    [-0.27, 0.27].forEach((x) => {
      const post = box(0.05, 1.02, 0.05); post.position.set(x, 0.51, -0.22);
      const rail = box(0.05, 0.05, 0.62); rail.position.set(x, 1.02, 0);
      dip.add(post, rail);
    });
    this.frameGroups.dip = dip;

    const cHigh = new THREE.Group();
    const cPost = box(0.08, 2.02, 0.08); cPost.position.set(0, 1.01, 0.58);
    const cTop = box(0.08, 0.08, 0.52); cTop.position.set(0, 2.00, 0.35);
    cHigh.add(cPost, cTop);
    this.frameGroups.cable_high = cHigh;

    const cLow = new THREE.Group();
    const clPost = box(0.08, 1.80, 0.08); clPost.position.set(0, 0.90, 0.68);
    cLow.add(clPost);
    this.frameGroups.cable_low = cLow;

    const cDual = new THREE.Group();
    [-0.86, 0.86].forEach((x) => {
      const p = box(0.08, 2.00, 0.08); p.position.set(x, 1.00, 0.0);
      cDual.add(p);
    });
    this.frameGroups.cable_dual = cDual;

    const lp = new THREE.Group();
    const lSeat = box(0.42, 0.08, 0.52); lSeat.position.set(0, 0.34, -0.34); lSeat.rotation.x = -0.65;
    const lTrack = box(0.10, 0.08, 1.05); lTrack.position.set(0, 0.62, 0.14); lTrack.rotation.x = -0.78;
    const lPost = box(0.10, 0.72, 0.10); lPost.position.set(0, 0.36, 0.44);
    this.sledPlate = box(0.44, 0.36, 0.06, matPlate);
    this.sledPlate.rotation.x = -0.78;
    lp.add(lSeat, lTrack, lPost, this.sledPlate);
    this.frameGroups.leg_press = lp;

    const bike = new THREE.Group();
    const bBase = box(0.28, 0.06, 0.90); bBase.position.set(0, 0.03, 0.04);
    const bSeat = box(0.18, 0.06, 0.22); bSeat.position.set(0, 0.72, -0.18);
    const bStem = box(0.06, 0.72, 0.06); bStem.position.set(0, 0.36, -0.18);
    const bFront = box(0.07, 0.98, 0.07); bFront.position.set(0, 0.52, 0.32); bFront.rotation.x = -0.18;
    const bHandle = box(0.48, 0.05, 0.05); bHandle.position.set(0, 1.04, 0.36);
    bike.add(bBase, bSeat, bStem, bFront, bHandle);
    this.frameGroups.bike = bike;

    const rower = new THREE.Group();
    const rRail = box(0.12, 0.08, 1.35); rRail.position.set(0, 0.18, -0.05);
    const rWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 20), matEquip);
    rWheel.rotation.z = Math.PI / 2; rWheel.position.set(0, 0.36, 0.54);
    rower.add(rRail, rWheel);
    this.frameGroups.rower = rower;

    const tread = new THREE.Group();
    const tDeck = box(0.62, 0.08, 1.30); tDeck.position.set(0, 0.04, 0);
    const tPostL = box(0.06, 1.02, 0.06); tPostL.position.set(0.28, 0.55, 0.52);
    const tPostR = box(0.06, 1.02, 0.06); tPostR.position.set(-0.28, 0.55, 0.52);
    const tCons = box(0.62, 0.12, 0.16); tCons.position.set(0, 1.06, 0.52);
    tread.add(tDeck, tPostL, tPostR, tCons);
    this.frameGroups.treadmill = tread;

    Object.values(this.frameGroups).forEach((g) => {
      g.visible = false;
      this.scene.add(g);
    });

    // Barbell, Dumbbells, Kettlebell, AbWheel, Cables
    this.barbellProp = new THREE.Group();
    const bBar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.48, 14), matBar);
    bBar.rotation.z = Math.PI / 2;
    this.barbellProp.add(bBar);
    [-0.58, 0.58].forEach((x) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.045, 24), matPlate);
      p.rotation.z = Math.PI / 2; p.position.x = x;
      this.barbellProp.add(p);
    });
    this.scene.add(this.barbellProp);

    const makeDB = () => {
      const g = new THREE.Group();
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.24, 10), matBar);
      h.rotation.z = Math.PI / 2;
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 16), matPlate);
      p1.rotation.z = Math.PI / 2; p1.position.x = -0.09;
      const p2 = p1.clone(); p2.position.x = 0.09;
      g.add(h, p1, p2);
      return g;
    };
    this.dbL = makeDB();
    this.dbR = makeDB();
    this.scene.add(this.dbL, this.dbR);

    this.kbProp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), matPlate);
    this.scene.add(this.kbProp);

    this.abWheelProp = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.06, 20), matPlate);
    this.abWheelProp.rotation.z = Math.PI / 2;
    this.scene.add(this.abWheelProp);

    // Dynamic cable lines
    const cMat = new THREE.LineBasicMaterial({ color: 0x94a3b8 });
    this.cableLineL = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), cMat);
    this.cableLineR = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), cMat);
    this.scene.add(this.cableLineL, this.cableLineR);
  }

  _applyMuscleHighlights() {
    const prim = normalizeMuscleKey(this.exMeta.muscle);
    const secs = new Set((this.exMeta.secondary || []).map(normalizeMuscleKey));

    const pickMat = (keys, fallback) => {
      if (keys.some((k) => k === prim)) return this.matPrimary;
      if (keys.some((k) => secs.has(k))) return this.matSecondary;
      return fallback;
    };

    this.chestOverlay.material = pickMat(['chest'], this.matBody);
    this.backOverlay.material = pickMat(['lats', 'upper_back'], this.matBody);
    this.absOverlay.material = pickMat(['abs'], this.matBody);
    this.lumbarOverlay.material = pickMat(['lower_back'], this.matBody);
    this.pelvisMesh.material = pickMat(['glutes'], this.matBody);

    const shMat = pickMat(['shoulders'], this.matBody);
    this.shoulderL.material = shMat;
    this.shoulderR.material = shMat;

    const uArmMat = pickMat(['biceps', 'triceps'], this.matLimb);
    this.uArmL.material = uArmMat;
    this.uArmR.material = uArmMat;

    const fArmMat = pickMat(['forearms'], this.matLimb);
    this.fArmL.material = fArmMat;
    this.fArmR.material = fArmMat;

    const thighMat = pickMat(['quads', 'hamstrings', 'glutes'], this.matBody);
    this.thighL.material = thighMat;
    this.thighR.material = thighMat;

    const shinMat = pickMat(['calves'], this.matLimb);
    this.shinL.material = shinMat;
    this.shinR.material = shinMat;
  }

  _updateFrame(t) {
    const speed = this.pattern === 'treadmill' || this.pattern === 'bike' || this.pattern === 'jump_rope' ? 3.2 : 2.1;
    const p = this.pattern === 'bike'
      ? (t * 0.65) % 1
      : (1 - Math.cos(t * speed)) * 0.5;

    const pose = computePose(this.pattern, p, this.exMeta.equipment, this.exMeta.name);

    // Orient Torso from hipCenter -> shoulderCenter
    const torsoUp = new THREE.Vector3().subVectors(pose.shoulderCenter, pose.hipCenter).normalize();
    const torsoRight = new THREE.Vector3().crossVectors(torsoUp, pose.torsoForward);
    if (torsoRight.lengthSq() < 1e-5) torsoRight.set(1, 0, 0);
    else torsoRight.normalize();
    const torsoFwd = new THREE.Vector3().crossVectors(torsoRight, torsoUp).normalize();
    const rotMat = new THREE.Matrix4().makeBasis(torsoRight, torsoUp, torsoFwd);

    this.torsoPivot.position.copy(pose.hipCenter);
    this.torsoPivot.quaternion.setFromRotationMatrix(rotMat);

    const shL = pose.shoulderCenter.clone().addScaledVector(torsoRight, 0.19);
    const shR = pose.shoulderCenter.clone().addScaledVector(torsoRight, -0.19);
    const hpL = pose.hipCenter.clone().addScaledVector(torsoRight, 0.10);
    const hpR = pose.hipCenter.clone().addScaledVector(torsoRight, -0.10);

    // Analytic 2-bone IK for Arms & Legs
    const elL = new THREE.Vector3(), elR = new THREE.Vector3();
    const wrL = new THREE.Vector3(), wrR = new THREE.Vector3();
    solveIK(shL, pose.gripL, L_UARM, L_FARM, pose.elbowPoleL, elL, wrL);
    solveIK(shR, pose.gripR, L_UARM, L_FARM, pose.elbowPoleR, elR, wrR);

    const knL = new THREE.Vector3(), knR = new THREE.Vector3();
    const akL = new THREE.Vector3(), akR = new THREE.Vector3();
    solveIK(hpL, pose.ankleL, L_THIGH, L_SHIN, pose.kneePoleL, knL, akL);
    solveIK(hpR, pose.ankleR, L_THIGH, L_SHIN, pose.kneePoleR, knR, akR);

    this.shoulderL.position.copy(shL);
    this.shoulderR.position.copy(shR);
    this.elbowL.position.copy(elL);
    this.elbowR.position.copy(elR);
    this.wristL.position.copy(wrL);
    this.wristR.position.copy(wrR);

    this.kneeL.position.copy(knL);
    this.kneeR.position.copy(knR);
    this.ankleL.position.copy(akL);
    this.ankleR.position.copy(akR);

    placeSegment(this.uArmL, shL, elL, L_UARM - 0.06);
    placeSegment(this.uArmR, shR, elR, L_UARM - 0.06);
    placeSegment(this.fArmL, elL, wrL, L_FARM - 0.06);
    placeSegment(this.fArmR, elR, wrR, L_FARM - 0.06);
    placeSegment(this.thighL, hpL, knL, L_THIGH - 0.08);
    placeSegment(this.thighR, hpR, knR, L_THIGH - 0.08);
    placeSegment(this.shinL, knL, akL, L_SHIN - 0.08);
    placeSegment(this.shinR, knR, akR, L_SHIN - 0.08);

    // Toggle Benches & Frames
    Object.entries(this.benchGroups).forEach(([k, g]) => { g.visible = pose.bench === k; });
    Object.entries(this.frameGroups).forEach(([k, g]) => { g.visible = pose.frame === k; });

    if (pose.frame === 'leg_press' && this.sledPlate && pose.barPos) {
      this.sledPlate.position.copy(pose.barPos);
    }

    // Weight props locked to exact wrist/bar coordinates
    this.barbellProp.visible = pose.weightType === 'barbell';
    if (this.barbellProp.visible) {
      this.barbellProp.position.addVectors(wrL, wrR).multiplyScalar(0.5);
    }

    this.dbL.visible = pose.weightType === 'dumbbells';
    this.dbR.visible = pose.weightType === 'dumbbells' || pose.weightType === 'dumbbell_single';
    if (this.dbL.visible) this.dbL.position.copy(wrL);
    if (this.dbR.visible) this.dbR.position.copy(wrR);

    this.kbProp.visible = pose.weightType === 'kettlebell';
    if (this.kbProp.visible) {
      this.kbProp.position.addVectors(wrL, wrR).multiplyScalar(0.5);
    }

    this.abWheelProp.visible = pose.weightType === 'abwheel';
    if (this.abWheelProp.visible && pose.barPos) {
      this.abWheelProp.position.copy(pose.barPos);
    }

    // Dynamic cables
    this.cableLineL.visible = Boolean(pose.cableTargetL);
    if (this.cableLineL.visible) {
      const anchor = pose.cableAnchor
        || (pose.frame === 'cable_dual'
          ? new THREE.Vector3(0.86, 1.35, 0)
          : pose.frame === 'cable_high'
            ? new THREE.Vector3(0, 1.98, 0.14)
            : new THREE.Vector3(0, 0.22, 0.66));
      this.cableLineL.geometry.setFromPoints([anchor, pose.cableTargetL]);
    }
    this.cableLineR.visible = Boolean(pose.cableTargetR);
    if (this.cableLineR.visible) {
      this.cableLineR.geometry.setFromPoints([new THREE.Vector3(-0.86, 1.35, 0), pose.cableTargetR]);
    }

    if (this.controls) {
      this.controls.target.copy(pose.camTarget);
    }
  }
}

const stageInstance = new IronLog3DStage();

window.IRONLOG_3D = {
  mount: (el, exMeta) => stageInstance.mount(el, exMeta),
  setCameraPreset: (preset) => stageInstance.setCameraPreset(preset),
  setTheme: (theme) => stageInstance.setTheme(theme),
  togglePause: () => stageInstance.togglePause(),
  stop: () => stageInstance.stop(),
  computePose
};

window.dispatchEvent(new Event('ironlog3d:ready'));
})();
