/**
 * Theme - personnalisation du thème (esprit « Mon thème » de Ceres, sans BDD).
 *
 * Tient la configuration du visiteur (voir defaults.js pour sa forme), la
 * garde dans le stockage du navigateur et l'applique à la page : mode
 * clair / sombre, couleur d'accent, arrondis, bordures, polices,
 * transparence, fond de page, décorations des cartes et effet de fond.
 *
 * Deux couches s'ajoutent à la configuration du visiteur :
 *   - le préréglage de l'expérience choisie (écran d'accueil), qui sert de
 *     « thème de base » (applyPreset, setBase, reset) ;
 *   - les thèmes d'événements (Noël, Halloween, Pâques, Octobre rose) qui,
 *     pendant leur période, REMPLACENT l'accent, l'effet et les décorations
 *     (comme CeresEventTheme), sauf si le visiteur les a désactivés.
 *     Un aperçu est possible à tout moment (non enregistré).
 *
 * Chaque application émet theme:change { config, mode } (Events).
 */
import Events from '../../core/Events.js';
import Particles from '../../effects/particles/Particles.js';
import { DEFAULTS, FILE_TYPE, FILE_VERSION } from './defaults.js';
import { FONT_STACKS } from './fonts.js';
import { hslToHex } from './color.js';
import { DECORATIONS, DECORATION_SIDES, decorationUri, applyDecorations } from './decorations.js';
import { EVENTS, findEvent, eventWindow } from './events-calendar.js';
import {
    clone, defaultConfig, sanitize, loadConfig, saveConfig,
    loadImage, saveImage, loadEventsOff, saveEventsOff
} from './config.js';
import { applyPageBg, pageBgColors } from './page-background.js';
import { applyStyles } from './styles.js';

const DARK_QUERY = '(prefers-color-scheme: dark)';
/** Un événement peut commencer pendant la visite : contrôle toutes les heures */
const EVENT_CHECK_MS = 3600 * 1000;

/* --- État (la configuration est lue dans le stockage par init) --- */
let config = defaultConfig();   // réglages du visiteur
let bgImage = null;             // image de fond importée (data URL)
let eventsOff = [];             // thèmes d'événements désactivés
let previewKey = null;          // aperçu d'un événement (non enregistré)
let base = {};                  // préréglage de l'expérience : « thème de base »
let darkQuery = null;
let started = false;

/** Requête média du thème de l'appareil (créée au premier besoin) */
function darkMedia() {
    if (!darkQuery) darkQuery = window.matchMedia(DARK_QUERY);
    return darkQuery;
}

/** Élément au hasard d'une liste */
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * Mode affiché : celui choisi, ou celui de l'appareil en mode « Auto ».
 * @returns {'light'|'dark'}
 */
function effectiveMode() {
    if (config.mode === 'light' || config.mode === 'dark') return config.mode;
    return darkMedia().matches ? 'dark' : 'light';
}

/* ======================================================================
   Thèmes d'événements
   ====================================================================== */

/** Événement qui s'applique : l'aperçu d'abord, sinon le premier actif et non désactivé */
function activeEvent() {
    if (previewKey) return findEvent(previewKey);
    return EVENTS.find((ev) => {
        if (eventsOff.includes(ev.key)) return false;
        const period = eventWindow(ev);
        return Boolean(period && period.active);
    }) || null;
}

/**
 * Configuration réellement appliquée : celle du visiteur, recouverte par
 * l'événement en cours. Hors expérience Classique, l'événement ne touche
 * qu'aux décorations et la palette de l'expérience est gardée (sauf en
 * aperçu, pour voir le thème complet).
 * @param {Object|null} ev événement actif
 */
function effectiveConfig(ev) {
    const eff = clone(config);
    if (!ev) return eff;
    const exp = document.documentElement.getAttribute('data-pb-exp');
    const full = previewKey || !exp || exp === 'classic';
    if (full) {
        eff.accent = ev.accent;
        eff.effect = ev.effect;
    }
    eff.decorations = clone(ev.decorations);
    return eff;
}

/* ======================================================================
   Application
   ====================================================================== */

