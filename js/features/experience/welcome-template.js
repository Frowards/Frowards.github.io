/**
 * Balisage de l'écran « Choisissez votre expérience » (fonctions pures :
 * aucune lecture ni écriture du DOM). Mise en forme : css/features/experience
 * (welcome.css, welcome-previews.css, welcome-live-preview.css...).
 *
 * Les fragments sont assemblés sans espace entre les balises, comme le
 * balisage d'origine : aucun nœud texte parasite dans la mise en page.
 */
import { t } from '../../core/Lang.js';
import { esc } from '../../utils/dom.js';
import Icon from '../../components/Icon.js';
import { EXPERIENCES } from './presets.js';
import './icons.js';

/** Texte traduit et échappé */
const tx = (key, params) => esc(t(key, params));

/** Mini-scènes d'aperçu de chaque carte (dessinées en CSS ; « Aa » est un
    spécimen de police, pas un texte à traduire) */
const PREVIEWS = {
    classic: () => [
        '<span class="xp-pv__dots"><i></i><i></i><i></i><i></i><i></i></span>',
        '<span class="xp-pv__title">Aa</span>',
        '<span class="xp-pv__line"></span><span class="xp-pv__line xp-pv__line--short"></span>'
    ].join(''),
    retro: () => `<span class="xp-pv__crt">${tx('EXP.PV_RETRO_CMD')}<br>${tx('EXP.PV_RETRO_LOADING')}<b class="xp-pv__cursor"></b></span>`,
    future: () => [
        '<span class="xp-pv__stars"></span><span class="xp-pv__stars xp-pv__stars--b"></span>',
        '<span class="xp-pv__cockpit"></span>',
        `<span class="xp-pv__hud">${tx('EXP.PV_FUTURE_HUD')}</span>`
    ].join(''),
    gamer: () => [
        `<span class="xp-pv__lvl">${tx('EXP.PV_GAMER_LVL')}</span>`,
        '<span class="xp-pv__xp"><i></i></span>',
        '<span class="xp-pv__heart"></span><span class="xp-pv__coin"></span>'
    ].join('')
};

/** Carte d'une expérience (bouton radio) */
function cardMarkup(exp) {
    const key = `EXP.${exp.toUpperCase()}`;
    return [
        `<button type="button" class="xp-card xp-card--${exp}" role="radio" data-xp="${exp}">`,
        `<span class="xp-pv xp-pv--${exp}" aria-hidden="true">${PREVIEWS[exp]()}</span>`,
        `<span class="xp-card__name">${tx(key)}</span>`,
        `<span class="xp-card__desc">${tx(`${key}_DESC`)}</span>`,
        '</button>'
    ].join('');
}

/** Choix clair / sombre, avec le mode détecté sur l'appareil */
function modeMarkup(detected) {
    const detectedName = t(detected === 'dark' ? 'EXP.DARK' : 'EXP.LIGHT').toLowerCase();
    return [
        '<div class="xp-mode">',
        `<span class="xp-mode__label">${tx('EXP.MODE')}</span>`,
        `<div class="seg xp-seg" role="radiogroup" aria-label="${tx('EXP.MODE')}">`,
        `<button type="button" role="radio" data-xp-mode="light">${Icon.svg('sun')}<span>${tx('EXP.LIGHT')}</span></button>`,
        `<button type="button" role="radio" data-xp-mode="dark">${Icon.svg('moon')}<span>${tx('EXP.DARK')}</span></button>`,
        '</div>',
        `<span class="xp-mode__detected">${tx('EXP.DETECTED', { mode: detectedName })}</span>`,
        `<span class="xp-mode__space">${tx('EXP.SPACE_NIGHT')}</span>`,
        '</div>'
    ].join('');
}

/** Option de visite (guidée / libre) */
function tourOptionMarkup(tour, icon, key) {
    return [
        `<button type="button" role="radio" class="xp-tour__opt" data-xp-tour="${tour}">${Icon.svg(icon)}`,
        `<span><b>${tx(key)}</b><small>${tx(`${key}_DESC`)}</small></span></button>`
    ].join('');
}

/** Choix du type de visite */
function tourMarkup() {
    return [
        `<div class="xp-tour" role="radiogroup" aria-label="${tx('EXP.TOUR')}">`,
        `<span class="xp-mode__label">${tx('EXP.TOUR')}</span>`,
        '<div class="xp-tour__opts">',
        tourOptionMarkup('guided', 'compass', 'EXP.TOUR_GUIDED'),
        tourOptionMarkup('free', 'scroll', 'EXP.TOUR_FREE'),
        '</div></div>'
    ].join('');
}

/**
 * Contenu complet de l'écran d'accueil.
 * @param {object} options
 * @param {boolean} options.closable  bouton de fermeture (absent à la première visite)
 * @param {string} options.detected   mode de l'appareil ('light' | 'dark')
 */
export function welcomeMarkup({ closable, detected }) {
    return [
        '<div class="xp-welcome__bg" aria-hidden="true"></div>',
        '<div class="xp-welcome__box">',
        '<div class="xp-welcome__top">',
        `<button type="button" class="xp-chip" data-xp-lang aria-label="${tx('EXP.LANG_ARIA')}">${tx('EXP.LANG_SWITCH')}</button>`,
        closable ? `<button type="button" class="toggle-btn" data-xp-close aria-label="${tx('EXP.CLOSE')}">${Icon.svg('close')}</button>` : '',
        '</div>',
        `<p class="xp-welcome__hello">${tx('EXP.HELLO')}</p>`,
        `<h2 id="xp-title" class="xp-welcome__title">${tx('EXP.TITLE')}</h2>`,
        `<p class="xp-welcome__sub">${tx('EXP.SUB')}</p>`,
        `<div class="xp-cards" role="radiogroup" aria-label="${tx('EXP.TITLE')}">${EXPERIENCES.map(cardMarkup).join('')}</div>`,
        modeMarkup(detected),
        tourMarkup(),
        `<button type="button" class="btn btn-primary xp-go" data-xp-go>${tx('EXP.GO')}</button>`,
        `<p class="xp-welcome__note">${Icon.svg('sparkle')}<span>${tx('EXP.NOTE')}</span></p>`,
        '</div>'
    ].join('');
}
