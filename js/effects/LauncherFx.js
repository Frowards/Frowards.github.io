/**
 * LauncherFx - halo de particules autour de la fenêtre-lanceur du héros.
 *
 * Des lucioles orbitent le long du cadre (traîne + halo) et lâchent des
 * étincelles. Couleur fixe « lumière du soleil », indépendante du thème.
 * Coupé si prefers-reduced-motion, en pause hors écran ou onglet caché.
 *
 * Balisage attendu : .launcher-wrap > .launcher + canvas.launcher-fx
 */
import { SUN_CORE, SUN_GLOW, sunRgba } from './sunlight.js';
import { prefersReducedMotion, onReducedMotionChange } from '../utils/motion.js';

const BLEED = 28;          // débord du canvas autour du cadre (px CSS)
const ORBITERS = 10;       // lucioles sur le périmètre
const TRAIL = 26;          // longueur de traîne (px le long du bord)
const TRAIL_DOTS = 6;      // points composant la traîne
const SPARK_EVERY = 0.09;  // s entre deux étincelles (moyenne)
const MAX_SPARKS = 40;

let wrap = null;
let launcher = null;
let canvas = null;
let ctx = null;
let cw = 0;                // taille du canvas (px CSS)
let ch = 0;
let geo = null;            // périmètre du rectangle arrondi
let orbiters = [];
let sparks = [];
let raf = 0;
let lastT = 0;
let sparkTimer = 0;
let visible = true;
let started = false;

/* ---------- Géométrie : périmètre du rectangle arrondi ---------- */

/** Découpe le cadre du lanceur en 4 bords et 4 arcs, parcourus dans le sens horaire */
function computeGeo() {
    const w = launcher.offsetWidth;
    const h = launcher.offsetHeight;
    if (!w || !h) {
        geo = null;
        return;
    }
    let r = parseFloat(getComputedStyle(launcher).borderTopLeftRadius) || 0;
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    const x = BLEED;
    const y = BLEED;
    const ew = w - 2 * r;
    const eh = h - 2 * r;
    const arc = r * Math.PI / 2;
    /* Segments dans l'ordre horaire depuis le haut-gauche (après l'arc) ;
       n = normale sortante des bords droits */
    const segs = [
        { t: 'l', len: ew, x: x + r, y, dx: 1, dy: 0, nx: 0, ny: -1 },
        { t: 'a', len: arc, cx: x + w - r, cy: y + r, a0: -Math.PI / 2 },
        { t: 'l', len: eh, x: x + w, y: y + r, dx: 0, dy: 1, nx: 1, ny: 0 },
        { t: 'a', len: arc, cx: x + w - r, cy: y + h - r, a0: 0 },
        { t: 'l', len: ew, x: x + w - r, y: y + h, dx: -1, dy: 0, nx: 0, ny: 1 },
        { t: 'a', len: arc, cx: x + r, cy: y + h - r, a0: Math.PI / 2 },
        { t: 'l', len: eh, x, y: y + h - r, dx: 0, dy: -1, nx: -1, ny: 0 },
        { t: 'a', len: arc, cx: x + r, cy: y + r, a0: Math.PI }
    ];
    let total = 0;
    segs.forEach((s) => {
        s.d0 = total;
        total += s.len;
    });
    geo = { segs, total, r };
}

/** Point (et normale sortante) à la distance d le long du périmètre */
function pointAt(d) {
    if (!geo) return { x: 0, y: 0, nx: 0, ny: 0 };
    d = ((d % geo.total) + geo.total) % geo.total;
    const { segs } = geo;
    for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (s.len <= 0) continue;   // arrondis à 0 : arcs de longueur nulle
        if (d <= s.d0 + s.len || i === segs.length - 1) {
            const u = d - s.d0;
            if (s.t === 'l') {
                return { x: s.x + s.dx * u, y: s.y + s.dy * u, nx: s.nx, ny: s.ny };
            }
            const a = s.a0 + (u / s.len) * Math.PI / 2;
            return {
                x: s.cx + Math.cos(a) * geo.r,
                y: s.cy + Math.sin(a) * geo.r,
                nx: Math.cos(a), ny: Math.sin(a)
            };
        }
    }
    return { x: 0, y: 0, nx: 0, ny: 0 };
}

/* ---------- Particules ---------- */

