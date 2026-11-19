/**
 * Events - bus d'événements de l'application.
 *
 * Les modules se préviennent par des événements nommés au lieu de
 * s'appeler les uns les autres : le thème n'a pas besoin de connaître le
 * panneau, la visite guidée n'a pas besoin de connaître la mascotte, etc.
 *
 * Événements émis (détail entre accolades) :
 *   - lang:change         { lang }               langue appliquée à la page
 *   - theme:change        { config, mode }       thème appliqué (mode effectif 'light' | 'dark')
 *   - experience:change   { exp, mode }          expérience appliquée
 *   - tour:toggle         { active }             visite guidée activée / quittée
 *   - tour:step           { index, count }       étape de la visite affichée
 *   - panel:toggle        { open }               panneau de personnalisation ouvert / fermé
 */

const listeners = new Map();

const Events = {
    /**
     * Abonne fn à l'événement name.
     * @returns {Function} fonction de désabonnement
     */
    on(name, fn) {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(fn);
        return () => Events.off(name, fn);
    },

    off(name, fn) {
        const set = listeners.get(name);
        if (set) set.delete(fn);
    },

    /** Prévient les abonnés ; l'erreur d'un abonné n'empêche pas les suivants */
    emit(name, detail = {}) {
        const set = listeners.get(name);
        if (!set) return;
        [...set].forEach((fn) => {
            try { fn(detail); } catch (err) { console.error(`[Events] ${name}`, err); }
        });
    }
};

export default Events;
