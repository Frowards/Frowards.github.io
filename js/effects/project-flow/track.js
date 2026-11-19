/**
 * track - géométrie du tracé de la frise des projets, suivi par l'impulsion
 * lumineuse : ligne de la rangée 1, virage en demi-cercle à droite, puis
 * ligne de la rangée 2 vers la flèche (simple ligne verticale en mobile).
 *
 * Le tracé est une suite de segments : droites { t: 'l', x1, y1, x2, y2 }
 * et quarts d'ellipse { t: 'a', cx, cy, rx, ry, a0, a1 }, chacun avec sa
 * longueur (len) et son abscisse curviligne de départ (d0).
 */

/**
 * Calcule le tracé dans le repère de la frise (px CSS).
 * @param {Object} m mesures de la frise
 * @param {number} m.width    largeur de la frise
 * @param {number} m.height   hauteur de la frise
 * @param {number} m.rem      taille de police racine (px)
 * @param {boolean} m.vertical disposition mobile (virage masqué)
 * @param {number} m.y1       ordonnée de la ligne de la rangée 1
 * @param {number} m.y2       ordonnée de la ligne de la rangée 2
 * @returns {{segs: Array, total: number, vertical: boolean, rem: number, xe: number, y1: number, y2: number}}
 */
export function buildTrack({ width, height, rem, vertical, y1, y2 }) {
    let segs;
    let xe = 0;
    if (vertical) {
        /* Mobile : ligne verticale à gauche, lecture de haut en bas */
        const x = 0.31 * rem + 1;
        segs = [{ t: 'l', x1: x, y1: 0.4 * rem, x2: x, y2: height - 0.4 * rem }];
    } else {
        /* Reproduit EXACTEMENT le trait du .pj-turn : bord gauche à
           W - 1.2rem (right:-0.1rem, width:1.3rem), border-radius 1.5rem
           plafonné à rx = largeur ; entre les deux quarts d'arrondi, le
           bord droit est un segment VERTICAL droit. */
        xe = width - 1.2 * rem;                         // bord gauche du virage
        const rx = 1.3 * rem - 1;                       // -1 : milieu du trait de 2px
        const ry = Math.min(1.5 * rem, (y2 - y1) / 2);
        segs = [
            { t: 'l', x1: 0, y1, x2: xe, y2: y1 },
            { t: 'a', cx: xe, cy: y1 + ry, rx, ry, a0: -Math.PI / 2, a1: 0 },
            { t: 'l', x1: xe + rx, y1: y1 + ry, x2: xe + rx, y2: y2 - ry },
            { t: 'a', cx: xe, cy: y2 - ry, rx, ry, a0: 0, a1: Math.PI / 2 },
            { t: 'l', x1: xe, y1: y2, x2: 14, y2 }
        ];
    }
    let total = 0;
    segs.forEach((s) => {
        /* longueur d'un quart d'ellipse : approximation par le rayon quadratique moyen */
        s.len = s.t === 'l'
            ? Math.hypot(s.x2 - s.x1, s.y2 - s.y1)
            : Math.abs(s.a1 - s.a0) * Math.sqrt((s.rx * s.rx + s.ry * s.ry) / 2);
        s.d0 = total;
        total += s.len;
    });
    return { segs, total, vertical, rem, xe, y1, y2 };
}

/**
 * Abscisse curviligne d'un jalon (point de la frise) de centre (x, y) :
 * l'impulsion l'embrase quand elle passe à cette distance.
 * @returns {number}
 */
export function milestoneDistance(track, x, y) {
    if (track.vertical) return y - 0.4 * track.rem;
    if (Math.abs(y - track.y1) < Math.abs(y - track.y2)) return x;    // rangée 1
    return track.segs[4].d0 + (track.xe - x);                         // rangée 2 (sens inverse)
}

/**
 * Point du tracé à la distance d (bornée au tracé).
 * @returns {{x: number, y: number}}
 */
export function pointAt(track, d) {
    const { segs, total } = track;
    d = Math.max(0, Math.min(d, total));
    for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (d <= s.d0 + s.len || i === segs.length - 1) {
            const u = s.len ? (d - s.d0) / s.len : 0;
            if (s.t === 'l') {
                return { x: s.x1 + (s.x2 - s.x1) * u, y: s.y1 + (s.y2 - s.y1) * u };
            }
            const a = s.a0 + (s.a1 - s.a0) * u;
            return { x: s.cx + Math.cos(a) * s.rx, y: s.cy + Math.sin(a) * s.ry };
        }
    }
    return { x: 0, y: 0 };
}
