/**
 * Lucioles : errance aléatoire et halo pulsé (interaction native : aucune).
 */
import { rnd, rgba, accentRgb } from '../helpers.js';
import { clamp } from '../../../utils/motion.js';

const COUNT = 35;
const MAX_SPEED = 0.55;

export default {
    /** @param {import('./index.js').Scene} scene */
    init(scene) {
        const flies = [];
        for (let i = 0; i < COUNT; i++) {
            flies.push({
                x: rnd(0, scene.width), y: rnd(0, scene.height),
                vx: rnd(-0.4, 0.4), vy: rnd(-0.4, 0.4),
                ph: rnd(0, 6.28), sp: rnd(0.5, 1.4), r: rnd(1.2, 2.6)
            });
        }
        return { flies, t: 0 };
    },

    /** @param {import('./index.js').Scene} scene */
    step(state, scene) {
        const { ctx } = scene;
        state.t += 0.016;
        const rgb = accentRgb();
        state.flies.forEach((p) => {
            p.vx += rnd(-0.03, 0.03);
            p.vy += rnd(-0.03, 0.03);
            p.vx = clamp(p.vx, -MAX_SPEED, MAX_SPEED);
            p.vy = clamp(p.vy, -MAX_SPEED, MAX_SPEED);
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > scene.width) p.vx *= -1;
            if (p.y < 0 || p.y > scene.height) p.vy *= -1;
            const k = scene.force(p);
            const glow = 0.3 + 0.45 * (0.5 + 0.5 * Math.sin(state.t * p.sp + p.ph));
            ctx.shadowBlur = 10;
            ctx.shadowColor = rgba(rgb, glow);
            ctx.fillStyle = rgba(rgb, glow);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * k, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        scene.grabLines(state.flies);
    }
};
