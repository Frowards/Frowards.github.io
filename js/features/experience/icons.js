/**
 * Icônes des expériences (écran d'accueil, bouton du header).
 *
 * Le soleil, la lune et la croix viennent du registre commun
 * (components/icons/ui.js), importé ici pour garantir leur présence.
 */
import Icon from '../../components/Icon.js';
import '../../components/icons/ui.js';

Icon.register({
    /* étincelles (changer d'expérience) */
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    /* boussole (visite guidée) */
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    /* souris à molette (visite libre) */
    scroll: '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 7v3"/>'
});
