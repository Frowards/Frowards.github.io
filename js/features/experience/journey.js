/**
 * Suivi du parcours : où en est le visiteur dans la page, et ce qui en
 * découle (HUD, lecture « ZONE » du cockpit, succès Gamer), plus les
 * étiquettes de section propres à chaque expérience.
 *
 * En visite libre, l'étape en cours est la dernière dont le haut a passé
 * 45 % de l'écran ; en visite guidée, c'est l'étape affichée.
 */
import { t } from '../../core/Lang.js';
import { qs } from '../../utils/dom.js';
import Tour from '../tour/Tour.js';
import { collectSteps, sectionName, pad2 } from '../tour/steps.js';
import Hud from './Hud.js';
import { trackStep } from './achievements.js';
import { currentExp } from './state.js';

let ticking = false;

/** Progression de défilement de la page (0 à 100) */
function scrollPercent() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return Math.max(0, Math.min(100, Math.round(window.scrollY / max * 100)));
}

/** Étape en cours et progression, en visite guidée comme libre */
function locate(steps) {
    if (Tour.active) {
        /* Visite guidée : la progression suit les étapes */
        const index = Math.min(Tour.index, steps.length - 1);
        return { index, pct: Math.round(index / Math.max(1, steps.length - 1) * 100) };
    }
    const pct = scrollPercent();
    const mid = window.innerHeight * 0.45;
    let index = 0;
    steps.forEach((step, i) => { if (step.el.getBoundingClientRect().top <= mid) index = i; });
    if (pct >= 99) index = steps.length - 1;
    return { index, pct };
}

/** Met à jour le HUD, le cockpit et les succès d'après la position du visiteur */
export function updateJourney() {
    ticking = false;
    if (!Hud.built) return;
    const exp = currentExp();
    const steps = collectSteps();
    const { index, pct } = locate(steps);
    const step = steps[index];
    const name = step ? sectionName(step.key) : '';
    if (exp === 'future' && !Tour.active) Tour.setZone(index, steps.length);
    Hud.update(exp, { pct, index, total: steps.length, name });
    trackStep(index, step, steps.length);
}

/** Défilement / redimensionnement : une mise à jour par image au plus */
export function scheduleJourneyUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateJourney);
}

/**
 * Étiquette chaque section dans le style de l'expérience
 * (« NIVEAU 2 », « // SECTEUR 02 », « C:\> CD CERES ») ; aucune en Classique.
 */
export function tagSections() {
    const exp = currentExp();
    collectSteps().forEach((step, i) => {
        const head = qs('.section-head', step.el) || qs('.eyebrow', step.el);
        if (!head) return;
        if (exp === 'classic') {
            head.removeAttribute('data-exp-tag');
            return;
        }
        const n = i + 1;
        head.setAttribute('data-exp-tag', t(`EXP.TAG_${exp.toUpperCase()}`, {
            n,
            nn: pad2(n),
            name: sectionName(step.key).toUpperCase()
        }));
    });
}
