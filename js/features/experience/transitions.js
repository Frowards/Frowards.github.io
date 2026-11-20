/**
 * Transitions de lancement d'une expérience (« C'est parti ») : un calque
 * plein écran (div.xp-trans) recouvre la page le temps d'appliquer
 * l'expérience, puis s'efface.
 *   - Classique : voile qui se pose, « C'est parti » en lettres dorées, puis s'ouvre
 *   - Rétro     : allumage d'un écran cathodique, « C:\> RUN PORTFOLIO.EXE »
 *   - Spatial   : saut en hyperespace (traînées d'étoiles jusqu'aux bords,
 *                 canvas de hyperspace.js), au rythme des sauts de la visite
 *   - Gamer     : mosaïque de pixels parcourue d'une vague, « PRÊT ? GO ! »
 * Animations en CSS (css/features/experience/transitions.css).
 */
import { t } from '../../core/Lang.js';
import { esc } from '../../utils/dom.js';
import { prefersReducedMotion } from '../../utils/motion.js';
import { waveCells } from '../tour/fx-layer.js';
import { startHyperspace } from './hyperspace.js';

/** Instant où la page, recouverte, change d'expérience (ms) */
const MID_MS = { classic: 520, retro: 700, future: 720, gamer: 760 };
/** Début de la sortie du calque (ms) : chaque effet va à son terme, texte
 *  compris, avant que le calque s'efface (rythme des sauts de la visite) */
const OUT_MS = { classic: 1500, retro: 1900, future: 2000, gamer: 2000 };
/** Fin de la transition : sortie terminée, le calque est retiré (ms) */
const END_MS = { classic: 2150, retro: 2700, future: 2700, gamer: 2750 };
/** Valeurs par défaut (expérience inconnue) */
const DEFAULT_MID_MS = 600;
const DEFAULT_END_MS = 1300;

/** Contenu du calque de chaque expérience */
const LAYERS = {
    classic: () => [
        '<span class="xp-trans__glow"></span>',
        `<span class="xp-trans__txt">${esc(t('EXP.T_CLASSIC'))}</span>`
    ].join(''),
    retro: () => `<span class="xp-trans__line"></span><span class="xp-trans__txt">${esc(t('EXP.T_RETRO'))}</span>`,
    future: () => [
        '<canvas class="xp-trans__sky"></canvas>',
        `<span class="xp-trans__txt">${esc(t('EXP.T_FUTURE'))}</span>`
    ].join(''),
    gamer: () => `<span class="xp-trans__pix">${waveCells(0.45)}</span><span class="xp-trans__txt">${esc(t('EXP.T_GAMER'))}</span>`
};

/**
 * Joue la transition de l'expérience exp.
 * @param {string} exp           expérience lancée
 * @param {object} options
 * @param {boolean} options.light  variante claire (Spatial clair)
 * @param {Function} options.onCovered  page recouverte : appliquer l'expérience
 * @param {Function} options.onEnd      transition terminée
 * Mouvement réduit : les deux rappels sont appelés aussitôt, sans calque.
 */
export function playLaunchTransition(exp, { light, onCovered, onEnd }) {
    if (prefersReducedMotion()) {
        onCovered();
        onEnd();
        return;
    }
    const layer = document.createElement('div');
    layer.className = `xp-trans xp-trans--${exp}${light ? ' is-light' : ''}`;
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = (LAYERS[exp] || LAYERS.classic)();
    document.body.appendChild(layer);
    const mid = MID_MS[exp] || DEFAULT_MID_MS;
    const out = OUT_MS[exp] || mid;
    const sky = layer.querySelector('.xp-trans__sky');
    const stopSky = sky ? startHyperspace(sky, { light, duration: out }) : () => {};
    requestAnimationFrame(() => layer.classList.add('is-on'));
    setTimeout(onCovered, mid);
    setTimeout(() => layer.classList.add('is-out'), out);
    setTimeout(() => {
        stopSky();
        layer.remove();
        onEnd();
    }, END_MS[exp] || DEFAULT_END_MS);
}
