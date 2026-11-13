// Mel ve 3D: vytažené křivky z docs/brand/mel (viewBox 64), měkký materiál, šest stavů.
// Jedno pevné plátno přes okno; Mel si sedá do prvků [data-mel-anchor] a mezi nimi přelétá.
import * as THREE from 'three';
import {RoomEnvironment} from '../vendor/RoomEnvironment.js';
import {mergeVertices} from '../vendor/BufferGeometryUtils.js';

const stage = window.MelStage;
const gsap = window.gsap;
const canvas = document.getElementById('mel-canvas');
const FX = new THREE.Color('#F21B68'), ERR = new THREE.Color('#B3124F');
const INK = '#FAF6FF', DARK = '#171522', PINK = '#FF92BA';
const X = x => x - 32, Y = y => 33.5 - y;
const FOV = 24;

const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'high-performance'});
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 10000);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
const key = new THREE.DirectionalLight('#ffffff', 2.4); key.position.set(-0.7, 1.1, 1.3);
const rim = new THREE.DirectionalLight(PINK, 2.2); rim.position.set(1.3, 0.2, -0.8);
const fill = new THREE.DirectionalLight('#8f7bff', 0.5); fill.position.set(0.9, -0.8, 0.9);
scene.add(key, rim, fill, new THREE.AmbientLight('#ffffff', 0.35));

let W = 0, H = 0;
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, W < 700 ? 1.6 : 2));
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.position.z = (H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  camera.near = camera.position.z * 0.2; camera.far = camera.position.z * 3;
  camera.updateProjectionMatrix();
}

// ---------- tvary ----------
function shapeFromPath(d, ox = 0, oy = 0) {
  const s = new THREE.Shape();
  const re = /([MLQZ])([^MLQZ]*)/g; let m;
  while ((m = re.exec(d))) {
    const n = (m[2].match(/-?\d*\.?\d+/g) || []).map(Number);
    if (m[1] === 'M') s.moveTo(X(n[0]) - ox, Y(n[1]) - oy);
    else if (m[1] === 'L') for (let i = 0; i < n.length; i += 2) s.lineTo(X(n[i]) - ox, Y(n[i + 1]) - oy);
    else if (m[1] === 'Q') for (let i = 0; i < n.length; i += 4) s.quadraticCurveTo(X(n[i]) - ox, Y(n[i + 1]) - oy, X(n[i + 2]) - ox, Y(n[i + 3]) - oy);
    else s.closePath();
  }
  return s;
}
function roundRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function pillow(shape, depth, bevel, size) {
  let g = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: size, bevelOffset: -size, bevelSegments: 10, curveSegments: 22});
  g.translate(0, 0, -depth / 2);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g, 0.02);
  g.computeVertexNormals();
  return g;
}

const TRUP = 'M4.27 17.99Q4 11 10.93 10.01L21.54 8.49Q25 8 27.75 10.16L28.85 11.03Q32 13.5 34.93 10.78L36.44 9.38Q39 7 42.48 7.33L53.03 8.34Q60 9 59.74 16.00L58.78 42.00Q58.6 47 53.60 47.00L10.40 47.00Q5.4 47 5.21 42.00Z';
const NL = 'M5.06 39.00Q5.2 37 7.20 37.00L30.00 37.00L30.00 47.00L27.54 56.14Q26.5 60 22.50 60.00L8.60 60.00Q3.6 60 3.95 55.01Z';
const NP = 'M58.94 39.00Q58.8 37 56.80 37.00L34.00 37.00L34.00 47.00L36.46 56.14Q37.5 60 41.50 60.00L55.40 60.00Q60.4 60 60.05 55.01Z';

