/**
 * Commandes de la visite guidée : clavier, balayage tactile et liens
 * internes (#ceres, #contact...).
 *
 *   flèche droite / gauche   étape suivante / précédente
 *   Ctrl + Début / Fin       première / dernière étape
 *   balayage horizontal      étape suivante / précédente
 *   lien vers une section    étape correspondante (#haut = accueil)
 *
 * Les commandes sont ignorées hors visite guidée, et au clavier quand le
 * panneau de personnalisation ou l'écran d'accueil est ouvert.
 */
import { qs } from '../../utils/dom.js';

/** Balayage : distance horizontale minimale (px) et dominance sur la verticale */
const SWIPE_MIN_PX = 70;
const SWIPE_RATIO = 1.6;

/** Vrai si une fenêtre modale du site a la main sur le clavier */
function modalOpen() {
    const panel = qs('#theme-panel');
    const welcome = qs('#pb-welcome');
    return Boolean((panel && !panel.hidden) || (welcome && !welcome.hidden));
}

/**
 * Pose les écouteurs sur le document.
 * @param {object} tour  { active(), index(), slides(), go(n) } : état et
 *                       navigation de la visite
 */
export function bindTourInputs(tour) {
    let touch = null;

    document.addEventListener('keydown', (e) => {
        if (!tour.active() || modalOpen()) return;
        const tag = (e.target && e.target.tagName) || '';
        if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
        const index = tour.index();
        if (e.key === 'ArrowRight') { e.preventDefault(); tour.go(index + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); tour.go(index - 1); }
        else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); tour.go(0); }
        else if (e.key === 'End' && e.ctrlKey) { e.preventDefault(); tour.go(tour.slides().length - 1); }
    });

    document.addEventListener('touchstart', (e) => {
        if (!tour.active() || e.touches.length !== 1) return;
        touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!tour.active() || !touch) return;
        const point = e.changedTouches[0];
        const dx = point.clientX - touch.x;
        const dy = point.clientY - touch.y;
        touch = null;
        if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * SWIPE_RATIO) {
            tour.go(dx < 0 ? tour.index() + 1 : tour.index() - 1);
        }
    }, { passive: true });

    document.addEventListener('click', (e) => {
        if (!tour.active()) return;
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const id = link.getAttribute('href').slice(1);
        let target = -1;
        tour.slides().forEach((slide, i) => { if (slide.id === id || (id === 'haut' && i === 0)) target = i; });
        if (target !== -1) {
            e.preventDefault();
            tour.go(target);
        }
    });
}
