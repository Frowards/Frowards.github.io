/**
 * ThemePanel - panneau de personnalisation du thème (onglets façon
 * « Mon thème » de Ceres : Couleurs, Style, Fond et effets, Partage, plus
 * une colonne d'aperçu et les thèmes d'événements).
 *
 * Le balisage du panneau est dans index.html (#theme-panel) ; ce module le
 * relie au thème. Chaque onglet est une vue (dossier views/) qui branche ses
 * contrôles et sait se resynchroniser à partir d'un instantané du thème.
 *
 * Synchronisation :
 *   - un réglage fait dans le panneau passe par ctx.change(), qui resynchronise
 *     le panneau ensuite, sauf pour les curseurs et listes, mis à jour sur place
 *     (les réécrire pendant le geste casserait le glisser) ;
 *   - un changement venu d'ailleurs (bouton clair / sombre de l'en-tête,
 *     expérience, langue, début d'un événement) resynchronise le panneau
 *     s'il est ouvert (événements theme:change, experience:change, lang:change).
 *
 * Émet panel:toggle { open } à chaque ouverture / fermeture.
 */
import Events from '../../core/Events.js';
import Lang from '../../core/Lang.js';
import Tabs from '../../components/Tabs.js';
import { qs } from '../../utils/dom.js';
import Theme from '../theme/Theme.js';
import { trackSwatchValues } from './controls.js';
import mountColors from './views/colors.js';
import mountStyle from './views/style.js';
import mountEffects from './views/effects.js';
import mountPageBg from './views/page-bg.js';
import mountDecorations from './views/decorations.js';
import mountEvents from './views/events.js';
import mountShare from './views/share.js';
import mountPreview from './views/preview.js';

/**
 * Contexte remis à chaque vue.
 * @typedef {Object} PanelContext
 * @property {HTMLElement} panel racine du panneau
 * @property {(selector: string) => HTMLElement|null} find élément du panneau
 * @property {(action: Function, options?: { resync?: boolean }) => void} change
 *           applique un réglage au thème, puis resynchronise le panneau (sauf resync: false)
 * @property {() => Object} snapshot état courant du thème { config, eventKey, previewKey }
 */

let panel = null;
let tabs = null;
let views = [];          // vues à resynchroniser
let eventsView = null;
let lastFocus = null;    // élément à qui rendre le focus à la fermeture
let ownChange = false;   // vrai pendant un réglage fait depuis le panneau

const isOpen = () => Boolean(panel) && !panel.hidden;

/** Instantané du thème lu par les vues */
function snapshot() {
    return {
        config: Theme.config,
        eventKey: Theme.activeEventKey,
        previewKey: Theme.previewKey
    };
}

/** Reflète la configuration courante dans tous les contrôles du panneau */
function sync() {
    if (!panel) return;
    const state = snapshot();
    views.forEach((view) => view.sync(state));
}

/**
 * Applique un réglage demandé depuis le panneau. Le theme:change qui en
 * découle est ignoré : c'est l'appelant qui choisit de resynchroniser.
 * @param {Function} action appel(s) au thème
 * @param {{ resync?: boolean }} [options] resync : resynchroniser le panneau ensuite
 */
function change(action, { resync = true } = {}) {
    ownChange = true;
    try {
        action();
    } finally {
        ownChange = false;
    }
    if (resync) sync();
}

/** Ouvre le panneau sur l'onglet en cours et lui donne le focus */
function open() {
    if (!panel || isOpen()) return;
    lastFocus = document.activeElement;
    panel.hidden = false;
    eventsView.place();
    sync();
    tabs.focusSelected();
    Events.emit('panel:toggle', { open: true });
}

/** Ferme le panneau (l'aperçu d'un événement ne survit pas à la fermeture) */
function close() {
    if (!isOpen()) return;
    panel.hidden = true;
    if (Theme.previewKey) Theme.previewEvent(null);
    if (lastFocus) lastFocus.focus();
    Events.emit('panel:toggle', { open: false });
}

/** Relie le panneau, ses onglets, ses vues et le bouton d'ouverture de l'en-tête */
function init() {
    if (panel) return;
    panel = document.getElementById('theme-panel');
    if (!panel) return;

    /** @type {PanelContext} */
    const ctx = { panel, find: (selector) => qs(selector, panel), change, snapshot };

    /* Onglets : en changeant d'onglet, la zone défilante revient en haut */
    const body = ctx.find('.theme-panel__body');
    tabs = new Tabs(ctx.find('.theme-tabs'), {
        onSelect: () => { if (body) body.scrollTop = 0; }
    });

    eventsView = mountEvents(ctx);
    views = [
        mountColors(ctx),
        mountStyle(ctx),
        mountEffects(ctx),
        mountPageBg(ctx),
        mountDecorations(ctx),
        eventsView
    ];
    mountShare(ctx);
    mountPreview(ctx);
    trackSwatchValues(panel);

    /* Ouverture (en-tête), fermeture (croix, fond assombri, Échap) */
    const button = document.getElementById('btn-theme');
    if (button) button.addEventListener('click', open);
    panel.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) close();
    });

    /* Changements venus d'ailleurs : le panneau ouvert se remet à jour */
    const resyncIfOpen = () => { if (isOpen()) sync(); };
    Events.on('theme:change', () => { if (!ownChange) resyncIfOpen(); });
    Events.on('experience:change', resyncIfOpen);
    Lang.onChange(resyncIfOpen);
}

export default { init, open, close, sync };
