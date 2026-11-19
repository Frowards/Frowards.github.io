/**
 * Mémoire du défilement en visite libre : après un rechargement (F5), la
 * page revient là où le visiteur lisait.
 *
 * La position est mémorisée pour la visite en cours (Storage.session
 * KEYS.SCROLL_POS) sous la forme « étape + décalage dans l'étape », et non en
 * pixels bruts : la mise en page bouge pendant le chargement (polices,
 * images), la position reste ainsi juste. Elle est réappliquée quand les
 * polices puis la page ont fini de charger, sauf si le visiteur a déjà
 * défilé lui-même.
 */
import Storage, { KEYS } from '../../core/Storage.js';
import { collectSteps } from './steps.js';

/** Interactions qui montrent que le visiteur a repris la main */
const USER_INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];

/** Haut d'un élément dans le document (px) */
const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;

/** Étape lue (la dernière dont le haut a dépassé le haut de l'écran) et décalage */
function readPosition() {
    const steps = collectSteps();
    let i = 0;
    steps.forEach((step, n) => { if (docTop(step.el) <= window.scrollY + 1) i = n; });
    return steps[i] ? { i, dy: Math.round(window.scrollY - docTop(steps[i].el)) } : null;
}

/** Position mémorisée, ou null */
function savedPosition() {
    try {
        const pos = JSON.parse(Storage.session.get(KEYS.SCROLL_POS, 'null'));
        return pos && Number.isInteger(pos.i) && Number.isFinite(pos.dy) ? pos : null;
    } catch (e) {
        return null;
    }
}

/** Revient à la position mémorisée (vrai si elle a pu être appliquée) */
function apply(pos) {
    const step = collectSteps()[pos.i];
    if (!step) return false;
    window.scrollTo({ top: Math.max(0, docTop(step.el) + pos.dy), left: 0, behavior: 'instant' });
    return true;
}

/**
 * Mémorise la position à chaque défilement tant que isFree() est vrai
 * (visite libre) et confie la reprise au script plutôt qu'au navigateur.
 * @param {() => boolean} isFree
 */
export function trackScroll(isFree) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    let pending = false;
    window.addEventListener('scroll', () => {
        if (pending || !isFree()) return;
        pending = true;
        requestAnimationFrame(() => {
            pending = false;
            const pos = readPosition();
            if (pos && isFree()) Storage.session.set(KEYS.SCROLL_POS, JSON.stringify(pos));
        });
    }, { passive: true });
}

/** Reprend la lecture à la position mémorisée pendant cette visite */
export function restoreScroll() {
    const pos = savedPosition();
    if (!pos || !apply(pos)) return;
    let userMoved = false;
    const stop = () => { userMoved = true; };
    USER_INPUTS.forEach((type) => window.addEventListener(type, stop, { once: true, passive: true }));
    const reapply = () => { if (!userMoved) apply(pos); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reapply);
    if (document.readyState === 'complete') reapply();
    else window.addEventListener('load', reapply, { once: true });
}
