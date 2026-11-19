/**
 * Fond du ciel étoilé, dessiné dans le canvas lui-même (et non en arrière-
 * plan CSS du canvas : un navigateur ne le repeint pas toujours quand le
 * mode change, le fond restait alors clair après un passage en sombre).
 *
 *   - sombre : nuit bleutée, halos violet, cyan et rose ;
 *   - clair  : blanc uni (l'inverse du sombre).
 *
 * L'image est préparée une fois par taille et par mode, puis recopiée à
 * chaque image de l'animation.
 */

/** Halos du ciel sombre : centre (x, y), rayons (rx, ry) en fraction de
    l'écran, couleur rgb et opacité au centre */
const GLOWS = [
    { x: 0.25, y: 0.2, rx: 0.6, ry: 0.45, rgb: '90, 40, 170', a: 0.32 },
    { x: 0.8, y: 0.85, rx: 0.55, ry: 0.45, rgb: '0, 140, 190', a: 0.26 },
    { x: 0.7, y: 0.3, rx: 0.35, ry: 0.25, rgb: '255, 62, 165', a: 0.12 }
];
const NIGHT = '#02030a';
const DAY = '#FFFFFF';

let cache = null;
let cacheKey = '';

/** Halo elliptique qui s'efface vers l'extérieur */
function drawGlow(ctx, w, h, glow) {
    ctx.save();
    ctx.translate(glow.x * w, glow.y * h);
    ctx.scale(glow.rx * w, glow.ry * h);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, `rgba(${glow.rgb}, ${glow.a})`);
    gradient.addColorStop(0.7, `rgba(${glow.rgb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
}

/**
 * Image du fond pour une taille d'écran et un mode.
 * @param {number} w largeur (px CSS)
 * @param {number} h hauteur (px CSS)
 * @param {boolean} light mode clair
 * @returns {HTMLCanvasElement}
 */
export function skyLayer(w, h, light) {
    const key = `${w}x${h}:${light ? 'clair' : 'sombre'}`;
    if (cache && cacheKey === key) return cache;
    cache = cache || document.createElement('canvas');
    cache.width = Math.max(1, Math.round(w));
    cache.height = Math.max(1, Math.round(h));
    const ctx = cache.getContext('2d');
    ctx.fillStyle = light ? DAY : NIGHT;
    ctx.fillRect(0, 0, w, h);
    if (!light) GLOWS.forEach((glow) => drawGlow(ctx, w, h, glow));
    cacheKey = key;
    return cache;
}