/** Applique la configuration à la page et prévient les modules (theme:change) */
function apply() {
    const root = document.documentElement;
    const ev = activeEvent();
    const eff = effectiveConfig(ev);
    const mode = effectiveMode();

    if (ev) root.setAttribute('data-pb-event', ev.key);
    else root.removeAttribute('data-pb-event');

    /* Mode effectif exposé aux styles (data-pb-mode) ; data-theme seulement s'il est forcé */
    root.setAttribute('data-pb-mode', mode);
    if (config.mode === 'light' || config.mode === 'dark') root.setAttribute('data-theme', config.mode);
    else root.removeAttribute('data-theme');

    applyStyles(root, eff, mode);
    applyPageBg(root, eff.pageBg, { image: bgImage, mode });
    applyDecorations(root, eff.decorations);

    /* Effet de fond, ses réglages et l'interaction souris */
    Particles.setInteraction(eff.interaction);
    Particles.setParams(eff.effectParams || {});
    Particles.setEffect(eff.effect);

    Events.emit('theme:change', { config: clone(config), mode });
}

/** Enregistre puis applique */
function commit() {
    saveConfig(config);
    apply();
}

/**
 * Modifie la configuration (fusion superficielle), l'enregistre et l'applique.
 * @param {Object} patch réglages à changer
 */
function set(patch) {
    Object.assign(config, patch);
    sanitize(config);
    commit();
}

/* ======================================================================
   Réglages détaillés
   ====================================================================== */

/**
 * Change un réglage d'effet ; la valeur par défaut retire la clé
 * (seuls les écarts au défaut sont gardés).
 */
function setEffectParam(effect, key, value, defaultValue) {
    const all = clone(config.effectParams || {});
    const params = all[effect] || {};
    if (value === defaultValue) delete params[key];
    else params[key] = value;
    if (Object.keys(params).length) all[effect] = params;
    else delete all[effect];
    set({ effectParams: all });
}

/** Met à jour le fond de page (fusion superficielle) */
function setPageBg(patch) {
    set({ pageBg: { ...clone(config.pageBg || {}), ...patch } });
}

/** Couleur n° index du dégradé ('gradient') ou du fond sous l'eau ('water'), pour le mode affiché */
function setPageBgColor(kind, index, hex) {
    const pb = clone(config.pageBg || {});
    const mode = effectiveMode();
    const bagKey = kind === 'gradient' ? 'gradient' : 'water';
    const bag = pb[bagKey] || {};
    pb[bagKey] = bag;
    const colors = pageBgColors(config.pageBg, kind, mode);
    colors[index] = hex;
    bag[mode] = colors;
    set({ pageBg: pb });
}

/** Remet les couleurs par défaut du dégradé / du fond sous l'eau (mode affiché) */
function resetPageBgColors(kind) {
    const pb = clone(config.pageBg || {});
    const bag = kind === 'gradient' ? pb.gradient : pb.water;
    if (bag) delete bag[effectiveMode()];
    set({ pageBg: pb });
}

/** Image de fond (data URL déjà réduite) ; null pour la retirer */
function setBgImage(dataUrl) {
    bgImage = dataUrl || null;
    saveImage(bgImage);
    apply();
}

/** Motif de décoration d'un côté des cartes ; clé vide ou inconnue pour l'enlever */
function setDecoration(side, key) {
    const decorations = clone(config.decorations || {});
    if (key && DECORATIONS[key]) decorations[side] = key;
    else delete decorations[side];
    set({ decorations });
}

/** Active ou désactive un thème d'événement pendant sa période */
function setEventEnabled(key, enabled) {
    eventsOff = eventsOff.filter((k) => k !== key);
    if (!enabled) eventsOff.push(key);
    saveEventsOff(eventsOff);
    apply();
}

/** Aperçu d'un thème d'événement (null pour l'arrêter) ; jamais enregistré */
function previewEvent(key) {
    previewKey = key && findEvent(key) ? key : null;
    apply();
}

/* ======================================================================
   Thème de base, thème aléatoire
   ====================================================================== */

/** « Revenir au thème de base » : défauts + préréglage de l'expérience ; le mode est gardé */
function reset() {
    const { mode } = config;
    config = sanitize({ ...defaultConfig(), ...clone(base) });
    config.mode = mode;
    bgImage = null;
    saveImage(null);
    commit();
}

/**
 * Applique le préréglage d'une expérience (écran d'accueil) : il devient la
 * base du thème.
 * @param {Object} preset réglages de l'expérience
 * @param {'auto'|'light'|'dark'} [mode] mode choisi sur l'écran d'accueil
 */
function applyPreset(preset, mode) {
    base = clone(preset || {});
    config = sanitize({ ...defaultConfig(), ...clone(base) });
    if (mode) config.mode = mode;
    commit();
}

/** Déclare le préréglage courant sans rien changer (rechargement de page) */
function setBase(preset) {
    base = clone(preset || {});
}

