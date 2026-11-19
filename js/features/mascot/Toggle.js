/**
 * Toggle - petit bouton rond, en bas à gauche, qui masque la mascotte ou la
 * fait revenir. Masquée, le bouton montre la tête de Pierre et appelle
 * doucement l'attention (animation CSS mascot-call).
 */
import { t } from '../../core/Lang.js';
import Icon from '../../components/Icon.js';
import { el } from '../../utils/dom.js';

let button = null;
let shown = true;

const Toggle = {
    /**
     * Crée le bouton et l'ajoute à la page.
     * @param {Function} onClick  appelée à chaque clic
     */
    mount(onClick) {
        button = el('button', { type: 'button', className: 'mascot-toggle' });
        button.addEventListener('click', onClick);
        document.body.appendChild(button);
    },

    /**
     * Met le bouton à jour (icône, libellés, état pressé).
     * @param {boolean} [visible]  mascotte affichée ; par défaut, l'état déjà connu
     */
    render(visible = shown) {
        shown = visible;
        button.innerHTML = shown
            ? Icon.svg('mascot-hide')
            : '<span class="mascot-toggle__face" aria-hidden="true"></span>';
        const label = t(shown ? 'MASCOT.HIDE' : 'MASCOT.SHOW');
        button.setAttribute('aria-label', label);
        button.title = label;
        button.setAttribute('aria-pressed', shown ? 'true' : 'false');
        button.classList.toggle('is-off', !shown);
    }
};

export default Toggle;
