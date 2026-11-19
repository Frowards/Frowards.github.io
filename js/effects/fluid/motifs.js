/**
 * motifs - tracés suivis par le pinceau ambiant du fluide.
 *
 * Un tracé est une suite de points en coordonnées uv (0 à 1, y vers le
 * haut) ; un point `lift` marque une levée du pinceau (rien n'est peint
 * jusqu'à lui). Trois familles :
 *   - ruban   : courbe sinueuse qui traverse l'écran
 *   - figure  : coeur, infini, étoile, fleur ou spirale, d'un seul trait
 *   - mot     : texte balayé colonne par colonne
 *
 * `view` désigne la taille du canvas : { width, height } (px).
 */

/** Figures disponibles */
export const FIGURES = Object.freeze(['heart', 'infinity', 'star', 'flower', 'spiral']);

const TAU = 6.2832;
const WORD_FONT = 'bold 120px "Segoe UI", Arial, sans-serif';
const WORD_STEP = 5;      // pas d'échantillonnage du texte (px)
const WORD_HEIGHT = 160;  // hauteur du canvas de rendu du texte (px)

/** Points échantillonnés de chaque mot déjà rendu */
const wordCache = new Map();

/**
 * Prépare un tracé : longueurs cumulées (en unités de hauteur d'écran).
 * @param {Array<{x: number, y: number, lift: boolean}>} pts points uv
 * @param {{width: number, height: number}} view taille du canvas
 * @param {number} duration durée de référence du tracé (s)
 * @param {number} radius   facteur de rayon des taches
 * @param {number} force    facteur de poussée
 * @param {number} dye      facteur de couleur
 * @returns {?Object} tracé, ou null s'il est vide
 */
export function buildPath(pts, view, duration, radius, force, dye) {
    const aspect = view.width / view.height;
    const cum = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
        if (!pts[i].lift) {
            const dx = (pts[i].x - pts[i - 1].x) * aspect;
            const dy = pts[i].y - pts[i - 1].y;
            total += Math.sqrt(dx * dx + dy * dy);
        }
        cum.push(total);
    }
    if (pts.length < 2 || total <= 0) return null;
    return { pts, cum, total, k: 1, duration, radius, force, dye };
}

/**
 * Position à la distance d le long du tracé. Le parcours est monotone :
 * path.k mémorise le segment atteint pour ne pas tout reparcourir.
 * @returns {{x: number, y: number, lifted: boolean}} lifted : une levée a été franchie
 */
export function pathPos(path, d) {
    const { pts, cum } = path;
    const n = pts.length;
    let k = path.k;
    let lifted = false;
    while (k < n - 1 && cum[k] < d) {
        k++;
        if (pts[k].lift) lifted = true;
    }
    if (pts[k].lift) lifted = true;
    path.k = k;
    const a = pts[k - 1];
    const b = pts[k];
    const len = cum[k] - cum[k - 1];
    const t = len > 0 ? Math.min(1, Math.max(0, (d - cum[k - 1]) / len)) : 1;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, lifted };
}

/** Ruban : courbe sinueuse qui traverse l'écran, dans un sens ou dans l'autre */
export function ribbonPath(view) {
    const pts = [];
    const n = 160;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const y0 = 0.25 + Math.random() * 0.5;
    const amp = 0.08 + Math.random() * 0.12;
    const freq = 1 + Math.random() * 1.5;
    const ph = Math.random() * 6.28;
    const ph2 = Math.random() * 6.28;
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = dir > 0 ? -0.05 + 1.1 * t : 1.05 - 1.1 * t;
        pts.push({
            x,
            y: y0 + amp * Math.sin(TAU * freq * t + ph) + amp * 0.35 * Math.sin(TAU * freq * 2.3 * t + ph2),
            lift: false
        });
    }
    return buildPath(pts, view, 4, 0.8, 1, 1);
}

/** Point d'une figure en [-1, 1], centrée à l'écran, converti en uv (proportions gardées) */
function figureToUv(view, X, Y, scale) {
    const m = Math.min(view.width, view.height) * scale;
    return { x: 0.5 + X * m / view.width, y: 0.5 + Y * m / view.height, lift: false };
}

