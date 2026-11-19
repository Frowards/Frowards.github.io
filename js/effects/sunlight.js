/**
 * sunlight - couleur « lumière du soleil » des effets lumineux de la page
 * (halo du lanceur, impulsion de la frise des projets). Fixe, volontairement
 * indépendante du thème : coeur presque blanc, halo doré chaud.
 */

/** Coeur de la lumière (blanc chaud) */
export const SUN_CORE = Object.freeze({ r: 255, g: 241, b: 209 });

/** Halo de la lumière (or chaud) */
export const SUN_GLOW = Object.freeze({ r: 255, g: 199, b: 105 });

/**
 * Couleur CSS rgba() d'une couleur { r, g, b } à l'opacité alpha.
 * @param {{r: number, g: number, b: number}} color
 * @param {number} alpha opacité (0 à 1)
 * @returns {string}
 */
export function sunRgba(color, alpha) {
    return `rgba(${color.r},${color.g},${color.b},${alpha})`;
}
