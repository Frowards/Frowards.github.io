/**
 * Tooltip - infobulles des termes techniques.
 *
 * Tout élément portant data-tip="CLE" affiche au survol la traduction de la
 * clé. Le texte est résolu au moment de l'affichage : il est donc toujours
 * dans la langue courante, sans resynchronisation.
 *
 * Une seule infobulle (#pb-tooltip) pour toute la page, repositionnée au-dessus
 * de l'élément survolé (en dessous s'il n'y a pas la place) et maintenue
 * dans la fenêtre. Délégation d'événements : les éléments ajoutés plus tard
 * (visite guidée, cartes générées...) en profitent aussi.
 */
import { t } from '../core/Lang.js';
import { el } from '../utils/dom.js';

/** Marge minimale entre l'infobulle et les bords de la fenêtre (px) */
const EDGE = 8;
/** Écart entre l'infobulle et l'élément survolé (px) */
const GAP = 10;

let tip = null;       // élément #pb-tooltip
let target = null;    // élément [data-tip] actuellement survolé

/** Place l'infobulle centrée au-dessus de node, ou en dessous à défaut */
function position(node) {
    const rect = node.getBoundingClientRect();
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const left = Math.max(EDGE, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - EDGE));
    let top = rect.top - height - GAP;
    if (top < EDGE) top = rect.bottom + GAP;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
}

function show(node) {
    target = node;
    tip.textContent = t(node.getAttribute('data-tip'));
    tip.classList.add('show');
    position(node);
}

function hide() {
    target = null;
    tip.classList.remove('show');
}

/** Survol : affiche l'infobulle de l'élément [data-tip] le plus proche, sinon la masque */
function onMouseOver(event) {
    const node = event.target instanceof Element ? event.target.closest('[data-tip]') : null;
    if (node) {
        if (node !== target) show(node);
    } else if (target) {
        hide();
    }
}

/** Défilement (de la page ou d'un conteneur) : l'infobulle suit son élément */
function onScroll() {
    if (target) position(target);
}

const Tooltip = {
    /** Crée l'infobulle et écoute le survol de toute la page (à appeler une fois) */
    init() {
        if (tip) return;
        tip = el('div', { id: 'pb-tooltip', role: 'tooltip' });
        document.body.appendChild(tip);
        document.addEventListener('mouseover', onMouseOver);
        /* capture : les défilements des conteneurs ne remontent pas jusqu'à window */
        window.addEventListener('scroll', onScroll, true);
    }
};

export default Tooltip;
