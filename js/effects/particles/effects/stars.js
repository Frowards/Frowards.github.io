/**
 * Étoiles : points fixes qui scintillent (interaction native : loupe).
 */
import { rnd, rgba, accentRgb } from '../helpers.js';

const AREA_PER_STAR = 18000;   // px² d'écran par étoile

export default {
    /** @param {import('./index.js').Scene} scene */
    init(scene) {
        const stars = [];
        const n = Math.round(scene.width * scene.height / AREA_PER_STAR);
        for (let i = 0; i < n; i++) {
            stars.push({
                x: rnd(0, scene.width), y: rnd(0, scene.height), r: rnd(0.6, 2),
                ph: rnd(0, 6.28), sp: rnd(0.5, 1.6)
            });
        }
        return { stars, t: 0 };
    },

    /** @param {import('./index.js').Scene} scene */
    step(state, scene) {
        const { ctx } = scene;
        state.t += 0.016;
        const rgb = accentRgb();
        state.stars.forEach((p) => {
            const twinkle = 0.35 + 0.35 * Math.sin(state.t * p.sp + p.ph);
            const k = scene.force(p);
            ctx.fillStyle = rgba(rgb, Math.min(0.9, twinkle + (k - 1) * 0.3));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * k, 0, Math.PI * 2);
            ctx.fill();
        });
        scene.grabLines(state.stars);
    }
};
