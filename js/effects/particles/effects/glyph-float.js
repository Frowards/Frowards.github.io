/**
 * glyph-float - fabrique d'effets à glyphes flottants (emoji qui dérivent
 * lentement et réapparaissent du bord opposé). Sert aux thèmes
 * d'événements Halloween et Pâques.
 */
import { rnd, pick } from '../helpers.js';

const COUNT = 18;
const MARGIN = 30;   // débord avant de réapparaître de l'autre côté (px)

/**
 * Crée un effet de glyphes flottants.
 * @param {string[]} glyphs caractères tirés au hasard
 * @returns {{init: Function, step: Function}} effet prêt pour le registre
 */
export function createGlyphFloat(glyphs) {
    return {
        /** @param {import('./index.js').Scene} scene */
        init(scene) {
            const items = [];
            for (let i = 0; i < COUNT; i++) {
                items.push({
                    x: rnd(0, scene.width), y: rnd(0, scene.height), s: rnd(14, 26),
                    vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3), o: rnd(0.15, 0.4),
                    g: pick(glyphs)
                });
            }
            return { items };
        },

        /** @param {import('./index.js').Scene} scene */
        step(state, scene) {
            const { ctx } = scene;
            const w = scene.width;
            const h = scene.height;
            state.items.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -MARGIN) p.x = w + MARGIN;
                if (p.x > w + MARGIN) p.x = -MARGIN;
                if (p.y < -MARGIN) p.y = h + MARGIN;
                if (p.y > h + MARGIN) p.y = -MARGIN;
                const k = scene.force(p);
                ctx.save();
                ctx.globalAlpha = p.o;
                ctx.font = `${Math.round(p.s * k)}px Verdana`;
                ctx.fillText(p.g, p.x, p.y);
                ctx.restore();
            });
            scene.grabLines(state.items);
        }
    };
}
