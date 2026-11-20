/**
 * Theme - thème de la page.
 *
 * Le thème n'est plus personnalisable : il vient du préréglage de
 * l'expérience choisie (presets.js : accent, polices, arrondis, bordures,
 * effet de fond, fond de page). Le visiteur ne règle que :
 *   - le mode clair / sombre / auto (bouton du header, écran d'accueil) ;
 *   - le mode daltonien (options d'affichage, css/features/a11y).
 *
 * Les thèmes d'événements (Noël, Halloween, Pâques, Octobre rose)
 * s'appliquent d'eux-mêmes pendant leur période et REMPLACENT l'accent,
 * l'effet et les décorations (comme CeresEventTheme ; hors expérience
 * Classique, seulement les décorations).
 *
 * La configuration complète (préréglage + modes) est enregistrée : le script
 * anti-flash du <head> l'applique avant l'affichage.
 * Chaque application émet theme:change { config, mode } (Events).
 */
import Events from '../../core/Events.js';
import Particles from '../../effects/particles/Particles.js';
import { applyDecorations } from './decorations.js';
import { EVENTS, eventWindow } from './events-calendar.js';
import { clone, defaultConfig, sanitize, loadConfig, saveConfig } from './config.js';
import { applyPageBg } from './page-background.js';
import { applyStyles } from './styles.js';

const DARK_QUERY = '(prefers-color-scheme: dark)';
/** Un événement peut commencer pendant la visite : contrôle toutes les heures */
const EVENT_CHECK_MS = 3600 * 1000;
/** Réglages du visiteur, gardés d'un préréglage à l'autre */
const VISITOR_KEYS = ['mode', 'cvd'];
/** Types de daltonisme corrigés (css/features/a11y/colorblind.css) */
const CVD_TYPES = ['deutan', 'protan', 'tritan'];

let config = defaultConfig();   // configuration appliquée (préréglage + modes)
let base = {};                  // préréglage de l'expérience
let darkQuery = null;
let started = false;

/** Requête média du thème de l'appareil (créée au premier besoin) */
function darkMedia() {
    if (!darkQuery) darkQuery = window.matchMedia(DARK_QUERY);
    return darkQuery;
}

/**
 * Mode affiché : celui choisi, ou celui de l'appareil en mode « Auto ».
 * @returns {'light'|'dark'}
 */
function effectiveMode() {
    if (config.mode === 'light' || config.mode === 'dark') return config.mode;
    return darkMedia().matches ? 'dark' : 'light';
}

/** Configuration bâtie sur le préréglage, avec les réglages du visiteur */
function build(visitor) {
    const cfg = sanitize({ ...defaultConfig(), ...clone(base) });
    VISITOR_KEYS.forEach((key) => { if (visitor[key] !== undefined) cfg[key] = visitor[key]; });
    /* Ancien interrupteur (true) : deutéranopie, la plus courante */
    if (cfg.cvd === true) cfg.cvd = 'deutan';
    if (!CVD_TYPES.includes(cfg.cvd)) cfg.cvd = false;
    return cfg;
}

/** Thème d'événement en cours, ou null */
function activeEvent() {
    return EVENTS.find((ev) => {
        const period = eventWindow(ev);
        return Boolean(period && period.active);
    }) || null;
}

/**
 * Configuration réellement appliquée : l'événement en cours recouvre
 * l'accent et l'effet (expérience Classique) et les décorations.
 * @param {Object|null} ev événement actif
 */
function effectiveConfig(ev) {
    const eff = clone(config);
    if (!ev) return eff;
    const exp = document.documentElement.getAttribute('data-pb-exp');
    if (!exp || exp === 'classic') {
        eff.accent = ev.accent;
        eff.effect = ev.effect;
    }
    eff.decorations = clone(ev.decorations);
    return eff;
}

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
    applyPageBg(root, eff.pageBg, { image: null, mode });
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
 * Change un réglage du visiteur (mode, cvd), l'enregistre et l'applique.
 * @param {{ mode?: string, cvd?: false|'deutan'|'protan'|'tritan' }} patch
 */
function set(patch) {
    config = build({ ...config, ...patch });
    commit();
}

/**
 * Applique le préréglage d'une expérience (écran d'accueil) ; le mode
 * daltonien est gardé.
 * @param {Object} preset réglages de l'expérience
 * @param {'auto'|'light'|'dark'} [mode] mode choisi sur l'écran d'accueil
 */
function applyPreset(preset, mode) {
    base = clone(preset || {});
    config = build({ ...config, ...(mode ? { mode } : {}) });
    commit();
}

/**
 * Aperçu de l'écran d'accueil : habille la racine comme le préréglage
 * (arrondis, bordures, polices, transparence) et le mode prévisualisés,
 * sans rien enregistrer ni toucher aux effets de fond. La taille du texte
 * est celle de l'écran (scale), la même pour toutes les expériences :
 * l'écran garde ses dimensions d'une expérience à l'autre (il compense
 * lui-même les petites polices, welcome-live-preview.css).
 * apply() rend ensuite la configuration du visiteur.
 * @param {Object} preset réglages de l'expérience prévisualisée
 * @param {'light'|'dark'} mode mode prévisualisé
 * @param {number} [scale] taille du texte de l'écran (%)
 */
function preview(preset, mode, scale = 100) {
    const root = document.documentElement;
    const cfg = sanitize({ ...defaultConfig(), ...clone(preset || {}), cvd: config.cvd, mode, fontScale: scale });
    applyStyles(root, cfg, mode);
    root.setAttribute('data-pb-mode', mode);
    root.setAttribute('data-theme', mode);
}

/** Déclare le préréglage courant sans rien appliquer (rechargement de page) */
function setBase(preset) {
    base = clone(preset || {});
}

/** Lit les réglages enregistrés, applique le thème et suit l'appareil et le calendrier */
function init() {
    if (started) return;
    started = true;
    config = build(loadConfig());
    apply();
    /* En mode « Auto », suit le thème de l'appareil */
    darkMedia().addEventListener('change', () => {
        if (config.mode === 'auto') apply();
    });
    setInterval(apply, EVENT_CHECK_MS);
}

const Theme = {
    init,
    apply,
    set,
    applyPreset,
    preview,
    setBase,
    effectiveMode,

    /** Copie de la configuration appliquée */
    get config() {
        return clone(config);
    }
};

export default Theme;