const wob = {uTime: {value: 0}, uWob: {value: 0}};
const bodyMat = new THREE.MeshPhysicalMaterial({color: FX.clone(), roughness: 0.42, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.4, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(PINK)});
bodyMat.onBeforeCompile = sh => {
  sh.uniforms.uTime = wob.uTime; sh.uniforms.uWob = wob.uWob;
  sh.vertexShader = 'uniform float uTime;uniform float uWob;\n' + sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\n transformed.x += sin(position.y*0.16 + uTime*9.0) * uWob * 2.6;\n transformed.xy += normal.xy * uWob * 1.4 * (0.6 + 0.4*sin(uTime*13.0 + position.x*0.2));');
};
const visorMat = new THREE.MeshPhysicalMaterial({color: DARK, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08});
const inkMat = new THREE.MeshBasicMaterial({color: INK, toneMapped: false});
const darkMat = new THREE.MeshBasicMaterial({color: DARK, toneMapped: false});
const gemPink = new THREE.MeshPhysicalMaterial({color: PINK, roughness: 0.25, clearcoat: 1, flatShading: true});
const gemFx = new THREE.MeshPhysicalMaterial({color: FX.clone(), roughness: 0.25, clearcoat: 1, flatShading: true});
const softPink = new THREE.MeshPhysicalMaterial({color: PINK, roughness: 0.35, clearcoat: 0.6});

const holder = new THREE.Group();      // poloha a měřítko v pixelech
const spin = new THREE.Group();        // natočení za kurzorem a otočka v letu
const squash = new THREE.Group();      // zmáčknutí kolem chodidel
const inner = new THREE.Group();
const FEET = Y(60);
squash.position.y = FEET; inner.position.y = -FEET;
holder.add(spin); spin.add(squash); squash.add(inner); scene.add(holder);

const D = 11, BEV = 4.6, FRONT = D / 2 + BEV;
const head = new THREE.Group(); head.position.set(0, Y(47), 0);
const headIn = new THREE.Group(); headIn.position.y = -Y(47); head.add(headIn); inner.add(head);
headIn.add(new THREE.Mesh(pillow(shapeFromPath(TRUP), D, BEV, 3.4), bodyMat));
function leg(d, px) {
  const g = new THREE.Group(); g.position.set(X(px), Y(38), 0);
  const m = new THREE.Mesh(pillow(shapeFromPath(d, X(px), Y(38)), D, BEV, 3.2), bodyMat); m.scale.z = 0.93; g.add(m); inner.add(g); return g;
}
const legL = leg(NL, 17.5), legR = leg(NP, 46.5);

const visorGeo = new THREE.ExtrudeGeometry(roundRect(41, 26, 10), {depth: 0.8, bevelEnabled: true, bevelThickness: 0.9, bevelSize: 0.9, bevelOffset: -0.9, bevelSegments: 5, curveSegments: 20});
const visor = new THREE.Mesh(visorGeo, visorMat); visor.position.set(0, Y(31.5), FRONT - 0.9); headIn.add(visor);
const face = new THREE.Group(); face.position.set(0, 0, FRONT + 1.05); headIn.add(face);

function tube(a, c, b, r) {
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0], a[1], 0), new THREE.Vector3(c[0], c[1], 0), new THREE.Vector3(b[0], b[1], 0));
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, r, 8), inkMat); t.scale.z = 0.3; g.add(t);
  for (const p of [a, b]) { const s = new THREE.Mesh(new THREE.CircleGeometry(r, 16), inkMat); s.position.set(p[0], p[1], 0.02); g.add(s); }
  return g;
}
const eyes = [], arcs = [], crosses = [];
for (const cx of [24.2, 39.8]) {
  const e = new THREE.Group(); e.position.set(X(cx), Y(30), 0);
  e.add(new THREE.Mesh(new THREE.ShapeGeometry(roundRect(13.4, 13.4, 4.556), 14), inkMat));
  const pupil = new THREE.Group(); pupil.position.z = 0.06;
  pupil.add(new THREE.Mesh(new THREE.CircleGeometry(4.4, 36), darkMat));
  const hl = new THREE.Mesh(new THREE.CircleGeometry(1.144, 16), inkMat); hl.position.set(1.495, 1.584, 0.05); pupil.add(hl);
  e.add(pupil); e.userData.pupil = pupil; e.userData.hl = hl; face.add(e); eyes.push(e);
  const a = tube([-5.36, -2.144], [0, 5.9], [5.36, -2.144], 1.3); a.position.copy(e.position); face.add(a); arcs.push(a);
  const x = new THREE.Group(); x.position.copy(e.position);
  for (const r of [1, -1]) { const b = new THREE.Mesh(new THREE.ShapeGeometry(roundRect(8.4, 2.2, 0.4)), inkMat); b.rotation.z = r * Math.PI / 4; x.add(b); }
  face.add(x); crosses.push(x);
}
const mouths = {
  smile: tube([-3.4, Y(40)], [0, Y(42.5)], [3.4, Y(40)], 0.95),
  flat: new THREE.Mesh(new THREE.ShapeGeometry(roundRect(4.6, 1.9, 0.9)), inkMat),
  big: tube([-4.4, Y(39.4)], [0, Y(43.6)], [4.4, Y(39.4)], 0.95),
  o: new THREE.Mesh(new THREE.CircleGeometry(1.9, 24), inkMat),
};
mouths.flat.position.set(0, Y(40.6), 0); mouths.o.position.set(0, Y(40.6), 0);
Object.values(mouths).forEach(m => face.add(m));

