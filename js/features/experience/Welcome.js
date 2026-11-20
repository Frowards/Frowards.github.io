/**
 * Welcome - écran « Choisissez votre expérience » (#pb-welcome).
 *
 * Affiché à la première visite (impossible à fermer tant qu'aucun choix
 * n'est fait), puis à tout moment depuis le bouton du header. Le visiteur
 * choisit :
 *   - l'expérience (4 cartes, groupe radio piloté aux flèches) ;
 *   - le mode clair / sombre, présélectionné d'après l'appareil ;
 *   - la visite guidée ou libre.
 * Chaque clic habille aussitôt l'écran dans le style choisi (aperçu en
 * direct par data-preview / data-preview-mode, voir welcome-live-preview.css).
 * La racine prend aussi l'expérience prévisualisée (data-pb-exp, arrondis,
 * bordures, polices, taille du texte : Theme.preview) : l'aperçu est le même
 * quelle que soit l'expérience affichée avant. La page, masquée dessous,
 * est rendue telle quelle si l'écran est refermé sans lancer.
 * « C'est parti » transmet le choix au propriétaire de l'écran (onLaunch).
 *
 * Fenêtre modale accessible : role="dialog", focus piégé, Échap pour fermer.
 */
import Lang from '../../core/Lang.js';
import Events from '../../core/Events.js';
import Theme from '../theme/Theme.js';
import { qs, qsa } from '../../utils/dom.js';
import { prefersReducedMotion } from '../../utils/motion.js';
import { EXPERIENCES, presetFor } from './presets.js';
import { currentExp, currentTour, systemMode } from './state.js';
import { welcomeMarkup } from './welcome-template.js';

/** Sur grand écran (PC), l'écran entier est agrandi à la taille du Rétro
 *  (118 %), pour toutes les expériences : il y a la place */
const LARGE_SCREEN = '(min-width: 1100px) and (min-height: 700px)';
const LARGE_SCALE = 118;

/** Durée du fondu d'ouverture et de fermeture (voir .xp-welcome dans welcome.css) */
const CLOSE_MS = 350;

let overlay = null;
let coverTimer = 0;
let firstVisit = false;
let launchHandler = null;
/** Expérience et défilement de la page à l'ouverture (rendus à la fermeture) */
let liveExp = null;
let liveScroll = 0;

/** Choix en cours sur l'écran */
const choice = { exp: 'classic', mode: null, tour: 'guided' };

