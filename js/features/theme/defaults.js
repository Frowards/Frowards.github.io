/**
 * Valeurs par défaut du thème.
 *
 * Forme de la configuration enregistrée (Storage, clé KEYS.THEME) :
 *   mode          'auto' | 'light' | 'dark'
 *   accent        '#rrggbb' | null (null = cyan Ceres des feuilles de thème)
 *   effect        effet de fond (clé de Particles.EFFECTS), interaction souris
 *   effectParams  { <effet>: { <réglage>: valeur } } : seules les valeurs
 *                 différentes du défaut sont gardées (comme effect_params de Ceres)
 *   radiusPct     0..200 (% des rayons de base), borderW 1..4 px, borderColor
 *   glass         transparence (verre) activée
 *   fontTitle, fontBody (clés de FONT_STACKS), fontScale 80..125 %
 *   pageBg        { type: 'default' | 'gradient' | 'underwater' | 'image',
 *                   gradient: { dark: [3 hex], light: [3 hex] },
 *                   water: { dark: [surface, profondeur], light: [...] },
 *                   animated: bool, opacity: 15..100 (image) }
 *   decorations   { top | bottom | left | right: clé de DECORATIONS }
 */

/** Configuration d'un visiteur qui n'a encore rien réglé */
export const DEFAULTS = Object.freeze({
    mode: 'auto',
    accent: null,
    effect: 'default',
    interaction: 'default',
    effectParams: {},
    radiusPct: 100,
    borderW: 1,
    borderColor: null,
    glass: true,
    fontTitle: 'cinzel',
    fontBody: 'system',
    fontScale: 100,
    pageBg: { type: 'default', animated: true, opacity: 45 },
    decorations: {}
});

/** Types de fond de page reconnus */
export const PAGE_BG_TYPES = ['default', 'gradient', 'underwater', 'image'];

/** Couleurs par défaut du fond « Dégradé », par mode */
export const GRADIENT_DEFAULTS = Object.freeze({
    dark: ['#0A0B10', '#123A5C', '#2B1B4D'],
    light: ['#EAF1F8', '#C7DCF0', '#D8CFF0']
});

/** Couleurs par défaut du fond « Sous l'eau » (surface, profondeur), par mode */
export const WATER_DEFAULTS = Object.freeze({
    dark: ['#103040', '#06080F'],
    light: ['#FFFFFF', '#9CD7F7']
});

/** Rayons de base (px), multipliés par radiusPct / 100 - mêmes bases que Ceres */
export const RADIUS_BASES = Object.freeze({
    '--pb-radius-sm': 4,
    '--pb-radius-md': 8,
    '--pb-radius-lg': 12
});

/** Bornes des réglages numériques (mêmes bornes que Ceres) */
export const LIMITS = Object.freeze({
    radiusPct: [0, 200],
    borderW: [1, 4],
    fontScale: [80, 125],
    imageOpacity: [15, 100]
});

/** Signature des fichiers de thème exportés (onglet Partage) */
export const FILE_TYPE = 'pb-theme';
export const FILE_VERSION = 1;
