/**
 * Pictos au trait du site (famille 'line' : 24 x 24, trait = couleur d'accent, classe .li).
 *
 * Utilisés par la page (navigation, en-tête, cartes, compétences, contact,
 * panneau de thème) :
 *     <svg data-icon="mail"></svg>          en HTML, rempli par Icon.hydrate()
 *     Icon.svg('mail')                       en JS
 */
import Icon from '../Icon.js';

Icon.register({
    /* drapeau planté (Parcours) */
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2.5 3.5L16 11H5"/>',
    /* grille de blocs (Compétences, design system) */
    grid: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
    /* ampoule (Projets) */
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
    /* enveloppe (contact) */
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    /* soleil (passer en mode clair) */
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    /* lune (passer en mode sombre) */
    moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    /* roue crantée (personnaliser le thème) */
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/>',
    /* croix (fermer) */
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    /* dé (thème aléatoire) */
    dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.4"/><circle cx="15.5" cy="8.5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="8.5" cy="15.5" r="1.4"/><circle cx="15.5" cy="15.5" r="1.4"/>',
    /* globe (international) */
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18-3-4-3-14.5 0-18z"/>',
    /* écran (interfaces web) */
    monitor: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M8 21h8"/>',
    /* personne (UI / UX) */
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    /* document avec lignes (architecture front) */
    'file-text': '<path d="M14 3v6h6"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M9 13h6M9 17h6"/>',
    /* point rayonnant (UI / UX de bout en bout) */
    focus: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
    /* invite de commande (API et logique métier) */
    terminal: '<path d="M4 17l6-6-6-6"/><path d="M12 19h8"/>',
    /* base de données */
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    /* liste à puces (intégrations) */
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>',
    /* chariot (portail de commandes) */
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 7H6"/>',
    /* bouclier validé (production et fiabilité) */
    'shield-check': '<path d="M12 3l7 4v5c0 4.4-3 8.4-7 9.5C8 20.4 5 16.4 5 12V7l7-4z"/><path d="M9 12l2 2 4-4"/>',
    /* tableau de présentation (organisation et transmission) */
    presentation: '<path d="M3 4h18"/><path d="M5 4v11h14V4"/><path d="M9 8l2 2 4-4"/><path d="M12 15v3"/><path d="M8.5 21l3.5-3 3.5 3"/>',
    /* crayon (UI / UX design) */
    pen: '<path d="M17 3l4 4L8 20l-5 1 1-5L17 3z"/>',
    /* silhouette (accessibilité) */
    accessibility: '<circle cx="12" cy="4.5" r="2"/><path d="M4 9c5 1.5 11 1.5 16 0M12 10v5l-3 6M12 15l3 6"/>',
    /* flèches d'échange (API REST) */
    transfer: '<path d="M7 7h10M17 7l-3-3M17 7l-3 3M17 17H7M7 17l3-3M7 17l3 3"/>',
    /* document (génération PDF) */
    file: '<path d="M14 3v6h6"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/>',
    /* serveurs empilés (mRemoteNG) */
    server: '<rect x="3" y="3" width="18" height="6" rx="1.5"/><rect x="3" y="15" width="18" height="6" rx="1.5"/><path d="M7 6h.01M7 18h.01M12 9v6"/>',
    /* cœur (au service des utilisateurs) */
    heart: '<path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.4 5.5 6.5 5.5c2 0 3.7 1.2 5.5 3.2 1.8-2 3.5-3.2 5.5-3.2 3.1 0 5.3 3.1 4 6.3C19.5 16.4 12 21 12 21z"/>',
    /* flèche circulaire (faire, refaire) */
    refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
    /* étincelles (plaisir coupable) */
    sparkles: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 14l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9L19 14z"/>',
    /* combiné (téléphone) */
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    /* LinkedIn au trait */
    'linkedin-square': '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 11v5M8 8v.01M12 16v-3a2 2 0 0 1 4 0v3"/>',
    /* repère de carte (localisation) */
    'map-pin': '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'
});
