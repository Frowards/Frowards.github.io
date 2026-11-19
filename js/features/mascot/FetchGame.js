/**
 * FetchGame - le jeu de la pomme rapportée.
 *
 * Assis, Pierre lance la pomme ; le dragon la poursuit, l'attrape dans sa
 * gueule et la rapporte dans sa main. Deux ou trois lancers, puis Pierre se
 * relève. Phases d'un lancer :
 *   hold    Pierre tient la pomme et attend
 *   throw   il la lance (elle part à l'image THROW_RELEASE_FRAME)
 *   chase   le dragon la poursuit, gueule ouverte à l'approche
 *   return  il la rapporte dans la paume de Pierre
 *   give    Pierre la tient un instant, puis relance ou arrête (done)
 *
 * Le module pilote aussi la pomme (physique et affichage) ; le dragon lui
 * demande à chaque image où aller (steer).
 */
import { el } from '../../utils/dom.js';
import { clamp } from '../../utils/motion.js';
import Pierre from './Pierre.js';
import { PIERRE_ANIMS, THROW_RELEASE_FRAME } from './anims.js';
import { DRAGON_SHEET, LANDMARKS, PET_MOUTH, TOY, cellOffset } from './sprites.js';
import { scene, viewportWidth, floorY, landmark, randomBetween } from './scene.js';

/** Physique de la pomme */
const TOY_GRAVITY = 1500;           // px/s²
const BOUNCE_MIN_SPEED = 140;       // en dessous, elle ne rebondit plus au sol (px/s)

/** Durées maximales des phases de poursuite et de retour (s) */
const CHASE_TIMEOUT = 14;
const RETURN_TIMEOUT = 8;

let game = null;
let toyEl = null;
let toySprite = null;

/**
 * Boîte affichée de la pomme, à l'échelle courante : carré de côté size,
 * centré dans la case cellW x cellH de la planche (retraits insetX, insetY).
 */
function toyBox() {
    const cellW = DRAGON_SHEET.w * scene.scale;
    const cellH = DRAGON_SHEET.h * scene.scale;
    const size = TOY.box * scene.scale;
    return { cellW, cellH, size, insetX: (cellW - size) / 2, insetY: (cellH - size) / 2 };
}

/** Pomme en vol : gravité, rebonds sur les bords et au sol, roulement */
function moveToy(toy, dt) {
    if (!toy.free) return;
    const r = TOY.radius * scene.scale;
    const floor = floorY();
    const right = viewportWidth() - r;
    toy.vy += TOY_GRAVITY * dt;
    toy.x += toy.vx * dt;
    toy.y += toy.vy * dt;
    toy.spin += (toy.vx * dt) / r;
    if (toy.x < r) {
        toy.x = r;
        toy.vx = Math.abs(toy.vx) * 0.5;
    }
    if (toy.x > right) {
        toy.x = right;
        toy.vx = -Math.abs(toy.vx) * 0.5;
    }
    if (toy.y + r >= floor) {
        toy.y = floor - r;
        if (toy.vy > BOUNCE_MIN_SPEED) {
            toy.vy = -toy.vy * 0.38;
            toy.vx *= 0.75;
        } else {
            toy.vy = 0;
            toy.vx *= Math.exp(-2.5 * dt);
            if (Math.abs(toy.vx) < 6) toy.vx = 0;
        }
    }
}

/**
 * Le dragon vise avec sa gueule : renvoie la position de son pivot qui place
 * sa gueule sur point, et la distance qui l'en sépare encore.
 */
function aim(point, k, anim) {
    const { pet } = scene;
    const mouth = { x: PET_MOUTH.x * scene.scale, y: PET_MOUTH.y * scene.scale };
    if (Math.abs(point.x - pet.x) > 4) pet.dir = point.x > pet.x ? 1 : -1;
    const d = pet.dir || 1;
    return {
        x: point.x - d * mouth.x,
        y: point.y - mouth.y,
        k,
        anim,
        dist: Math.hypot(point.x - (pet.x + d * mouth.x), point.y - (pet.y + mouth.y))
    };
}

/** Lancer suivant, ou fin de partie après un temps assis */
function nextThrow(g) {
    g.left -= 1;
    g.t = 0;
    if (g.left > 0) {
        g.phase = 'hold';
        g.wait = randomBetween(0.8, 1.6);
        Pierre.play('fetch');
        return;
    }
    g.phase = 'done';
    Pierre.play('fetch');
    setTimeout(() => {
        if (game !== g) return;
        FetchGame.end();
        g.onFinish();
    }, randomBetween(1200, 2200));
}

