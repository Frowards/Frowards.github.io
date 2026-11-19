/**
 * Planches de sprites de la mascotte et repères de placement.
 *
 * Les dimensions sont celles des cases de chaque planche, en pixels d'image ;
 * elles sont multipliées par l'échelle courante (scene.scale) à l'affichage.
 * Planches reprises de la mascotte de Ceres.
 */

const SPRITE_DIR = 'assets/sprites/';

/** Planche de Pierre : cases de 146 x 93 px, 12 colonnes */
export const PIERRE_SHEET = Object.freeze({
    src: `${SPRITE_DIR}mascotte-pierre.png`,
    w: 146,
    h: 93,
    cols: 12
});

/**
 * Planche du dragon : cases de 139 x 48 px, 8 colonnes.
 * pivot : point d'ancrage du dragon dans sa case (fractions), regard à droite.
 */
export const DRAGON_SHEET = Object.freeze({
    src: `${SPRITE_DIR}mascotte-dragon.png`,
    w: 139,
    h: 48,
    cols: 8,
    pivot: Object.freeze({ x: 0.187, y: 0.5 })
});

/** Repères dans la case de Pierre (fractions de la case, regard à droite) */
export const LANDMARKS = Object.freeze({
    pet: { x: 0.353, y: 0.348 },     // place du dragon qui l'accompagne
    front: { x: 0.709, y: 0.507 },   // devant lui : souffle de feu du dragon
    head: { x: 0.48, y: 0.3 },       // tête : le dragon tourne autour quand il est sonné
    hand: { x: 0.54, y: 0.376 },     // main qui lance la pomme
    palm: { x: 0.699, y: 0.581 }     // paume où le dragon rapporte la pomme
});

/** Gueule du dragon, en pixels de planche depuis son pivot (regard à droite) */
export const PET_MOUTH = Object.freeze({ x: 14.7, y: 0.2 });

/**
 * Pomme du jeu : case de la planche du dragon et boîte affichée, en pixels de
 * planche. La pomme est centrée dans sa case ; la boîte (box x box) l'entoure
 * au plus près pour que l'élément ne déborde jamais de l'écran.
 */
export const TOY = Object.freeze({ cell: 33, box: 12, radius: 5 });

/**
 * Décalage de fond (background-position) de la case index d'une planche
 * de cols colonnes dont les cases mesurent w x h pixels à l'écran.
 * @returns {{ x: number, y: number }}
 */
export function cellOffset(index, cols, w, h) {
    return { x: -(index % cols) * w, y: -Math.floor(index / cols) * h };
}
