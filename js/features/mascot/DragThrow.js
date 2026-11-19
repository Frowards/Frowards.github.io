/**
 * DragThrow - attraper et lancer Pierre.
 *
 * On le saisit à la souris ou au doigt : au-delà de quelques pixels de
 * déplacement, il pend au pointeur. Lâché avec élan, il part avec la vitesse
 * du geste, rebondit sur les bords de l'écran et reste sonné s'il tombe de
 * haut. Un simple clic, sans déplacement, ouvre ou ferme la bulle de contact.
 * Désactivé si l'utilisateur préfère réduire les animations.
 */
import { prefersReducedMotion, clamp } from '../../utils/motion.js';
import Pierre from './Pierre.js';
import Behavior from './Behavior.js';
import Bubble from './Bubble.js';
import FetchGame from './FetchGame.js';
import { scene, viewportWidth, cellWidth, cellHeight, cellTop, floorY, maxHeight, randomBetween } from './scene.js';

/** Déplacement du pointeur à partir duquel on attrape Pierre (px) */
const DRAG_THRESHOLD = 5;

/** Lancer : fenêtre de mesure du geste (ms), vitesse minimale et maximales (px/s) */
const THROW_WINDOW = 100;
const THROW_MIN = 140;
const THROW_MAX_VX = 1600;
const THROW_MAX_VY = 1300;

/** Chute : gravité (px/s²) et freinage de l'air (part de vitesse perdue par seconde) */
const GRAVITY = 1800;
const AIR_DRAG = 0.5;

/** Atterrissage brutal : vitesse verticale (px/s) ou hauteur de chute (px) */
const HARD_LANDING_SPEED = -900;
const HARD_LANDING_HEIGHT = 220;

let drag = null;         // saisie en cours : { id, sx, sy, offX, offY, moved, samples }

/** Vitesse du lancer d'après les derniers points du geste, ou null si trop lent */
function throwVelocity(samples, event) {
    if (!samples.length) return null;
    const now = performance.now();
    const first = samples[0];
    if (now - first.t > THROW_WINDOW * 1.5) return null;
    const dt = (now - first.t) / 1000;
    if (dt < 0.016) return null;
    const vx = (event.clientX - first.x) / dt;
    const vy = (event.clientY - first.y) / dt;
    if (Math.hypot(vx, vy) < THROW_MIN) return null;
    return { vx: clamp(vx, -THROW_MAX_VX, THROW_MAX_VX), vy: clamp(vy, -THROW_MAX_VY, THROW_MAX_VY) };
}

function onDown(event) {
    if (event.button !== 0 || prefersReducedMotion()) return;
    event.preventDefault();
    scene.el.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, sx: event.clientX, sy: event.clientY, offX: 0, offY: 0, moved: false, samples: [] };
}

function onMove(event) {
    const d = drag;
    if (!d || d.id !== event.pointerId) return;
    if (!d.moved) {
        if (Math.hypot(event.clientX - d.sx, event.clientY - d.sy) < DRAG_THRESHOLD) return;
        /* Saisie : Pierre pend au pointeur, à l'endroit où on l'a pris */
        d.moved = true;
        Bubble.close(false);
        FetchGame.end();
        d.offX = d.sx - scene.x;
        d.offY = d.sy - cellTop();
        scene.state = 'drag';
        scene.el.classList.add('is-dragging');
        Pierre.play('hang');
    }
    scene.x = clamp(event.clientX - d.offX, -cellWidth() * 0.3, viewportWidth() - cellWidth() * 0.7);
    scene.y = clamp(floorY() - cellHeight() - (event.clientY - d.offY), 0, maxHeight());
    const now = performance.now();
    d.samples.push({ t: now, x: event.clientX, y: event.clientY });
    while (d.samples.length > 1 && now - d.samples[0].t > THROW_WINDOW) d.samples.shift();
}

function onUp(event) {
    const d = drag;
    if (!d || d.id !== event.pointerId) return;
    drag = null;
    scene.el.classList.remove('is-dragging');
    if (!d.moved) {
        Bubble.toggle();
        return;
    }
    /* Lâcher : chute libre, avec l'élan du geste s'il y en a un */
    const v = throwVelocity(d.samples, event);
    scene.state = 'fall';
    scene.fallTop = scene.y;
    Pierre.play('fall');
    scene.vx = v ? v.vx : 0;
    scene.vy = v ? -v.vy : 0;                   // écran : y vers le bas ; scène : y vers le haut
    if (v && Math.abs(v.vx) > THROW_MIN) scene.dir = v.vx > 0 ? 1 : -1;
    if (!v && scene.y < 150) Pierre.play('jump');
}

/** Atterrissage : sonné s'il tombe de haut, sinon il reprend sa vie */
function land(now) {
    const hard = scene.vy < HARD_LANDING_SPEED || scene.fallTop > HARD_LANDING_HEIGHT;
    scene.y = 0;
    scene.vx = 0;
    scene.vy = 0;
    if (hard) {
        scene.state = 'stun';
        Pierre.play('stun', () => Behavior.getUp('standUpPlain'));
    } else {
        scene.state = 'idle';
        Pierre.play('stand');
        scene.stateUntil = now + randomBetween(600, 1400);
    }
}

const DragThrow = {
    /** Branche la saisie au pointeur sur l'élément de Pierre */
    bind(target) {
        target.addEventListener('pointerdown', onDown);
        target.addEventListener('pointermove', onMove);
        target.addEventListener('pointerup', onUp);
        target.addEventListener('pointercancel', onUp);
    },

    /**
     * Chute libre de dt secondes : gravité, freinage, rebonds sur les bords
     * et sous l'en-tête, atterrissage au sol.
     * @param {number} dt   temps écoulé (s)
     * @param {number} now  instant courant (ms, horloge de requestAnimationFrame)
     */
    fall(dt, now) {
        scene.vy -= GRAVITY * dt;
        scene.vx *= (1 - AIR_DRAG) ** dt;
        scene.x += scene.vx * dt;
        scene.y += scene.vy * dt;
        const maxX = viewportWidth() - cellWidth();
        if (scene.x < 0) {
            scene.x = 0;
            scene.vx = Math.abs(scene.vx) * 0.5;
        }
        if (scene.x > maxX) {
            scene.x = maxX;
            scene.vx = -Math.abs(scene.vx) * 0.5;
        }
        if (scene.y > maxHeight()) {
            scene.y = maxHeight();
            scene.vy = -Math.abs(scene.vy) * 0.3;
        }
        if (scene.y <= 0) land(now);
    }
};

export default DragThrow;
