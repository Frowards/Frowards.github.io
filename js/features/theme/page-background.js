/**
 * Fond de page : dégradé animé, fond « sous l'eau » ou image importée.
 *
 * Le fond est un calque fixe #pb-page-bg placé sous les particules (créé au
 * besoin en tête de <body>). Son type est donné par une classe
 * (.pb-bg--gradient, --underwater, --image, --still), ses couleurs par des
 * variables CSS (voir css/features/ambience/page-background.css).
 */
import { clamp } from '../../utils/motion.js';
import { GRADIENT_DEFAULTS, WATER_DEFAULTS, LIMITS } from './defaults.js';
import { hexToRgb } from './color.js';

const LAYER_ID = 'pb-page-bg';
const DEFAULT_OPACITY = 45;

let layer = null;

/** Calque du fond de page (créé au premier besoin), ou null avant le <body> */
function ensureLayer() {
    if (layer) return layer;
    layer = document.getElementById(LAYER_ID);
    if (!layer && document.body) {
        layer = document.createElement('div');
        layer.id = LAYER_ID;
        layer.setAttribute('aria-hidden', 'true');
        document.body.insertBefore(layer, document.body.firstChild);
    }
    return layer;
}

/**
 * Couleurs du dégradé ou du fond sous l'eau pour un mode : celles du
 * visiteur si elles sont complètes et valides, sinon celles par défaut.
 * @param {Object} pageBg configuration du fond de page
 * @param {'gradient'|'water'} kind
 * @param {'light'|'dark'} mode
 * @returns {string[]} copie modifiable
 */
export function pageBgColors(pageBg, kind, mode) {
    const pb = pageBg || {};
    const source = kind === 'gradient' ? pb.gradient : pb.water;
    const defaults = kind === 'gradient' ? GRADIENT_DEFAULTS : WATER_DEFAULTS;
    const list = source && Array.isArray(source[mode]) ? source[mode] : null;
    const valid = list && list.length === defaults[mode].length && list.every(hexToRgb);
    return valid ? list.slice() : defaults[mode].slice();
}

/**
 * Opacité de l'image de fond, en %, bornée à 15-100 (45 par défaut).
 * @param {Object} pageBg
 * @returns {number}
 */
export function imageOpacity(pageBg) {
    const [min, max] = LIMITS.imageOpacity;
    return clamp(Number(pageBg && pageBg.opacity) || DEFAULT_OPACITY, min, max);
}

/**
 * Affiche le fond de page demandé.
 * @param {HTMLElement} root racine du document (reçoit data-pb-pagebg)
 * @param {Object} pageBg configuration du fond de page
 * @param {{ image: string|null, mode: 'light'|'dark' }} context
 *        image importée (data URL) et mode affiché
 */
export function applyPageBg(root, pageBg, { image, mode }) {
    const el = ensureLayer();
    if (!el) return;
    let type = (pageBg && pageBg.type) || 'default';
    if (type === 'image' && !image) type = 'default';

    el.className = '';
    el.removeAttribute('style');
    root.toggleAttribute('data-pb-pagebg', type !== 'default');
    if (type === 'default') {
        el.hidden = true;
        return;
    }

    el.hidden = false;
    el.classList.add(`pb-bg--${type}`);
    if (pageBg.animated === false) el.classList.add('pb-bg--still');

    if (type === 'gradient' || type === 'underwater') {
        const colors = pageBgColors(pageBg, type === 'gradient' ? 'gradient' : 'water', mode);
        colors.forEach((color, i) => el.style.setProperty(`--pb-bg-c${i + 1}`, color));
    } else if (type === 'image') {
        el.style.setProperty('--pb-bg-img', `url("${image}")`);
        el.style.setProperty('--pb-bg-opacity', String(imageOpacity(pageBg) / 100));
    }
}
