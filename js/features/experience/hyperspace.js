/**
 * Hyperspace - traînées d'étoiles du lancement Spatial (« C'est parti »).
 *
 * Canvas plein écran dans le calque de transition : les étoiles sont
 * réparties du centre jusqu'aux bords dès la première image, puis
 * s'étirent en traînées qui filent vers les bords de plus en plus vite
 * (comme les sauts de la visite, features/tour/space/Starfield.js).
 * Une étoile sortie de l'écran repart près du centre.
 *
 * Utilisation : const stop = startHyperspace(canvas, { light, duration });
 * puis stop() quand le calque est retiré.
 */

const STAR_COUNT = 260;
const MAX_DPR = 1.5;
/** Vitesse radiale (part du rayon par seconde) au départ et au sommet */
const SPEED_START = 0.25;
const SPEED_PEAK = 3.2;
/** Longueur des traînées (part de la distance au centre) au départ et au sommet */
const TAIL_START = 0.03;
const TAIL_PEAK = 0.75;
/** Rayon de départ minimal d'une étoile recyclée (part du rayon) */
const RESPAWN_MIN = 0.02;
const RESPAWN_MAX = 0.25;

const DARK_COLORS = ['190, 245, 255', '210, 180, 255', '255, 255, 255'];
const LIGHT_COLORS = ['60, 72, 96', '120, 96, 80', '30, 40, 60'];

/** Accélération douce (lente au départ, rapide à la fin) */
const ease = (p) => p * p * (3 - 2 * p);

/**
 * Lance l'animation dans le canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {{ light?: boolean, duration: number }} options durée de l'accélération (ms)
 * @returns {() => void} arrêt de l'animation
 */
export function startHyperspace(canvas, { light = false, duration }) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.hypot(cx, cy);   // du centre au coin de l'écran
    const colors = light ? LIGHT_COLORS : DARK_COLORS;

    /* Réparties jusqu'aux bords dès le départ (racine : densité uniforme) */
    const stars = Array.from({ length: STAR_COUNT }, () => ({
        angle: Math.random() * Math.PI * 2,
        r: Math.sqrt(Math.random()) * radius,
        width: 0.6 + Math.random() * 1.4,
        color: colors[Math.floor(Math.random() * colors.length)]
    }));

    const start = performance.now();
    let last = start;
    let raf = 0;

    const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const p = ease(Math.min(1, (now - start) / duration));
        const speed = SPEED_START + (SPEED_PEAK - SPEED_START) * p;
        const tail = TAIL_START + (TAIL_PEAK - TAIL_START) * p;

        ctx.clearRect(0, 0, w, h);
        stars.forEach((star) => {
            /* Plus une étoile est loin du centre, plus elle file (perspective) */
            star.r += (star.r + radius * 0.04) * speed * dt;
            if (star.r * (1 - tail) > radius) {
                star.r = (RESPAWN_MIN + Math.random() * (RESPAWN_MAX - RESPAWN_MIN)) * radius;
            }
            const cos = Math.cos(star.angle);
            const sin = Math.sin(star.angle);
            const inner = star.r * (1 - tail);
            const alpha = Math.min(1, 0.25 + star.r / radius);
            ctx.strokeStyle = `rgba(${star.color}, ${alpha.toFixed(2)})`;
            ctx.lineWidth = star.width * (0.6 + star.r / radius);
            ctx.beginPath();
            ctx.moveTo(cx + cos * inner, cy + sin * inner);
            ctx.lineTo(cx + cos * (star.r + 0.6), cy + sin * (star.r + 0.6));
            ctx.stroke();
        });
        raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
}
