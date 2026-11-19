/**
 * ProjectFlow - frise des projets : placement du virage et impulsion lumineuse.
 *
 * Le virage (.pj-turn, demi-cercle à droite) relie la ligne de la rangée 1
 * à celle de la rangée 2 ; leurs hauteurs dépendant du contenu (langue,
 * largeur), il est positionné en JS et recalculé à chaque changement.
 *
 * Sauf si l'utilisateur préfère réduire les animations, un canvas .pj-flow
 * est inséré en tête de la frise : toutes les PULSE_EVERY secondes, une
 * onde « lumière du soleil » parcourt le trait jusqu'à la flèche et
 * embrase les jalons (.pj-dot) au passage. En pause hors écran.
 *
 * Balisage attendu : .pj-road > .pj-row (x2), .pj-turn, .pj-dot
 */
import Lang from '../../core/Lang.js';
import { prefersReducedMotion } from '../../utils/motion.js';
import { buildTrack, milestoneDistance } from './track.js';
import { drawPulse, PULSE_LENGTH } from './pulse.js';

const PULSE_EVERY = 3.2;   // s entre deux départs d'impulsion

let road = null;
let canvas = null;
let ctx = null;
let track = null;          // tracé courant (null tant que la frise n'est pas mesurée)
let milestones = [];       // jalons { x, y, d }
let pulses = [];           // impulsions en cours { d, speed }
let visible = true;
let lastT = 0;
let spawnTimer = 0;

/** Canvas à la taille de la frise, à la résolution de l'écran (dpr plafonné à 2) */
function sizeCanvas(width, height) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/** Centre de chaque jalon dans le repère de la frise, avec son abscisse curviligne */
function measureMilestones() {
    const roadRect = road.getBoundingClientRect();
    return Array.from(road.querySelectorAll('.pj-dot'), (dot) => {
        const r = dot.getBoundingClientRect();
        const x = r.left + r.width / 2 - roadRect.left;
        const y = r.top + r.height / 2 - roadRect.top;
        return { x, y, d: milestoneDistance(track, x, y) };
    });
}

/**
 * Recalcule le virage ET le tracé suivi par l'impulsion
 * (ligne 1 -> demi-cercle -> ligne 2 vers la flèche ; vertical en mobile).
 */
function layout() {
    if (!road) return;
    const turn = road.querySelector('.pj-turn');
    const rows = road.querySelectorAll('.pj-row');
    if (!turn || rows.length < 2) return;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const lineOffset = 0.5 * rem + 1;
    const width = road.clientWidth;
    const height = road.clientHeight;

    if (canvas) sizeCanvas(width, height);

    const vertical = getComputedStyle(turn).display === 'none';
    let y1 = 0;
    let y2 = 0;
    if (!vertical) {
        y1 = rows[0].offsetTop + lineOffset;
        y2 = rows[1].offsetTop + lineOffset;
        turn.style.top = `${y1 - 1}px`;
        turn.style.height = `${y2 - y1 + 2}px`;
    }
    track = buildTrack({ width, height, rem, vertical, y1, y2 });
    milestones = measureMilestones();
}

/* ---------- Boucle ---------- */

function step(now) {
    requestAnimationFrame(step);
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    if (!track || document.hidden || !visible) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Une impulsion part du début toutes les PULSE_EVERY s... */
    spawnTimer += dt;
    if (spawnTimer >= PULSE_EVERY) {
        spawnTimer = 0;
        pulses.push({ d: 0, speed: 170 + Math.random() * 40 });
    }

    ctx.lineCap = 'round';
    for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.d += p.speed * dt;
        /* ...et s'éteint une fois la flèche atteinte (queue comprise) */
        if (p.d - PULSE_LENGTH > track.total) {
            pulses.splice(i, 1);
            continue;
        }
        drawPulse(ctx, track, milestones, p.d);
    }
}

/** Crée le canvas de l'impulsion et lance l'animation */
function startPulse() {
    canvas = document.createElement('canvas');
    canvas.className = 'pj-flow';
    canvas.setAttribute('aria-hidden', 'true');
    road.insertBefore(canvas, road.firstChild);
    ctx = canvas.getContext('2d');
    /* Première impulsion immédiate au premier passage de la boucle */
    spawnTimer = PULSE_EVERY;
    layout();
    if (window.IntersectionObserver) {
        new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
        }, { rootMargin: '60px' }).observe(road);
    }
    lastT = performance.now();
    requestAnimationFrame(step);
}

/** Branche la frise (sans effet si .pj-road est absente) */
function init() {
    road = document.querySelector('.pj-road');
    if (!road) return;
    layout();
    window.addEventListener('resize', layout);
    Lang.onChange(() => layout());
    if (window.ResizeObserver) new ResizeObserver(() => layout()).observe(road);
    if (!prefersReducedMotion()) startPulse();
}

export default { init };
