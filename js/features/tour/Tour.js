/**
 * Tour - visite guidée du portfolio (au choix sur l'écran d'accueil, sinon
 * visite libre).
 *
 * Le portfolio devient une suite d'étapes (accueil, Ceres, parcours,
 * compétences, projets, philosophie, contact) affichées une par une, avec
 * une barre Précédent / Suivant, les flèches du clavier et le balayage.
 * Chaque expérience a sa mise en scène (voir transitions.js) ; l'expérience
 * Spatial ajoute, en visite guidée comme libre, un cockpit devant un ciel
 * étoilé qui défile (Cockpit.js, space/Starfield.js).
 *
 * <html data-pb-tour="guided"> active la mise en page (css/features/tour).
 * L'étape à l'écran est mémorisée pour la visite en cours (Storage.session
 * KEYS.TOUR_STEP) : un rechargement de la page y revient. En visite libre,
 * c'est la position de lecture qui est mémorisée (scroll-memory.js).
 * Respecte prefers-reduced-motion (changements instantanés).
 *
 * Événements émis : tour:toggle { active } à l'activation / l'arrêt,
 * tour:step { index, count } à chaque étape affichée.
 */
import Lang from '../../core/Lang.js';
import Events from '../../core/Events.js';
import Storage, { KEYS } from '../../core/Storage.js';
import { prefersReducedMotion } from '../../utils/motion.js';
import { STEPS, collectSteps, sectionName, pad2 } from './steps.js';
import TourBar from './TourBar.js';
import Cockpit from './Cockpit.js';
import Starfield from './space/Starfield.js';
import { playStepTransition, clearStepAnimation, replayReveals } from './transitions.js';
import { removeFxLayer } from './fx-layer.js';
import { bindTourInputs } from './input.js';
import { trackScroll, restoreScroll } from './scroll-memory.js';

/** Contenu restant sous l'étape (px) au-delà duquel on invite à défiler */
const MORE_THRESHOLD_PX = 40;
/** Délai avant de mesurer le contenu d'une étape tout juste affichée (ms) */
const MORE_CHECK_DELAY_MS = 60;
/** Hauteur du header si --xp-header-h n'est pas encore connue (px) */
const DEFAULT_HEADER_PX = 56;

let active = false;
let index = 0;
let busy = false;
let slides = [];
let exitHandler = null;

const root = () => document.documentElement;
const currentExp = () => root().getAttribute('data-pb-exp') || 'classic';

/** Nom traduit de l'étape i */
const stepName = (i) => sectionName(STEPS[i].key);

/** Libellé de la lecture « ZONE » du cockpit (« 03/07 PARCOURS ») */
const zoneLabel = (i, total) => `${pad2(i + 1)}/${pad2(total)} ${stepName(i).toUpperCase()}`;

/** Recense les sections présentes dans la page */
function collect() {
    slides = collectSteps().map((step) => step.el);
}

function renderBar() {
    TourBar.render(index, slides.length, stepName);
    Cockpit.setZone(zoneLabel(index, slides.length));
}

/** « Faites défiler » tant que l'étape a du contenu sous la ligne de flottaison */
function checkMore() {
    const slide = slides[index];
    const more = Boolean(active && slide && slide.scrollHeight - slide.clientHeight - slide.scrollTop > MORE_THRESHOLD_PX);
    root().classList.toggle('tour-more', more);
}

/** Affiche l'étape n (sans mise en scène) */
function show(n) {
    slides.forEach((slide, i) => {
        const on = i === n;
        slide.classList.toggle('is-current', on);
        slide.setAttribute('aria-hidden', on ? 'false' : 'true');
        if ('inert' in slide) slide.inert = !on;
    });
    index = n;
    Storage.session.set(KEYS.TOUR_STEP, n);
    slides[n].scrollTop = 0;
    setTimeout(checkMore, MORE_CHECK_DELAY_MS);
    replayReveals(slides[n]);
    renderBar();
    /* La frise des projets et les canvas se recalent sur la taille visible */
    window.dispatchEvent(new Event('resize'));
    Events.emit('tour:step', { index: n, count: slides.length });
}

/** Ciel étoilé + cockpit : expérience Spatial, en visite guidée comme libre */
function syncSpace() {
    const space = currentExp() === 'future';
    Cockpit.setVisible(space);
    if (space) Starfield.start();
    else Starfield.stop();
}

/** Clic sur la barre : 'prev', 'next', 'exit' ou numéro d'étape */
function onBarAction(action) {
    if (action === 'prev') Tour.go(index - 1);
    else if (action === 'next') Tour.go(index >= slides.length - 1 ? 0 : index + 1);
    else if (action === 'exit') {
        if (exitHandler) exitHandler();
        else Tour.disable();
    } else if (/^\d+$/.test(action)) Tour.go(Number(action));
}

