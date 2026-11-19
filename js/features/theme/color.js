/**
 * Calculs de couleurs du thème (fonctions pures, sans accès au DOM).
 *
 * Toutes les couleurs sont manipulées au format hexadécimal '#rrggbb'.
 */

/**
 * Composantes [r, g, b] (0-255) d'une couleur hexadécimale.
 * @param {string} hex '#rrggbb' (le # est facultatif)
 * @returns {number[]|null} null si la valeur n'est pas une couleur valide
 */
export function hexToRgb(hex) {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!match) return null;
    const n = parseInt(match[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Couleur hexadécimale de composantes [r, g, b] (arrondies et bornées à 0-255).
 * @param {number[]} rgb
 * @returns {string}
 */
export function rgbToHex(rgb) {
    const hexPart = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return `#${rgb.map(hexPart).join('')}`;
}

/**
 * Éclaircit ou assombrit une couleur.
 * @param {string} hex
 * @param {number} pct > 0 : éclaircit vers le blanc ; < 0 : assombrit vers le noir (-1..1)
 * @returns {string} la couleur d'origine si elle n'est pas valide
 */
export function shade(hex, pct) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(rgb.map((v) => (pct >= 0 ? v + (255 - v) * pct : v * (1 + pct))));
}

/**
 * Variables CSS de la couleur d'accent et de ses dérivées.
 * En clair, l'accent est assombri pour garder du contraste (comme Ceres).
 * @param {string} accent couleur valide '#rrggbb'
 * @param {'light'|'dark'} mode mode affiché
 * @returns {Object<string, string>} { '--pb-primary': ..., ... }
 */
export function accentTokens(accent, mode) {
    const base = mode === 'light' ? shade(accent, -0.3) : accent;
    const rgb = hexToRgb(base).join(', ');
    return {
        '--pb-primary': base,
        '--pb-primary-hover': shade(base, -0.15),
        '--pb-primary-light': shade(base, 0.2),
        '--pb-primary-rgb': rgb,
        '--pb-primary-alpha': `rgba(${rgb}, 0.15)`
    };
}

/**
 * Variables CSS d'une couleur de bordure personnalisée.
 * La variante « light » est éclaircie en sombre et assombrie en clair.
 * @param {string} color couleur valide '#rrggbb'
 * @param {'light'|'dark'} mode mode affiché
 * @returns {Object<string, string>}
 */
export function borderTokens(color, mode) {
    return {
        '--pb-border': color,
        '--pb-border-light': shade(color, mode === 'dark' ? 0.15 : -0.15)
    };
}
