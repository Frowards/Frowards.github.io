/**
 * État de l'expérience : celle qui est affichée (<html data-pb-exp>), le
 * type de visite en cours et le choix mémorisé du visiteur
 * (Storage KEYS.EXPERIENCE : { exp, tour, at }).
 */
import Storage, { KEYS } from '../../core/Storage.js';
import Tour from '../tour/Tour.js';
import { TOUR_MODES, isExperience } from './presets.js';

/** Expérience affichée (posée sur <html> dès le <head> par l'anti-flash) */
export function currentExp() {
    return document.documentElement.getAttribute('data-pb-exp') || 'classic';
}

/** Mode clair / sombre de l'appareil */
export function systemMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Type de visite en cours : 'guided' ou 'free' */
export function currentTour() {
    if (Tour.active) return 'guided';
    return document.documentElement.getAttribute('data-pb-tour') === 'guided' ? 'guided' : 'free';
}

/**
 * Choix mémorisé du visiteur, ou null s'il n'a jamais choisi (ou si la
 * valeur stockée est invalide) : l'écran d'accueil s'affiche alors.
 * @returns {{ exp: string, tour: string, at: number } | null}
 */
export function loadChoice() {
    const saved = Storage.getJSON(KEYS.EXPERIENCE, null);
    return saved && isExperience(saved.exp) ? saved : null;
}

/**
 * Vrai si l'écran d'accueil a déjà été montré pendant cette visite :
 * il s'affiche une fois par visite (onglet), pas à chaque rechargement.
 */
export function welcomeSeenThisVisit() {
    return Storage.session.get(KEYS.WELCOME_SEEN) === '1';
}

/** Note que l'écran d'accueil a été montré pendant cette visite */
export function markWelcomeSeen() {
    Storage.session.set(KEYS.WELCOME_SEEN, '1');
}

/**
 * Mémorise l'expérience et le type de visite (le type en cours si tour
 * n'est pas précisé).
 */
export function saveChoice(exp, tour) {
    const mode = TOUR_MODES.includes(tour) ? tour : currentTour();
    Storage.setJSON(KEYS.EXPERIENCE, { exp, tour: mode, at: Date.now() });
}
