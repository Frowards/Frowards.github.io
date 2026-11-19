/**
 * Bulles : cercles translucides qui montent en ondulant
 * (interaction native : répulsion).
 */
import { rnd, rgba, accentRgb } from '../helpers.js';

const COUNT = 45;

export default {
    /** @param {import('./index.js').Scene} scene */
    init(scene) {
        const bubbles = [];
        for (let i = 0; i < COUNT; i++) {
            bubbles.push({
                x: rnd(0, scene.width), y: rnd(0, scene.height), r: rnd(2, 9),
                v: rnd(0.5, 1.3), ph: rnd(0, 6.28), o: rnd(0.08, 0.2)
            });
        }
        return { bubbles, t: 0 };
    },

    /** @param {import('./index.js').Scene} scene */
    step(state, scene) {
        const { ctx } = scene;
        state.t += 0.01;
        const rgb = accentRgb();
        state.bubbles.forEach((p) => {
            p.y -= p.v;
            p.x += Math.sin(state.t * 2 + p.ph) * 0.3;
            if (p.y < -12) {
                p.y = scene.height + 12;
                p.x = rnd(0, scene.width);
            }
            const k = scene.force(p);
            ctx.strokeStyle = rgba(rgb, p.o * 2);
            ctx.fillStyle = rgba(rgb, p.o);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * k, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        scene.grabLines(state.bubbles);
    }
};
