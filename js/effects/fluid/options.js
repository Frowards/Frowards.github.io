/**
 * options - réglages du fluide, validés et bornés.
 *
 *   colors      mode de couleur (COLOR_MODES)
 *   color       couleur du mode 'solid'
 *   radius      taille des taches, 20 à 300 (%)
 *   trail       longueur de la traînée, 1 (s'efface vite) à 100 (traîne longue)
 *   intensity   quantité de couleur, 20 à 200 (%)
 *   ambient     vivacité du pinceau ambiant, 0 (coupé) à 100
 *   motif       ce que trace le pinceau ambiant (MOTIFS)
 *   ambientMode pinceau au repos seulement ou en permanence (AMBIENT_MODES)
 *   words       mots tracés par le motif 'words' (24 caractères max chacun)
 */
import { clamp } from '../../utils/motion.js';
import { parseColor, FALLBACK_COLOR } from './colors.js';

export const COLOR_MODES = Object.freeze(['random', 'pastel', 'rainbow', 'theme', 'solid']);
export const MOTIFS = Object.freeze(['mix', 'ribbons', 'figures', 'words']);
export const AMBIENT_MODES = Object.freeze(['idle', 'always']);

/* Mots par défaut, volontairement bilingues : ils sont dessinés dans le
   fluide comme des formes, pas lus comme du texte d'interface */
const DEFAULT_WORDS = Object.freeze(['Bonjour', 'Hello', 'UX', 'Ceres']);
const MAX_WORD_LENGTH = 24;

/** Réglages courants (objet partagé, modifié uniquement par applyOptions) */
export const settings = {
    colors: 'random', color: FALLBACK_COLOR, radius: 100, trail: 50, intensity: 100,
    ambient: 0, motif: 'mix', ambientMode: 'idle',
    words: DEFAULT_WORDS.slice()
};

/** trail 1 -> dissipation 4 (s'efface vite), 100 -> 0.15 (traîne longue) */
function trailToDissipation(trail) {
    return 4 * Math.pow(0.15 / 4, (trail - 1) / 99);
}

let densityDissipation = trailToDissipation(settings.trail);

/** Vitesse d'effacement de la couleur, déduite du réglage trail */
export function getDensityDissipation() {
    return densityDissipation;
}

/** Nombre borné, ou def s'il n'est pas lisible */
function boundedNumber(value, min, max, def) {
    const n = Number(value);
    return Number.isFinite(n) ? clamp(n, min, max) : def;
}

/** value si elle fait partie de list, sinon def */
function oneOf(value, list, def) {
    return list.includes(value) ? value : def;
}

/** Liste de mots nettoyée (chaîne "a,b,c" ou tableau) ; vide si rien d'utilisable */
function cleanWords(words) {
    const list = typeof words === 'string' ? words.split(',') : words;
    if (!Array.isArray(list)) return [];
    return list
        .map((w) => String(w == null ? '' : w).trim().slice(0, MAX_WORD_LENGTH))
        .filter(Boolean);
}

/**
 * Applique un ensemble partiel de réglages (les valeurs invalides sont ignorées).
 * @param {Object} o réglages à modifier
 * @returns {{motifChanged: boolean, colorsChanged: boolean}} ce qui a changé
 *          et oblige à réinitialiser le pinceau ou les couleurs en cours
 */
export function applyOptions(o) {
    if (!o || typeof o !== 'object') return { motifChanged: false, colorsChanged: false };
    const prevMotif = settings.motif;
    const prevColors = settings.colors;
    if (o.colors !== undefined) settings.colors = oneOf(o.colors, COLOR_MODES, settings.colors);
    if (o.color !== undefined && parseColor(String(o.color))) settings.color = String(o.color);
    if (o.radius !== undefined) settings.radius = boundedNumber(o.radius, 20, 300, settings.radius);
    if (o.trail !== undefined) settings.trail = boundedNumber(o.trail, 1, 100, settings.trail);
    if (o.intensity !== undefined) settings.intensity = boundedNumber(o.intensity, 20, 200, settings.intensity);
    if (o.ambient !== undefined) settings.ambient = boundedNumber(o.ambient, 0, 100, settings.ambient);
    if (o.motif !== undefined) settings.motif = oneOf(o.motif, MOTIFS, settings.motif);
    if (o.ambientMode !== undefined) settings.ambientMode = oneOf(o.ambientMode, AMBIENT_MODES, settings.ambientMode);
    if (o.words !== undefined) {
        const words = cleanWords(o.words);
        if (words.length) settings.words = words;
    }
    densityDissipation = trailToDissipation(settings.trail);
    return {
        motifChanged: settings.motif !== prevMotif,
        colorsChanged: settings.colors !== prevColors
    };
}
