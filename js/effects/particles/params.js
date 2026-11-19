/**
 * params - réglages exposés par effet de fond (équivalent des effect_params de Ceres).
 *
 * Chaque effet réglable déclare la liste de ses réglages ; le panneau de
 * personnalisation les affiche (libellés THEME.EP_<CLE>) et le moteur lit
 * leurs valeurs par param(effet, clé).
 *
 * Types de réglage :
 *   - curseur (par défaut) : min, max, step, def, unit
 *   - 'select'             : options (libellés THEME.EP_<CLE>_<OPTION>), def
 *   - 'color'              : def (couleur hexadécimale)
 * showIf : réglage affiché seulement si un autre réglage a la valeur indiquée.
 */

/** Gèle un objet et tout ce qu'il contient (registre en lecture seule) */
function deepFreeze(value) {
    if (value && typeof value === 'object') {
        Object.values(value).forEach(deepFreeze);
        Object.freeze(value);
    }
    return value;
}

/** Registre des réglages par effet : { effet: [ { key, ... } ] } */
export const EFFECT_PARAMS = deepFreeze({
    coderain: [
        { key: 'speed', min: 25, max: 300, step: 5, def: 100, unit: '%' },
        { key: 'density', min: 20, max: 250, step: 5, def: 100, unit: '%' },
        { key: 'size', min: 50, max: 250, step: 5, def: 100, unit: '%' }
    ],
    fluid: [
        { key: 'colors', type: 'select', options: ['random', 'pastel', 'rainbow', 'theme', 'solid'], def: 'random' },
        { key: 'color', type: 'color', def: '#06B6D4', showIf: { colors: 'solid' } },
        { key: 'radius', min: 20, max: 300, step: 5, def: 100, unit: '%' },
        { key: 'trail', min: 1, max: 100, step: 1, def: 50, unit: '' },
        { key: 'intensity', min: 20, max: 200, step: 5, def: 100, unit: '%' },
        { key: 'ambient', min: 0, max: 100, step: 5, def: 0, unit: '' },
        { key: 'motif', type: 'select', options: ['mix', 'ribbons', 'figures', 'words'], def: 'mix' },
        { key: 'ambientMode', type: 'select', options: ['idle', 'always'], def: 'idle' }
    ]
});

/** Valeurs choisies par l'utilisateur : { effet: { clé: valeur } } */
let values = {};

/**
 * Valeur d'un réglage d'effet (défaut du registre si non réglé).
 * @param {string} effect nom de l'effet
 * @param {string} key    clé du réglage
 * @returns {*} la valeur, ou undefined si le réglage n'existe pas
 */
export function param(effect, key) {
    const def = (EFFECT_PARAMS[effect] || []).find((p) => p.key === key);
    if (!def) return undefined;
    const bag = values[effect];
    const value = bag && bag[key];
    return value === undefined ? def.def : value;
}

/** Tous les réglages d'un effet, défauts compris : { clé: valeur } */
export function paramsOf(effect) {
    const out = {};
    (EFFECT_PARAMS[effect] || []).forEach((p) => { out[p.key] = param(effect, p.key); });
    return out;
}

/** Remplace tous les réglages (copie profonde, l'objet reçu n'est pas conservé) */
export function replaceParams(all) {
    values = JSON.parse(JSON.stringify(all || {}));
}

/** Empreinte des réglages choisis pour un effet (sert à détecter un changement) */
export function paramsSignature(effect) {
    return JSON.stringify(values[effect] || {});
}