/* Une fonction par phase : renvoie la cible du dragon, ou null */
const PHASES = {
    hold(g) {
        scene.pet.dir = 0;
        if (g.t > g.wait) {
            g.phase = 'throw';
            g.t = 0;
            Pierre.play('fetchThrow');
        }
        return null;
    },

    throw(g) {
        const { toy } = g;
        if (!toy.free && Pierre.anim === 'fetchThrow' && Pierre.frame >= THROW_RELEASE_FRAME) {
            const hand = landmark(LANDMARKS.hand);
            Object.assign(toy, { free: true, shown: true, x: hand.x, y: hand.y, spin: 0 });
            toy.vx = (scene.dir < 0 ? -1 : 1) * randomBetween(160, 620) * scene.scale;
            toy.vy = -randomBetween(300, 480);
        }
        if (toy.free && Pierre.frame >= PIERRE_ANIMS.fetchThrow.f.length - 1) {
            g.phase = 'chase';
            g.t = 0;
            Pierre.play('fetchWatch');
        }
        return null;
    },

    chase(g) {
        const { toy } = g;
        const goal = aim(toy, 6, 'fly');
        if (goal.dist < 60) goal.anim = 'snap';
        if (goal.dist < 10 || g.t > CHASE_TIMEOUT) {
            toy.free = false;
            toy.shown = false;
            g.phase = 'return';
            g.t = 0;
        }
        return goal;
    },

    return(g) {
        const { toy } = g;
        const palm = landmark(LANDMARKS.palm);
        const goal = aim(palm, 4, 'carry');
        if (goal.dist < 22 && Pierre.anim !== 'fetchCatch') Pierre.play('fetchCatch');
        if (goal.dist < 6 || g.t > RETURN_TIMEOUT) {
            g.phase = 'give';
            g.t = 0;
            Pierre.play('fetchCatch');
            Object.assign(toy, { x: palm.x, y: palm.y - 3, spin: 0 });
        }
        return goal;
    },

    give(g) {
        const { toy } = g;
        toy.shown = true;
        scene.pet.dir = 0;
        const palm = landmark(LANDMARKS.palm);
        toy.x = palm.x;
        toy.y = palm.y - 3;
        if (g.t > 0.8) {
            toy.shown = false;
            nextThrow(g);
        }
        return null;
    },

    done() {
        scene.pet.dir = 0;
        return null;
    }
};

const FetchGame = {
    /** Vrai pendant une partie */
    get active() {
        return game !== null;
    },

    /** Crée l'élément de la pomme (.mascot-toy) et l'ajoute à la page */
    mount() {
        toyEl = el('div', { className: 'mascot-toy', 'aria-hidden': 'true', hidden: true });
        toySprite = el('div', { className: 'mascot-toy__sprite' });
        toySprite.style.backgroundImage = `url("${DRAGON_SHEET.src}")`;
        toyEl.appendChild(toySprite);
        document.body.appendChild(toyEl);
    },

    /**
     * Commence une partie.
     * @param {Function} onFinish  appelée quand Pierre a fini de jouer
     */
    start(onFinish) {
        scene.state = 'fetch';
        game = {
            phase: 'hold',
            t: 0,
            wait: randomBetween(0.9, 1.6),
            left: Math.round(randomBetween(2, 3)),
            onFinish,
            toy: { free: false, shown: false, x: 0, y: 0, vx: 0, vy: 0, spin: 0 }
        };
        Pierre.play('fetch');
    },

    /** Arrête la partie en cours (le dragon reprend le regard de Pierre) */
    end() {
        game = null;
        scene.pet.dir = 0;
        if (toyEl) toyEl.hidden = true;
    },

    /**
     * Fait avancer la partie de dt secondes.
     * @returns {{ x: number, y: number, k: number, anim: string } | null}
     *          cible du pivot du dragon (k : vivacité du suivi) et son
     *          animation, ou null s'il reste auprès de Pierre
     */
    steer(dt) {
        const g = game;
        if (!g) return null;
        g.t += dt;
        moveToy(g.toy, dt);
        g.toy.shown = g.toy.free;
        return PHASES[g.phase](g);
    },

    /**
     * Affiche la pomme, centrée sur sa position. Sa boîte est bornée à
     * l'écran, rotation comprise, pour ne jamais déborder sur les côtés.
     */
    render() {
        const toy = game && game.toy;
        toyEl.hidden = !(toy && toy.shown);
        if (!toy || !toy.shown) return;
        const box = toyBox();
        const angle = toy.spin.toFixed(2);           // angle affiché (rad)
        const turn = Number(angle);
        /* Demi-largeur de la boîte une fois tournée, mesurée depuis son centre */
        const reach = (box.size / 2) * (Math.abs(Math.cos(turn)) + Math.abs(Math.sin(turn)));
        /* Même placement, au sous-pixel près, que la case entière qu'elle découpe */
        const left = clamp(
            Math.round(toy.x - box.cellW / 2) + box.insetX,
            reach - box.size / 2,
            viewportWidth() - reach - box.size / 2
        );
        const top = Math.round(toy.y - box.cellH / 2) + box.insetY;
        toyEl.style.transform = `translate(${left}px,${top}px)`;
        toySprite.style.transform = `rotate(${angle}rad)`;
    },

    /** Adapte la pomme à l'échelle courante */
    resize() {
        const box = toyBox();
        const offset = cellOffset(TOY.cell, DRAGON_SHEET.cols, box.cellW, box.cellH);
        const { style } = toySprite;
        style.width = `${box.size}px`;
        style.height = `${box.size}px`;
        style.backgroundSize = `${DRAGON_SHEET.cols * box.cellW}px auto`;
        style.backgroundPosition = `${offset.x - box.insetX}px ${offset.y - box.insetY}px`;
    }
};

export default FetchGame;
