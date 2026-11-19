/**
 * Flocons : glyphes de flocons qui tombent en ondulant
 * (interaction native : répulsion).
 */
import { rnd, pick, rgba, accentRgb } from '../helpers.js';

const COUNT = 40;
const GLYPHS = ['❄', '❅', '❆'];

export default {
    /** @param {import('./index.js').Scene} scene */
    init(scene) {
        const flakes = [];
        for (let i = 0; i < COUNT; i++) {
            flakes.push({
                x: rnd(0, scene.width), y: rnd(0, scene.height), s: rnd(8, 16),
                v: rnd(0.4, 1.1), ph: rnd(0, 6.28), o: rnd(0.2, 0.5),
                g: pick(GLYPHS)
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
            p.x += Math.sin(state.t * 2 + p.ph) * 0.35;
            if (p.y > scene.height + 20) {
                p.y = -20;
                p.x = rnd(0, scene.width);
            }
            const k = scene.force(p);
            ctx.font = `${Math.round(p.s * k)}px Verdana`;
            ctx.fillStyle = rgba(rgb, p.o);
            ctx.fillText(p.g, p.x, p.y);
        });
        scene.grabLines(state.flakes);
    }
};