/** Point de la figure name à l'avancement t (0 à 1) */
function figurePoint(view, name, t) {
    if (name === 'heart') {
        const a = t * Math.PI * 2;
        return figureToUv(view, Math.pow(Math.sin(a), 3) * 16 / 17,
            (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17 + 0.15, 0.3);
    }
    if (name === 'infinity') {
        const a = t * Math.PI * 2;
        const d = 1 + Math.sin(a) * Math.sin(a);
        return figureToUv(view, 1.3 * Math.cos(a) / d, 1.3 * Math.sin(a) * Math.cos(a) / d, 0.3);
    }
    if (name === 'star') {
        /* étoile à 5 branches : 10 sommets alternant grand / petit rayon */
        let f = t * 10;
        const k = Math.min(9, Math.floor(f));
        f -= k;
        const va = Math.PI / 2 + k * Math.PI / 5;
        const vb = va + Math.PI / 5;
        const ra = k % 2 ? 0.42 : 1;
        const rb = k % 2 ? 1 : 0.42;
        return figureToUv(view, Math.cos(va) * ra * (1 - f) + Math.cos(vb) * rb * f,
            Math.sin(va) * ra * (1 - f) + Math.sin(vb) * rb * f, 0.32);
    }
    if (name === 'flower') {
        const a = t * Math.PI;
        const r = Math.cos(5 * a);
        return figureToUv(view, r * Math.cos(a + Math.PI / 2), r * Math.sin(a + Math.PI / 2), 0.32);
    }
    /* spirale */
    const a = t * Math.PI * 6;
    return figureToUv(view, t * Math.cos(a), t * Math.sin(a), 0.32);
}

/** Figure tracée d'un seul trait au centre de l'écran */
export function figurePath(view, name) {
    const pts = [];
    const n = 240;
    for (let i = 0; i <= n; i++) pts.push(figurePoint(view, name, i / n));
    return buildPath(pts, view, name === 'spiral' ? 5 : 4.5, 0.6, 0.6, 1);
}

/**
 * Points d'un mot : texte dessiné sur un canvas 2D hors écran puis
 * échantillonné colonne par colonne, en aller-retour comme un balayage.
 * @returns {?{pts: Array, w: number, h: number}} null si le canvas est illisible
 */
function wordPoints(word) {
    if (wordCache.has(word)) return wordCache.get(word);
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.font = WORD_FONT;
    const tw = Math.ceil(ctx.measureText(word).width) + 24;
    const th = WORD_HEIGHT;
    c.width = tw;
    c.height = th;
    ctx.font = WORD_FONT;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, tw / 2, th / 2);
    let data;
    try {
        data = ctx.getImageData(0, 0, tw, th).data;
    } catch (err) {
        return null;
    }
    const pts = [];
    const half = Math.floor(WORD_STEP / 2);
    let flip = false;
    let prev = null;
    for (let x = half; x < tw; x += WORD_STEP) {
        const col = [];
        for (let y = half; y < th; y += WORD_STEP) {
            if (data[(y * tw + x) * 4 + 3] > 128) col.push(y);
        }
        if (!col.length) continue;
        if (flip) col.reverse();
        flip = !flip;
        col.forEach((y) => {
            const p = { x, y, lift: false };
            if (prev && (Math.abs(p.x - prev.x) > WORD_STEP * 1.5 || Math.abs(p.y - prev.y) > WORD_STEP * 1.5)) p.lift = true;
            pts.push(p);
            prev = p;
        });
    }
    const result = { pts, w: tw, h: th };
    wordCache.set(word, result);
    return result;
}

/** Mot écrit au centre de l'écran ; null si le mot ne peut pas être rendu */
export function wordPath(view, word) {
    const wp = wordPoints(word);
    if (!wp || wp.pts.length < 2) return null;
    const s = Math.min(0.8 * view.width / wp.w, 0.45 * view.height / wp.h);
    const pts = wp.pts.map((q) => ({
        x: 0.5 + (q.x - wp.w / 2) * s / view.width,
        y: 0.5 - (q.y - wp.h / 2) * s / view.height,
        lift: q.lift
    }));
    /* petit rayon et presque pas de poussée : le mot doit rester lisible */
    return buildPath(pts, view, 5, 0.1, 0.04, 1.3);
}
