/**
 * Corps célestes du ciel étoilé.
 *
 * Chaque corps est tiré une fois au hasard et sert selon le mode :
 *   - sombre : une étoile (couleur c) ;
 *   - clair  : une poussière (dust) ou un astéroïde (couleur rock, taille,
 *              rotation et contour irrégulier shape).
 * Coordonnées : x, y dans [-1,4 ; 1,4] (plan de l'écran), z dans ]0 ; 1]
 * (profondeur, 1 = au loin, vers 0 = contre le pare-brise).
 */

/** Teintes des étoiles (rgb), le blanc dominant */
const STAR_COLORS = ['255,255,255', '255,255,255', '255,255,255', '160,240,255', '200,180,255'];

/** Teintes des astéroïdes (rgb), gris et brun */
const ROCK_COLORS = ['122,128,142', '146,136,124', '104,112,128', '160,150,138', '92,98,112'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * Nouveau corps céleste.
 * @param {boolean} far  vrai : placé au loin (recyclage) ; faux : à une
 *                       profondeur quelconque (remplissage initial)
 */
export function makeBody(far) {
    const vertices = 7 + Math.floor(Math.random() * 4);
    const shape = Array.from({ length: vertices }, () => 0.68 + Math.random() * 0.32);
    return {
        x: (Math.random() * 2 - 1) * 1.4,
        y: (Math.random() * 2 - 1) * 1.4,
        z: far ? 1 : 0.05 + Math.random() * 0.95,
        c: pick(STAR_COLORS),
        rock: pick(ROCK_COLORS),
        dust: Math.random() < 0.5,
        size: 7 + Math.random() * 30,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 1.6,
        shape
    };
}
