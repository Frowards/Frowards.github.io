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

/** Luminance relative WCAG d'une couleur valide '#rrggbb' */
function luminance(hex) {
    const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const [r, g, b] = hexToRgb(hex).map(lin);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Texte foncé utilisé sur les accents clairs */
const DARK_ON_COLOR = '#0B0B12';

/**
 * Couleur du texte posé sur l'accent (boutons pleins) : blanc ou foncé,
 * celui qui contraste le plus.
 * @param {string} hex couleur valide '#rrggbb'
 * @returns {string}
 */
export function textOn(hex) {
    const l = luminance(hex);
    const onWhite = 1.05 / (l + 0.05);
    const onDark = (l + 0.05) / (luminance(DARK_ON_COLOR) + 0.05);
    return onWhite >= onDark ? '#ffffff' : DARK_ON_COLOR;
}

/** Contraste minimal de l'accent, utilisé comme texte, sur fond clair (WCAG AA) */
const LIGHT_MIN_CONTRAST = 4.5;

/**
 * Accent du mode clair : assombri de 30 %, puis davantage si besoin pour
 * rester lisible en texte sur fond blanc (contraste 4,5).
 * @param {string} accent couleur valide '#rrggbb'
 * @returns {string}
 */
function readableOnLight(accent) {
    let pct = -0.3;
    let color = shade(accent, pct);
    while (1.05 / (luminance(color) + 0.05) < LIGHT_MIN_CONTRAST && pct > -0.9) {
        pct -= 0.05;
        color = shade(accent, pct);
    }
    return color;
}

/**
 * Variables CSS de la couleur d'accent et de ses dérivées.
 * En clair, l'accent est assombri pour rester lisible (readableOnLight).
 * @param {string} accent couleur valide '#rrggbb'
 * @param {'light'|'dark'} mode mode affiché
 * @returns {Object<string, string>} { '--pb-primary': ..., ... }
 */
export function accentTokens(accent, mode) {
    const base = mode === 'light' ? readableOnLight(accent) : accent;
    const rgb = hexToRgb(base).join(', ');
    return {
        '--pb-text-on-color': textOn(base),
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
