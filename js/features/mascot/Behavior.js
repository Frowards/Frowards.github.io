/**
 * Behavior - la vie de Pierre quand on ne le touche pas.
 *
 * Il alterne balades et pauses ; à chaque pause il tire au sort une
 * occupation : rester planté, regarder le ciel, faire la fête, sauter, faire
 * un salto, jouer à la pomme avec son dragon ou faire une sieste au coin du feu.
 */
import Pierre from './Pierre.js';
import FetchGame from './FetchGame.js';
import { scene, viewportWidth, cellWidth, randomBetween } from './scene.js';

/** Vitesse de marche à l'échelle 1 (px/s) */
const WALK_SPEED = 55;

/** Marge entre la balade et les bords de l'écran (px) */
const EDGE_MARGIN = 8;

/**
 * Délai de garde (ms) : l'état suivant est choisi par la fin de l'animation
 * en cours, pas par le temps écoulé.
 */
const AWAIT_ANIMATION = 99999;

/**
 * Occupations d'une pause, tirées au sort : chacune est choisie quand le
 * tirage (entre 0 et 1) est inférieur à son seuil cumulé below.
 */
const IDLE_ACTIONS = [
    {
        below: 0.28,                 // rester planté
        run: (now) => {
            Pierre.play('stand');
            scene.stateUntil = now + randomBetween(1800, 4000);
        }
    },
    {
        below: 0.42,                 // regarder le ciel
        run: (now) => {
            Pierre.play('lookUp', () => Pierre.play('stand'));
            scene.stateUntil = now + 2600;
        }
    },
    {
        below: 0.54,                 // faire la fête
        run: (now) => {
            Pierre.play('celebrate');
            scene.stateUntil = now + randomBetween(1600, 2600);
        }
    },
    {
        below: 0.62,                 // sauter
        run: (now) => {
            Pierre.play('jump', () => Pierre.play('stand'));
            scene.stateUntil = now + 1100;
        }
    },
    {
        below: 0.67,                 // salto
        run: (now) => {
            Pierre.play('flip', () => Pierre.play('stand'));
            scene.stateUntil = now + 900;
        }
    },
    {
        below: 0.86,                 // jouer à la pomme
        run: () => FetchGame.start(() => Behavior.getUp('standUpPlain'))
    },
    {
        below: Infinity,             // feu de camp puis sieste avec le dragon
        run: (now) => {
            scene.state = 'nap';
            Pierre.play('campfire', () => Pierre.play('lie'));
            scene.stateUntil = now + randomBetween(9000, 14000);
        }
    }
];

const Behavior = {
    /** Pause : tire au sort une occupation sur place */
    chooseIdle() {
        const draw = Math.random();
        FetchGame.end();
        scene.state = 'idle';
        const now = performance.now();
        IDLE_ACTIONS.find((action) => draw < action.below).run(now);
    },

    /** Balade : choisit une destination assez éloignée et s'y rend */
    chooseWalk() {
        FetchGame.end();
        scene.state = 'walk';
        const min = EDGE_MARGIN;
        const max = Math.max(min + 10, viewportWidth() - cellWidth() - EDGE_MARGIN);
        const minDistance = Math.min(160, (max - min) / 3);
        let tries = 0;
        do {
            scene.target = randomBetween(min, max);
            tries += 1;
        } while (tries < 12 && Math.abs(scene.target - scene.x) < minDistance);
        scene.dir = scene.target > scene.x ? 1 : -1;
        Pierre.play('walk');
    },

    /** Se relève (animation anim) puis repart en balade */
    getUp(anim) {
        scene.state = 'idle';
        Pierre.play(anim, () => Behavior.chooseWalk());
        scene.stateUntil = performance.now() + AWAIT_ANIMATION;
    },

    /** Entrée en scène : marche depuis le bord gauche jusqu'à un point proche */
    enter() {
        scene.target = Math.min(viewportWidth() * 0.18, 220);
        scene.dir = 1;
        scene.state = 'walk';
        Pierre.play('walk');
    },

    /**
     * Fait avancer la balade et enchaîne les états à leur échéance.
     * @param {number} dt   temps écoulé (s)
     * @param {number} now  instant courant (ms, horloge de requestAnimationFrame)
     */
    update(dt, now) {
        if (scene.state === 'walk') {
            scene.x += scene.dir * WALK_SPEED * scene.scale * dt;
            const arrived = scene.dir > 0 ? scene.x >= scene.target : scene.x <= scene.target;
            if (arrived) {
                scene.x = scene.target;
                Behavior.chooseIdle();
            }
        } else if ((scene.state === 'idle' || scene.state === 'nap') && now > scene.stateUntil) {
            if (scene.state === 'nap') Behavior.getUp('standUp');
            else Behavior.chooseWalk();
        }
    }
};

export default Behavior;
