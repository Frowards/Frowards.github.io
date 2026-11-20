/**
 * ThemePanel - options d'affichage (roue crantée du header).
 *
 * Petite fenêtre modale (balisage #theme-panel dans index.html) avec deux
 * interrupteurs :
 *   - Mascotte : réglage propre à la mascotte, échangé par événements avec
 *     features/mascot (mascot:request pour la demande, mascot:change pour
 *     l'état) ;
 *   - Mode daltonien : un type au choix (désactivé, deutéranopie,
 *     protanopie, tritanopie), réglage du thème (Theme.set({ cvd })).
 * Le thème lui-même n'est plus personnalisable : chaque expérience apporte
 * le sien.
 *
 * Ouverture : roue crantée du header (toutes les options), ou bouton
 * « Mode daltonien » de l'écran d'accueil (panel:request { only: 'cvd' } :
 * seulement les types de daltonisme, titre « Mode daltonien »).
 * Style : celui de l'expérience (attribut data-look : classic, retro,
 * future, gamer ; css/features/theme-panel/looks.css). Depuis l'écran
 * d'accueil, la fenêtre reprend les couleurs et polices de l'expérience
 * prévisualisée (variables copiées depuis l'écran, option styleFrom).
 * Fermeture : croix, fond assombri ou Échap. Émet panel:toggle { open }.
 */
import Events from '../../core/Events.js';
import Storage, { KEYS } from '../../core/Storage.js';
import Lang from '../../core/Lang.js';
import Theme from '../theme/Theme.js';

let panel = null;
let lastFocus = null;   // élément à qui rendre le focus à la fermeture
let mascot = null;
let cvdChoices = [];
let title = null;

/** Variables de l'aperçu de l'écran d'accueil (welcome-live-preview.css) */
const LOOK_VARS = [
    '--pb-primary', '--pb-primary-hover', '--pb-primary-rgb', '--pb-text-on-color',
    '--pb-bg', '--pb-card-bg', '--pb-text', '--pb-text-secondary', '--pb-text-muted',
    '--pb-border', '--pb-border-light', '--pb-surface-subtle', '--pb-surface-glass'
];
/** Polices de l'aperçu, avec celles de l'écran d'accueil par défaut */
const LOOK_FONTS = {
    '--xp-font-title': "'Cinzel', Georgia, serif",
    '--xp-font-body': "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"
};

const isOpen = () => Boolean(panel) && !panel.hidden;

/**
 * Habille la fenêtre au style d'une expérience.
 * @param {{ look?: string, styleFrom?: Element }} [options]
 *   look : expérience (sinon celle de la page) ; styleFrom : élément dont
 *   reprendre couleurs et polices (aperçu de l'écran d'accueil)
 */
function dress(options = {}) {
    [...LOOK_VARS, ...Object.keys(LOOK_FONTS)].forEach((name) => panel.style.removeProperty(name));
    panel.dataset.look = options.look || document.documentElement.getAttribute('data-pb-exp') || 'classic';
    if (!options.styleFrom) return;
    const computed = getComputedStyle(options.styleFrom);
    LOOK_VARS.forEach((name) => {
        const value = computed.getPropertyValue(name).trim();
        if (value) panel.style.setProperty(name, value);
    });
    Object.entries(LOOK_FONTS).forEach(([name, fallback]) => {
        panel.style.setProperty(name, computed.getPropertyValue(name).trim() || fallback);
    });
}

/** Reflète l'état courant dans les interrupteurs */
function sync() {
    mascot.checked = Storage.get(KEYS.MASCOT) !== 'off';
    const current = Theme.config.cvd || 'off';
    cvdChoices.forEach((input) => { input.checked = input.value === current; });
}

/**
 * Ouvre la fenêtre.
 * @param {{ only?: 'cvd', look?: string, styleFrom?: Element }} [options]
 *   only: 'cvd' n'affiche que le mode daltonien ; look, styleFrom : voir dress()
 */
function open(options = {}) {
    if (!panel || isOpen()) return;
    dress(options);
    const cvdOnly = options.only === 'cvd';
    lastFocus = document.activeElement;
    sync();
    panel.classList.toggle('theme-panel--cvd', cvdOnly);
    title.setAttribute('data-i18n', cvdOnly ? 'THEME.CVD' : 'THEME.TITLE');
    title.textContent = Lang.t(cvdOnly ? 'THEME.CVD' : 'THEME.TITLE');
    panel.hidden = false;
    const checked = cvdChoices.find((input) => input.checked);
    (cvdOnly ? (checked || cvdChoices[0]) : mascot).focus();
    Events.emit('panel:toggle', { open: true });
}

function close() {
    if (!isOpen()) return;
    panel.hidden = true;
    if (lastFocus) lastFocus.focus();
    Events.emit('panel:toggle', { open: false });
}

/** Relie la fenêtre, ses interrupteurs et le bouton d'ouverture de l'en-tête */
function init() {
    if (panel) return;
    panel = document.getElementById('theme-panel');
    if (!panel) return;
    mascot = panel.querySelector('#opt-mascot');
    cvdChoices = [...panel.querySelectorAll('input[name="cvd"]')];
    title = panel.querySelector('#theme-panel-title');

    mascot.addEventListener('change', () => Events.emit('mascot:request', { visible: mascot.checked }));
    cvdChoices.forEach((input) => input.addEventListener('change', () => {
        if (input.checked) Theme.set({ cvd: input.value === 'off' ? false : input.value });
    }));
    Events.on('mascot:change', ({ visible }) => { mascot.checked = visible; });

    const button = document.getElementById('btn-theme');
    if (button) button.addEventListener('click', () => open());
    Events.on('panel:request', open);
    panel.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) close();
    });
}

export default { init, open, close };
