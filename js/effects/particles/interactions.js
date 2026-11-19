/**
 * interactions - réaction des particules au pointeur de la souris
 * (calquées sur les MOUSE_INTERACTIONS de Ceres).
 *
 * Modes : default (l'effet décide), none, repulse, attract, grab (toile),
 * bubble (loupe), blackhole (aspiration puis absorption).
 * Les effets sans particules (hexgrid, coderain, fluid, off) gardent leur
 * comportement natif : le choix d'interaction ne les concerne pas.
 */
import { rnd, rgba } from './helpers.js';

/** Interactions proposées à l'utilisateur */
export const INTERACTIONS = Object.freeze(['default', 'none', 'repulse', 'attract', 'grab', 'bubble', 'blackhole']);

/** Effets sans particules : le choix d'interaction n'a pas de sens (Ceres : noInteraction) */
export const NO_INTERACTION = Object.freeze(['hexgrid', 'coderain', 'fluid', 'off']);

/** Interaction native de chaque effet quand le choix est 'default' (configs Ceres) */
const NATIVE = Object.freeze({
    default: 'grab', snow: 'repulse', flakes: 'repulse', stars: 'bubble',
    bubbles: 'repulse', fireflies: 'none', confetti: 'repulse',
    halloween: 'attract', easter: 'attract', ribbons: 'repulse',
    hexgrid: 'none', coderain: 'none', fluid: 'none', off: 'none'
});

/* Portées (px) et intensités de chaque mode */
const REPULSE_RADIUS = 110;
const ATTRACT_RADIUS = 170;
const BLACKHOLE_RADIUS = 350;
const BLACKHOLE_CORE = 16;
const BUBBLE_RADIUS = 140;
const GRAB_RADIUS = 170;

/**
 * Mode d'interaction effectif pour un effet.
 * @param {string} effect effet affiché
 * @param {string} choice interaction choisie (INTERACTIONS)
 * @returns {string} mode appliqué ('none' si l'effet n'a pas de particules)
 */
export function resolveMode(effect, choice) {
    if (NO_INTERACTION.includes(effect)) return 'none';
    return choice === 'default' ? (NATIVE[effect] || 'none') : choice;
}

/**
 * Applique la force du mode à une particule {x, y} (modifiée sur place).
 * @param {{x: number, y: number}} p particule
 * @param {string} mode   mode effectif (resolveMode)
 * @param {{x: number, y: number}} mouse position du pointeur
 * @param {number} width  largeur du canvas
 * @param {number} height hauteur du canvas
 * @returns {number} facteur de taille (le mode bubble grossit près du curseur)
 */
export function applyForce(p, mode, mouse, width, height) {
    if (mode === 'none' || mode === 'grab') return 1;
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
    if (mode === 'repulse') {
        if (d < REPULSE_RADIUS) {
            const f = (1 - d / REPULSE_RADIUS) * 3;
            p.x += dx / d * f;
            p.y += dy / d * f;
        }
    } else if (mode === 'attract') {
        if (d < ATTRACT_RADIUS) {
            const f = (1 - d / ATTRACT_RADIUS) * 1.6;
            p.x -= dx / d * f;
            p.y -= dy / d * f;
        }
    } else if (mode === 'blackhole') {
        /* Aspiration douce puis absorption : ce qui touche le curseur
           réapparaît ailleurs (comme ceresBlackhole) */
        if (d < BLACKHOLE_RADIUS) {
            const f = 1 - d / BLACKHOLE_RADIUS;
            const pull = 0.3 + f * f * 7;
            p.x -= dx / d * pull;
            p.y -= dy / d * pull;
            if (d < BLACKHOLE_CORE) {
                p.x = rnd(0, width);
                p.y = rnd(0, height);
            }
        }
    } else if (mode === 'bubble') {
        if (d < BUBBLE_RADIUS) return 1 + (1 - d / BUBBLE_RADIUS) * 1.8;
    }
    return 1;
}

/**
 * Mode toile (grab) : relie le curseur aux particules proches.
 * @param {CanvasRenderingContext2D} ctx contexte de dessin
 * @param {Array<{x: number, y: number}>} parts particules
 * @param {{x: number, y: number}} mouse position du pointeur
 * @param {string} rgb couleur d'accent "r, g, b"
 */
export function drawGrabLines(ctx, parts, mouse, rgb) {
    ctx.lineWidth = 1;
    parts.forEach((p) => {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < GRAB_RADIUS) {
            ctx.strokeStyle = rgba(rgb, (0.45 * (1 - d / GRAB_RADIUS)).toFixed(3));
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }
    });
}

/**
 * Suit la position du pointeur dans l'objet mouse (coordonnées écran).
 * Hors de la fenêtre, le pointeur est envoyé très loin : plus aucune force.
 * @param {{x: number, y: number}} mouse objet mis à jour en continu
 */
export function trackPointer(mouse) {
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });
}
