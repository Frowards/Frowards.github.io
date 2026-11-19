/**
 * Dessin du champ d'astéroïdes (ciel étoilé en mode clair) : poussière
 * fine et rochers qui grossissent et tournent en approchant. Pendant un
 * saut (vitesse élevée), chaque corps laisse une traînée depuis sa
 * position précédente.
 */

const TAU = 6.2832;

/** Couleur de la poussière (rgb) */
const DUST_RGB = '70, 82, 104';

/** Taille maximale d'un rocher à l'écran (px) */
const MAX_ROCK_RADIUS = 70;

/**
 * Rocher irrégulier : contour à rayons variables, face éclairée et cratère.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} body  corps céleste (voir bodies.js)
 */
function drawRock(ctx, body, x, y, radius) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.rot);
    const n = body.shape.length;
    ctx.beginPath();
    body.shape.forEach((factor, i) => {
        const angle = i / n * TAU;
        const rr = radius * factor;
        if (i === 0) ctx.moveTo(Math.cos(angle) * rr, Math.sin(angle) * rr);
        else ctx.lineTo(Math.cos(angle) * rr, Math.sin(angle) * rr);
    });
    ctx.closePath();
    ctx.fillStyle = `rgb(${body.rock})`;
    ctx.fill();
    /* relief : face éclairée et cratère */
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath(); ctx.arc(-radius * 0.25, -radius * 0.25, radius * 0.45, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(40, 40, 50, 0.22)';
    ctx.beginPath(); ctx.arc(radius * 0.25, radius * 0.15, radius * 0.18, 0, TAU); ctx.fill();
    ctx.restore();
}

/** Grain de poussière : point, ou trait pendant un saut */
function drawDust(ctx, view) {
    const color = `rgba(${DUST_RGB},${0.25 + view.alpha * 0.6})`;
    if (view.streak) {
        ctx.strokeStyle = color;
        ctx.lineWidth = view.radius * 0.8;
        ctx.beginPath(); ctx.moveTo(view.fromX, view.fromY); ctx.lineTo(view.x, view.y); ctx.stroke();
    } else {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(view.x, view.y, view.radius * 0.8, 0, TAU); ctx.fill();
    }
}

/**
 * Dessine un corps du champ d'astéroïdes.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} body  corps céleste (sa rotation avance de dt)
 * @param {object} view  projection à l'écran : x, y (position), fromX, fromY
 *                       (position précédente), alpha, radius, streak (saut),
 *                       scale (échelle de l'écran), dt (secondes écoulées)
 */
export function drawAsteroidBody(ctx, body, view) {
    body.rot += body.vr * view.dt;
    if (body.dust) {
        drawDust(ctx, view);
        return;
    }
    const radius = Math.min(MAX_ROCK_RADIUS, body.size * Math.pow(1 - body.z, 1.7) * view.scale + 0.6);
    ctx.globalAlpha = Math.min(1, 0.4 + view.alpha);
    if (view.streak) {
        ctx.strokeStyle = 'rgba(120, 130, 150, 0.35)';
        ctx.lineWidth = radius * 0.9;
        ctx.beginPath(); ctx.moveTo(view.fromX, view.fromY); ctx.lineTo(view.x, view.y); ctx.stroke();
    }
    drawRock(ctx, body, view.x, view.y, radius);
    ctx.globalAlpha = 1;
}
