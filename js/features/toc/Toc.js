/**
 * Toc - sommaire flottant (remplace la navigation du header).
 *
 * Un bouton rond en bas à droite de l'écran ouvre la liste numérotée des
 * sections (Accueil, Ceres, Parcours...), la section lue mise en valeur.
 * Chaque entrée est un simple lien d'ancre : la page défile jusqu'à la
 * section. Visite libre uniquement : en visite guidée, la barre de visite
 * (flèches, points des étapes) fait déjà ce travail, le sommaire est masqué
 * (css/features/toc/toc.css).
 *
 * Le bouton se déplace : on le glisse ou on le lance, il s'aimante au bord
 * le plus proche et y reste (drag.js).
 * Fermeture : Échap, clic en dehors, ou choix d'une section.
 * Mise en forme : css/features/toc/toc.css (habillée par chaque expérience
 * via les variables du thème).
 */
import Lang, { t } from '../../core/Lang.js';
import Events from '../../core/Events.js';
import Icon from '../../components/Icon.js';
import { esc, qsa } from '../../utils/dom.js';
import { STEPS, collectSteps, sectionName, pad2 } from '../tour/steps.js';
import { makeDraggable } from './drag.js';
import './icons.js';

/** Section considérée comme lue : la dernière dont le haut a passé 40 % de l'écran */
const READ_LINE = 0.4;

let root = null;
let toggle = null;
let list = null;
let current = 0;
let tourActive = false;
let drag = null;

/** Lien d'ancre de l'étape i (l'accueil n'a pas d'id : haut de la page) */
const hrefOf = (step) => (step.el.id ? `#${step.el.id}` : '#haut');

function render() {
    const steps = collectSteps();
    const title = esc(t('TOC.TITLE'));
    toggle.innerHTML = `${Icon.svg('toc-list')}<span class="toc__label">${title}</span>`;
    toggle.setAttribute('aria-label', t('TOC.OPEN'));
    list.innerHTML = steps.map((step, i) => [
        `<li><a class="toc__link" href="${hrefOf(step)}" data-toc="${i}">`,
        `<span class="toc__num">${pad2(i + 1)}</span>`,
        `<span class="toc__name">${esc(sectionName(step.key))}</span>`,
        '</a></li>'
    ].join('')).join('');
    list.setAttribute('aria-label', t('TOC.TITLE'));
    mark();
    /* Le libellé change de largeur avec la langue : le bouton se recale */
    if (drag) drag.refresh();
}

/** Met en valeur la section lue */
function mark() {
    qsa('.toc__link', list).forEach((link) => {
        const on = Number(link.dataset.toc) === current;
        link.classList.toggle('is-current', on);
        if (on) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
    });
}

/** Visite libre : section lue d'après le défilement */
function trackScroll() {
    if (tourActive) return;
    const line = innerHeight * READ_LINE;
    let n = 0;
    collectSteps().forEach((step, i) => { if (step.el.getBoundingClientRect().top <= line) n = i; });
    if (n !== current) { current = n; mark(); }
}

function open() {
    list.hidden = false;
    root.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    const active = list.querySelector('.is-current') || list.querySelector('.toc__link');
    if (active) active.focus({ preventScroll: true });
}

function close(focusToggle) {
    if (list.hidden) return;
    list.hidden = true;
    root.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (focusToggle) toggle.focus({ preventScroll: true });
}

function build() {
    root = document.createElement('nav');
    root.className = 'toc';
    root.innerHTML = [
        '<button type="button" class="toc__toggle" aria-expanded="false" aria-controls="toc-list"></button>',
        `<ol class="toc__list" id="toc-list" hidden></ol>`
    ].join('');
    toggle = root.querySelector('.toc__toggle');
    list = root.querySelector('.toc__list');
    document.body.appendChild(root);
    drag = makeDraggable(root, toggle);

    /* Fin d'un glisser : pas d'ouverture */
    toggle.addEventListener('click', () => {
        if (drag.wasDragged()) return;
        if (list.hidden) open();
        else close(false);
    });
    /* Choix d'une section : le lien fait son travail, le sommaire se referme */
    list.addEventListener('click', (e) => { if (e.target.closest('.toc__link')) close(false); });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(true); });
    document.addEventListener('click', (e) => { if (!root.contains(e.target)) close(false); });
}

const Toc = {
    /** Crée le sommaire et suit la section lue (à appeler une fois, après Tour.init) */
    init() {
        if (!STEPS.length) return;
        build();
        render();
        Lang.onChange(render);
        Events.on('tour:toggle', ({ active }) => {
            tourActive = active;
            close(false);
            if (!active) trackScroll();
        });
        let pending = false;
        window.addEventListener('scroll', () => {
            if (pending) return;
            pending = true;
            requestAnimationFrame(() => { pending = false; trackScroll(); });
        }, { passive: true });
        trackScroll();
    }
};

export default Toc;