/** Répartit les lucioles sur le périmètre */
function buildOrbiters() {
    orbiters = [];
    if (!geo) return;
    for (let i = 0; i < ORBITERS; i++) {
        orbiters.push({
            d: (geo.total / ORBITERS) * i + Math.random() * 30,
            speed: 55 + Math.random() * 45,             // px/s, toutes dans le sens horaire
            size: 1.4 + Math.random() * 1.3,
            pulse: Math.random() * Math.PI * 2
        });
    }
}

/** Lâche une étincelle depuis un point du cadre, vers l'extérieur */
function spawnSpark() {
    if (!geo) return;
    const p = pointAt(Math.random() * geo.total);
    const drift = 8 + Math.random() * 16;
    sparks.push({
        x: p.x, y: p.y,
        vx: p.nx * drift + (Math.random() - 0.5) * 10,
        vy: p.ny * drift + (Math.random() - 0.5) * 10 - 4,
        life: 0, max: 0.9 + Math.random() * 0.8,
        size: 0.7 + Math.random() * 1.1
    });
    if (sparks.length > MAX_SPARKS) sparks.splice(0, sparks.length - MAX_SPARKS);
}

/** Luciole et sa traîne */
function drawOrbiter(o, dt) {
    o.d += o.speed * dt;
    o.pulse += dt * 3;
    const glow = 0.65 + Math.sin(o.pulse) * 0.35;
    for (let j = TRAIL_DOTS; j >= 1; j--) {
        const p = pointAt(o.d - (TRAIL / TRAIL_DOTS) * j);
        ctx.beginPath();
        ctx.arc(p.x, p.y, o.size * (1 - j / 8), 0, Math.PI * 2);
        ctx.fillStyle = sunRgba(SUN_GLOW, 0.28 * glow * (1 - j / 7));
        ctx.fill();
    }
    const p = pointAt(o.d);
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = sunRgba(SUN_GLOW, 0.95);
    ctx.beginPath();
    ctx.arc(p.x, p.y, o.size, 0, Math.PI * 2);
    ctx.fillStyle = sunRgba(SUN_CORE, 0.6 + 0.4 * glow);
    ctx.fill();
    ctx.restore();
}

/** Étincelles qui s'échappent du cadre en s'éteignant */
function drawSparks(dt) {
    sparkTimer += dt;
    if (sparkTimer > SPARK_EVERY * (0.5 + Math.random())) {
        sparkTimer = 0;
        spawnSpark();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;
        if (s.life >= s.max) {
            sparks.splice(i, 1);
            continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy -= 6 * dt;   // légère montée
        const k = 1 - s.life / s.max;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * k, 0, Math.PI * 2);
        ctx.fillStyle = sunRgba(SUN_GLOW, 0.6 * k);
        ctx.fill();
    }
}

/* ---------- Boucle ---------- */

function step(now) {
    raf = requestAnimationFrame(step);
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    if (!geo || document.hidden) return;
    ctx.clearRect(0, 0, cw, ch);
    orbiters.forEach((o) => drawOrbiter(o, dt));
    drawSparks(dt);
}

function play() {
    if (raf || !visible || prefersReducedMotion() || !started) return;
    lastT = performance.now();
    raf = requestAnimationFrame(step);
}

function pause() {
    if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
    }
    if (ctx) ctx.clearRect(0, 0, cw, ch);
}

/* ---------- Dimensionnement ---------- */

/** Canvas = cadre + débord, à la résolution de l'écran (devicePixelRatio plafonné à 2) */
function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cw = launcher.offsetWidth + BLEED * 2;
    ch = launcher.offsetHeight + BLEED * 2;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    computeGeo();
    if (!orbiters.length) buildOrbiters();
}

/* ---------- Init ---------- */

/** Branche l'effet sur le lanceur du héros (sans effet si le balisage est absent) */
function init() {
    wrap = document.querySelector('.launcher-wrap');
    launcher = wrap ? wrap.querySelector('.launcher') : null;
    canvas = wrap ? wrap.querySelector('.launcher-fx') : null;
    if (!wrap || !launcher || !canvas || !canvas.getContext) return;
    ctx = canvas.getContext('2d');
    started = true;
    resize();

    if (window.ResizeObserver) {
        new ResizeObserver(() => resize()).observe(launcher);
    } else {
        window.addEventListener('resize', resize);
    }
    if (window.IntersectionObserver) {
        new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
            if (visible) play();
            else pause();
        }, { rootMargin: '80px' }).observe(wrap);
    }
    onReducedMotionChange((reduced) => {
        if (reduced) pause();
        else play();
    });
    play();
}

export default { init };
