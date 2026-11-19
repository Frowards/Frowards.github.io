/**
 * Intégration des expériences dans le header :
 *   - bouton « Changer d'expérience » (#btn-exp), en tête des actions ;
 *   - interrupteur de visite (#btn-tour), juste après : boussole « Passer en
 *     visite guidée » en visite libre, molette « Passer en visite libre » en
 *     visite guidée (il suit l'événement tour:toggle) ;
 *   - hauteur réelle du header publiée dans la
 *     variable CSS --xp-header-h : le HUD, les messages, le cockpit et la
 *     visite guidée se placent juste dessous.
 */
import { t } from '../../core/Lang.js';
import Events from '../../core/Events.js';
import { qs } from '../../utils/dom.js';
import Icon from '../../components/Icon.js';
import './icons.js';

/**
 * Bouton d'icône du header. Ses libellés suivent la langue grâce à
 * data-i18n-aria / data-i18n-title.
 */
function headerButton(id, icon, labelKey, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = 'toggle-btn';
    button.setAttribute('data-i18n-aria', labelKey);
    button.setAttribute('data-i18n-title', labelKey);
    button.setAttribute('aria-label', t(labelKey));
    button.title = t(labelKey);
    button.innerHTML = Icon.svg(icon);
    button.addEventListener('click', onClick);
    return button;
}

/**
 * Ajoute le bouton « Changer d'expérience » (une seule fois).
 * @param {Function} onClick  ouverture de l'écran d'accueil
 */
export function addExperienceButton(onClick) {
    const actions = qs('.topbar-actions');
    if (!actions || qs('#btn-exp')) return;
    actions.insertBefore(headerButton('btn-exp', 'sparkle', 'EXP.CHANGE', onClick), actions.firstChild);
}

/** Icône et libellé de l'interrupteur de visite selon la visite en cours */
function syncTourButton(button, guided) {
    const key = guided ? 'EXP.TO_FREE' : 'EXP.TO_GUIDED';
    button.innerHTML = Icon.svg(guided ? 'scroll' : 'compass');
    button.setAttribute('data-i18n-aria', key);
    button.setAttribute('data-i18n-title', key);
    button.setAttribute('aria-label', t(key));
    button.title = t(key);
}

/**
 * Ajoute l'interrupteur visite guidée / visite libre après le bouton des
 * expériences (une seule fois).
 * @param {Function} onClick  bascule de visite
 */
export function addTourButton(onClick) {
    const actions = qs('.topbar-actions');
    if (!actions || qs('#btn-tour')) return;
    const button = headerButton('btn-tour', 'compass', 'EXP.TO_GUIDED', onClick);
    const after = qs('#btn-exp', actions);
    actions.insertBefore(button, after ? after.nextSibling : actions.firstChild);
    syncTourButton(button, document.documentElement.getAttribute('data-pb-tour') === 'guided');
    Events.on('tour:toggle', ({ active }) => syncTourButton(button, active));
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
