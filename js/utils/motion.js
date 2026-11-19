/**
 * Outils d'animation partagés.
 */

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Vrai si l'utilisateur a demandé à réduire les animations */
export function prefersReducedMotion() {
    return reducedQuery.matches;
}

/** Abonne fn aux changements de la préférence « réduire les animations » */
export function onReducedMotionChange(fn) {
    reducedQuery.addEventListener('change', () => fn(reducedQuery.matches));
}

/** Promesse résolue après ms millisecondes */
export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Borne value entre min et max */
export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

/** Interpolation linéaire entre a et b */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
