/**
 * colors - couleurs injectées dans le fluide (composantes r, g, b dans [0, 1]).
 *
 * Modes de couleur (réglage 'colors') :
 *   random  teinte vive au hasard        pastel  teinte douce au hasard
 *   rainbow arc-en-ciel qui défile       theme   couleur d'accent du site
 *   solid   couleur choisie (réglage 'color')
 */

/** Couleur par défaut du mode 'solid' (accent d'origine du site) */
export const FALLBACK_COLOR = '#06B6D4';

/**
 * Lit une couleur CSS #rgb, #rrggbb(aa) ou rgb(a)().
 * @param {string} value couleur CSS
 * @returns {{r: number, g: number, b: number}|null} null si illisible
 */
export function parseColor(value) {
    const s = (value || '').trim();
    let m = /^#([0-9a-f]{3})$/i.exec(s);
    if (m) {
        const h = m[1];
        return { r: parseInt(h[0] + h[0], 16) / 255, g: parseInt(h[1] + h[1], 16) / 255, b: parseInt(h[2] + h[2], 16) / 255 };
    }
    m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
    if (m) {
        const h = m[1];
        return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
    }
    m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);
    if (m) {
        return { r: Math.min(255, +m[1]) / 255, g: Math.min(255, +m[2]) / 255, b: Math.min(255, +m[3]) / 255 };
    }
    return null;
}

/** Couleur à partir de teinte, saturation et valeur (toutes dans [0, 1]) */
export function hsv(h, s, v) {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (((i % 6) + 6) % 6) {
        case 0: return { r: v, g: t, b: p };
        case 1: return { r: q, g: v, b: p };
        case 2: return { r: p, g: v, b: t };
        case 3: return { r: p, g: q, b: v };
        case 4: return { r: t, g: p, b: v };
        default: return { r: v, g: p, b: q };
    }
}

/** Couleur d'accent du site, relue à chaque appel (le thème peut changer) */
export function themeColor() {
    const cs = getComputedStyle(document.documentElement);
    let c = parseColor(cs.getPropertyValue('--pb-primary'));
    if (!c) {
        const rgb = cs.getPropertyValue('--pb-primary-rgb').trim();
        if (rgb) c = parseColor(`rgb(${rgb})`);
    }
    return c || { r: 6 / 255, g: 182 / 255, b: 212 / 255 };
}

/**
 * Nouvelle couleur selon le mode choisi.
 * @param {{colors: string, color: string}} settings réglages courants
 * @param {number} now horodatage (ms) : fait défiler l'arc-en-ciel
 */
export function pickColor(settings, now) {
    switch (settings.colors) {
        case 'pastel': return hsv(Math.random(), 0.3 + Math.random() * 0.15, 1);
        case 'rainbow': return hsv((now / 8000) % 1, 1, 1);
        case 'theme': return themeColor();
        case 'solid': return parseColor(settings.color) || parseColor(FALLBACK_COLOR);
        default: return hsv(Math.random(), 1, 1);
    }
}

/**
 * Couleur courante d'un émetteur (pointeur ou pinceau) : en aléatoire ou
 * pastel elle change toutes les `period` secondes, sinon elle est
 * recalculée à chaque tache.
 * @param {{color: ?Object, timer: number, mode: string}} owner émetteur (modifié)
 * @param {{colors: string, color: string}} settings réglages courants
 * @param {number} now    horodatage (ms)
 * @param {number} dt     temps écoulé depuis l'image précédente (s)
 * @param {number} period durée de vie d'une couleur (s)
 */
export function colorFor(owner, settings, now, dt, period) {
    if (settings.colors !== 'random' && settings.colors !== 'pastel') return pickColor(settings, now);
    owner.timer -= dt;
    if (!owner.color || owner.timer <= 0 || owner.mode !== settings.colors) {
        owner.color = pickColor(settings, now);
        owner.timer = period;
        owner.mode = settings.colors;
    }
    return owner.color;
}

/** Couleur multipliée par k (dosage de la quantité injectée) */
export function scaleColor(c, k) {
    return { r: c.r * k, g: c.g * k, b: c.b * k };
}
