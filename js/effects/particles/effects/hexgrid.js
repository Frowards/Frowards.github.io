/**
 * Grille hexagonale "fibre de carbone" : les arêtes s'illuminent au passage
 * de la souris (rendu sur mesure, comme ceresHexGrid ; pas de particules).
 */
import { rgba, accentRgb } from '../helpers.js';

const RADIUS = 34;        // rayon d'un hexagone (px)
const GLOW_RANGE = 160;   // portée de l'illumination autour du pointeur (px)

/** Les 6 sommets d'un hexagone à sommet plat centré en (cx, cy) */
function hexCorners(cx, cy) {
    const pts = [];
    for (let k = 0; k < 6; k++) {
        pts.push([cx + RADIUS * Math.cos(Math.PI / 3 * k), cy + RADIUS * Math.sin(Math.PI / 3 * k)]);
    }
    return pts;
}

export default {
    /**
     * Calcule une seule fois chaque arête de la grille (les arêtes partagées
     * par deux hexagones voisins sont dédoublonnées par leur milieu).
     * @param {import('./index.js').Scene} scene
     */
    init(scene) {
        const edges = [];
        const seen = new Set();
        const dx = RADIUS * 1.5;
        const dy = RADIUS * Math.sqrt(3);
        for (let col = -1; col * dx < scene.width + RADIUS; col++) {
            for (let row = -1; row * dy < scene.height + dy; row++) {
                const cx = col * dx;
                const cy = row * dy + (col % 2 ? dy / 2 : 0);
                const pts = hexCorners(cx, cy);
                for (let k = 0; k < 6; k++) {
                    const a = pts[k];
                    const b = pts[(k + 1) % 6];
                    const key = [Math.round((a[0] + b[0]) / 2), Math.round((a[1] + b[1]) / 2)].join('|');
                    if (!seen.has(key)) {
                        seen.add(key);
                        edges.push([a[0], a[1], b[0], b[1]]);
                    }
                }
            }
        }
        return { edges };
    },

    /** @param {import('./index.js').Scene} scene */
    step(state, scene) {
        const { ctx, mouse } = scene;
        const rgb = accentRgb();
        ctx.lineWidth = 1;
        state.edges.forEach((e) => {
            const mx = (e[0] + e[2]) / 2;
            const my = (e[1] + e[3]) / 2;
            const dx = mx - mouse.x;
            const dy = my - mouse.y;
            const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / GLOW_RANGE);
            ctx.strokeStyle = rgba(rgb, 0.05 + near * 0.5);
            ctx.beginPath();
            ctx.moveTo(e[0], e[1]);
            ctx.lineTo(e[2], e[3]);
            ctx.stroke();
        });
    }
};
