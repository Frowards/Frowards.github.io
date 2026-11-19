/**
 * helpers - petites fonctions partagées par les effets de particules.
 */

/** Couleur d'accent de repli ("r, g, b") si la variable CSS est absente */
const FALLBACK_ACCENT = '6, 182, 212';

/** Nombre aléatoire dans [min, max[ */
export function rnd(min, max) {
    return min + Math.random() * (max - min);
}

/** Élément aléatoire d'une liste */
export function pick(list) {
    return list[Math.floor(rnd(0, list.length))];
}

/**
 * Couleur d'accent du thème au format "r, g, b" (--pb-primary-rgb),
 * relue à chaque image : le thème peut changer pendant l'animation.
 */
export function accentRgb() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--pb-primary-rgb').trim();
    return value || FALLBACK_ACCENT;
}

/** Couleur CSS rgba() à partir d'un triplet "r, g, b" et d'une opacité */
export function rgba(rgb, alpha) {
    return `rgba(${rgb},${alpha})`;
}
