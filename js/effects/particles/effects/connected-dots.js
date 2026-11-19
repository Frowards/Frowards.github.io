/**
 * Points reliés (effet standard Ceres, clé 'default') : des points dérivent
 * et se relient par des traits d'autant plus nets qu'ils sont proches.
 */
import { rnd, rgba, accentRgb } from '../helpers.js';

const AREA_PER_DOT = 22000;   // px² d'écran par point
const LINK_DISTANCE = 140;    // distance max d'un lien (px)

export default {
    /** @param {import('./index.js').Scene} scene */
    init(scene) {
        const dots = [];
        const n = Math.round(scene.width * scene.height / AREA_PER_DOT);
        for (let i = 0; i < n; i++) {
            dots.push({
                x: rnd(0, scene.width), y: rnd(0, scene.height),
                vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3), r: rnd(1, 2.2)
            });
        }
        return { dots };
    },

    /** @param {import('./index.js').Scene} scene */
    step(state, scene) {
        const { ctx } = scene;
        const rgb = accentRgb();
        const { dots } = state;
        const scale = [];
        dots.forEach((d, i) => {
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < 0 || d.x > scene.width) d.vx *= -1;
            if (d.y < 0 || d.y > scene.height) d.vy *= -1;
            scale[i] = scene.force(d);
        });
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const a = dots[i];
                const b = dots[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < LINK_DISTANCE) {
                    ctx.strokeStyle = rgba(rgb, (0.4 * (1 - dist / LINK_DISTANCE)).toFixed(3));
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
        ctx.fillStyle = rgba(rgb, 0.6);
        dots.forEach((d, k) => {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r * scale[k], 0, Math.PI * 2);
            ctx.fill();
        });
        scene.grabLines(dots);
    }
};
