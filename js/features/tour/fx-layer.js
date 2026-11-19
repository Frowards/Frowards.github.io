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

/**
 * Cases d'un rideau de pixels, chacune avec un délai aléatoire (--d) pour
 * qu'elles apparaissent en désordre. Partagé avec les transitions de
 * lancement des expériences.
 * @param {number} count     nombre de cases (12 x 8 dans les feuilles de style)
 * @param {number} maxDelay  délai maximal en secondes
 */
export function pixelCells(count, maxDelay) {
    return Array.from({ length: count }, () => `<i style="--d:${(Math.random() * maxDelay).toFixed(2)}s"></i>`).join('');
}
