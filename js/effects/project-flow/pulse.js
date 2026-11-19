/**
 * pulse - dessin d'une impulsion lumineuse le long du tracé de la frise :
 * le trait lui-même s'illumine (tête blanc chaud, queue dorée qui
 * s'estompe ; aucun point ne vole au-dessus de la ligne) et les jalons
 * s'embrasent à son passage.
 */
import { pointAt } from './track.js';
import { SUN_CORE, SUN_GLOW, sunRgba } from '../sunlight.js';

/** Longueur de l'onde lumineuse (px le long du trait) */
export const PULSE_LENGTH = 110;
/** Pas de découpe de l'onde en petits segments (px) */
const STEP = 6;
const SEGMENTS = Math.ceil(PULSE_LENGTH / STEP);
/** Portée de l'embrasement d'un jalon autour de la tête (px) */
const MILESTONE_RANGE = 55;

/** L'onde : segments de plus en plus fins et pâles de la tête à la queue */
function drawWave(ctx, track, head) {
    let prev = null;
    for (let k = 0; k <= SEGMENTS; k++) {
        const d = head - k * STEP;
        if (d < 0 || d > track.total) {
            prev = null;
            continue;
        }
        const pt = pointAt(track, d);
        if (prev) {
            const t = k / SEGMENTS;   // 0 = tête, 1 = queue
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(pt.x, pt.y);
            ctx.strokeStyle = k <= 2
                ? sunRgba(SUN_CORE, 0.95 * (1 - t))
                : sunRgba(SUN_GLOW, 0.8 * (1 - t));
            ctx.lineWidth = 2.6 * (1 - t) + 0.5;
            ctx.stroke();
        }
        prev = pt;
    }
}

/** Halo doux sur la tête de l'onde */
function drawHead(ctx, track, head) {
    if (head < 0 || head > track.total) return;
    const p = pointAt(track, head);
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = sunRgba(SUN_GLOW, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = sunRgba(SUN_CORE, 0.95);
    ctx.fill();
    ctx.restore();
}

/** Les jalons proches de la tête s'embrasent */
function drawMilestones(ctx, milestones, head) {
    milestones.forEach((dot) => {
        const dist = Math.abs(head - dot.d);
        if (dist > MILESTONE_RANGE) return;
        const glow = 1 - dist / MILESTONE_RANGE;
        ctx.save();
        ctx.shadowBlur = 14 * glow;
        ctx.shadowColor = sunRgba(SUN_GLOW, 0.85 * glow);
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 4.5 + 2 * glow, 0, Math.PI * 2);
        ctx.fillStyle = sunRgba(SUN_CORE, 0.5 * glow);
        ctx.fill();
        ctx.restore();
    });
}

/**
 * Dessine une impulsion dont la tête est à la distance head du départ.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} track tracé (buildTrack)
 * @param {Array<{x: number, y: number, d: number}>} milestones jalons
 * @param {number} head position de la tête (px le long du tracé)
 */
export function drawPulse(ctx, track, milestones, head) {
    drawWave(ctx, track, head);
    drawHead(ctx, track, head);
    drawMilestones(ctx, milestones, head);
}
