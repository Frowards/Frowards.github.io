/**
 * Fluid - fond "fluide" WebGL qui suit la souris (façon fond d'écran
 * Lively "Fluid") : chaque mouvement du pointeur injecte de la couleur et
 * une poussée dans un fluide simulé sur le GPU, un clic fait une éclaboussure.
 * Option 'ambient' : un pinceau invisible trace tout seul des rubans, des
 * figures (coeur, infini, étoile, fleur, spirale) ou des mots.
 *
 * Algorithme d'après "WebGL Fluid Simulation" de Pavel Dobryakov
 * https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
 * Copyright (c) 2017 Pavel Dobryakov - licence MIT.
 *
 * Canvas transparent (alpha prémultiplié). La boucle s'arrête d'elle-même
 * quand plus rien n'est visible et repart au premier mouvement.
 * Respecte prefers-reduced-motion (jamais démarré dans ce cas).
 *
 * Modules : simulation (solveur GPU), pointer (entrées), ambient (pinceau),
 * motifs (tracés), colors, options, shaders, webgl, framebuffers, config.
 */
import FluidSimulation from './simulation.js';
import PointerInput from './pointer.js';
import AmbientBrush from './ambient.js';
import { createContext } from './webgl.js';
import { settings, applyOptions, getDensityDissipation, COLOR_MODES, MOTIFS, AMBIENT_MODES } from './options.js';
import { BASE_RADIUS, DYE_BASE, FADE_EPS, MAX_DPR } from './config.js';
import { prefersReducedMotion } from '../../utils/motion.js';

/* État WebGL */
let canvas = null;
let gl = null;
let sim = null;
let lost = false;

/* État de la boucle et des entrées */
let rafId = null;
let lastTime = 0;
let lastMove = 0;
let energy = 0;           // estimation (sans relire le GPU) de la couleur la plus forte à l'écran
let resizeDirty = true;
let rect = { left: 0, top: 0, width: 1, height: 1 };
const pointer = new PointerInput();
let brush = new AmbientBrush();
let supportCache = null;

/**
 * Pinceau commun au pointeur et au pinceau ambiant : convertit les réglages
 * en taches pour la simulation et tient le compte de la couleur injectée.
 */
const painter = {
    get width() { return canvas.width; },
    get height() { return canvas.height; },

    /**
     * Injecte une tache en (x, y) uv.
     * @param {number} radiusScale facteur de rayon (1 = taille réglée)
     */
    splat(x, y, dx, dy, color, radiusScale) {
        const radius = BASE_RADIUS * (settings.radius / 100) * (radiusScale || 1) / 100;
        sim.splat(x, y, dx, dy, color, radius);
        if (color) energy = Math.min(2, energy + Math.max(color.r, color.g, color.b));
    },

    /** Quantité de couleur d'une tache selon l'intensité réglée */
    dyeAmount() {
        return DYE_BASE * settings.intensity / 100;
    },

    /* Déplacements uv -> vitesse isotrope (corrige l'étirement du canvas) */
    correctDX(d) {
        const aspect = canvas.width / canvas.height;
        return aspect < 1 ? d * aspect : d;
    },

    correctDY(d) {
        const aspect = canvas.width / canvas.height;
        return aspect > 1 ? d / aspect : d;
    }
};

/** Applique des réglages et réinitialise ce qu'ils rendent caduc */
function updateSettings(o) {
    const { motifChanged, colorsChanged } = applyOptions(o);
    if (motifChanged) brush.path = null;
    if (colorsChanged) {
        pointer.color = null;
        brush.color = null;
    }
}

/* ---------------------------------------------------------------- Boucle */

/** Relance la boucle si elle dort */
function wake() {
    if (!gl || lost || rafId !== null || document.hidden) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
}

function frame(now) {
    rafId = null;
    if (!gl || lost || document.hidden) return;
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (!(dt > 0.001)) dt = 0.001;
    if (dt > 0.016666) dt = 0.016666;
    if (resizeDirty) resize();
    pointer.flush(dt, now, settings, painter);
    brush.step(dt, now, { settings, lastMove, painter });
    const dissipation = getDensityDissipation();
    sim.step(dt, dissipation);
    sim.render();
    energy /= 1 + dissipation * dt;
    if (energy > FADE_EPS || pointer.pending || settings.ambient > 0) {
        rafId = requestAnimationFrame(frame);
    } else {
        goIdle();
    }
}

