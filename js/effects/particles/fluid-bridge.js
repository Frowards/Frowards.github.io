/**
 * fluid-bridge - pilotage de l'effet 'fluid' depuis le moteur de particules.
 *
 * Le fluide est une simulation WebGL (module Fluid) dessinée sur son propre
 * canvas #pb-fluid : ce pont l'affiche, le démarre avec les réglages de
 * l'effet, les lui transmet à chaud et le masque à l'arrêt.
 */
import Fluid from '../fluid/Fluid.js';
import { paramsOf } from './params.js';

let fluidCanvas = null;
let running = false;

/** Réglages de l'effet 'fluid' au format attendu par Fluid */
function fluidOptions() {
    const p = paramsOf('fluid');
    return {
        colors: p.colors, color: p.color, radius: p.radius, trail: p.trail,
        intensity: p.intensity, ambient: p.ambient, motif: p.motif, ambientMode: p.ambientMode
    };
}

/** Vrai si la simulation tourne */
export function isFluidRunning() {
    return running;
}

/**
 * Démarre le fluide (ou lui transmet les réglages s'il tourne déjà).
 * @returns {boolean} false si impossible (pas de WebGL, pas de canvas)
 */
export function startFluid() {
    fluidCanvas = fluidCanvas || document.getElementById('pb-fluid');
    if (!fluidCanvas) return false;
    if (running) {
        Fluid.setOptions(fluidOptions());
        return true;
    }
    fluidCanvas.hidden = false;
    let ok = false;
    try {
        ok = Fluid.start(fluidCanvas, fluidOptions());
    } catch (err) {
        ok = false;
    }
    if (!ok) {
        fluidCanvas.hidden = true;
        return false;
    }
    running = true;
    return true;
}

/** Transmet les réglages courants à la simulation en cours */
export function updateFluid() {
    Fluid.setOptions(fluidOptions());
}

/** Arrête la simulation et masque son canvas */
export function stopFluid() {
    if (running) Fluid.stop();
    running = false;
    if (fluidCanvas) fluidCanvas.hidden = true;
}

/** Vrai si le navigateur sait faire tourner le fluide (WebGL) */
export function fluidSupported() {
    return !!Fluid.supported();
}
