/**
 * TourBar - barre de la visite guidée, en bas de l'écran.
 *
 * Précédent / Suivant (« Recommencer » à la dernière étape), numéro et nom
 * de l'étape, une pastille par étape et le bouton « Visite libre ».
 * Au-dessus, l'indicateur « Faites défiler pour lire la suite » (affiché par
 * la classe tour-more de <html>).
 *
 * Les clics sont transmis tels quels au propriétaire de la barre :
 * 'prev', 'next', 'exit' ou le numéro de l'étape visée ('0', '1'...).
 */
import { t } from '../../core/Lang.js';
import { esc } from '../../utils/dom.js';
import Icon from '../../components/Icon.js';
import { pad2 } from './steps.js';
import './icons.js';

let bar = null;

/** Pastille d'accès direct à l'étape i */
function dotMarkup(i, current, nameOf) {
    const on = i === current;
    const label = esc(t('TOUR.GOTO', { n: i + 1, name: nameOf(i) }));
    return `<button type="button" class="tourbar__dot${on ? ' is-on' : ''}" data-tour="${i}" aria-label="${label}"${on ? ' aria-current="step"' : ''}></button>`;
}

function barMarkup(index, count, nameOf) {
    const last = index >= count - 1;
    const nextLabel = esc(t(last ? 'TOUR.RESTART' : 'TOUR.NEXT'));
    const dots = Array.from({ length: count }, (_, i) => dotMarkup(i, index, nameOf)).join('');
    return [
        `<span class="tourbar__more" aria-hidden="true">${Icon.svg('chevron-down')}${esc(t('TOUR.MORE'))}</span>`,
        `<button type="button" class="tourbar__btn tourbar__prev" data-tour="prev"${index === 0 ? ' disabled' : ''} aria-label="${esc(t('TOUR.PREV'))}">`,
        `${Icon.svg('chevron-left')}<span>${esc(t('TOUR.PREV'))}</span></button>`,
        '<div class="tourbar__mid">',
        `<span class="tourbar__count">${pad2(index + 1)} / ${pad2(count)}</span>`,
        `<span class="tourbar__name" aria-live="polite">${esc(nameOf(index))}</span>`,
        `<span class="tourbar__dots">${dots}</span>`,
        '</div>',
        `<button type="button" class="tourbar__btn tourbar__next" data-tour="next" aria-label="${nextLabel}">`,
        `<span>${nextLabel}</span>${Icon.svg('chevron-right')}</button>`,
        `<button type="button" class="tourbar__exit" data-tour="exit" title="${esc(t('TOUR.EXIT_TITLE'))}">`,
        `${Icon.svg('text-lines')}<span>${esc(t('TOUR.EXIT'))}</span></button>`
    ].join('');
}

const TourBar = {
    /**
     * Crée la barre (une seule fois) et transmet ses clics à onAction.
     * @param {(action: string) => void} onAction
     */
    build(onAction) {
        if (bar) return;
        bar = document.createElement('nav');
        bar.id = 'pb-tourbar';
        bar.className = 'tourbar';
        document.body.appendChild(bar);
        bar.addEventListener('click', (e) => {
            const button = e.target.closest('[data-tour]');
            if (button) onAction(button.getAttribute('data-tour'));
        });
    },

    /**
     * Redessine la barre pour l'étape index.
     * @param {number} index           étape affichée
     * @param {number} count           nombre d'étapes
     * @param {(i: number) => string} nameOf  nom traduit de l'étape i
     */
    render(index, count, nameOf) {
        if (!bar) return;
        bar.setAttribute('aria-label', t('TOUR.ARIA'));
        bar.innerHTML = barMarkup(index, count, nameOf);
    },

    show() {
        if (bar) bar.hidden = false;
    },

    hide() {
        if (bar) bar.hidden = true;
    }
};

export default TourBar;
