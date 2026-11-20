/**
 * Hyperspace - étoiles du Spatial dessinées dans un canvas.
 *
 * Deux usages :
 *   - startHyperspace : traînées du lancement (« C'est parti ») ; les
 *     étoiles, réparties du centre jusqu'aux bords dès la première image,
 *     s'étirent en traînées qui filent vers les bords de plus en plus vite
 *     (comme les sauts de la visite, features/tour/space/Starfield.js) ;
 *   - startCruise : ciel de l'écran d'accueil, étoiles qui avancent
 *     lentement vers le spectateur.
 * Une étoile sortie de l'écran repart près du centre.
 *
 * Un canvas à la taille de l'écran, et non des calques CSS géants agrandis
 * en continu : la carte graphique n'a qu'une petite surface à redessiner
 * (sinon Chrome affiche des tuiles en damier pendant qu'il rattrape).
 *
 * Chaque fonction renvoie stop(), à appeler quand le canvas est retiré.
 */
import { prefersReducedMotion } from '../../utils/motion.js';

const MAX_DPR = 1.5;
/** Rayon de départ d'une étoile recyclée (part du rayon) */
const RESPAWN_MIN = 0.02;
const RESPAWN_MAX = 0.25;

const DARK_COLORS = ['190, 245, 255', '210, 180, 255', '255, 255, 255'];
const LIGHT_COLORS = ['60, 72, 96', '120, 96, 80', '30, 40, 60'];

/** Accélération douce (lente au départ, rapide à la fin) */
const ease = (p) => p * p * (3 - 2 * p);

/**
 * Anime un champ d'étoiles qui fuient depuis le centre.
 * @param {HTMLCanvasElement} canvas
 * @param {object} o
 * @param {boolean} o.light      étoiles foncées (ciel clair)
 * @param {number} o.count       nombre d'étoiles
 * @param {number[]} o.speed     vitesse radiale [départ, sommet] (part du rayon par seconde)
 * @param {number[]} o.tail      longueur des traînées [départ, sommet] (part de la distance au centre)
 * @param {number} o.duration    durée du passage du départ au sommet (ms)
 * @returns {() => void} arrêt de l'animation
 */
function startField(canvas, { light, count, speed, tail, duration }) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    let w = 0;
    let h = 0;
    let radius = 1;
    const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = 'round';
        radius = Math.hypot(w / 2, h / 2) || 1;   // du centre au coin de l'écran
    };
    resize();

    const colors = light ? LIGHT_COLORS : DARK_COLORS;
    /* Réparties jusqu'aux bords dès le départ (racine : densité uniforme) */
    const stars = Array.from({ length: count }, () => ({
        angle: Math.random() * Math.PI * 2,
        r: Math.sqrt(Math.random()),          // part du rayon
        width: 0.6 + Math.random() * 1.4,
        color: colors[Math.floor(Math.random() * colors.length)]
    }));

    const draw = (dt, p) => {
        const v = speed[0] + (speed[1] - speed[0]) * p;
        const k = tail[0] + (tail[1] - tail[0]) * p;
        const cx = w / 2;
        const cy = h / 2;
        ctx.clearRect(0, 0, w, h);
        stars.forEach((star) => {
            /* Plus une étoile est loin du centre, plus elle file (perspective) */
            star.r += (star.r + 0.04) * v * dt;
            if (star.r * (1 - k) > 1) star.r = RESPAWN_MIN + Math.random() * (RESPAWN_MAX - RESPAWN_MIN);
            const r = star.r * radius;
            const inner = r * (1 - k);
            const cos = Math.cos(star.angle);
            const sin = Math.sin(star.angle);
            ctx.strokeStyle = `rgba(${star.color}, ${Math.min(1, 0.25 + star.r).toFixed(2)})`;
            ctx.lineWidth = star.width * (0.6 + star.r);
            ctx.beginPath();
            ctx.moveTo(cx + cos * inner, cy + sin * inner);
            ctx.lineTo(cx + cos * (r + 0.6), cy + sin * (r + 0.6));
            ctx.stroke();
        });
    };

    /* Mouvement réduit : une seule image fixe */
    if (prefersReducedMotion()) {
        draw(0, 0);
        return () => {};
    }
    const start = performance.now();
    let last = start;
    let raf = 0;
    const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        draw(dt, ease(Math.min(1, (now - start) / duration)));
        raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
    };
}

/**
 * Traînées du lancement Spatial : accélération jusqu'au saut.
 * @param {HTMLCanvasElement} canvas
 * @param {{ light?: boolean, duration: number }} options durée de l'accélération (ms)
 */
export function startHyperspace(canvas, { light = false, duration }) {
    return startField(canvas, { light, count: 260, speed: [0.25, 3.2], tail: [0.03, 0.75], duration });
}

/**
 * Ciel de l'écran d'accueil : vitesse de croisière lente, sans traînées.
 * @param {HTMLCanvasElement} canvas
 * @param {{ light?: boolean }} [options]
 */
export function startCruise(canvas, { light = false } = {}) {
    return startField(canvas, { light, count: 220, speed: [0.12, 0.12], tail: [0.004, 0.004], duration: 1 });
}
