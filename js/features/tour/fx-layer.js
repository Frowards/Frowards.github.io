/**
 * Calque plein écran des transitions d'étape (div.tour-fx) : écran de
 * chargement Rétro, rideau de pixels Gamer, texte du saut Spatial.
 * Un seul calque à la fois ; il s'anime grâce aux classes is-on (posée à
 * l'image suivante) puis is-out.
 */

let layer = null;

/**
 * Affiche un nouveau calque (remplace le précédent).
 * @param {string} variant  classe de variante (ex. 'tour-fx--retro')
 * @param {string} markup   contenu HTML (textes déjà échappés)
 */
export function showFxLayer(variant, markup = '') {
    if (layer) layer.remove();
    layer = document.createElement('div');
    layer.className = `tour-fx ${variant}`;
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = markup;
    document.body.appendChild(layer);
    requestAnimationFrame(() => { if (layer) layer.classList.add('is-on'); });
    return layer;
}

/** Lance l'animation de sortie du calque */
export function fadeOutFxLayer() {
    if (layer) layer.classList.add('is-out');
}

/** Retire le calque */
export function removeFxLayer() {
    if (!layer) return;
    layer.remove();
    layer = null;
}

/** Mosaïque du Gamer : 12 x 8 pixels (grilles des feuilles de style) */
const PIX_COLS = 12;
const PIX_ROWS = 8;
/** Décalage de la vague en diagonale, par pixel (s) */
const PIX_WAVE_STEP_S = 0.06;

/**
 * Pixels de la mosaïque du Gamer, partagée par les changements d'étape et
 * le lancement de l'expérience : chacun apparaît après un délai aléatoire
 * (--d) puis suit une vague en diagonale (--w, place dans la vague).
 * @param {number} maxDelay  délai d'apparition maximal (s)
 */
export function waveCells(maxDelay) {
    let html = '';
    for (let row = 0; row < PIX_ROWS; row += 1) {
        for (let col = 0; col < PIX_COLS; col += 1) {
            const d = (Math.random() * maxDelay).toFixed(2);
            const w = ((row + col) * PIX_WAVE_STEP_S).toFixed(2);
            html += `<i style="--d:${d}s;--w:${w}s"></i>`;
        }
    }
    return html;
}
