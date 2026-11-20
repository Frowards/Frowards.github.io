/**
 * Header - boutons de l'en-tête et année du pied de page.
 *
 * - Bouton de langue (#btn-lang) : affiche le drapeau de la langue CIBLE
 *   (drapeau anglais quand la page est en français, et inversement).
 * - Bouton clair / sombre (#btn-mode) : affiche l'icône du mode CIBLE
 *   (soleil en mode sombre, lune en mode clair), sur le même principe.
 * - Année courante dans le pied de page (#annee).
 *
 * Les boutons se resynchronisent d'eux-mêmes sur lang:change et theme:change :
 * peu importe qui change la langue ou le thème (ce module, le panneau de
 * personnalisation, l'écran d'accueil...), l'en-tête reste juste.
 */
import Lang, { t } from '../../core/Lang.js';
import Events from '../../core/Events.js';
import Theme from '../theme/Theme.js';
import Flag from '../../components/Flag.js';
import { qs } from '../../utils/dom.js';

/**
 * Montre ou masque une icône SVG.
 * toggleAttribute et non la propriété .hidden : elle n'existe pas sur
 * SVGElement, l'assigner ne poserait jamais l'attribut.
 */
function setHidden(node, hidden) {
    if (node) node.toggleAttribute('hidden', hidden);
}

/** Bouton de langue : drapeau de la langue affichée, libellé accessible de l'action */
function initLangButton() {
    const button = qs('#btn-lang');
    if (!button) return;

    const refresh = () => {
        button.innerHTML = Flag.svg(Lang.lang);
        button.setAttribute('aria-label', t('LANG.SWITCH_ARIA'));
    };

    button.addEventListener('click', () => Lang.toggle());
    Events.on('lang:change', refresh);
    refresh();
}

/** Bouton clair / sombre : icône et libellé accessible du mode cible */
function initModeButton() {
    const button = qs('#btn-mode');
    if (!button) return;

    const refresh = () => {
        const isDark = Theme.effectiveMode() === 'dark';
        setHidden(qs('.mode-sun', button), !isDark);
        setHidden(qs('.mode-moon', button), isDark);
        button.setAttribute('aria-label', t(isDark ? 'THEME.TO_LIGHT' : 'THEME.TO_DARK'));
    };

    /* Theme.set émet theme:change : l'icône (et le panneau, s'il est ouvert)
       se mettent à jour par l'événement */
    button.addEventListener('click', () => {
        Theme.set({ mode: Theme.effectiveMode() === 'dark' ? 'light' : 'dark' });
    });
    Events.on('theme:change', refresh);
    Events.on('lang:change', refresh);
    /* En mode auto, l'icône suit aussi le thème de l'appareil */
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refresh);
    refresh();
}

/** Année courante dans le pied de page */
function initFooterYear() {
    const year = qs('#annee');
    if (year) year.textContent = new Date().getFullYear();
}

const Header = {
    /** Câble les boutons de l'en-tête et l'année du pied de page (à appeler une fois) */
    init() {
        initFooterYear();
        initLangButton();
        initModeButton();
    }
};

export default Header;
