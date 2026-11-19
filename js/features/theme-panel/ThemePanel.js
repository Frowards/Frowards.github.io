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
 * Ouverture : roue crantée du header, ou bouton « Mode daltonien » de
 * l'écran d'accueil (événement panel:request).
 * Fermeture : croix, fond assombri ou Échap. Émet panel:toggle { open }.
 */
import Events from '../../core/Events.js';
import Storage, { KEYS } from '../../core/Storage.js';
import Theme from '../theme/Theme.js';

let panel = null;
let lastFocus = null;   // élément à qui rendre le focus à la fermeture
let mascot = null;
let cvdChoices = [];

const isOpen = () => Boolean(panel) && !panel.hidden;

/** Reflète l'état courant dans les interrupteurs */
function sync() {
    mascot.checked = Storage.get(KEYS.MASCOT) !== 'off';
    const current = Theme.config.cvd || 'off';
    cvdChoices.forEach((input) => { input.checked = input.value === current; });
}

function open() {
    if (!panel || isOpen()) return;
    lastFocus = document.activeElement;
    sync();
    panel.hidden = false;
    mascot.focus();
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

    mascot.addEventListener('change', () => Events.emit('mascot:request', { visible: mascot.checked }));
    cvdChoices.forEach((input) => input.addEventListener('change', () => {
        if (input.checked) Theme.set({ cvd: input.value === 'off' ? false : input.value });
    }));
    Events.on('mascot:change', ({ visible }) => { mascot.checked = visible; });

    const button = document.getElementById('btn-theme');
    if (button) button.addEventListener('click', open);
    Events.on('panel:request', open);
    panel.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) close();
    });
}

export default { init, open, close };
