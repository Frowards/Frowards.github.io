/**
 * Animations de la mascotte : suites de cases des planches (sprites.js).
 *
 * Chaque animation : { f: cases dans l'ordre, fps: images par seconde,
 * loop: rejouée en boucle (sinon elle s'arrête sur sa dernière image) }.
 */

/** Animations de Pierre */
export const PIERRE_ANIMS = Object.freeze({
    stand: { f: [0], fps: 1, loop: true },
    walk: { f: [1, 2, 3, 4, 5, 6, 7, 8], fps: 10, loop: true },
    celebrate: { f: [77, 78, 79, 47], fps: 8, loop: true },
    lookUp: { f: [0, 57, 58, 58, 58, 58, 58, 57, 0], fps: 6 },
    campfire: { f: [24, 25, 26, 27, 28, 29], fps: 3 },
    lie: { f: [15, 16, 17, 18, 19, 20, 21, 22], fps: 4, loop: true },
    standUp: { f: [59, 56, 23, 0], fps: 8 },
    standUpPlain: { f: [56, 23, 0], fps: 8 },
    jump: { f: [69, 70, 71, 72, 73, 74, 75, 76], fps: 12 },
    flip: { f: [38, 39, 40, 41, 42, 43, 44, 45], fps: 16 },
    wave: { f: [0, 46, 46, 46, 46, 0, 47, 47, 47], fps: 8 },
    hang: { f: [89, 90, 91, 92], fps: 6, loop: true },
    fall: { f: [89, 90, 91, 92], fps: 10, loop: true },
    stun: { f: [34, 35, 36, 37, 37, 37, 37], fps: 6 },
    fetch: { f: [48, 49], fps: 2, loop: true },
    fetchThrow: { f: [50, 50, 51, 51, 51], fps: 9 },
    fetchWatch: { f: [52, 52, 53, 53, 54, 54], fps: 4, loop: true },
    fetchCatch: { f: [55], fps: 2, loop: true }
});

/** Animations du dragon */
export const PET_ANIMS = Object.freeze({
    fly: { f: [0, 1, 2, 3, 4, 5, 6, 7], fps: 12, loop: true },
    breath: { f: [8, 8, 9, 27, 28, 29, 30, 29, 30, 31, 10, 10], fps: 10 },
    happy: { f: [11, 12, 13, 14], fps: 8, loop: true },
    dizzy: { f: [15, 16, 17, 18], fps: 8, loop: true },
    carry: { f: [19, 20, 21, 22, 23, 24], fps: 12, loop: true },
    snap: { f: [25, 26], fps: 8, loop: true }
});

/** Animations de Pierre où le dragon est déjà dessiné sur l'image : on le cache */
export const PET_HIDDEN_DURING = Object.freeze(['campfire', 'lie']);

/** Image de l'animation wave où Pierre tend le doigt : le dragon crache son feu */
export const WAVE_POINT_FRAME = 1;

/** Image de l'animation fetchThrow où la pomme quitte la main */
export const THROW_RELEASE_FRAME = 2;