/** Étape à l'écran en visite libre (la dernière dont le haut a passé 40 % de l'écran) */
function visibleStep() {
    const mid = innerHeight * 0.4;
    let n = 0;
    slides.forEach((slide, i) => { if (slide.getBoundingClientRect().top <= mid) n = i; });
    return n;
}

const Tour = {
    get active() { return active; },
    get index() { return index; },
    get count() { return slides.length || STEPS.length; },

    /** Étape mémorisée pendant cette visite (0 si aucune) : reprise après un rechargement */
    get savedStep() {
        const n = Number(Storage.session.get(KEYS.TOUR_STEP, 0));
        return Number.isInteger(n) && n >= 0 ? n : 0;
    },

    /**
     * Passe à l'étape n avec la mise en scène de l'expérience
     * (ignoré pendant une transition ou hors visite guidée).
     */
    go(n) {
        if (!active || busy || n < 0 || n >= slides.length || n === index) return;
        if (prefersReducedMotion()) {
            show(n);
            return;
        }
        const from = slides[index];
        const to = slides[n];
        busy = true;
        playStepTransition(currentExp(), {
            from,
            to,
            index: n,
            name: stepName(n),
            dir: n > index ? 1 : -1,
            show: () => show(n),
            done: () => {
                clearStepAnimation(from);
                clearStepAnimation(to);
                busy = false;
            }
        });
    },

    /**
     * Active la visite guidée.
     * @param {number} [startAt]  étape de départ ; par défaut, celle qui
     *                            était à l'écran en visite libre
     */
    enable(startAt) {
        collect();
        if (!slides.length) return;
        const wasActive = active;
        active = true;
        root().setAttribute('data-pb-tour', 'guided');
        TourBar.build(onBarAction);
        TourBar.show();
        if (!wasActive) {
            const n = typeof startAt === 'number' ? startAt : visibleStep();
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            show(Math.max(0, Math.min(slides.length - 1, n)));
        }
        Tour.syncExp();
        if (!wasActive) Events.emit('tour:toggle', { active: true });
    },

    /** Revient à la visite libre, à l'endroit de l'étape en cours */
    disable() {
        if (!active) return;
        const current = slides[index];
        active = false;
        busy = false;
        root().removeAttribute('data-pb-tour');
        root().classList.remove('tour-warping', 'tour-more');
        slides.forEach((slide) => {
            clearStepAnimation(slide);
            slide.classList.remove('is-current');
            slide.removeAttribute('aria-hidden');
            if ('inert' in slide) slide.inert = false;
            slide.scrollTop = 0;
        });
        removeFxLayer();
        TourBar.hide();
        syncSpace();
        /* On reprend la visite libre là où on en était */
        if (current) {
            const header = parseFloat(getComputedStyle(root()).getPropertyValue('--xp-header-h')) || DEFAULT_HEADER_PX;
            const y = current.getBoundingClientRect().top + window.scrollY - header;
            window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'instant' });
        }
        window.dispatchEvent(new Event('resize'));
        Events.emit('tour:toggle', { active: false });
    },

    /** Adapte la visite à l'expérience courante (ciel étoilé, barre) */
    syncExp() {
        syncSpace();
        if (active) renderBar();
    },

    /** Lecture « ZONE » du cockpit (visite libre : suit le défilement) */
    setZone(n, total) {
        Cockpit.setZone(zoneLabel(n, total));
    },

    /** Visite libre : reprend la lecture là où elle en était avant le rechargement */
    resumeScroll() {
        if (!active) restoreScroll();
    },

    /** Lance le ciel étoilé et un saut en hyperespace de ms millisecondes */
    warp(ms) {
        Starfield.start();
        Starfield.warp(ms);
    },

    /**
     * Action du bouton « Visite libre » de la barre (par défaut : disable).
     * L'expérience s'y abonne pour mémoriser le choix du visiteur.
     */
    onExit(fn) {
        exitHandler = fn;
    },

    /** Pose les écouteurs (défilement, clavier, balayage, liens, langue) */
    init() {
        Starfield.onFrame((speed) => Cockpit.setSpeed(speed));
        trackScroll(() => !active);
        document.addEventListener('scroll', (e) => {
            if (active && e.target && e.target.classList && e.target.classList.contains('is-current')) checkMore();
        }, true);
        window.addEventListener('resize', () => { if (active) checkMore(); });
        bindTourInputs({
            active: () => active,
            index: () => index,
            slides: () => slides,
            go: (n) => Tour.go(n)
        });
        /* Visite libre en Spatial : le vaisseau accélère avec le défilement */
        let lastY = window.scrollY;
        window.addEventListener('scroll', () => {
            const dy = Math.abs(window.scrollY - lastY);
            lastY = window.scrollY;
            if (!active && currentExp() === 'future') Starfield.push(Math.min(0.5, dy * 0.006));
        }, { passive: true });
        /* Le cockpit est recréé dans la nouvelle langue */
        Lang.onChange(() => {
            Cockpit.destroy();
            Tour.syncExp();
        });
    }
};

export default Tour;
