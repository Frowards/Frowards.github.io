/**
 * Mises en scène des changements d'étape, une par expérience :
 *   - Classique : diaporama en fondu glissé
 *   - Rétro     : l'écran s'éteint, « C:\> LOAD CERES.DAT », puis se rallume
 *   - Gamer     : écran « STAGE 2 » sur une mosaïque de pixels parcourue
 *                 d'une vague (la même qu'au lancement de l'expérience)
 *   - Spatial   : l'interface se replie, saut en hyperespace (les étoiles
 *                 s'étirent) et la zone suivante surgit de l'espace
 * Les animations elles-mêmes sont en CSS (css/features/tour/transitions.css,
 * warp.css) : ce module pose les classes au bon moment.
 */
import { t } from '../../core/Lang.js';
import { esc } from '../../utils/dom.js';
import { pad2 } from './steps.js';
import Cockpit from './Cockpit.js';
import Starfield from './space/Starfield.js';
import { showFxLayer, fadeOutFxLayer, removeFxLayer, waveCells } from './fx-layer.js';

/** Classes d'animation posées sur les étapes pendant une transition */
const ANIMATION_CLASSES = ['tour-out', 'tour-in', 'tour-fwd', 'tour-back', 'tour-crt-off', 'tour-crt-on', 'tour-fold', 'tour-arrive', 'is-leaving'];

/** Calendriers des mises en scène (ms depuis le début de la transition) */
const TIMING = {
    classic: { end: 950 },
    retro: { screenOff: 450, screenOn: 2100, end: 2700 },
    gamer: { show: 700, curtainOut: 2100, end: 2650 },
    future: { jump: 500, warp: 2300, arrive: 2600, end: 3650 }
};

/** Apparitions en cascade dans une étape : délai par bloc et plafond (ms) */
const REVEAL_STEP_MS = 70;
const REVEAL_MAX_DELAY_MS = 560;
const REVEAL_CLEANUP_MS = 1400;

const later = (ms, fn) => setTimeout(fn, ms);

/** Retire d'une étape toutes les classes d'animation */
export function clearStepAnimation(step) {
    step.classList.remove(...ANIMATION_CLASSES);
}

/** Rejoue les apparitions (.reveal) de l'étape, en cascade */
export function replayReveals(step) {
    const items = step.querySelectorAll('.reveal');
    items.forEach((item) => {
        item.classList.remove('visible');
        item.style.transitionDelay = '';
    });
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            items.forEach((item, i) => {
                item.style.transitionDelay = `${Math.min(i * REVEAL_STEP_MS, REVEAL_MAX_DELAY_MS)}ms`;
                item.classList.add('visible');
            });
            later(REVEAL_CLEANUP_MS, () => items.forEach((item) => { item.style.transitionDelay = ''; }));
        });
    });
}

/* Chaque scène reçoit { from, to, index, name, dir, show, done } :
   from / to  éléments des étapes quittée et visée
   index      numéro de l'étape visée, name son nom traduit
   dir        1 vers l'avant, -1 vers l'arrière
   show()     affiche l'étape visée ; done() libère la visite */

function classicScene({ from, to, dir, show, done }) {
    const way = dir > 0 ? 'tour-fwd' : 'tour-back';
    from.classList.add('is-leaving', 'tour-out', way);
    to.classList.add('tour-in', way);
    show();
    later(TIMING.classic.end, done);
}

function retroScene({ from, to, name, show, done }) {
    const T = TIMING.retro;
    from.classList.add('is-leaving', 'tour-crt-off');
    later(T.screenOff, () => {
        from.classList.remove('is-leaving');
        const file = name.toUpperCase().replace(/\s+/g, '_');
        showFxLayer('tour-fx--retro', `<span class="tour-fx__txt">${esc(t('TOUR.LOAD', { name: file }))}</span><span class="tour-fx__bar"><i></i></span>`);
    });
    later(T.screenOn, () => {
        removeFxLayer();
        to.classList.add('tour-crt-on');
        show();
    });
    later(T.end, done);
}

function gamerScene({ index, name, show, done }) {
    const T = TIMING.gamer;
    const card = `<span class="tour-fx__card"><b>${esc(t('TOUR.STAGE', { n: index + 1 }))}</b><span>${esc(name.toUpperCase())}</span></span>`;
    showFxLayer('tour-fx--gamer', `<span class="tour-fx__pix">${waveCells(0.35)}</span>${card}`);
    later(T.show, show);
    later(T.curtainOut, fadeOutFxLayer);
    later(T.end, () => { removeFxLayer(); done(); });
}

function futureScene({ from, to, index, name, show, done }) {
    const T = TIMING.future;
    const root = document.documentElement;
    root.classList.add('tour-warping');
    from.classList.add('is-leaving', 'tour-fold');
    Cockpit.setWarp(true);
    later(T.jump, () => {
        from.classList.remove('is-leaving');
        Starfield.warp(T.warp);
        /* « Saut vers la zone 02 : » sur une ligne, le nom de la zone dessous */
        const jump = esc(t('TOUR.JUMP', { nn: pad2(index + 1) }));
        showFxLayer('tour-fx--future', `<span class="tour-fx__txt"><span>${jump}</span><span>${esc(name.toUpperCase())}</span></span>`);
    });
    later(T.arrive, () => {
        removeFxLayer();
        to.classList.add('tour-arrive');
        show();
        root.classList.remove('tour-warping');
        Cockpit.setWarp(false);
    });
    later(T.end, done);
}

const SCENES = { classic: classicScene, retro: retroScene, gamer: gamerScene, future: futureScene };

/**
 * Joue la mise en scène de l'expérience exp (Classique par défaut).
 * @param {string} exp     expérience courante
 * @param {object} scene   { from, to, index, name, dir, show, done }
 */
export function playStepTransition(exp, scene) {
    (SCENES[exp] || classicScene)(scene);
}
