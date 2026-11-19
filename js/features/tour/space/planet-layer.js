/**
 * Décor du ciel étoilé en mode clair, dessiné une fois par taille d'écran
 * dans un canvas hors écran (cache) : horizon d'une immense planète bleu
 * clair vue depuis l'orbite (liseré d'atmosphère, nuages diffus, ombre du
 * terminateur) et, au loin, une petite planète à anneaux.
 */

const TAU = 6.2832;

/** Bandes de nuages : [décalage vertical, épaisseur, opacité] (en rayons) */
const CLOUD_BANDS = [[-0.86, 0.05, 0.22], [-0.8, 0.035, 0.16], [-0.74, 0.05, 0.12], [-0.9, 0.025, 0.18]];

let cache = null;
let cacheKey = '';

/** Halo d'atmosphère autour de la grande planète */
function drawHalo(c, w, h, px, py, R) {
    const halo = c.createRadialGradient(px, py, R * 0.97, px, py, R * 1.13);
    halo.addColorStop(0, 'rgba(170, 215, 255, 0.75)');
    halo.addColorStop(0.35, 'rgba(190, 225, 255, 0.35)');
    halo.addColorStop(1, 'rgba(200, 230, 255, 0)');
    c.fillStyle = halo;
    c.fillRect(0, 0, w, h);
}

/** Corps de la grande planète, éclairé par le haut à gauche */
function drawBody(c, px, py, R) {
    const g = c.createRadialGradient(px - R * 0.25, py - R * 0.95, R * 0.05, px, py, R);
    g.addColorStop(0, '#f6fbff');
    g.addColorStop(0.35, '#cfe6f6');
    g.addColorStop(0.7, '#8fbfe0');
    g.addColorStop(1, '#5d8fbd');
    c.fillStyle = g;
    c.beginPath(); c.arc(px, py, R, 0, TAU); c.fill();
}

/** Nuages diffus et ombre du terminateur, limités au disque de la planète */
function drawSurface(c, w, h, px, py, R) {
    c.save();
    c.beginPath(); c.arc(px, py, R, 0, TAU); c.clip();
    c.filter = `blur(${Math.round(R * 0.012)}px)`;
    CLOUD_BANDS.forEach(([offset, thickness, alpha], i) => {
        c.fillStyle = `rgba(255, 255, 255,${alpha})`;
        c.beginPath();
        c.ellipse(px + (i - 1.5) * R * 0.18, py + offset * R, R * 0.75, R * thickness, -0.04 + i * 0.02, 0, TAU);
        c.fill();
    });
    c.filter = 'none';
    /* ombre du terminateur (côté opposé à la lumière) */
    const shadow = c.createLinearGradient(px - R * 0.3, py - R, px + R * 0.6, py - R * 0.6);
    shadow.addColorStop(0, 'rgba(30, 50, 90, 0)');
    shadow.addColorStop(1, 'rgba(30, 50, 90, 0.35)');
    c.fillStyle = shadow;
    c.fillRect(0, 0, w, h);
    c.restore();
}

/** Liseré lumineux de l'horizon */
function drawRim(c, px, py, R) {
    c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    c.lineWidth = Math.max(1.5, R * 0.0025);
    c.beginPath(); c.arc(px, py, R, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
}

/** Petite planète à anneaux, au loin (anneau arrière, sphère, anneau avant) */
function drawRingedPlanet(c, w, h) {
    const r = Math.min(w, h) * 0.045;
    const qx = w * 0.16;
    const qy = h * 0.2;
    c.lineWidth = r * 0.18;
    c.strokeStyle = 'rgba(150, 140, 200, 0.35)';
    c.beginPath(); c.ellipse(qx, qy, r * 2.1, r * 0.5, -0.4, Math.PI, Math.PI * 2); c.stroke();
    const g = c.createRadialGradient(qx - r * 0.4, qy - r * 0.4, r * 0.1, qx, qy, r);
    g.addColorStop(0, '#f3effc');
    g.addColorStop(1, '#a99cd6');
    c.fillStyle = g;
    c.beginPath(); c.arc(qx, qy, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(170, 160, 220, 0.6)';
    c.beginPath(); c.ellipse(qx, qy, r * 2.1, r * 0.5, -0.4, 0, Math.PI); c.stroke();
}

/**
 * Canvas du décor pour un écran w x h (redessiné seulement si la taille change).
 * @returns {HTMLCanvasElement}
 */
export function planetLayer(w, h) {
    const key = `${w}x${h}`;
    if (cache && cacheKey === key) return cache;
    cacheKey = key;
    cache = cache || document.createElement('canvas');
    cache.width = w;
    cache.height = h;
    const c = cache.getContext('2d');
    c.clearRect(0, 0, w, h);
    const R = Math.max(w, h) * 0.95;
    const px = w * 0.6;
    const py = h + R * 0.74;
    drawHalo(c, w, h, px, py, R);
    drawBody(c, px, py, R);
    drawSurface(c, w, h, px, py, R);
    drawRim(c, px, py, R);
    drawRingedPlanet(c, w, h);
    return cache;
}