/** Plus rien à animer : on vide les champs et le canvas, la boucle s'arrête */
function goIdle() {
    energy = 0;
    sim.clearAll();
}

/** Tampon de dessin = taille CSS x devicePixelRatio (plafonné) */
function resize() {
    resizeDirty = false;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const r = canvas.getBoundingClientRect();
    const cw = r.width || window.innerWidth;
    const ch = r.height || window.innerHeight;
    rect = { left: r.left, top: r.top, width: cw, height: ch };
    const w = Math.max(1, Math.round(cw * dpr));
    const h = Math.max(1, Math.round(ch * dpr));
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }
    sim.resizeFields();
}

/* ---------------------------------------------------------------- Écouteurs */

/** Position d'un événement en uv du canvas (y vers le haut) */
function eventToUv(e) {
    return { x: (e.clientX - rect.left) / rect.width, y: 1 - (e.clientY - rect.top) / rect.height };
}

const onPointerMove = (e) => {
    if (!gl) return;
    pointer.move(eventToUv(e));
    lastMove = performance.now();
    wake();
};

const onPointerDown = (e) => {
    if (!gl || e.button !== 0) return;
    pointer.press(eventToUv(e));
    lastMove = performance.now();
    wake();
};

const onResize = () => {
    resizeDirty = true;
    wake();
};

const onVisibility = () => {
    if (document.hidden) {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
    } else {
        wake();
    }
};

const onContextLost = () => {
    lost = true;
    stop();
};

/* ---------------------------------------------------------------- Cycle de vie */

/** Libère les ressources GPU, sauf si le contexte est déjà perdu */
function releaseGL() {
    if (!gl || lost || (gl.isContextLost && gl.isContextLost())) return;
    sim.destroy();
}

/** Revient à l'état "arrêté" (les réglages sont conservés) */
function reset() {
    canvas = null;
    gl = null;
    sim = null;
    energy = 0;
    pointer.reset();
    brush = new AmbientBrush();
    resizeDirty = true;
}

/**
 * Démarre le fluide sur un canvas.
 * @param {HTMLCanvasElement} cv canvas d'affichage (plein écran, transparent)
 * @param {Object} [o] réglages (voir options.js)
 * @returns {boolean} false si impossible (pas de WebGL, animations réduites...)
 */
function start(cv, o) {
    stop();
    if (o) updateSettings(o);
    if (!cv || !cv.getContext || prefersReducedMotion()) return false;
    const ctx = createContext(cv);
    if (!ctx) return false;
    canvas = cv;
    gl = ctx;
    sim = new FluidSimulation(gl);
    lost = false;
    try {
        if (gl.isContextLost && gl.isContextLost()) throw new Error('[Fluid] contexte perdu');
        sim.init();
        resize();
    } catch (err) {
        releaseGL();
        reset();
        return false;
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onContextLost);
    lastMove = performance.now();
    if (settings.ambient > 0) wake();
    return true;
}

/** Arrête la boucle, retire les écouteurs et libère le GPU */
function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    if (canvas) canvas.removeEventListener('webglcontextlost', onContextLost);
    if (gl) releaseGL();
    reset();
}

/**
 * Modifie les réglages à chaud (sans redémarrer la simulation).
 * @param {Object} o réglages partiels (voir options.js)
 */
function setOptions(o) {
    updateSettings(o);
    if (gl) wake();
}

/** WebGL disponible ? (testé une fois sur un canvas jetable, contexte libéré aussitôt) */
function supported() {
    if (supportCache !== null) return supportCache;
    try {
        const c = document.createElement('canvas');
        const ctx = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
        supportCache = !!ctx;
        if (ctx) {
            const ext = ctx.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
        }
    } catch (err) {
        supportCache = false;
    }
    return supportCache;
}

const Fluid = {
    start,
    stop,
    setOptions,
    supported,
    COLOR_MODES,
    MOTIFS,
    AMBIENT_MODES
};

export default Fluid;
