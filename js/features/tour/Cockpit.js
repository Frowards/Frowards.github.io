/**
 * Cockpit - poste de pilotage de l'expérience Spatial.
 *
 * Montants du pare-brise (SVG étiré sur tout l'écran), titre de navigation
 * et deux lectures de bord : la vitesse (alimentée à chaque image par le
 * ciel étoilé) et la zone visitée. Pendant un saut en hyperespace, le
 * cockpit tremble (classe is-warp).
 *
 * Purement décoratif : aria-hidden, aucun élément interactif.
 */
import { t } from '../../core/Lang.js';
import { esc } from '../../utils/dom.js';

let cockpit = null;

/** Vitesse affichée au démarrage, avant la première image du ciel étoilé */
const INITIAL_SPEED = '0.05';

/** Conversion de la vitesse interne du ciel étoilé en fraction de c */
const SPEED_TO_C = 0.9;

/** Coque et montants du pare-brise (repère 1000 x 1000, étiré) */
const FRAME = [
    '<svg class="ck-frame" viewBox="0 0 1000 1000" preserveAspectRatio="none">',
    '<path class="ck-hull" d="M0 0H1000V26H640L610 46H390L360 26H0Z"/>',
    '<path class="ck-hull ck-side" d="M0 26H55L0 130Z"/>',
    '<path class="ck-hull ck-side" d="M1000 26H945L1000 130Z"/>',
    '<path class="ck-hull ck-side" d="M0 1000V880L40 1000Z"/>',
    '<path class="ck-hull ck-side" d="M1000 1000V880L960 1000Z"/>',
    '<path class="ck-line" d="M0 26H360L390 46H610L640 26H1000"/>',
    '<path class="ck-line ck-side" d="M55 26L0 130M945 26L1000 130M0 880L40 1000M1000 880L960 1000"/>',
    '</svg>'
].join('');

function cockpitMarkup() {
    return [
        FRAME,
        `<div class="ck-top"><span class="ck-led"></span><span>${esc(t('TOUR.CK_TITLE'))}</span></div>`,
        `<div class="ck-read ck-read--l"><span>${esc(t('TOUR.CK_SPEED'))}</span>`,
        `<b data-ck="speed">${esc(t('TOUR.CK_SPEED_VALUE', { speed: INITIAL_SPEED }))}</b></div>`,
        `<div class="ck-read ck-read--r"><span>${esc(t('TOUR.CK_ZONE'))}</span><b data-ck="zone"></b></div>`,
        '<div class="ck-glare"></div>'
    ].join('');
}

/** Lecture de bord nommée (« speed », « zone ») */
function reading(name) {
    return cockpit ? cockpit.querySelector(`[data-ck="${name}"]`) : null;
}

const Cockpit = {
    /** Crée le cockpit (une seule fois, dans la langue courante) */
    build() {
        if (cockpit) return;
        cockpit = document.createElement('div');
        cockpit.id = 'pb-cockpit';
        cockpit.setAttribute('aria-hidden', 'true');
        cockpit.innerHTML = cockpitMarkup();
        document.body.appendChild(cockpit);
    },

    /** Supprime le cockpit (il sera recréé, par exemple dans une autre langue) */
    destroy() {
        if (!cockpit) return;
        cockpit.remove();
        cockpit = null;
    },

    /** Affiche (en le créant si besoin) ou masque le cockpit */
    setVisible(visible) {
        if (visible) Cockpit.build();
        if (cockpit) cockpit.hidden = !visible;
    },

    /** Tremblement du saut en hyperespace */
    setWarp(on) {
        if (cockpit) cockpit.classList.toggle('is-warp', on);
    },

    /** Lecture « VITESSE » à partir de la vitesse interne du ciel étoilé */
    setSpeed(speed) {
        const node = reading('speed');
        if (node) node.textContent = t('TOUR.CK_SPEED_VALUE', { speed: (speed * SPEED_TO_C).toFixed(2) });
    },

    /** Lecture « ZONE » (« 03/07 PARCOURS ») */
    setZone(text) {
        const node = reading('zone');
        if (node) node.textContent = text;
    }
};

export default Cockpit;
