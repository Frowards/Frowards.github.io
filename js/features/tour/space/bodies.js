/**
 * Corps célestes du ciel étoilé : des étoiles.
 *
 * Chaque étoile a deux teintes : claire sur le ciel noir (mode sombre),
 * foncée sur le ciel blanc (mode clair, l'inverse du sombre).
 * Coordonnées : x, y dans [-1,4 ; 1,4] (plan de l'écran), z dans ]0 ; 1]
 * (profondeur, 1 = au loin, vers 0 = contre le pare-brise).
 */

/** Teintes (rgb) : [sur ciel noir, sur ciel blanc], le blanc / noir dominant */
const STAR_COLORS = [
    ['255,255,255', '12,14,22'],
    ['255,255,255', '12,14,22'],
    ['255,255,255', '12,14,22'],
    ['160,240,255', '0,72,110'],
    ['200,180,255', '72,40,140']
];

/**
 * Nouvelle étoile.
 * @param {boolean} far  vrai : placée au loin (recyclage) ; faux : à une
 *                       profondeur quelconque (remplissage initial)
 */
export function makeBody(far) {
    const [dark, light] = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    return {
        x: (Math.random() * 2 - 1) * 1.4,
        y: (Math.random() * 2 - 1) * 1.4,
        z: far ? 1 : 0.05 + Math.random() * 0.95,
        c: dark,
        ink: light
    };
}
