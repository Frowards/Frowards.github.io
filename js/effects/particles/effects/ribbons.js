/**
 * Rubans de sensibilisation (Octobre rose) qui s'élèvent doucement en
 * tournant, couleur d'accent (interaction native : répulsion).
 */
import { rnd, rgba, accentRgb } from '../helpers.js';

/** Tracé du ruban (repère 24 x 32) : boucle + deux pans croisés */
const RIBBON_PATH = 'M7 30 L15.2 16.5 C18.5 11 17.5 3 12 3 C6.5 3 5.5 11 8.8 16.5 L17 30';
const AREA_PER_RIBBON = 36000;   // px² d'écran par ruban
const MIN_COUNT = 14;

export default {
    /** @param {import('./index.js').Scene} scene */
    init(scene) {
        const ribbons = [];
        const n = Math.max(MIN_COUNT, Math.round(scene.width * scene.height / AREA_PER_RIBBON));
        for (let i = 0; i < n; i++) {
            ribbons.push({
                x: rnd(0, scene.width), y: rnd(0, scene.height), s: rnd(0.55, 1.15),
                v: rnd(0.25, 0.7), a: rnd(-0.6, 0.6), va: rnd(-0.006, 0.006),
                o: rnd(0.2, 0.45), ph: rnd(0, 6.28)
            });
        }
        /* Path2D absent (très vieux navigateur) : l'effet ne dessine rien */
        const path = typeof Path2D !== 'undefined' ? new Path2D(RIBBON_PATH) : null;
        return { ribbons, path };
    },

    /** @param {import('./index.js').Scene} scene */
    step(state, scene) {
        if (!state.path) return;
        const { ctx } = scene;
        const rgb = accentRgb();
        ctx.lineJoin = 'round';
        state.ribbons.forEach((p) => {
            p.y -= p.v;
            p.ph += 0.01;
            p.x += Math.sin(p.ph) * 0.25;
            p.a += p.va;
            if (p.y < -40) {
                p.y = scene.height + 40;
                p.x = rnd(0, scene.width);
            }
            const k = scene.force(p);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.a);
            ctx.scale(p.s * k, p.s * k);
            ctx.translate(-12, -16);
            ctx.strokeStyle = rgba(rgb, p.o);
            ctx.lineWidth = 3.6;
            ctx.stroke(state.path);
            ctx.restore();
        });
        scene.grabLines(state.ribbons);
    }
};
