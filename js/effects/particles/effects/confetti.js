/**
 * Confettis : carrés colorés qui tombent en tournant (palette Ceres,
 * indépendante du thème ; interaction native : répulsion).
 */
import { rnd, pick } from '../helpers.js';

const COUNT = 55;
const COLORS = ['#E05252', '#F5C542', '#4FA5E0', '#5DBB63', '#B07CD9'];

export default {
    /** @param {import('./index.js').Scene} scene */
    init(scene) {
        const pieces = [];
        for (let i = 0; i < COUNT; i++) {
            pieces.push({
                x: rnd(0, scene.width), y: rnd(0, scene.height), s: rnd(3, 6),
                v: rnd(0.8, 1.8), rot: rnd(0, 6.28), vr: rnd(-0.08, 0.08),
                col: pick(COLORS),
                o: rnd(0.25, 0.55)
            });
        }
        return { pieces };
    },

    /** @param {import('./index.js').Scene} scene */
    step(state, scene) {
        const { ctx } = scene;
        state.pieces.forEach((p) => {
            p.y += p.v;
            p.rot += p.vr;
            if (p.y > scene.height + 10) {
                p.y = -10;
                p.x = rnd(0, scene.width);
            }
            const k = scene.force(p);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = p.o;
            ctx.fillStyle = p.col;
            const size = p.s * k;
            ctx.fillRect(-size / 2, -size / 2, size, size);
            ctx.restore();
        });
        ctx.globalAlpha = 1;
        scene.grabLines(state.pieces);
    }
};
