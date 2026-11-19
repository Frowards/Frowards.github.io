/**
 * Reveal - apparition douce des blocs au défilement.
 *
 * Chaque élément .reveal reçoit la classe .visible la première fois qu'il
 * entre dans la fenêtre (l'animation elle-même est en CSS, et chaque
 * expérience a la sienne). Si l'utilisateur préfère réduire les animations,
 * tout est rendu visible d'emblée.
 *
 * replay() : après un changement d'expérience, les blocs hors écran perdent
 * .visible pour rejouer leur apparition dans le nouveau style.
 */
import { qsa } from '../utils/dom.js';
import { prefersReducedMotion } from '../utils/motion.js';

/** Part de l'élément qui doit être visible pour déclencher l'apparition */
const THRESHOLD = 0.12;

let blocks = [];        // éléments .reveal présents à l'initialisation
let observer = null;    // null : apparitions désactivées (ou init pas encore appelé)

/** Rend visibles les blocs qui entrent dans la fenêtre, une seule fois chacun */
function onIntersect(entries) {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
    });
}

/** Vrai si l'élément est entièrement hors de la fenêtre */
function isOffscreen(node) {
    const rect = node.getBoundingClientRect();
    return rect.top > window.innerHeight || rect.bottom < 0;
}

const Reveal = {
    /** Observe les blocs .reveal de la page (à appeler une fois) */
    init() {
        if (observer) return;
        blocks = qsa('.reveal');
        if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
            blocks.forEach((node) => node.classList.add('visible'));
            return;
        }
        observer = new IntersectionObserver(onIntersect, { threshold: THRESHOLD });
        blocks.forEach((node) => observer.observe(node));
    },

    /**
     * Rejoue l'apparition des blocs hors écran (changement d'expérience).
     * Sans effet si les apparitions sont désactivées ou si init n'a pas été appelé.
     */
    replay() {
        if (!observer) return;
        blocks.filter(isOffscreen).forEach((node) => {
            node.classList.remove('visible');
            observer.observe(node);
        });
    }
};

export default Reveal;
