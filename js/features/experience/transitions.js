/**
 * Transitions de lancement d'une expérience (« C'est parti ») : un calque
 * plein écran (div.xp-trans) recouvre la page le temps d'appliquer
 * l'expérience, puis s'efface.
 *   - Classique : voile qui se pose puis s'ouvre en douceur
 *   - Rétro     : allumage d'un écran cathodique, « C:\> RUN PORTFOLIO.EXE »
 *   - Spatial   : saut en hyperespace (traînées d'étoiles)
 *   - Gamer     : mosaïque de pixels et « PRÊT ? GO ! »
 * Animations en CSS (css/features/experience/transitions.css).
 */
import { t } from '../../core/Lang.js';
import { esc } from '../../utils/dom.js';
import { prefersReducedMotion } from '../../utils/motion.js';
import { pixelCells } from '../tour/fx-layer.js';

/** Instant où la page, recouverte, change d'expérience (ms) */
const MID_MS = { classic: 520, retro: 700, future: 720, gamer: 760 };
/** Fin de la transition : le calque est retiré (ms) */
const END_MS = { classic: 1150, retro: 1500, future: 1500, gamer: 1700 };
/** Valeurs par défaut (expérience inconnue) */
const DEFAULT_MID_MS = 600;
const DEFAULT_END_MS = 1300;

/** Contenu du calque de chaque expérience */
const LAYERS = {
    classic: () => '<span class="xp-trans__glow"></span>',
    retro: () => `<span class="xp-trans__line"></span><span class="xp-trans__txt">${esc(t('EXP.T_RETRO'))}</span>`,
    future: () => [
        '<span class="xp-trans__warp"></span><span class="xp-trans__warp xp-trans__warp--b"></span>',
        `<span class="xp-trans__txt">${esc(t('EXP.T_FUTURE'))}</span>`
    ].join(''),
    gamer: () => `<span class="xp-trans__pix">${pixelCells(96, 0.45)}</span><span class="xp-trans__txt">${esc(t('EXP.T_GAMER'))}</span>`
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
    requestAnimationFrame(() => layer.classList.add('is-on'));
    setTimeout(() => {
        onCovered();
        layer.classList.add('is-out');
    }, MID_MS[exp] || DEFAULT_MID_MS);
    setTimeout(() => {
        layer.remove();
        onEnd();
    }, END_MS[exp] || DEFAULT_END_MS);
}
