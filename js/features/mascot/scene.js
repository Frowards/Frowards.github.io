/**
 * Scène de la mascotte : état partagé entre ses modules et mesures d'écran.
 *
 * Repère de Pierre : x = bord gauche de sa case (px depuis la gauche de
 * l'écran), y = hauteur au-dessus de son sol (px, vers le haut). Le sol est
 * le bas de l'élément .mascot, que le CSS remonte au-dessus de la barre de
 * visite guidée ou de la ligne de commande Rétro (--mascot-floor).
 *
 * États de Pierre (scene.state) :
 *   idle   immobile ou petite animation sur place
 *   walk   se rend à scene.target
 *   nap    feu de camp puis sieste
 *   fetch  joue à la pomme avec le dragon (FetchGame)
 *   drag   tenu au pointeur
 *   fall   lâché : chute libre et rebonds
 *   stun   sonné après une chute de haut
 */
import { PIERRE_SHEET } from './sprites.js';

/** Hauteur de l'en-tête quand elle n'est pas encore mesurée (px) */
const DEFAULT_HEADER_HEIGHT = 56;

export const scene = {
    el: null,            // .mascot : bouton qui contient le sprite
    sprite: null,        // .mascot__sprite
    visible: true,       // mascotte affichée (bouton masquer / afficher)
    scale: 1,            // échelle des planches selon la largeur d'écran

    x: -120,
    y: 0,
    vx: 0,               // vitesses de chute (px/s, y vers le haut)
    vy: 0,
    dir: 1,              // regard : 1 à droite, -1 à gauche
    target: 0,           // abscisse visée par la balade
    state: 'idle',
    stateUntil: 0,       // instant (performance.now) de fin de l'état idle ou nap
    fallTop: 0,          // hauteur de départ de la chute

    /** Dragon : position de son pivot à l'écran et regard imposé (0 = celui de Pierre) */
    pet: { x: null, y: null, dir: 0 }
};

/** Largeur utile de l'écran (sans la barre de défilement) */
export const viewportWidth = () => document.documentElement.clientWidth;

/** Largeur affichée d'une case de Pierre */
export const cellWidth = () => PIERRE_SHEET.w * scene.scale;

/** Hauteur affichée d'une case de Pierre */
export const cellHeight = () => PIERRE_SHEET.h * scene.scale;

/** Ordonnée écran du sol de la mascotte */
export function floorY() {
    const lift = scene.el ? parseFloat(getComputedStyle(scene.el).bottom) || 0 : 0;
    return window.innerHeight - lift;
}

/** Haut de la case de Pierre, en coordonnées écran */
export const cellTop = () => floorY() - scene.y - cellHeight();

/** Hauteur maximale de Pierre : sa tête ne passe pas sous l'en-tête */
export function maxHeight() {
    const style = getComputedStyle(document.documentElement);
    const header = parseFloat(style.getPropertyValue('--xp-header-h')) || DEFAULT_HEADER_HEIGHT;
    return Math.max(0, floorY() - cellHeight() - header);
}

/**
 * Point d'un repère de la case de Pierre (LANDMARKS), en coordonnées écran,
 * en tenant compte du sens de son regard.
 */
export function landmark(point) {
    const fx = scene.dir < 0 ? 1 - point.x : point.x;
    return { x: scene.x + fx * cellWidth(), y: cellTop() + point.y * cellHeight() };
}

/** Nombre aléatoire entre min et max */
export const randomBetween = (min, max) => min + Math.random() * (max - min);
