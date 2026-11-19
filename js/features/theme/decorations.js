/**
 * Décorations des cartes : un motif au choix PAR CÔTÉ, combinables librement.
 *
 * Chaque motif est dessiné une seule fois « posé sur le bord bas » (bande de
 * 120 x size, base à y = size) ; les côtés haut, gauche et droit sont obtenus
 * par transformation SVG (haut = miroir vertical, sauf pour les motifs
 * `upright`, gardés à l'endroit : fleurs, cœurs, feuilles, étoiles).
 *
 * Le rendu passe par des variables CSS posées sur la racine
 * (--pb-deco-<côté>-img / -size) et l'attribut data-pb-deco
 * (voir css/features/ambience/decorations.css).
 */

/** Côtés décorables, dans l'ordre d'affichage du panneau */
export const DECORATION_SIDES = ['top', 'bottom', 'left', 'right'];

/** Hauteur affichée d'un motif = size x DECO_SCALE px */
const DECO_SCALE = 1.35;

/** Longueur (px) de la bande dessinée, répétée le long du côté */
const BAND = 120;

/** Motifs disponibles : { size: hauteur de la bande, upright?, motif: contenu SVG } */
export const DECORATIONS = {
    snow: {
        size: 14,
        motif: [
            '<path fill="#d3e3f2" fill-opacity="0.6" d="M0 14V8c6-5 12-3 18-1 7-5 14-4 20 0 6-4 13-4 20 0 6-5 14-4 20 0 7-4 13-5 20-1 7-4 15-3 22 1v8z"/>',
            '<path fill="#fff" fill-opacity="0.93" d="M0 14v-4c5-4 10-3 15 0 5-5 12-4 17-1 6-4 11-3 16 1 6-5 13-4 18 0 5-3 11-4 16 0 6-4 12-3 18 1 5-3 10-3 20-1v4z"/>'
        ].join('')
    },
    icicles: {
        size: 14,
        motif: [
            '<path fill="#e3f3fc" fill-opacity="0.88" d="M0 14v-3h5l3-8 3 8h5l2-5 3 5h7l4-9 4 9h7l3-4 3 4h7l4-8 4 8h7l3-5 3 5h7l4-9 4 9h5l3-6 3 6h3v3z"/>',
            '<rect y="12" width="120" height="2" fill="#fff" fill-opacity="0.55"/>'
        ].join('')
    },
    garland: {
        size: 16,
        motif: [
            '<path stroke="#c9a86a" stroke-width="1" fill="none" d="M0 14q30 3 60 0t60 0"/>',
            '<path fill="#e05252" d="M5 15h11L10.5 5z"/><path fill="#f5c542" d="M29 14h11L34.5 4z"/>',
            '<path fill="#5dbb63" d="M53 14h11L58.5 4z"/><path fill="#4fa5e0" d="M77 14h11L82.5 4z"/>',
            '<path fill="#b07cd9" d="M101 15h11l-5.5-10z"/>'
        ].join('')
    },
    lights: {
        size: 12,
        motif: [
            '<path stroke="#8a8f99" stroke-width="1" fill="none" d="M0 9q30 3 60 0t60 0"/>',
            '<g fill-opacity="0.28"><circle cx="12" cy="6" r="3.6" fill="#e05252"/><circle cx="36" cy="8" r="3.6" fill="#f5c542"/><circle cx="60" cy="6" r="3.6" fill="#5dbb63"/><circle cx="84" cy="8" r="3.6" fill="#4fa5e0"/><circle cx="108" cy="6" r="3.6" fill="#b07cd9"/></g>',
            '<circle cx="12" cy="6" r="2" fill="#e05252"/><circle cx="36" cy="8" r="2" fill="#f5c542"/><circle cx="60" cy="6" r="2" fill="#5dbb63"/><circle cx="84" cy="8" r="2" fill="#4fa5e0"/><circle cx="108" cy="6" r="2" fill="#b07cd9"/>'
        ].join('')
    },
    cobweb: {
        size: 15,
        motif: [
            '<path stroke="#cfd8e3" stroke-opacity="0.55" stroke-width="1" fill="none" d="M0 15q15-13 30 0m0 0q15-10 30 0m0 0q15-14 30 0m0 0q15-10 30 0"/>',
            '<path stroke="#cfd8e3" stroke-opacity="0.35" stroke-width="0.8" fill="none" d="M0 15q15-7 30 0m0 0q15-5 30 0m0 0q15-8 30 0m0 0q15-5 30 0"/>',
            '<path stroke="#9aa3ad" stroke-width="0.6" d="M75 0v6"/><circle cx="75" cy="7" r="1.4" fill="#9aa3ad"/>'
        ].join('')
    },
    flowers: {
        size: 14,
        upright: true,
        motif: [
            '<path stroke="#5dbb63" stroke-width="1.2" fill="none" d="M10 14V8M34 14V9M58 14V7M82 14V9M106 14V8"/>',
            '<g fill="#f48fb1"><circle cx="10" cy="6" r="2.6"/><circle cx="58" cy="5" r="2.6"/><circle cx="106" cy="6" r="2.6"/></g>',
            '<g fill="#ffd54f"><circle cx="34" cy="7" r="2.4"/><circle cx="82" cy="7" r="2.4"/></g>',
            '<g fill="#fff8e1"><circle cx="10" cy="6" r="1"/><circle cx="34" cy="7" r="1"/><circle cx="58" cy="5" r="1"/><circle cx="82" cy="7" r="1"/><circle cx="106" cy="6" r="1"/></g>'
        ].join('')
    },
    hearts: {
        size: 12,
        upright: true,
        motif: [
            '<g fill="#f43f5e" fill-opacity="0.8">',
            '<path d="M15 10.5c-3-2.2-4.6-3.8-4.6-5.6a2.3 2.3 0 0 1 4.6-.6 2.3 2.3 0 0 1 4.6.6c0 1.8-1.6 3.4-4.6 5.6z"/>',
            '<path d="M55 10.5c-3-2.2-4.6-3.8-4.6-5.6a2.3 2.3 0 0 1 4.6-.6 2.3 2.3 0 0 1 4.6.6c0 1.8-1.6 3.4-4.6 5.6z"/>',
            '<path d="M95 10.5c-3-2.2-4.6-3.8-4.6-5.6a2.3 2.3 0 0 1 4.6-.6 2.3 2.3 0 0 1 4.6.6c0 1.8-1.6 3.4-4.6 5.6z"/></g>',
            '<g fill="#fb7185" fill-opacity="0.5"><circle cx="35" cy="8" r="1.5"/><circle cx="75" cy="8" r="1.5"/><circle cx="115" cy="8" r="1.5"/></g>'
        ].join('')
    },
    leaves: {
        size: 14,
        upright: true,
        motif: [
            '<g fill-opacity="0.85">',
            '<path fill="#e07a2e" d="M12 13c-5-1-7-6-5-10 5 0 8 4 5 10z"/>',
            '<path fill="#c0392b" d="M42 13c4-2 6-6 3-10-4 1-6 5-3 10z"/>',
            '<path fill="#e3a72f" d="M72 13c-5-1-7-6-5-10 5 0 8 4 5 10z"/>',
            '<path fill="#a0522d" d="M102 13c4-2 6-6 3-10-4 1-6 5-3 10z"/></g>'
        ].join('')
    },
    stars: {
        size: 12,
        upright: true,
        motif: [
            '<g fill="#f5c542" fill-opacity="0.85">',
            '<path d="M14 2l1.6 3.3 3.6.5-2.6 2.5.6 3.6L14 10.2l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"/>',
            '<path d="M64 4l1.1 2.3 2.5.4-1.8 1.7.4 2.5L64 9.7l-2.2 1.2.4-2.5-1.8-1.7 2.5-.4z"/>',
            '<path d="M104 2l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"/></g>',
            '<g fill="#fff3c4"><circle cx="39" cy="8" r="1"/><circle cx="85" cy="6" r="1"/></g>'
        ].join('')
    }
};

