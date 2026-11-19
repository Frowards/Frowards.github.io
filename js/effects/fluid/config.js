/**
 * config - constantes de la simulation de fluide (choisies pour un fluide
 * réactif, sans "vent" permanent).
 */

/** Résolution (petit côté) du champ de vitesse */
export const SIM_RES = 128;
/** Résolution (petit côté) du champ de couleur */
export const DYE_RES = 512;

/** Atténuation de la pression d'une image à l'autre */
export const PRESSURE = 0.8;
/** Itérations de Jacobi pour la pression */
export const PRESSURE_ITER = 20;
/** Intensité du confinement de vorticité */
export const CURL = 25;
/** Amortissement (fort) de la vitesse */
export const VELOCITY_DISSIPATION = 2.0;

/** Poussée donnée par un mouvement du pointeur */
export const SPLAT_FORCE = 6000;
/** Rayon d'une tache à 100 % */
export const BASE_RADIUS = 0.22;
/** Quantité de couleur par tache à 100 % */
export const DYE_BASE = 0.14;
/** En dessous, plus rien de visible (< 1/255) : la boucle peut s'arrêter */
export const FADE_EPS = 0.003;
/** Immobilité (ms) avant que le pinceau ambiant prenne le relais */
export const IDLE_DELAY = 3000;
/** Plafond du devicePixelRatio (coût GPU) */
export const MAX_DPR = 1.5;
/** Plage des champs signés en repli RGBA8 (littéral GLSL) */
export const PACK_RANGE = '256.0';
