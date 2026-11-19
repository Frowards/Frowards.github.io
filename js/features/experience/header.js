/**
 * Intégration des expériences dans le header :
 *   - bouton « Changer d'expérience » (#btn-exp), en tête des actions ;
 *   - hauteur réelle du header (2 rangées sur mobile) publiée dans la
 *     variable CSS --xp-header-h : le HUD, les messages, le cockpit et la
 *     visite guidée se placent juste dessous.
 */
import { t } from '../../core/Lang.js';
import { qs } from '../../utils/dom.js';
import Icon from '../../components/Icon.js';
import './icons.js';

/**
 * Ajoute le bouton « Changer d'expérience » (une seule fois).
 * Ses libellés suivent la langue grâce à data-i18n-aria / data-i18n-title.
 * @param {Function} onClick  ouverture de l'écran d'accueil
 */
export function addExperienceButton(onClick) {
    const actions = qs('.topbar-actions');
    if (!actions || qs('#btn-exp')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'btn-exp';
    button.className = 'toggle-btn';
    button.setAttribute('data-i18n-aria', 'EXP.CHANGE');
    button.setAttribute('data-i18n-title', 'EXP.CHANGE');
    button.setAttribute('aria-label', t('EXP.CHANGE'));
    button.title = t('EXP.CHANGE');
    button.innerHTML = Icon.svg('sparkle');
    button.addEventListener('click', onClick);
    actions.insertBefore(button, actions.firstChild);
}

/** Publie la hauteur du header et la tient à jour (fenêtre et header redimensionnés) */
export function trackHeaderHeight() {
    const bar = qs('.topbar');
    const sync = () => {
        if (bar) document.documentElement.style.setProperty('--xp-header-h', `${bar.getBoundingClientRect().height}px`);
    };
    sync();
    window.addEventListener('resize', sync);
    if (window.ResizeObserver && bar) new ResizeObserver(sync).observe(bar);
}
