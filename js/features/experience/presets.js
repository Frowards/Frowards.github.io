/**
 * Expériences proposées sur l'écran d'accueil et préréglages de thème
 * associés : chaque préréglage devient la base du thème (Theme.setBase /
 * Theme.applyPreset), que le visiteur peut ensuite personnaliser.
 *
 * Les clés de police (fontTitle, fontBody) renvoient aux piles de polices
 * du thème ; le script anti-flash du <head> (js/boot/anti-flash.js) en
 * garde une copie pour appliquer le thème avant l'affichage.
 */

/** Expériences, dans l'ordre des cartes de l'écran d'accueil */
export const EXPERIENCES = Object.freeze(['classic', 'retro', 'future', 'gamer']);

/** Types de visite : guidée (étape par étape) ou libre (toute la page) */
export const TOUR_MODES = Object.freeze(['guided', 'free']);

/** Préréglages de thème de chaque expérience */
export const PRESETS = Object.freeze({
    classic: {
        accent: null, effect: 'default', interaction: 'default',
        fontTitle: 'cinzel', fontBody: 'system', fontScale: 100,
        radiusPct: 100, borderW: 1, glass: true
    },
    retro: {
        accent: '#FFB000', effect: 'coderain', interaction: 'default',
        effectParams: { coderain: { speed: 45, density: 30 } },
        fontTitle: 'terminal', fontBody: 'terminal', fontScale: 118,
        radiusPct: 0, borderW: 2, glass: false
    },
    future: {
        accent: '#00E5FF', effect: 'off', interaction: 'default',
        fontTitle: 'orbitron', fontBody: 'exo', fontScale: 100,
        radiusPct: 20, borderW: 1, glass: true,
        pageBg: {
            type: 'gradient', animated: true, opacity: 45,
            gradient: { dark: ['#04060E', '#0A1E38', '#1A0A36'], light: ['#EEF4FB', '#D5E8FA', '#E7DEFB'] }
        }
    },
    gamer: {
        accent: '#FF3EA5', effect: 'stars', interaction: 'bubble',
        fontTitle: 'pixel', fontBody: 'system', fontScale: 100,
        radiusPct: 0, borderW: 3, glass: false
    }
});

/** Vrai si exp est une expérience connue */
export function isExperience(exp) {
    return EXPERIENCES.includes(exp);
}

/** Préréglage de l'expérience exp (Classique si inconnue) */
export function presetFor(exp) {
    return PRESETS[exp] || PRESETS.classic;
}