// doplňky stavů
const gemGeo = new THREE.OctahedronGeometry(1);
const gem = (x, y, s, mat) => { const m = new THREE.Mesh(gemGeo, mat); m.position.set(X(x), Y(y), 0); m.scale.set(s, s, s * 0.55); m.userData.s = s; return m; };
const extras = {
  working: [gem(32, 0.5, 4.6, gemFx), gem(34.4, -8.5, 4.6, gemFx), gem(32, -17.5, 4.6, gemPink)],
  waiting: [gem(32, -1, 5.2, gemPink)],
  thinking: [[54.8, 4, 1.7], [60.4, -2.4, 2.5], [67, -10, 3.5]].map(([x, y, r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), softPink); m.position.set(X(x), Y(y), 2); m.scale.setScalar(r); m.userData.s = r; return m; }),
  done: [gem(1.5, 8, 4, gemPink), gem(62.5, 5, 5, gemPink), gem(32, -6, 3.6, gemPink)],
  idle: [], error: [],
};
const allExtras = [];
for (const k in extras) extras[k].forEach((m, i) => { m.userData.k = k; m.userData.i = i; m.userData.v = 0; m.scale.setScalar(0.0001); inner.add(m); allExtras.push(m); });

// stín pod chodidly
const sc = document.createElement('canvas'); sc.width = 256; sc.height = 64;
const sg = sc.getContext('2d'); const grd = sg.createRadialGradient(128, 32, 2, 128, 32, 126);
grd.addColorStop(0, 'rgba(8,6,14,.55)'); grd.addColorStop(1, 'rgba(8,6,14,0)');
sg.fillStyle = grd; sg.scale(1, 0.25); sg.fillRect(0, 0, 256, 256);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(72, 16), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, toneMapped: false}));
shadow.position.set(0, FEET - 2.5, -4); holder.add(shadow);

// ---------- stavy ----------
let state = 'idle', stateT = 0;
const sq = {sx: 1, sy: 1, legs: 0, hop: 0};
function applyFace(s) {
  const happy = s === 'done', err = s === 'error';
  eyes.forEach(e => e.visible = !happy && !err);
  arcs.forEach(a => a.visible = happy);
  crosses.forEach(c => c.visible = err);
  mouths.smile.visible = s === 'idle';
  mouths.flat.visible = s === 'thinking' || s === 'working' || err;
  mouths.big.visible = happy;
  mouths.o.visible = s === 'waiting';
}
applyFace(state);
function setState(s, instant) {
  if (s === state) return;
  state = s; stateT = 0;
  if (instant) { applyFace(s); return; }
  gsap.killTweensOf(sq); gsap.killTweensOf(wob.uWob);
  gsap.timeline()
    .to(sq, {sx: 1.26, sy: 0.56, legs: 1, duration: 0.15, ease: 'power2.in'})
    .call(() => applyFace(s))
    .to(sq, {sx: 0.84, sy: 1.2, legs: -0.3, hop: s === 'done' ? 9 : 4, duration: 0.17, ease: 'power2.out'})
    .to(sq, {sx: 1, sy: 1, legs: 0, duration: 0.95, ease: 'elastic.out(1,0.38)'})
    .to(sq, {hop: 0, duration: 0.5, ease: 'bounce.out'}, '<');
  gsap.fromTo(wob.uWob, {value: 0.9}, {value: 0, duration: 1.1, ease: 'power2.out'});
}

