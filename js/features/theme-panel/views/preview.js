/**
 * Colonne d'aperçu : la carte de démonstration reflète les réglages en
 * direct (par les variables CSS, sans code) ; ses boutons tirent un thème
 * aléatoire ou ramènent au thème de base de l'expérience.
 */
import Theme from '../../theme/Theme.js';

/**
 * Branche les boutons de la colonne d'aperçu.
 * @param {import('../ThemePanel.js').PanelContext} ctx
 */
export default function mountPreview({ find, change }) {
    /* Dé de la carte de démonstration : accent, effet, arrondis, polices... au hasard */
    find('#opt-random').addEventListener('click', () => change(() => Theme.randomize()));
    /* « Revenir au thème de base » : défauts + préréglage de l'expérience */
    find('#opt-reset').addEventListener('click', () => change(() => Theme.reset()));
}
