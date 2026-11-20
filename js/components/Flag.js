/**
 * Flag - drapeaux des langues du site, partagés par le bouton de langue du
 * header et celui de l'écran d'accueil.
 *
 * Petites illustrations aux couleurs officielles (ratio 2:1, viewBox 60 x 30),
 * et non des pictos monochromes du registre d'icônes (Icon). Les émojis
 * drapeaux ne sont pas utilisés : Windows les affiche en simples lettres.
 *
 * Les boutons montrent le drapeau de la langue AFFICHÉE (repère immédiat,
 * et valable s'il y a un jour plus de deux langues au choix).
 *
 * Utilisation : Flag.svg('en') -> '<svg class="flag flag-en" ...>...</svg>'
 *               <span data-flag="be"></span> en HTML, puis Flag.hydrate()
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
        + '<rect x="40" width="20" height="30" fill="#EF4135"/>',
    be: '<rect width="20" height="30" fill="#000"/>'
        + '<rect x="20" width="20" height="30" fill="#FDDA24"/>'
        + '<rect x="40" width="20" height="30" fill="#EF3340"/>',
    lu: '<rect width="60" height="10" fill="#EA141D"/>'
        + '<rect y="10" width="60" height="10" fill="#fff"/>'
        + '<rect y="20" width="60" height="10" fill="#51ADDA"/>',
    /* États-Unis : bandes, canton bleu, étoiles simplifiées en points */
    us: '<rect width="60" height="30" fill="#fff"/>'
        + '<rect y="0.00" width="60" height="2.31" fill="#B31942"/><rect y="4.62" width="60" height="2.31" fill="#B31942"/><rect y="9.23" width="60" height="2.31" fill="#B31942"/><rect y="13.85" width="60" height="2.31" fill="#B31942"/><rect y="18.46" width="60" height="2.31" fill="#B31942"/><rect y="23.08" width="60" height="2.31" fill="#B31942"/><rect y="27.69" width="60" height="2.31" fill="#B31942"/>'
        + '<rect width="24" height="16.15" fill="#0A3161"/>'
        + '<g fill="#fff"><circle cx="2.0" cy="1.62" r="0.6"/><circle cx="6.0" cy="1.62" r="0.6"/><circle cx="10.0" cy="1.62" r="0.6"/><circle cx="14.0" cy="1.62" r="0.6"/><circle cx="18.0" cy="1.62" r="0.6"/><circle cx="22.0" cy="1.62" r="0.6"/><circle cx="4.0" cy="3.23" r="0.6"/><circle cx="8.0" cy="3.23" r="0.6"/><circle cx="12.0" cy="3.23" r="0.6"/><circle cx="16.0" cy="3.23" r="0.6"/><circle cx="20.0" cy="3.23" r="0.6"/><circle cx="2.0" cy="4.85" r="0.6"/><circle cx="6.0" cy="4.85" r="0.6"/><circle cx="10.0" cy="4.85" r="0.6"/><circle cx="14.0" cy="4.85" r="0.6"/><circle cx="18.0" cy="4.85" r="0.6"/><circle cx="22.0" cy="4.85" r="0.6"/><circle cx="4.0" cy="6.46" r="0.6"/><circle cx="8.0" cy="6.46" r="0.6"/><circle cx="12.0" cy="6.46" r="0.6"/><circle cx="16.0" cy="6.46" r="0.6"/><circle cx="20.0" cy="6.46" r="0.6"/><circle cx="2.0" cy="8.08" r="0.6"/><circle cx="6.0" cy="8.08" r="0.6"/><circle cx="10.0" cy="8.08" r="0.6"/><circle cx="14.0" cy="8.08" r="0.6"/><circle cx="18.0" cy="8.08" r="0.6"/><circle cx="22.0" cy="8.08" r="0.6"/><circle cx="4.0" cy="9.69" r="0.6"/><circle cx="8.0" cy="9.69" r="0.6"/><circle cx="12.0" cy="9.69" r="0.6"/><circle cx="16.0" cy="9.69" r="0.6"/><circle cx="20.0" cy="9.69" r="0.6"/><circle cx="2.0" cy="11.31" r="0.6"/><circle cx="6.0" cy="11.31" r="0.6"/><circle cx="10.0" cy="11.31" r="0.6"/><circle cx="14.0" cy="11.31" r="0.6"/><circle cx="18.0" cy="11.31" r="0.6"/><circle cx="22.0" cy="11.31" r="0.6"/><circle cx="4.0" cy="12.92" r="0.6"/><circle cx="8.0" cy="12.92" r="0.6"/><circle cx="12.0" cy="12.92" r="0.6"/><circle cx="16.0" cy="12.92" r="0.6"/><circle cx="20.0" cy="12.92" r="0.6"/><circle cx="2.0" cy="14.54" r="0.6"/><circle cx="6.0" cy="14.54" r="0.6"/><circle cx="10.0" cy="14.54" r="0.6"/><circle cx="14.0" cy="14.54" r="0.6"/><circle cx="18.0" cy="14.54" r="0.6"/><circle cx="22.0" cy="14.54" r="0.6"/></g>',
    /* Canada : bandes rouges, feuille d'érable (tracé officiel mis à l'échelle) */
    ca: '<rect width="60" height="30" fill="#D80621"/>'
        + '<rect x="15" width="30" height="30" fill="#fff"/>'
        + '<path transform="scale(0.00625)" fill="#D80621" d="m 4890,4430 -45,-863 a 95,95 0 0 1 111,-98 l 859,151 -116,-320 a 65,65 0 0 1 20,-73 l 941,-762 -212,-99 a 65,65 0 0 1 -34,-79 l 186,-572 -542,115 a 65,65 0 0 1 -73,-38 l -105,-247 -423,454 a 65,65 0 0 1 -111,-57 l 204,-1052 -327,189 a 65,65 0 0 1 -91,-27 l -332,-652 -332,652 a 65,65 0 0 1 -91,27 l -327,-189 204,1052 a 65,65 0 0 1 -111,57 l -423,-454 -105,247 a 65,65 0 0 1 -73,38 l -542,-115 186,572 a 65,65 0 0 1 -34,79 l -212,99 941,762 a 65,65 0 0 1 20,73 l -116,320 859,-151 a 95,95 0 0 1 111,98 l -45,863 z"/>'
});

const Flag = {
    /** Balisage SVG du drapeau de la langue (chaîne vide si inconnue) */
    svg(lang) {
        if (!FLAGS[lang]) return '';
        return `<svg class="flag flag-${lang}" viewBox="0 0 60 30" aria-hidden="true" focusable="false">${FLAGS[lang]}</svg>`;
    },

    /** Remplace tous les <span data-flag="xx"> présents sous root par leur drapeau */
    hydrate(root = document) {
        root.querySelectorAll('[data-flag]').forEach((node) => {
            node.outerHTML = Flag.svg(node.dataset.flag);
        });
    }
};

export default Flag;
