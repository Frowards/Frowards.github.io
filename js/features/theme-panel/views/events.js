/**
 * Thèmes d'événements (colonne d'aperçu) : pour chaque événement, sa
 * période, un bouton d'aperçu (non enregistré, arrêté à la fermeture du
 * panneau) et un interrupteur pour l'autoriser pendant sa période.
 *
 * La boîte vit dans la colonne d'aperçu en grand écran ; sur téléphone,
 * elle descend dans la zone défilante pour laisser l'aperçu épinglé.
 */
import Lang, { t } from '../../../core/Lang.js';
import { esc } from '../../../utils/dom.js';
import Theme from '../../theme/Theme.js';
import { eventName, miniButton, switchControl } from '../controls.js';

/** Même seuil que la mise en page du panneau (css/features/theme-panel/panel.css) */
const NARROW_QUERY = '(max-width: 719px)';

/** Jour et mois en toutes lettres dans la langue de la page (« 24 octobre ») */
function formatDay(date) {
    return date.toLocaleDateString(Lang.lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long' });
}

/**
 * Ligne d'un événement.
 * @param {string} key clé de l'événement
 * @param {{ eventKey: string|null, previewKey: string|null }} state
 */
function eventRow(key, { eventKey, previewKey }) {
    const period = Theme.eventWindow(key);
    const isLive = !previewKey && eventKey === key;
    const isPreview = previewKey === key;
    const name = eventName(key);
    const when = period ? t('THEME.EV_WHEN', { from: formatDay(period.from), to: formatDay(period.to) }) : '';
    const liveBadge = isLive ? `<span class="event-row__live">${esc(t('THEME.EV_LIVE'))}</span>` : '';
    return `<li class="event-row${isLive || isPreview ? ' is-live' : ''}">`
        + `<span class="event-row__txt"><span class="event-row__name">${esc(name)}${liveBadge}</span>`
        + `<span class="event-row__when">${esc(when)}</span></span>`
        + miniButton(t(isPreview ? 'THEME.EV_STOP' : 'THEME.EV_PREVIEW'), `data-ev-preview="${key}"`, { active: isPreview })
        + switchControl({
            attrs: `data-ev-toggle="${key}"`,
            checked: Theme.isEventEnabled(key),
            title: t('THEME.EV_ENABLE'),
            ariaLabel: t('THEME.EV_ENABLE_ARIA', { name })
        })
        + '</li>';
}

/**
 * Branche la liste des thèmes d'événements.
 * @param {import('../ThemePanel.js').PanelContext} ctx
 * @returns {{ sync: (snapshot: Object) => void, place: () => void }}
 */
export default function mountEvents({ find, change }) {
    const box = find('.events-box');
    const list = find('#opt-events');
    const body = find('.theme-panel__body');
    const side = find('.theme-panel__side');
    const narrow = window.matchMedia(NARROW_QUERY);

    /** Range la boîte dans la colonne d'aperçu (large) ou la zone défilante (étroit) */
    function place() {
        const target = narrow.matches ? body : side;
        if (box && box.parentNode !== target) target.appendChild(box);
    }
    narrow.addEventListener('change', place);

    list.addEventListener('click', (e) => {
        const button = e.target.closest('[data-ev-preview]');
        if (!button) return;
        const key = button.getAttribute('data-ev-preview');
        change(() => Theme.previewEvent(Theme.previewKey === key ? null : key));
    });

    list.addEventListener('change', (e) => {
        const toggle = e.target.closest('[data-ev-toggle]');
        if (!toggle) return;
        change(() => Theme.setEventEnabled(toggle.getAttribute('data-ev-toggle'), toggle.checked));
    });

    return {
        place,
        sync(state) {
            list.innerHTML = Theme.EVENTS.map((key) => eventRow(key, state)).join('');
        }
    };
}
