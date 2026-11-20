/**
 * Flag - drapeaux des langues du site, partagés par le bouton de langue du
 * header et celui de l'écran d'accueil.
 *
 * Les mêmes drapeaux que Ceres (C:\Ceres\front\_CeresAssets\flags, issus de
 * la bibliothèque flag-icons, licence MIT) : couleurs officielles, chaque
 * drapeau redessiné au format commun 4:3 (jamais étiré ni écrasé), et non des
 * pictos monochromes du registre d'icônes (Icon). Les émojis
 * drapeaux ne sont pas utilisés : Windows les affiche en simples lettres.
 *
 * Les boutons montrent le drapeau de la langue AFFICHÉE (repère immédiat,
 * et valable s'il y a un jour plus de deux langues au choix).
 *
 * Utilisation : Flag.svg('en') -> '<svg class="flag flag-en" ...>...</svg>'
 *               <span data-flag="be"></span> en HTML, puis Flag.hydrate()
 *               (le span devient .flag-slot : emplacement de largeur fixe)
 * Mise en forme : .toggle-btn .flag (components/toggle-button.css) et
 * .xp-chip--flag .flag (features/experience/welcome.css).
 */
const FLAGS = Object.freeze({
    /* Royaume-Uni (langue anglaise) */
    en: () => '<path fill="#012169" d="M0 0h640v480H0z"/><path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0z"/><path fill="#C8102E" d="m424 281 216 159v40L369 281zm-184 20 6 35L54 480H0zM640 0v3L391 191l2-44L590 0zM0 0l239 176h-60L0 42z"/><path fill="#FFF" d="M241 0v480h160V0zM0 160v160h640V160z"/><path fill="#C8102E" d="M0 193v96h640v-96zM273 0v480h96V0z"/>',
    /* France */
    fr: () => '<path fill="#fff" d="M0 0h640v480H0z"/><path fill="#000091" d="M0 0h213.3v480H0z"/><path fill="#e1000f" d="M426.7 0H640v480H426.7z"/>',
    /* Belgique */
    be: () => '<g fill-rule="evenodd" stroke-width="1pt"><path fill="#000001" d="M0 0h213.3v480H0z"/><path fill="#ffd90c" d="M213.3 0h213.4v480H213.3z"/><path fill="#f31830" d="M426.7 0H640v480H426.7z"/></g>',
    /* Luxembourg */
    lu: () => '<path fill="#ed2939" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#00a1de" d="M0 320h640v160H0z"/>',
    /* Canada */
    ca: () => '<path fill="#fff" d="M150.1 0h339.7v480H150z"/><path fill="#d52b1e" d="M-19.7 0h169.8v480H-19.7zm509.5 0h169.8v480H489.9zM201 232l-13.3 4.4 61.4 54c4.7 13.7-1.6 17.8-5.6 25l66.6-8.4-1.6 67 13.9-.3-3.1-66.6 66.7 8c-4.1-8.7-7.8-13.3-4-27.2l61.3-51-10.7-4c-8.8-6.8 3.8-32.6 5.6-48.9 0 0-35.7 12.3-38 5.8l-9.2-17.5-32.6 35.8c-3.5.9-5-.5-5.9-3.5l15-74.8-23.8 13.4q-3.2 1.3-5.2-2.2l-23-46-23.6 47.8q-2.8 2.5-5 .7L264 130.8l13.7 74.1c-1.1 3-3.7 3.8-6.7 2.2l-31.2-35.3c-4 6.5-6.8 17.1-12.2 19.5s-23.5-4.5-35.6-7c4.2 14.8 17 39.6 9 47.7"/>',
    /* États-Unis */
    us: (id) => `<path fill="#bd3d44" d="M0 0h640v480H0"/><path stroke="#fff" stroke-width="37" d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"/><path fill="#192f5d" d="M0 0h364.8v258.5H0"/><marker id="${id}" markerHeight="30" markerWidth="30"><path fill="#fff" d="m14 0 9 27L0 10h28L5 27z"/></marker><path fill="none" marker-mid="url(#${id})" d="m0 0 16 11h61 61 61 61 60L47 37h61 61 60 61L16 63h61 61 61 61 60L47 89h61 61 60 61L16 115h61 61 61 61 60L47 141h61 61 60 61L16 166h61 61 61 61 60L47 192h61 61 60 61L16 218h61 61 61 61 60z"/>`
});

/** Compteur pour des identifiants uniques (étoiles du drapeau américain) */
let uid = 0;

const Flag = {
    /**
     * Balisage SVG du drapeau de la langue ou du pays (chaîne vide si inconnu).
     * Format 4:3 commun à tous les drapeaux (viewBox et aspect-ratio) : les
     * feuilles de style ne fixent que la hauteur.
     */
    svg(code) {
        const body = FLAGS[code];
        if (!body) return '';
        uid += 1;
        return `<svg class="flag flag-${code}" viewBox="0 0 640 480" style="aspect-ratio: 4 / 3" aria-hidden="true" focusable="false">${body(`pb-flag-${uid}`)}</svg>`;
    },

    /** Remplace tous les <span data-flag="xx"> présents sous root par leur drapeau */
    hydrate(root = document) {
        root.querySelectorAll('[data-flag]').forEach((node) => {
            node.classList.add('flag-slot');
            node.innerHTML = Flag.svg(node.dataset.flag);
            node.removeAttribute('data-flag');
        });
    }
};

export default Flag;
