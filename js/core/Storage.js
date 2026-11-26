/**
 * Storage - accès au stockage du navigateur sans risque.
 *
 * - Storage.get / set / getJSON / setJSON / remove : localStorage (durable)
 * - Storage.session.get / set : sessionStorage (le temps d'une visite :
 *   effacé à la fermeture de l'onglet)
 *
 * Le stockage peut être indisponible (navigation privée, données bloquées,
 * aperçu) : chaque lecture renvoie alors la valeur de repli et chaque
 * écriture est ignorée, sans jamais lever d'exception.
 *
 * Toutes les clés du site sont déclarées dans KEYS : aucune chaîne de clé
 * ne doit être écrite en dur ailleurs.
 */

/** Clés utilisées par le portfolio (préfixe pb_ commun) */
export const KEYS = Object.freeze({
    LANG: 'pb_lang',              // langue choisie ('fr' | 'en')
    THEME: 'pb_cfg',              // réglages du thème (objet)
    EXPERIENCE: 'pb_exp',         // expérience et visite choisies ({ exp, tour, at })
    MASCOT: 'pb_mascot',          // mascotte masquée ('off') ou visible
    WELCOME_SEEN: 'pb_welcome_seen', // (session) écran d'accueil déjà montré pendant cette visite
    TOUR_STEP: 'pb_tour_step',      // (session) étape de la visite guidée à l'écran
    SCROLL_POS: 'pb_scroll_pos',    // (session) position de lecture en visite libre ({ i, dy })
    ORIENT_HINT_OFF: 'pb_orient_off', // (session) conseil « tournez votre téléphone » refermé
    STATS: 'pb_stats',              // mesure d'audience refusée ('off')
    TOC_POS: 'pb_toc_pos'           // position du bouton du sommaire ({ side, t })
});

function area(kind) {
    try { return kind === 'session' ? window.sessionStorage : window.localStorage; } catch (e) { return null; }
}

function read(key, kind = 'local') {
    try { return area(kind).getItem(key); } catch (e) { return null; }
}

function write(key, value, kind = 'local') {
    try { area(kind).setItem(key, value); return true; } catch (e) { return false; }
}

const Storage = {
    /** Chaîne brute, ou fallback si absente / illisible */
    get(key, fallback = null) {
        const value = read(key);
        return value === null ? fallback : value;
    },

    set(key, value) {
        return write(key, String(value));
    },

    /** Objet JSON, ou fallback si absent / corrompu */
    getJSON(key, fallback = null) {
        const raw = read(key);
        if (raw === null) return fallback;
        try { return JSON.parse(raw); } catch (e) { return fallback; }
    },

    setJSON(key, value) {
        return write(key, JSON.stringify(value));
    },

    remove(key) {
        try { window.localStorage.removeItem(key); } catch (e) { /* stockage indisponible */ }
    },

    /** Mémoire de la visite en cours (sessionStorage) */
    session: {
        get(key, fallback = null) {
            const value = read(key, 'session');
            return value === null ? fallback : value;
        },

        set(key, value) {
            return write(key, String(value), 'session');
        }
    }
};

export default Storage;
