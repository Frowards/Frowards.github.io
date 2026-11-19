/**
 * Messages de l'expérience : message d'arrivée après le lancement et,
 * en Gamer, un succès débloqué pour chaque nouvelle section atteinte.
 *
 * Un succès n'est débloqué que si le visiteur reste un instant sur la
 * section (pas en défilant à toute vitesse), et une seule fois par
 * section tant que l'expérience n'est pas relancée.
 */
import { t } from '../../core/Lang.js';
import Toast from '../../components/Toast.js';
import Tour from '../tour/Tour.js';
import { currentExp } from './state.js';

/** Temps passé sur une section avant d'en débloquer le succès (ms) */
const DWELL_MS = 900;

let unlocked = {};
let currentStep = -1;
let timer = 0;

/** Message habillé selon l'expérience ; un seul à la fois en visite guidée */
function notify(title, text) {
    Toast.show(title, text, { variant: currentExp(), exclusive: Tour.active });
}

/** Oublie les succès débloqués et l'étape en cours (nouvelle partie) */
export function resetAchievements() {
    unlocked = {};
    currentStep = -1;
}

/**
 * Signale l'étape du parcours où se trouve le visiteur.
 * @param {number} index        étape (à partir de 0)
 * @param {{ key: string } | undefined} step  étape correspondante
 * @param {number} count        nombre d'étapes
 */
export function trackStep(index, step, count) {
    if (index === currentStep) return;
    currentStep = index;
    clearTimeout(timer);
    if (currentExp() !== 'gamer' || !step || unlocked[step.key] || index === 0) return;
    timer = setTimeout(() => {
        if (currentStep !== index || currentExp() !== 'gamer') return;
        unlocked[step.key] = true;
        const last = index === count - 1;
        notify(t(last ? 'EXP.ACH_END_T' : 'EXP.ACH_T'), t(`EXP.ACH_${step.key.toUpperCase()}`));
    }, DWELL_MS);
}

/**
 * Message d'arrivée après le lancement d'une expérience : premier succès
 * en Gamer, conseil de visite à la toute première visite sinon.
 */
export function announceArrival(exp, wasFirst) {
    if (exp === 'gamer') notify(t('EXP.ACH_START_T'), t('EXP.ACH_START'));
    else if (wasFirst) notify(t('EXP.WELCOME_T'), t(Tour.active ? 'EXP.WELCOME_GUIDED' : `EXP.WELCOME_${exp.toUpperCase()}`));
}
