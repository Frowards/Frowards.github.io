/**
 * Configuration du thème : lecture, contrôle de forme et enregistrement.
 *
 * Trois entrées de stockage (voir KEYS) :
 *   - THEME       la configuration du visiteur (voir defaults.js)
 *   - BG_IMAGE    l'image de fond importée (data URL réduite), rangée à part
 *                 pour garder la configuration légère
 *   - EVENTS_OFF  les thèmes d'événements désactivés (tableau de clés)
 */
import Storage, { KEYS } from '../../core/Storage.js';
import { DEFAULTS, PAGE_BG_TYPES } from './defaults.js';
import { DECORATIONS, DECORATION_SIDES } from './decorations.js';

/** Ancienne valeur d'arrondi (px, v1 du panneau) -> pourcentage */
const LEGACY_RADIUS = { 0: 0, 8: 100, 14: 175 };

/** Copie profonde d'une valeur sérialisable en JSON */
export const clone = (value) => JSON.parse(JSON.stringify(value));

/** Nouvelle configuration par défaut (copie modifiable de DEFAULTS) */
export const defaultConfig = () => clone(DEFAULTS);

/**
 * Garde-fous de forme d'une configuration (ancienne, corrompue ou importée).
 * Corrige l'objet en place.
 * @param {Object} cfg
 * @returns {Object} cfg
 */
export function sanitize(cfg) {
    if (!cfg.effectParams || typeof cfg.effectParams !== 'object') cfg.effectParams = {};
    if (!cfg.pageBg || typeof cfg.pageBg !== 'object') cfg.pageBg = clone(DEFAULTS.pageBg);
    if (!PAGE_BG_TYPES.includes(cfg.pageBg.type)) cfg.pageBg.type = 'default';
    if (!cfg.decorations || typeof cfg.decorations !== 'object') cfg.decorations = {};
    DECORATION_SIDES.forEach((side) => {
        if (cfg.decorations[side] && !DECORATIONS[cfg.decorations[side]]) delete cfg.decorations[side];
    });
    return cfg;
}

/**
 * Reprend les clés de la première version du panneau dans le nouveau format.
 * @param {Object} cfg configuration en construction (modifiée en place)
 * @param {Object} stored configuration lue telle quelle
 */
function migrate(cfg, stored) {
    if (stored.particles === false && !stored.effect) cfg.effect = 'off';
    if (typeof stored.radius === 'number' && stored.radiusPct === undefined) {
        cfg.radiusPct = LEGACY_RADIUS[stored.radius] ?? 100;
    }
    if (typeof stored.border === 'number' && stored.borderW === undefined) cfg.borderW = stored.border;
    delete cfg.particles;
    delete cfg.radius;
    delete cfg.border;
}

/** Configuration enregistrée, complétée par les valeurs par défaut */
export function loadConfig() {
    const cfg = defaultConfig();
    const stored = Storage.getJSON(KEYS.THEME);
    if (stored && typeof stored === 'object') {
        Object.assign(cfg, stored);
        migrate(cfg, stored);
    }
    return sanitize(cfg);
}

/** Enregistre la configuration */
export function saveConfig(cfg) {
    Storage.setJSON(KEYS.THEME, cfg);
}

/** Image de fond enregistrée (data URL), ou null */
export function loadImage() {
    return Storage.get(KEYS.BG_IMAGE) || null;
}

/**
 * Enregistre (ou retire si null) l'image de fond. Si le quota du stockage est
 * dépassé, l'écriture est ignorée : l'image ne vaut alors que pour la session.
 * @param {string|null} dataUrl
 */
export function saveImage(dataUrl) {
    if (dataUrl) Storage.set(KEYS.BG_IMAGE, dataUrl);
    else Storage.remove(KEYS.BG_IMAGE);
}

/** Clés des thèmes d'événements désactivés par le visiteur */
export function loadEventsOff() {
    const list = Storage.getJSON(KEYS.EVENTS_OFF, []);
    return Array.isArray(list) ? list : [];
}

/** Enregistre les thèmes d'événements désactivés */
export function saveEventsOff(list) {
    Storage.setJSON(KEYS.EVENTS_OFF, list);
}
