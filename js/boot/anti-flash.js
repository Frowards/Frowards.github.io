/**
 * anti-flash - préréglages appliqués AVANT le premier affichage de la page.
 *
 * Script CLASSIQUE (pas un module), chargé de façon bloquante dans le <head> :
 * il s'exécute avant que le navigateur ne peigne quoi que ce soit, ce qui
 * évite le « flash » d'un thème ou d'une expérience par défaut le temps que
 * les modules ES (différés) prennent le relais.
 *
 * Il pose sur <html> :
 *   - data-pb-exp          expérience choisie (classic par défaut)
 *   - pb-welcome-pending   classe : l'écran d'accueil va s'afficher (une fois par visite)
 *   - data-pb-tour         'guided' si la visite guidée était active
 *   - data-pb-mode         mode effectif 'light' | 'dark' (data-theme si le mode est forcé)
 *   - pb-no-blur           classe : transparence (effet verre) désactivée
 *   - variables CSS        arrondis, bordures, polices, taille du texte, couleur d'accent
 *
 * Il reprend volontairement, en version minimale, une partie de la logique de
 * features/theme/Theme.js : un script classique ne peut rien importer. Les clés
 * de stockage doivent rester alignées sur KEYS (core/Storage.js) et les piles
 * de polices sur celles du thème.
 *
 * Enfin, si la page est ouverte directement depuis le disque (file://), les
 * modules ES sont bloqués par le navigateur : un bandeau explique comment
 * lancer le site en local. C'est la seule exception à la règle « aucun texte
 * en dur » : les dictionnaires (modules) ne peuvent justement pas se charger,
 * le message est donc bilingue et écrit ici.
 */
(() => {
    'use strict';

    /* Clés de stockage : mêmes valeurs que KEYS.EXPERIENCE, KEYS.THEME et
       KEYS.WELCOME_SEEN (cette dernière en sessionStorage) */
    const KEY_EXPERIENCE = 'pb_exp';
    const KEY_THEME = 'pb_cfg';
    const KEY_WELCOME_SEEN = 'pb_welcome_seen';

    const EXPERIENCES = ['classic', 'retro', 'future', 'gamer'];

    /* Piles de polices proposées par le panneau de thème */
    const FONT_STACKS = {
        cinzel: "'Cinzel', 'Georgia', serif",
        serif: "'Georgia', 'Times New Roman', serif",
        system: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
        mono: "'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
        terminal: "'VT323', 'Cascadia Code', 'Consolas', monospace",
        orbitron: "'Orbitron', 'Segoe UI', sans-serif",
        exo: "'Exo 2', 'Segoe UI', sans-serif",
        pixel: "'Press Start 2P', 'Cascadia Code', monospace"
    };

    const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

    const root = document.documentElement;

    /**
     * Valeur JSON stockée, ou fallback si absente.
     * Lève une exception si le stockage est inaccessible ou la valeur corrompue :
     * chaque étape est protégée par son propre try / catch (voir en bas).
     */
    const readJSON = (key, fallback) => {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    /** Écran d'accueil déjà montré pendant cette visite (onglet) ? */
    const welcomeSeen = () => {
        try { return window.sessionStorage.getItem(KEY_WELCOME_SEEN) === '1'; } catch (e) { return false; }
    };

    /**
     * Expérience choisie sur l'écran d'accueil. L'écran s'affiche une fois par
     * visite (et toujours tant qu'aucun choix n'est fait) : la page reste alors
     * masquée jusqu'à son ouverture.
     */
    const applyExperience = () => {
        const choice = readJSON(KEY_EXPERIENCE, null);
        const known = Boolean(choice) && EXPERIENCES.includes(choice.exp);
        root.setAttribute('data-pb-exp', known ? choice.exp : 'classic');
        if (known && choice.tour === 'guided') root.setAttribute('data-pb-tour', 'guided');
        if (!known || !welcomeSeen()) root.classList.add('pb-welcome-pending');
    };

    /** Configuration du thème : mode, transparence, arrondis, bordures, polices, accent */
    const applyTheme = () => {
        const cfg = readJSON(KEY_THEME, {});
        const style = root.style;

        const dark = cfg.mode === 'dark'
            || (cfg.mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.setAttribute('data-pb-mode', dark ? 'dark' : 'light');
        if (cfg.mode === 'light' || cfg.mode === 'dark') root.setAttribute('data-theme', cfg.mode);
        if (cfg.glass === false) root.classList.add('pb-no-blur');

        if (typeof cfg.radiusPct === 'number') {
            const ratio = clamp(cfg.radiusPct, 0, 200) / 100;
            const radius = (base) => `${Math.round(base * ratio * 10) / 10}px`;
            style.setProperty('--pb-radius-sm', radius(4));
            style.setProperty('--pb-radius-md', radius(8));
            style.setProperty('--pb-radius-lg', radius(12));
        }
        if (typeof cfg.borderW === 'number') {
            style.setProperty('--pb-border-w', `${clamp(cfg.borderW, 1, 4)}px`);
        }
        if (cfg.borderColor && HEX_COLOR.test(cfg.borderColor)) {
            style.setProperty('--pb-border', cfg.borderColor);
            style.setProperty('--pb-border-light', cfg.borderColor);
        }

        if (FONT_STACKS[cfg.fontTitle]) style.setProperty('--pb-font-title', FONT_STACKS[cfg.fontTitle]);
        if (FONT_STACKS[cfg.fontBody]) style.setProperty('--pb-font-family', FONT_STACKS[cfg.fontBody]);
        if (typeof cfg.fontScale === 'number') style.fontSize = `${clamp(cfg.fontScale, 80, 125)}%`;

        if (cfg.accent && HEX_COLOR.test(cfg.accent)) {
            const n = parseInt(cfg.accent.slice(1), 16);
            let rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
            /* En mode clair, l'accent est assombri (30 %) pour rester lisible */
            if (!dark) rgb = rgb.map((v) => Math.round(v * 0.7));
            const hex = `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
            style.setProperty('--pb-primary', hex);
            style.setProperty('--pb-primary-hover', hex);
            style.setProperty('--pb-primary-light', hex);
            style.setProperty('--pb-primary-rgb', rgb.join(', '));
            style.setProperty('--pb-primary-alpha', `rgba(${rgb.join(', ')}, 0.15)`);
        }
    };

    /** Bandeau « lancez le serveur local » quand la page est ouverte en file:// */
    const warnIfOpenedFromDisk = () => {
        if (window.location.protocol !== 'file:') return;
        const show = () => {
            /* Styles en ligne avec repli : le bandeau doit rester lisible même
               si les feuilles de style ne se chargent pas */
            const banner = document.createElement('p');
            banner.setAttribute('role', 'alert');
            banner.style.cssText = [
                'position: fixed', 'inset: auto 0 0 0', 'z-index: 10000', 'margin: 0',
                'padding: 0.8rem 1rem', 'text-align: center', 'font: 600 0.9rem/1.5 system-ui, sans-serif',
                'background: var(--pb-warning, #F59E0B)', 'color: #111'
            ].join(';');
            banner.textContent = 'Ouverture directe impossible : lancez lancer-en-local.cmd (serveur local).'
                + ' - Opening this file directly does not work: run lancer-en-local.cmd (local server).';
            document.body.appendChild(banner);
        };
        if (document.body) show();
        else document.addEventListener('DOMContentLoaded', show, { once: true });
    };

    try { applyExperience(); } catch (e) { root.setAttribute('data-pb-exp', 'classic'); }
    try { applyTheme(); } catch (e) { /* thème par défaut des feuilles de style */ }
    warnIfOpenedFromDisk();
})();
