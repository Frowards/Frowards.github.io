/**
 * Pet - le petit dragon de Pierre.
 *
 * Il vole à son épaule, fait la fête avec lui, crache du feu quand Pierre
 * montre la bulle de contact, tourne autour de sa tête quand il est sonné et
 * joue à la pomme (FetchGame). Il disparaît pendant le feu de camp et la
 * sieste : il est alors déjà dessiné sur les images de Pierre.
 *
 * Son pivot (scene.pet) suit sa cible avec un amorti exponentiel : plus k est
 * grand, plus il la rejoint vite.
 */
import { el } from '../../utils/dom.js';
import SpriteAnimator from './SpriteAnimator.js';
import Pierre from './Pierre.js';
import FetchGame from './FetchGame.js';
import { PET_ANIMS, PET_HIDDEN_DURING, WAVE_POINT_FRAME } from './anims.js';
import { DRAGON_SHEET, LANDMARKS, cellOffset } from './sprites.js';
import { scene, viewportWidth, cellWidth, cellHeight, landmark } from './scene.js';

/** Plans du dragon : devant ou derrière Pierre (z-index de .mascot : 315) */
const Z_FRONT = '317';
const Z_BEHIND = '314';

/** Durée du souffle de feu : l'animation entière, plus une courte marge (s) */
const BREATH_TIME = PET_ANIMS.breath.f.length / PET_ANIMS.breath.fps + 0.15;

const animator = new SpriteAnimator(PET_ANIMS, 'fly', 'fly');
let petEl = null;
let petSprite = null;
let time = 0;            // horloge du flottement (s)
let orbit = 0;           // angle autour de la tête de Pierre sonné (rad)
let breath = 0;          // temps de souffle restant (s)
let pointing = false;    // Pierre tendait déjà le doigt à l'image précédente

/** Cible du dragon selon ce que fait Pierre : { x, y, k, front } */
function chooseTarget(dt, goal) {
    if (breath > 0) {
        const front = landmark(LANDMARKS.front);
        return { x: front.x, y: front.y, k: 14, front: true };
    }
    if (goal) return { x: goal.x, y: goal.y, k: goal.k, front: true };
    if (scene.state === 'stun') {
        /* Sonné : il tourne autour de la tête, étourdi lui aussi */
        animator.ensure('dizzy');
        orbit += dt * 3.2;
        const head = landmark(LANDMARKS.head);
        return {
            x: head.x + Math.cos(orbit) * cellWidth() * 0.42,
            y: head.y - cellHeight() * 0.28 + Math.sin(orbit) * cellHeight() * 0.08,
            k: 12,
            front: Math.sin(orbit) > 0
        };
    }
    const rest = landmark(LANDMARKS.pet);
    if (!FetchGame.active) animator.ensure(Pierre.anim === 'celebrate' ? 'happy' : 'fly');
    return { x: rest.x, y: rest.y + Math.sin(time * 2.6) * 4, k: 5, front: true };
}

/**
 * Affiche le dragon. Sa case (139 px de large, dont souvent un tiers
 * seulement est dessiné) est rognée à la largeur de l'écran : l'image ne
 * bouge pas, mais l'élément ne déborde jamais sur les côtés.
 */
function render(front) {
    const pw = DRAGON_SHEET.w * scene.scale;
    const ph = DRAGON_SHEET.h * scene.scale;
    const { pivot } = DRAGON_SHEET;
    const { pet } = scene;
    const mirrored = pet.dir ? pet.dir < 0 : scene.dir < 0;
    const left = Math.round(pet.x - (mirrored ? 1 - pivot.x : pivot.x) * pw);
    const top = Math.round(pet.y - pivot.y * ph);

    /* Partie de la case visible à l'écran, et largeur rognée de chaque côté */
    const start = Math.max(left, 0);
    const end = Math.max(start, Math.min(left + pw, viewportWidth()));
    const cutLeft = start - left;
    const cutRight = left + pw - end;
    /* Retourné (scaleX(-1)), le côté droit de l'écran montre le début de l'image */
    const skip = mirrored ? cutRight : cutLeft;

    const offset = cellOffset(animator.cell, DRAGON_SHEET.cols, pw, ph);
    petEl.style.transform = `translate(${start}px,${top}px)`;
    petEl.style.zIndex = front ? Z_FRONT : Z_BEHIND;
    petSprite.style.width = `${end - start}px`;
    petSprite.style.backgroundPosition = `${offset.x - skip}px ${offset.y}px`;
    petSprite.style.transform = mirrored ? 'scaleX(-1)' : '';
}

const Pet = {
    /** Crée l'élément du dragon (.mascot-pet) et l'ajoute à la page */
    mount() {
        time = Math.random() * 6;
        petEl = el('div', { className: 'mascot-pet', 'aria-hidden': 'true' });
        petSprite = el('div', { className: 'mascot-pet__sprite' });
        petSprite.style.backgroundImage = `url("${DRAGON_SHEET.src}")`;
        petEl.appendChild(petSprite);
        /* Caché jusqu'à sa première image placée (update) : sinon il apparaît
           un instant en haut à gauche, avant l'entrée en scène de Pierre */
        petEl.hidden = true;
        document.body.appendChild(petEl);
    },

    /** Cache le dragon ; il réapparaît à sa prochaine image placée (update) */
    show(on) {
        if (!on) petEl.hidden = true;
    },

    /** Fait vivre le dragon pendant dt secondes, puis l'affiche (et la pomme) */
    update(dt) {
        time += dt;
        const tucked = PET_HIDDEN_DURING.includes(Pierre.anim);
        petEl.hidden = tucked || !scene.visible;

        /* Souffle de feu quand Pierre tend le doigt vers la bulle */
        const point = Pierre.anim === 'wave' && Pierre.frame === WAVE_POINT_FRAME;
        if (point && !pointing) {
            breath = BREATH_TIME;
            animator.play('breath');
        }
        pointing = point;
        if (breath > 0) breath -= dt;

        const goal = FetchGame.steer(dt);
        if (goal) animator.ensure(goal.anim);
        const target = chooseTarget(dt, goal);
        if (breath > 0) animator.ensure('breath');

        const { pet } = scene;
        if (tucked || pet.x === null) {
            pet.x = target.x;
            pet.y = target.y;
        } else {
            const follow = 1 - Math.exp(-target.k * dt);
            pet.x += (target.x - pet.x) * follow;
            pet.y += (target.y - pet.y) * follow;
        }
        animator.update(dt);

        if (petEl.hidden) return;
        render(target.front);
        FetchGame.render();
    },

    /** Adapte le dragon à l'échelle courante */
    resize() {
        const pw = DRAGON_SHEET.w * scene.scale;
        const { style } = petSprite;
        style.width = `${pw}px`;
        style.height = `${DRAGON_SHEET.h * scene.scale}px`;
        style.backgroundSize = `${DRAGON_SHEET.cols * pw}px auto`;
    }
};

export default Pet;