/**
 * Thème aléatoire (bouton dé de la carte de démonstration) : accent, effet,
 * interaction, arrondis, bordures, polices et décorations ; le mode est gardé.
 */
function randomize() {
    const effects = Particles.EFFECTS.filter((e) => e !== 'off');
    const fonts = Object.keys(FONT_STACKS);
    const accent = hslToHex(Math.floor(Math.random() * 360), 0.72, 0.55);
    const interactions = Particles.INTERACTIONS.filter((i) => i !== 'none');
    const decoKeys = Object.keys(DECORATIONS);
    const decorations = {};
    if (Math.random() < 0.5) decorations.bottom = pick(decoKeys);
    if (Math.random() < 0.3) decorations.top = pick(decoKeys);
    set({
        accent,
        effect: pick(effects),
        interaction: pick(interactions),
        radiusPct: Math.round(Math.random() * 40) * 5,
        borderW: 1 + Math.floor(Math.random() * 4),
        fontTitle: pick(fonts),
        fontBody: pick(fonts),
        decorations
    });
}

/* ======================================================================
   Partage : export / import dans un fichier JSON
   ====================================================================== */

/** Données du thème à enregistrer dans un fichier (image comprise si elle sert) */
function exportTheme() {
    const data = { type: FILE_TYPE, version: FILE_VERSION, exported: new Date().toISOString(), config: clone(config) };
    if (config.pageBg && config.pageBg.type === 'image' && bgImage) data.image = bgImage;
    return data;
}

/**
 * Importe un thème exporté par exportTheme.
 * @param {Object} data contenu du fichier
 * @throws {Error} si le fichier n'est pas un thème
 */
function importTheme(data) {
    if (!data || data.type !== FILE_TYPE || !data.config || typeof data.config !== 'object') {
        throw new Error('format');
    }
    const next = defaultConfig();
    Object.keys(DEFAULTS).forEach((key) => {
        if (data.config[key] !== undefined) next[key] = data.config[key];
    });
    config = sanitize(next);
    saveConfig(config);
    if (typeof data.image === 'string' && data.image.startsWith('data:image/')) setBgImage(data.image);
    else apply();
}

/* ======================================================================
   Démarrage
   ====================================================================== */

/** Lit la configuration enregistrée, l'applique et suit l'appareil et le calendrier */
function init() {
    if (started) return;
    started = true;
    config = loadConfig();
    bgImage = loadImage();
    eventsOff = loadEventsOff();
    apply();
    /* En mode « Auto », suit le thème de l'appareil (accent et fond recalculés) */
    darkMedia().addEventListener('change', () => {
        if (config.mode === 'auto') apply();
    });
    setInterval(() => {
        if (!previewKey) apply();
    }, EVENT_CHECK_MS);
}

const Theme = {
    init,
    apply,
    set,
    reset,
    applyPreset,
    setBase,
    randomize,
    effectiveMode,
    setEffectParam,
    setPageBg,
    setPageBgColor,
    resetPageBgColors,
    setBgImage,
    setDecoration,
    setEventEnabled,
    previewEvent,
    exportTheme,
    importTheme,

    /** Copie de la configuration du visiteur */
    get() {
        return clone(config);
    },
    /** Copie de la configuration du visiteur (alias de get()) */
    get config() {
        return clone(config);
    },

    /**
     * Couleurs du dégradé ('gradient') ou du fond sous l'eau ('water').
     * @param {'gradient'|'water'} kind
     * @param {'light'|'dark'} [mode] mode affiché par défaut
     */
    pageBgColors(kind, mode) {
        return pageBgColors(config.pageBg, kind, mode || effectiveMode());
    },
    /** Image de fond importée (data URL), ou null */
    get bgImage() {
        return bgImage;
    },

    /** Clés des motifs de décoration et côtés décorables */
    DECORATIONS: Object.keys(DECORATIONS),
    DECORATION_SIDES,
    decorationUri,

    /** Clés des thèmes d'événements, dans l'ordre de priorité */
    EVENTS: EVENTS.map((ev) => ev.key),
    /** Période en cours ou prochaine d'un événement ({ from, to, active }), ou null */
    eventWindow(key) {
        const ev = findEvent(key);
        return ev ? eventWindow(ev) : null;
    },
    isEventEnabled(key) {
        return !eventsOff.includes(key);
    },
    /** Événement en aperçu, ou null */
    get previewKey() {
        return previewKey;
    },
    /** Événement appliqué en ce moment (aperçu compris), ou null */
    get activeEventKey() {
        const ev = activeEvent();
        return ev ? ev.key : null;
    }
};

export default Theme;
