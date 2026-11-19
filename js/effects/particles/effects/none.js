/**
 * Effet vide : le canvas 2D reste blanc. Sert à 'off' (fond désactivé)
 * et à 'fluid', dont le rendu WebGL est délégué au module Fluid sur son
 * propre canvas (#pb-fluid).
 */
export default {
    init() {
        return {};
    },

    step() {
        /* rien à dessiner */
    }
};
