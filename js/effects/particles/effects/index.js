/**
 * Registre des effets de fond (calqué sur les BACKGROUND_EFFECTS de
 * CeresGlobalTheme, réimplémentés en canvas maison, sans bibliothèque).
 *
 * Chaque effet est un objet { init(scene), step(state, scene) } :
 *   - init  crée l'état de départ (particules...) pour la taille du canvas
 *   - step  fait avancer l'état d'une image et le dessine
 *
 * L'ordre des clés est celui proposé à l'utilisateur (Particles.EFFECTS).
 *
 * @typedef {Object} Scene contexte de dessin fourni aux effets par le moteur
 * @property {CanvasRenderingContext2D} ctx contexte 2D du canvas #pb-particles
 * @property {number} width  largeur courante du canvas (px)
 * @property {number} height hauteur courante du canvas (px)
 * @property {{x: number, y: number}} mouse position du pointeur
 * @property {(p: {x: number, y: number}) => number} force applique
 *           l'interaction souris à une particule, renvoie son facteur de taille
 * @property {(parts: Array<{x: number, y: number}>) => void} grabLines
 *           dessine la toile curseur - particules (mode grab uniquement)
 */
import connectedDots from './connected-dots.js';
import snow from './snow.js';
import flakes from './flakes.js';
import stars from './stars.js';
import bubbles from './bubbles.js';
import fireflies from './fireflies.js';
import confetti from './confetti.js';
import halloween from './halloween.js';
import easter from './easter.js';
import hexgrid from './hexgrid.js';
import ribbons from './ribbons.js';
import coderain from './coderain.js';
import none from './none.js';

const REGISTRY = Object.freeze({
    default: connectedDots,
    snow,
    flakes,
    stars,
    bubbles,
    fireflies,
    confetti,
    halloween,
    easter,
    hexgrid,
    ribbons,
    coderain,
    fluid: none,   // rendu WebGL délégué au module Fluid
    off: none
});

export default REGISTRY;
