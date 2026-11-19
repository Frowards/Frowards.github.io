/**
 * Flag - drapeaux des langues du site, partagés par le bouton de langue du
 * header et celui de l'écran d'accueil.
 *
 * Petites illustrations aux couleurs officielles (ratio 2:1, viewBox 60 x 30),
 * et non des pictos monochromes du registre d'icônes (Icon). Les émojis
 * drapeaux ne sont pas utilisés : Windows les affiche en simples lettres.
 *
 * Utilisation : Flag.svg('en') -> '<svg class="flag flag-en" ...>...</svg>'
 * Mise en forme : .toggle-btn .flag (components/toggle-button.css) et
 * .xp-chip--flag .flag (features/experience/welcome.css).
 */
const FLAGS = Object.freeze({
    en: '<rect width="60" height="30" fill="#012169"/>'
        + '<path d="M0,0 60,30 M60,0 0,30" stroke="#fff" stroke-width="6"/>'
        + '<path d="M0,0 60,30 M60,0 0,30" stroke="#C8102E" stroke-width="3.5"/>'
        + '<path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/>'
        + '<path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6"/>',
    fr: '<rect width="20" height="30" fill="#0055A4"/>'
        + '<rect x="20" width="20" height="30" fill="#fff"/>'
        + '<rect x="40" width="20" height="30" fill="#EF4135"/>'
});

const Flag = {
    /** Balisage SVG du drapeau de la langue (chaîne vide si inconnue) */
    svg(lang) {
        if (!FLAGS[lang]) return '';
        return `<svg class="flag flag-${lang}" viewBox="0 0 60 30" aria-hidden="true" focusable="false">${FLAGS[lang]}</svg>`;
    },

    /** Langue proposée par un bouton de langue : l'autre que celle affichée */
    target(lang) {
        return lang === 'fr' ? 'en' : 'fr';
    }
};

export default Flag;
