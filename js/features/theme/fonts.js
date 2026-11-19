/**
 * Piles de polices proposées pour les titres et le texte
 * (mêmes choix que FONT_STACKS de CeresGlobalTheme).
 *
 * Les clés sont les valeurs des listes « Titres » et « Texte » du panneau
 * (onglet Style) et de fontTitle / fontBody dans la configuration.
 * Note : le script anti-flash du <head> en garde une copie, car il
 * s'exécute avant le chargement des modules.
 */
export const FONT_STACKS = Object.freeze({
    cinzel: "'Cinzel', 'Georgia', serif",
    serif: "'Georgia', 'Times New Roman', serif",
    system: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
    mono: "'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
    /* Polices des expériences (écran d'accueil) */
    terminal: "'VT323', 'Cascadia Code', 'Consolas', monospace",
    orbitron: "'Orbitron', 'Segoe UI', sans-serif",
    exo: "'Exo 2', 'Segoe UI', sans-serif",
    pixel: "'Press Start 2P', 'Cascadia Code', monospace"
});

/**
 * Pile de polices de la clé donnée, ou celle de fallbackKey si la clé est inconnue.
 * @param {string} key
 * @param {string} fallbackKey
 * @returns {string}
 */
export function fontStack(key, fallbackKey) {
    return FONT_STACKS[key] || FONT_STACKS[fallbackKey];
}
