/**
 * OrientationHint - conseil « plus agréable en portrait » sur téléphone.
 *
 * Le portfolio fonctionne en portrait comme en paysage ; mais quand un
 * téléphone est tenu en paysage, un petit bandeau propose de le tourner :
 *   - il apparaît en haut de l'écran, au-dessus de tout (écran d'accueil
 *     compris), et s'efface de lui-même après quelques secondes ;
 *   - il disparaît dès que le téléphone repasse en portrait ;
 *   - refermé par le visiteur, il ne revient plus de la visite
 *     (Storage.session KEYS.ORIENT_HINT_OFF).
 * Téléphone = écran tactile sans survol, de faible hauteur en paysage :
 * une tablette ou un ordinateur ne voient jamais ce conseil.
 * Mise en forme : css/features/orientation/hint.css.
 */
import Lang, { t } from '../../core/Lang.js';
import Storage, { KEYS } from '../../core/Storage.js';
import Icon from '../../components/Icon.js';
import { esc } from '../../utils/dom.js';
import { prefersReducedMotion } from '../../utils/motion.js';
import './icons.js';

/** Téléphone tenu en paysage */
const PHONE_LANDSCAPE = '(orientation: landscape) and (max-height: 500px) and (hover: none) and (pointer: coarse)';
/** Durée d'affichage du conseil (ms) */
const DISPLAY_MS = 7000;
/** Durée de l'animation de sortie (voir hint.css) */
const EXIT_MS = 300;

let hint = null;
let hideTimer = 0;

const dismissed = () => Storage.session.get(KEYS.ORIENT_HINT_OFF) === '1';

/** Contenu du bandeau, dans la langue affichée */
function render() {
    hint.innerHTML = [
        Icon.svg('orient-rotate'),
        `<span class="orient-hint__text"><b>${esc(t('ORIENT.TITLE'))}</b><span>${esc(t('ORIENT.TEXT'))}</span></span>`,
        `<button type="button" class="orient-hint__close" data-orient-close aria-label="${esc(t('ORIENT.CLOSE'))}">${Icon.svg('close')}</button>`
    ].join('');
}

function build() {
    hint = document.createElement('div');
    hint.className = 'orient-hint';
    hint.setAttribute('role', 'status');
    hint.hidden = true;
    render();
    hint.addEventListener('click', (e) => {
        if (!e.target.closest('[data-orient-close]')) return;
        Storage.session.set(KEYS.ORIENT_HINT_OFF, '1');
        hide();
    });
    document.body.appendChild(hint);
    Lang.onChange(render);
}

function show() {
    if (dismissed()) return;
    if (!hint) build();
    clearTimeout(hideTimer);
    hint.hidden = false;
    requestAnimationFrame(() => hint.classList.add('is-in'));
    hideTimer = setTimeout(hide, DISPLAY_MS);
}

function hide() {
    if (!hint || hint.hidden) return;
    clearTimeout(hideTimer);
    hint.classList.remove('is-in');
    const done = () => { hint.hidden = true; };
    if (prefersReducedMotion()) done();
    else hideTimer = setTimeout(done, EXIT_MS);
}

const OrientationHint = {
    /** Surveille l'orientation (à appeler une fois) */
    init() {
        const query = window.matchMedia(PHONE_LANDSCAPE);
        const sync = () => { if (query.matches) show(); else hide(); };
        query.addEventListener('change', sync);
        sync();
    }
};

export default OrientationHint;
