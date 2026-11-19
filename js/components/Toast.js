/**
 * Toast - messages éphémères (titre + texte) affichés en haut à droite,
 * sous le header (css/components/toast.css).
 *
 * - Zone d'annonce polie (role="status") : les lecteurs d'écran lisent
 *   chaque message sans interrompre le visiteur
 * - Deux messages visibles au plus ; chacun disparaît après 3,2 s
 * - Variante d'habillage facultative (classe xp-toast--<variante>)
 * - Mode exclusif : le nouveau message remplace ceux déjà affichés
 *
 *     Toast.show('Succès débloqué !', 'Explorateur : les projets persos.', { variant: 'gamer' });
 */
import { esc } from '../utils/dom.js';

const DISPLAY_MS = 3200;   // durée d'affichage
const EXIT_MS = 400;       // durée de l'animation de sortie (voir toast.css)
const MAX_VISIBLE = 2;     // messages affichés en même temps

let container = null;

/** Zone des messages, créée au premier message */
function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'xp-toasts';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    return container;
}

const Toast = {
    /**
     * Affiche un message.
     * @param {string} title  titre (texte brut)
     * @param {string} text   message (texte brut)
     * @param {object} [options]
     * @param {string} [options.variant]    habillage (ex. 'gamer')
     * @param {boolean} [options.exclusive] retire d'abord les messages affichés
     */
    show(title, text, { variant = '', exclusive = false } = {}) {
        const box = ensureContainer();
        const toast = document.createElement('div');
        toast.className = variant ? `xp-toast xp-toast--${variant}` : 'xp-toast';
        toast.innerHTML = `<b>${esc(title)}</b><span>${esc(text)}</span>`;
        if (exclusive) box.replaceChildren();
        box.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('is-in'));
        setTimeout(() => {
            toast.classList.remove('is-in');
            setTimeout(() => toast.remove(), EXIT_MS);
        }, DISPLAY_MS);
        while (box.children.length > MAX_VISIBLE) box.firstChild.remove();
    }
};

export default Toast;