/**
 * Image SVG (data URL) du motif pour un côté de carte.
 * @param {string} styleKey clé de DECORATIONS
 * @param {'top'|'bottom'|'left'|'right'} side
 * @returns {string|null} null si le motif est inconnu
 */
export function decorationUri(styleKey, side) {
    const deco = DECORATIONS[styleKey];
    if (!deco) return null;
    const s = deco.size;
    let inner = deco.motif;
    let width = BAND;
    let height = s;
    if (side === 'top' && !deco.upright) {
        inner = `<g transform="translate(0 ${s}) scale(1 -1)">${inner}</g>`;
    }
    if (side === 'left') {
        width = s;
        height = BAND;
        inner = `<g transform="translate(${s} 0) rotate(90)">${inner}</g>`;
    }
    if (side === 'right') {
        width = s;
        height = BAND;
        inner = `<g transform="translate(0 ${BAND}) rotate(-90)">${inner}</g>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${inner}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Applique les décorations aux cartes de la page.
 * @param {HTMLElement} root racine du document
 * @param {Object<string, string>} decorations { côté: clé de motif }
 */
export function applyDecorations(root, decorations) {
    let any = false;
    DECORATION_SIDES.forEach((side) => {
        const key = decorations && decorations[side];
        const deco = key && DECORATIONS[key];
        if (deco) {
            any = true;
            root.style.setProperty(`--pb-deco-${side}-img`, `url("${decorationUri(key, side)}")`);
            root.style.setProperty(`--pb-deco-${side}-size`, `${Math.round(deco.size * DECO_SCALE)}px`);
        } else {
            root.style.removeProperty(`--pb-deco-${side}-img`);
            root.style.removeProperty(`--pb-deco-${side}-size`);
        }
    });
    root.toggleAttribute('data-pb-deco', any);
}