// ---------- kotvy a let ----------
let cur = null, prev = null, flyT = 1, flySpin = 0;
const pose = {x: 0, y: 0, h: 100};
function rectOf(el) { const r = el.getBoundingClientRect(); return r.width > 2 ? r : null; }
function pick() {
  let best = null, bs = Infinity;
  for (const el of stage.anchors) {
    const r = rectOf(el); if (!r) continue;
    if (r.bottom < -H * 0.2 || r.top > H * 1.2) continue;
    let s = Math.abs((r.top + r.bottom) / 2 - H * 0.46);
    if (el === cur) s -= 90;
    if (s < bs) { bs = s; best = el; }
  }
  return best;
}
function target(el) { const r = rectOf(el); return r ? {x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height} : null; }

const ptr = {x: 0, y: 0, tx: 0, ty: 0, live: false};
window.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; ptr.live = true; ptr.px = e.clientX; ptr.py = e.clientY; }, {passive: true});
let blink = 0, nextBlink = 2, lastScroll = window.scrollY, vel = 0, last = performance.now(), time = 0, drawn = false, visible = true;
const ease = t => 1 - Math.pow(1 - t, 3.2);
const tmpC = new THREE.Color();

function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt; stateT += dt;
  const sy = window.scrollY; vel += ((sy - lastScroll) / Math.max(dt, 0.008) / 1400 - vel) * 0.12; lastScroll = sy;

  const next = pick();
  if (next && next !== cur) {
    prev = cur; cur = next;
    if (prev) { flyT = 0; flySpin = (target(cur)?.x ?? 0) >= pose.x ? 1 : -1; } else flyT = 1;
  }
  if (!cur) return;
  const want = cur.dataset.mel || 'idle';
  if (want !== state) setState(want, !drawn);
  const b = target(cur); if (!b) return;
  let p = b;
  if (flyT < 1) {
    flyT = Math.min(1, flyT + dt / 0.95);
    const a = (prev && target(prev)) || pose, e = ease(flyT);
    p = {x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e - Math.sin(Math.PI * e) * Math.min(120, Math.abs(b.y - a.y) * 0.25 + 30), h: a.h + (b.h - a.h) * e};
  }
  pose.x = p.x; pose.y = p.y; pose.h = p.h;
  const off = p.y + p.h < -40 || p.y - p.h > H + 40;
  if (off) { if (visible) { renderer.clear(); visible = false; } return; }
  visible = true;

  const s = p.h / 66;
  holder.position.set(p.x - W / 2, H / 2 - p.y - 1.5 * s, 0);
  holder.scale.setScalar(s);

  // pohled: kurzor, jinak klidné rozhlížení
  if (ptr.live) { ptr.tx = THREE.MathUtils.clamp((ptr.px - p.x) / (W * 0.45), -1, 1); ptr.ty = THREE.MathUtils.clamp((ptr.py - p.y) / (H * 0.5), -1, 1); }
  else { ptr.tx = Math.sin(time * 0.55) * 0.55; ptr.ty = Math.sin(time * 0.37 + 1) * 0.25; }
  ptr.x += (ptr.tx - ptr.x) * 0.08; ptr.y += (ptr.ty - ptr.y) * 0.08;

  const fe = flyT < 1 ? ease(flyT) : 1;
  spin.rotation.y = ptr.x * 0.5 + flySpin * (1 - fe) * Math.PI * 2 + Math.sin(time * 0.6) * 0.05;
  spin.rotation.x = ptr.y * 0.26 + THREE.MathUtils.clamp(vel, -1, 1) * 0.35;
  spin.rotation.z = THREE.MathUtils.clamp(-vel, -1, 1) * 0.06;

  // tělo podle stavu
  let by = 1 + Math.sin(time * 1.15) * 0.016, bx = 1, headZ = Math.sin(time * 0.7) * 0.015, gx = ptr.x * 1.9, gy = -ptr.y * 1.6, tap = 0, hop = 0, shake = 0;
  if (state === 'thinking') { headZ = 0.105 + Math.sin(time * 1.3) * 0.012; const j = Math.floor(time / 1.6) % 3; gx = [1.9, 1.2, 2.1][j]; gy = [1.7, 2.0, 1.2][j]; }
  else if (state === 'working') { by = 1 + Math.sin(time * 9) * 0.022; gx = Math.sin(time * 5) * 1.7; gy = -1.7; headZ = Math.sin(time * 4.5) * 0.02; }
  else if (state === 'waiting') { headZ = 0.05; tap = Math.max(0, Math.sin(time * 6.5)) * -0.2; }
  else if (state === 'error') { by = 0.965; headZ = -0.05; shake = Math.sin(time * 46) * Math.max(0, 1 - stateT * 1.6) * 1.6; }
  else if (state === 'done') { hop = stateT < 1.6 ? Math.abs(Math.sin(stateT * 5.2)) * 5 * (1 - stateT / 1.6) : 0; headZ = Math.sin(time * 2) * 0.03; }
  squash.scale.set(sq.sx * bx, sq.sy * by, 1 + (sq.sx - 1) * 0.5);
  squash.position.set(shake, FEET + sq.hop + hop, 0);
  head.rotation.z += (headZ - head.rotation.z) * 0.14;
  legL.rotation.z = -sq.legs * 0.34; legR.rotation.z = sq.legs * 0.34 + tap;
  shadow.scale.set(sq.sx * (1 - (sq.hop + hop) * 0.02), 1, 1);
  bodyMat.color.lerp(tmpC.copy(state === 'error' ? ERR : FX), 0.12);

  // oči
  nextBlink -= dt; if (nextBlink < 0) { blink = 1; nextBlink = 2.2 + Math.random() * 3.5; }
  blink = Math.max(0, blink - dt * 7);
  const lid = 1 - Math.sin(Math.min(1, blink) * Math.PI) * 0.92;
  for (const e of eyes) {
    e.scale.y = lid;
    const pu = e.userData.pupil;
    pu.position.x += (THREE.MathUtils.clamp(gx, -2.2, 2.2) - pu.position.x) * 0.2;
    pu.position.y += (THREE.MathUtils.clamp(gy, -2.2, 2.2) - pu.position.y) * 0.2;
  }

  // doplňky
  for (const m of allExtras) {
    const on = m.userData.k === state ? 1 : 0, i = m.userData.i;
    let k = on;
    if (on && state === 'thinking') { const ph = (stateT * 0.9) % 2.6; k = ph > 0.15 + i * 0.3 && ph < 2.2 ? 1 : 0; }
    m.userData.v += (k - m.userData.v) * (k ? 0.16 : 0.22);
    let sc = m.userData.s * Math.max(0.0001, m.userData.v);
    if (state === 'waiting' && on) sc *= 1 + Math.sin(time * 5) * 0.14;
    if (state === 'done' && on) sc *= 0.75 + Math.abs(Math.sin(time * 3 + i * 1.3)) * 0.4;
    if (m.geometry === gemGeo) { m.scale.set(sc, sc, sc * 0.55); m.rotation.y = time * (1.6 + i * 0.5) + i; if (state === 'working') m.position.y = Y([0.5, -8.5, -17.5][i]) + Math.max(0, Math.sin(time * 9 - i * 0.9)) * 1.6; }
    else m.scale.setScalar(sc);
    m.visible = m.userData.v > 0.01;
  }

  wob.uTime.value = time;
  renderer.render(scene, camera);
  if (!drawn) { drawn = true; document.documentElement.classList.add('mel3d'); }
}

resize();
window.addEventListener('resize', resize);
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.documentElement.classList.remove('mel3d'); });
requestAnimationFrame(frame);
