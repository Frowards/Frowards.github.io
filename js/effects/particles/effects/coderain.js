/**
 * Pluie de code : colonnes de caractères ASCII qui s'élèvent du bas de
 * l'écran (rendu sur mesure, comme ceresCodeRain ; pas de particules).
 * Vitesse, densité et taille réglables (100 % = réglage d'origine).
 */
import { rnd, rgba, accentRgb } from '../helpers.js';
import { param } from '../params.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}=+*/#$%&@';
const BASE_SIZE = 14;   // taille de police à 100 % (px)
const FONT_STACK = '"Cascadia Code", Consolas, monospace';

/** Vitesse de montée aléatoire d'une colonne */
function columnSpeed(speedFactor) {
    return rnd(1.2, 3.2) * speedFactor;
}

export default {
    /** @param {import('./index.js').Scene} scene */
    init(scene) {
        const size = Math.round(BASE_SIZE * param('coderain', 'size') / 100);
        const gap = size * 1.2 * 100 / param('coderain', 'density');
        const n = Math.ceil(scene.width / gap);
        const speed = param('coderain', 'speed') / 100;
        const cols = [];
        for (let i = 0; i < n; i++) {
            cols.push({
                x: i * gap, y: rnd(0, scene.height * 2),
                v: columnSpeed(speed), len: Math.floor(rnd(8, 22))
            });
        }
        return { cols, size, speed, tick: 0 };
    },

    /** @param {import('./index.js').Scene} scene */
    step(state, scene) {
        const { ctx } = scene;
        const { size } = state;
        const h = scene.height;
        state.tick++;
        const rgb = accentRgb();
        ctx.font = `${size}px ${FONT_STACK}`;
        state.cols.forEach((c) => {
            c.y -= c.v;
            /* Colonne sortie par le haut : elle repart d'en bas */
            if (c.y + c.len * size < -20) {
                c.y = h + rnd(0, h * 0.5);
                c.v = columnSpeed(state.speed);
            }
            for (let k = 0; k < c.len; k++) {
                const cy = c.y + k * size;
                if (cy < -size || cy > h + size) continue;
                const alpha = k === 0 ? 0.75 : 0.5 * (1 - k / c.len);
                ctx.fillStyle = rgba(rgb, alpha);
                const ch = CHARS[Math.floor(c.x + k * 7 + Math.floor(state.tick / 8)) % CHARS.length];
                ctx.fillText(ch, c.x, cy);
            }
        });
    }
};
