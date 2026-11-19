/**
 * Jetons de style du thème : couleur d'accent, arrondis, bordures, polices
 * et transparence, écrits en variables CSS sur la racine du document.
 *
 * Une variable retirée laisse s'appliquer la valeur des feuilles de thème
 * (css/themes) : c'est ainsi que « pas de couleur personnalisée » revient
 * au cyan Ceres ou aux bordures du thème.
 */
import { clamp } from '../../utils/motion.js';
import { RADIUS_BASES, LIMITS } from './defaults.js';
import { hexToRgb, accentTokens, borderTokens } from './color.js';
import { fontStack } from './fonts.js';

const ACCENT_PROPS = ['--pb-primary', '--pb-primary-hover', '--pb-primary-light', '--pb-primary-rgb', '--pb-primary-alpha'];
const BORDER_PROPS = ['--pb-border', '--pb-border-light'];

/** Écrit chaque { variable: valeur } dans style */
function setTokens(style, tokens) {
    Object.entries(tokens).forEach(([prop, value]) => style.setProperty(prop, value));
}

/** Couleur d'accent : dérivées calculées, ou cyan des feuilles de thème si aucune */
function applyAccent(style, accent, mode) {
    if (accent && hexToRgb(accent)) setTokens(style, accentTokens(accent, mode));
    else ACCENT_PROPS.forEach((prop) => style.removeProperty(prop));
}

/** Arrondis : pourcentage appliqué aux rayons de base (comme Ceres) */
function applyRadius(style, radiusPct) {
    const pct = clamp(Number(radiusPct), ...LIMITS.radiusPct) / 100;
    Object.entries(RADIUS_BASES).forEach(([prop, base]) => {
        style.setProperty(prop, `${Math.round(base * pct * 10) / 10}px`);
    });
}

/** Bordures : épaisseur 1-4 px et couleur personnalisée éventuelle */
function applyBorders(style, borderW, borderColor, mode) {
    style.setProperty('--pb-border-w', `${clamp(Number(borderW), ...LIMITS.borderW)}px`);
    if (borderColor && hexToRgb(borderColor)) setTokens(style, borderTokens(borderColor, mode));
    else BORDER_PROPS.forEach((prop) => style.removeProperty(prop));
}

/** Polices des titres et du texte, et échelle globale du texte */
function applyFonts(style, { fontTitle, fontBody, fontScale }) {
    style.setProperty('--pb-font-title', fontStack(fontTitle, 'cinzel'));
    style.setProperty('--pb-font-family', fontStack(fontBody, 'system'));
    style.fontSize = `${clamp(Number(fontScale) || 100, ...LIMITS.fontScale)}%`;
}

/**
 * Applique les jetons de style d'une configuration effective.
 * @param {HTMLElement} root racine du document
 * @param {Object} cfg configuration effective (événement en cours compris)
 * @param {'light'|'dark'} mode mode affiché
 */
export function applyStyles(root, cfg, mode) {
    const { style } = root;
    applyAccent(style, cfg.accent, mode);
    applyRadius(style, cfg.radiusPct);
    applyBorders(style, cfg.borderW, cfg.borderColor, mode);
    applyFonts(style, cfg);
    /* Transparence (verre) désactivée : classe lue par les feuilles de style */
    root.classList.toggle('pb-no-blur', !cfg.glass);
    /* Mode daltonien : type lu par css/features/a11y/colorblind.css */
    if (cfg.cvd) root.setAttribute('data-pb-cvd', cfg.cvd);
    else root.removeAttribute('data-pb-cvd');
}
