/**
 * Configuration du thème : lecture, contrôle de forme et enregistrement
 * (Storage, clé KEYS.THEME ; forme décrite dans defaults.js).
 */
import Storage, { KEYS } from '../../core/Storage.js';
import { DEFAULTS, PAGE_BG_TYPES } from './defaults.js';
import { DECORATIONS, DECORATION_SIDES } from './decorations.js';

/** Copie profonde d'une valeur sérialisable en JSON */
export const clone = (value) => JSON.parse(JSON.stringify(value));

/** Nouvelle configuration par défaut (copie modifiable de DEFAULTS) */
export const defaultConfig = () => clone(DEFAULTS);

/**
 * Garde-fous de forme d'une configuration (préréglage ou stockage corrompu).
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

/** Réglages enregistrés (objet vide s'il n'y en a pas ou s'ils sont illisibles) */
export function loadConfig() {
    const stored = Storage.getJSON(KEYS.THEME);
    return stored && typeof stored === 'object' ? stored : {};
}

/** Enregistre la configuration appliquée (lue aussi par le script anti-flash) */
export function saveConfig(cfg) {
    Storage.setJSON(KEYS.THEME, cfg);
}
