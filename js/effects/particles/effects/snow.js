/**
 * Neige : points qui tombent en ondulant (interaction native : répulsion).
 */
import { rnd, rgba, accentRgb } from '../helpers.js';

const COUNT = 80;

export default {
    /** @param {import('./index.js').Scene} scene */
    init(scene) {
        const flakes = [];
        for (let i = 0; i < COUNT; i++) {
            flakes.push({
                x: rnd(0, scene.width), y: rnd(0, scene.height), r: rnd(1.5, 3.5),
                v: rnd(0.5, 1.4), ph: rnd(0, 6.28), o: rnd(0.25, 0.6)
            });
        }
        return { flakes, t: 0 };
    },

    /** @param {import('./index.js').Scene} scene */
    step(state, scene) {
        const { ctx } = scene;
        state.t += 0.01;
        const rgb = accentRgb();
        state.flakes.forEach((p) => {
            p.y += p.v;
            p.x += Math.sin(state.t * 2 + p.ph) * 0.4;
            if (p.y > scene.height + 5) {
                p.y = -5;
                p.x = rnd(0, scene.width);
            }
            const k = scene.force(p);
            ctx.fillStyle = rgba(rgb, p.o);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * k, 0, Math.PI * 2);
            ctx.fill();
        });
        scene.grabLines(state.flakes);
    }
};
