/**
 * Particles - moteur des fonds animés de la page (canvas #pb-particles).
 *
 * Effets disponibles (registre ./effects/index.js) : default (points reliés),
 * snow, flakes, stars, bubbles, fireflies, confetti, halloween, easter,
 * hexgrid, ribbons, coderain, fluid, off.
 *   - fluid : simulation WebGL déléguée au module Fluid sur son propre
 *     canvas #pb-fluid ; repli sur 'default' si WebGL est indisponible.
 *   - réglages par effet (EFFECT_PARAMS) : pluie de code et fluide.
 *   - interactions souris (INTERACTIONS) : voir interactions.js.
 *
 * Le moteur est piloté par le thème (Theme.apply) :
 *     Particles.setInteraction(cfg.interaction);
 *     Particles.setParams(cfg.effectParams);
 *     Particles.setEffect(cfg.effect);
 *
 * Respecte prefers-reduced-motion : aucun effet n'est alors démarré.
 */
import REGISTRY from './effects/index.js';
import { EFFECT_PARAMS, param, replaceParams, paramsSignature } from './params.js';
import { INTERACTIONS, NO_INTERACTION, resolveMode, applyForce, drawGrabLines, trackPointer } from './interactions.js';
import { accentRgb } from './helpers.js';
import { startFluid, stopFluid, updateFluid, isFluidRunning, fluidSupported } from './fluid-bridge.js';
import { prefersReducedMotion } from '../../utils/motion.js';

let canvas = null;
let ctx = null;
let rafId = null;
let current = 'off';
let interaction = 'default';
let state = null;
const mouse = { x: -9999, y: -9999 };

/** Mode d'interaction effectif de l'effet courant */
function activeMode() {
    return resolveMode(current, interaction);
}

/** Contexte de dessin transmis aux effets (voir le type Scene du registre) */
const scene = {
    get ctx() { return ctx; },
    get width() { return canvas.width; },
    get height() { return canvas.height; },
    mouse,
    force: (p) => applyForce(p, activeMode(), mouse, canvas.width, canvas.height),
    grabLines: (parts) => {
        if (activeMode() === 'grab') drawGrabLines(ctx, parts, mouse, accentRgb());
    }
};

/* ---------- Boucle d'animation ---------- */

function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    REGISTRY[current].step(state, scene);
    rafId = requestAnimationFrame(frame);
}

/** Canvas à la taille de la fenêtre */
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/** Redimensionne et recrée l'état de l'effet courant */
function restart() {
    resize();
    state = REGISTRY[current].init(scene);
}

/** Récupère le canvas au premier usage et branche les écouteurs (une seule fois) */
function ensureCanvas() {
    if (canvas) return true;
    canvas = document.getElementById('pb-particles');
    if (!canvas) return false;
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', () => {
        if (current !== 'off' && rafId) restart();
    });
    trackPointer(mouse);
    return true;
}

/* ---------- API ---------- */

/**
 * Affiche l'effet demandé ('default' si inconnu). Ne fait rien si le même
 * effet tourne déjà avec les mêmes réglages : l'animation n'est pas relancée
 * à chaque réglage du thème.
 * @param {string} name clé du registre (Particles.EFFECTS)
 */
function setEffect(name) {
    if (!REGISTRY[name]) name = 'default';
    const prevKey = `${current}|${paramsSignature(current)}`;
    const nextKey = `${name}|${paramsSignature(name)}`;
    if (prevKey === nextKey && (rafId || isFluidRunning())) return;
    current = name;
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    if (!ensureCanvas()) return;
    if (name !== 'fluid') stopFluid();
    if (name === 'off' || prefersReducedMotion()) {
        stopFluid();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.hidden = true;
        return;
    }
    if (name === 'fluid') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.hidden = true;
        if (startFluid()) return;
        current = 'default';   // repli sans WebGL
    }
    canvas.hidden = false;
    restart();
    rafId = requestAnimationFrame(frame);
}

/**
 * Choisit l'interaction souris ('default' si inconnue).
 * @param {string} mode une valeur de Particles.INTERACTIONS
 */
function setInteraction(mode) {
    interaction = INTERACTIONS.includes(mode) ? mode : 'default';
}

/**
 * Réglages de tous les effets ({ effet: { clé: valeur } }). Si ceux de
 * l'effet en cours changent, il est mis à jour : le fluide à chaud, les
 * autres effets sont réinitialisés.
 * @param {Object<string, Object>} all réglages par effet
 */
function setParams(all) {
    const before = paramsSignature(current);
    replaceParams(all);
    if (before === paramsSignature(current)) return;
    if (current === 'fluid' && isFluidRunning()) {
        updateFluid();
        return;
    }
    if (rafId && canvas) restart();
}

const Particles = {
    setEffect,
    setInteraction,
    setParams,

    /** Valeur d'un réglage d'effet : param(effet, clé) (défaut du registre si non réglé) */
    param,

    /** Coupe le fond animé */
    stop() {
        setEffect('off');
    },

    /** Effet réellement affiché (peut différer du choix : repli du fluide) */
    get current() {
        return current;
    },

    /** Vrai si le navigateur sait afficher l'effet fluide (WebGL) */
    fluidSupported,

    /** Clés des effets, dans l'ordre proposé à l'utilisateur */
    EFFECTS: Object.freeze(Object.keys(REGISTRY)),
    EFFECT_PARAMS,
    INTERACTIONS,
    NO_INTERACTION
};

export default Particles;