/** Coche l'élément sélectionné de chaque groupe et met à jour l'aperçu */
function renderSelection() {
    qsa('[data-xp]', overlay).forEach((card) => {
        const on = card.getAttribute('data-xp') === choice.exp;
        card.classList.toggle('is-selected', on);
        card.setAttribute('aria-checked', on ? 'true' : 'false');
        card.tabIndex = on ? 0 : -1;
    });
    qsa('[data-xp-mode]', overlay).forEach((button) => {
        const on = button.getAttribute('data-xp-mode') === choice.mode;
        button.classList.toggle('active', on);
        button.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    qsa('[data-xp-tour]', overlay).forEach((option) => {
        const on = option.getAttribute('data-xp-tour') === choice.tour;
        option.classList.toggle('is-selected', on);
        option.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    overlay.setAttribute('data-preview', choice.exp);
    overlay.setAttribute('data-preview-mode', choice.mode);
    document.documentElement.setAttribute('data-pb-exp', choice.exp);
    const scale = window.matchMedia(LARGE_SCREEN).matches ? LARGE_SCALE : 100;
    Theme.preview(presetFor(choice.exp), choice.mode, scale);
    markColorBlind();
}

/** Bouton « Mode daltonien » allumé quand un type est corrigé */
function markColorBlind() {
    const button = qs('[data-xp-cvd]', overlay);
    if (button) button.classList.toggle('is-on', Boolean(Theme.config.cvd));
}

/** Redessine tout l'écran (ouverture, changement de langue) */
function render() {
    overlay.innerHTML = welcomeMarkup({ closable: !firstVisit, detected: systemMode() });
    renderSelection();
}

function onClick(e) {
    const card = e.target.closest('[data-xp]');
    if (card) { choice.exp = card.getAttribute('data-xp'); renderSelection(); return; }
    const mode = e.target.closest('[data-xp-mode]');
    if (mode) { choice.mode = mode.getAttribute('data-xp-mode'); renderSelection(); return; }
    const tour = e.target.closest('[data-xp-tour]');
    if (tour) { choice.tour = tour.getAttribute('data-xp-tour'); renderSelection(); return; }
    if (e.target.closest('[data-xp-go]')) { if (launchHandler) launchHandler({ ...choice }); return; }
    if (e.target.closest('[data-xp-close]')) { Welcome.close(); return; }
    if (e.target.closest('[data-xp-cvd]')) { Events.emit('panel:request', { only: 'cvd', look: choice.exp, styleFrom: overlay }); return; }
    if (e.target.closest('[data-xp-lang]')) Lang.toggle();
}

/** Cartes : les flèches déplacent la sélection, comme dans un groupe radio */
function moveCardSelection(card, key) {
    const i = EXPERIENCES.indexOf(card.getAttribute('data-xp'));
    const step = (key === 'ArrowRight' || key === 'ArrowDown') ? 1 : -1;
    choice.exp = EXPERIENCES[(i + step + EXPERIENCES.length) % EXPERIENCES.length];
    renderSelection();
    qs(`[data-xp="${choice.exp}"]`, overlay).focus();
}

/** Piège à focus : Tab et Maj+Tab bouclent dans l'écran */
function trapFocus(e) {
    const focusables = qsa('button:not([disabled]), [tabindex="0"]', overlay);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function onKeydown(e) {
    if (e.key === 'Escape' && !firstVisit) { e.preventDefault(); Welcome.close(); return; }
    const card = e.target.closest('[data-xp]');
    if (card && /^Arrow/.test(e.key)) {
        e.preventDefault();
        moveCardSelection(card, e.key);
    }
    if (e.key === 'Tab') trapFocus(e);
}

/** Crée l'écran (masqué) à sa première ouverture */
function build() {
    overlay = document.createElement('div');
    overlay.id = 'pb-welcome';
    overlay.className = 'xp-welcome';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'xp-title');
    overlay.hidden = true;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', onClick);
    overlay.addEventListener('keydown', onKeydown);
    Lang.onChange(() => { if (overlay && !overlay.hidden) render(); });
    Events.on('theme:change', () => { if (overlay && !overlay.hidden) markColorBlind(); });
    /* Fenêtre redimensionnée (passage PC / petit écran) : taille de l'écran recalculée */
    window.matchMedia(LARGE_SCREEN).addEventListener('change', () => { if (overlay && !overlay.hidden) renderSelection(); });
}

/**
 * Masque (ou réaffiche) la page sous l'écran d'accueil : body.xp-covered,
 * posé seulement une fois l'écran opaque (voir welcome.css).
 */
function setPageCovered(covered) {
    clearTimeout(coverTimer);
    document.body.classList.toggle('xp-covered', covered);
}

/** Rend le focus au bouton du header qui rouvre l'écran (sauf première visite) */
function focusHeaderButton() {
    const button = qs('#btn-exp');
    if (button && !firstVisit) button.focus({ preventScroll: true });
}

const Welcome = {
    /**
     * Prépare l'écran (sans rien afficher).
     * @param {object} options
     * @param {boolean} options.firstVisit  aucun choix mémorisé
     * @param {string} options.tour         type de visite présélectionné
     * @param {(choice: { exp: string, mode: string, tour: string }) => void} options.onLaunch
     *        appelé par « C'est parti » avec le choix du visiteur
     */
    init({ firstVisit: first, tour, onLaunch }) {
        firstVisit = first;
        choice.tour = tour;
        launchHandler = onLaunch;
    },

    /** Vrai tant que le visiteur n'a encore jamais lancé d'expérience */
    get firstVisit() { return firstVisit; },

    /** Le visiteur a fait son premier choix : l'écran devient refermable */
    markVisited() {
        firstVisit = false;
    },

    /** Ouvre l'écran, présélectionné sur l'expérience et le mode affichés */
    open() {
        if (!overlay) build();
        liveExp = currentExp();
        liveScroll = window.scrollY;
        choice.exp = liveExp;
        choice.mode = Theme.effectiveMode();
        if (!firstVisit) choice.tour = currentTour();
        render();
        overlay.hidden = false;
        document.body.classList.add('xp-open');
        /* Page déjà masquée par l'anti-flash : elle le reste ; sinon, elle
           l'est à la fin du fondu d'ouverture */
        const root = document.documentElement;
        if (root.classList.contains('pb-welcome-pending') || prefersReducedMotion()) setPageCovered(true);
        else coverTimer = setTimeout(() => setPageCovered(true), CLOSE_MS);
        root.classList.remove('pb-welcome-pending');
        requestAnimationFrame(() => {
            overlay.classList.add('is-in');
            const selected = qs('[data-xp].is-selected', overlay);
            if (selected) selected.focus({ preventScroll: true });
        });
    },

    /** Ferme l'écran en fondu et rend le focus au bouton du header */
    close() {
        if (!overlay) return;
        /* Fermé sans lancer : la page retrouve son expérience et sa place */
        if (liveExp) document.documentElement.setAttribute('data-pb-exp', liveExp);
        Theme.apply();
        setPageCovered(false);
        overlay.classList.remove('is-in');
        document.body.classList.remove('xp-open');
        /* Après le retour du défilement de la page (body.xp-open retiré) */
        window.scrollTo({ top: liveScroll, left: 0, behavior: 'instant' });
        const done = () => { overlay.hidden = true; };
        if (prefersReducedMotion()) done();
        else setTimeout(done, CLOSE_MS);
        focusHeaderButton();
    },

    /**
     * Lancement d'une expérience : l'écran reste affiché, opaque mais inerte,
     * pendant que la transition se pose par-dessus. Il n'est retiré (hide)
     * qu'une fois la page entièrement recouverte : on ne l'entrevoit jamais.
     */
    leave() {
        if (overlay) overlay.inert = true;
    },

    /** Retire l'écran immédiatement, sans fondu, et rend le focus au header */
    hide() {
        if (!overlay) return;
        overlay.hidden = true;
        overlay.inert = false;
        setPageCovered(false);
        overlay.classList.remove('is-in');
        document.body.classList.remove('xp-open');
        focusHeaderButton();
    }
};

export default Welcome;
