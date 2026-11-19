/**
 * Experience - « Choisissez votre expérience ».
 *
 * Quatre façons de vivre le portfolio (Classique, Rétro, Spatial, Gamer),
 * choisies sur l'écran d'accueil (première visite, puis à tout moment via
 * le bouton du header), en mode clair ou sombre, en visite guidée ou libre.
 * Au lancement :
 *   - une transition propre à l'expérience recouvre la page ;
 *   - le préréglage de l'expérience devient la base du thème (Theme) ;
 *   - <html data-pb-exp> active la palette, les finitions et les
 *     apparitions de l'expérience (css/features/experience) ;
 *   - la visite s'adapte : barre de progression (Classique), ligne de
 *     commande (Rétro), cockpit et analyse (Spatial), niveaux, XP et succès
 *     (Gamer).
 * Le choix est mémorisé (Storage KEYS.EXPERIENCE). Respecte
 * prefers-reduced-motion.
 *
 * Événement émis : experience:change { exp, mode } quand une expérience est
 * appliquée (mode : mode effectif 'light' | 'dark' du thème).
 */
import Lang from '../../core/Lang.js';
import Events from '../../core/Events.js';
import Theme from '../theme/Theme.js';
import Reveal from '../../components/Reveal.js';
import Tour from '../tour/Tour.js';
import { EXPERIENCES, PRESETS, isExperience, presetFor } from './presets.js';
import { currentExp, systemMode, loadChoice, saveChoice, welcomeSeenThisVisit, markWelcomeSeen } from './state.js';
import Welcome from './Welcome.js';
import Hud from './Hud.js';
import { playLaunchTransition } from './transitions.js';
import { resetAchievements, announceArrival } from './achievements.js';
import { updateJourney, scheduleJourneyUpdate, tagSections } from './journey.js';
import { addExperienceButton, trackHeaderHeight } from './header.js';

/** Applique une expérience : attribut, préréglage du thème, HUD, visite */
function applyExperience(exp, mode) {
    document.documentElement.setAttribute('data-pb-exp', exp);
    Theme.applyPreset(PRESETS[exp], mode);
    resetAchievements();
    tagSections();
    Hud.build(exp);
    updateJourney();
    /* Rejoue les apparitions de la page dans le style de l'expérience */
    Tour.syncExp();
    if (!Tour.active) Reveal.replay();
    Events.emit('experience:change', { exp, mode: Theme.effectiveMode() });
}

/** Active la visite guidée (depuis l'accueil) ou revient à la visite libre */
function startTour(tour) {
    if (tour === 'guided') Tour.enable(0);
    else Tour.disable();
}

/**
 * « C'est parti » : mémorise le choix, joue la transition et applique
 * l'expérience pendant que la page est recouverte.
 */
function launch({ exp, mode: chosenMode, tour }) {
    /* Le mode de l'appareil reste « auto » : il suivra l'appareil */
    const mode = chosenMode === systemMode() ? 'auto' : chosenMode;
    const wasFirst = Welcome.firstVisit;
    Welcome.markVisited();
    saveChoice(exp, tour);
    Welcome.leave();
    playLaunchTransition(exp, {
        light: chosenMode === 'light',
        onCovered: () => {
            Welcome.hide();
            startTour(tour);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            applyExperience(exp, mode);
        },
        onEnd: () => {
            announceArrival(exp, wasFirst);
            updateJourney();
        }
    });
}

const Experience = {
    /** Expériences disponibles */
    EXPS: EXPERIENCES,

    /** Expérience affichée */
    get current() { return currentExp(); },

    /**
     * Déclare au thème le préréglage de l'expérience affichée, sans rien
     * appliquer. À appeler AVANT Theme.init() : le thème du visiteur se
     * construit sur cette base dès le chargement.
     */
    prepareTheme() {
        Theme.setBase(presetFor(currentExp()));
    },

    /** Ouvre l'écran « Choisissez votre expérience » */
    open() {
        Welcome.open();
    },

    /**
     * Applique directement une expérience (sans écran ni transition).
     * @param {string} exp   'classic' | 'retro' | 'future' | 'gamer'
     * @param {string} [mode] 'auto' | 'light' | 'dark'
     */
    set(exp, mode) {
        if (!isExperience(exp)) return;
        saveChoice(exp);
        applyExperience(exp, mode);
    },

    /** Visite guidée ou libre (bouton « Visite libre » de la barre de visite) */
    setTour(tour) {
        saveChoice(currentExp(), tour);
        startTour(tour);
        updateJourney();
    },

    /** Recalcule la progression affichée */
    refresh() {
        updateJourney();
    },

    /**
     * Démarre l'expérience : bouton du header, HUD, écouteurs, reprise de la
     * visite guidée mémorisée, puis écran d'accueil (une fois par visite).
     * À appeler après Theme.init() et Tour.init().
     */
    init() {
        const saved = loadChoice();
        Welcome.init({
            firstVisit: !saved,
            tour: saved && saved.tour === 'free' ? 'free' : 'guided',
            onLaunch: launch
        });
        /* La visite guidée prévient à chaque étape et à son arrêt */
        Tour.onExit(() => Experience.setTour('free'));
        Events.on('tour:step', updateJourney);
        Events.on('tour:toggle', ({ active }) => { if (!active) updateJourney(); });

        addExperienceButton(() => Welcome.open());
        trackHeaderHeight();
        tagSections();
        Hud.build(currentExp());
        window.addEventListener('scroll', scheduleJourneyUpdate, { passive: true });
        window.addEventListener('resize', scheduleJourneyUpdate);
        Lang.onChange(() => {
            tagSections();
            Hud.build(currentExp());
            updateJourney();
        });
        updateJourney();
        /* Visiteur connu : sa visite guidée reprend (même derrière l'écran
           d'accueil, qu'il peut refermer pour retrouver son expérience), à
           l'étape où il était si la page vient d'être rechargée ; en visite
           libre, à sa position de lecture */
        if (saved && saved.tour === 'guided') Tour.enable(Tour.savedStep);
        else Tour.resumeScroll();
        /* Écran d'accueil une fois par visite, présélectionné sur le dernier choix */
        if (!saved || !welcomeSeenThisVisit()) {
            markWelcomeSeen();
            Welcome.open();
        }
        Tour.syncExp();
    }
};

export default Experience;
