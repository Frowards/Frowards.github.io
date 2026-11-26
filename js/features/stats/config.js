/**
 * Réglages de la mesure d'audience.
 *
 * ENDPOINT : adresse du service de collecte, posée à la mise en service.
 * Tant qu'elle est vide, rien n'est mesuré ni envoyé, et la note
 * d'information de la section Contact reste masquée.
 */
export const ENDPOINT = 'https://portfolio-stats.portfolio-stats.workers.dev';

/** Service de collecte local : seulement sur localhost, avec ?stats=local */
export const LOCAL_ENDPOINT = 'http://localhost:8787';

/** Paramètres lus dans l'adresse, puis retirés */
export const PARAMS = Object.freeze({
    SRC: 'src',       // code du lien (support ou entreprise, jamais une personne)
    REF: 'ref',       // site d'origine transmis par /en/ (redirection)
    STATS: 'stats'    // off / on : refuser ou accepter la mesure ; local : essai
});

/** Au-delà de ce délai sans geste, le temps passé n'est plus compté (ms) */
export const IDLE_MS = 60000;

/** Délai du premier bilan après l'arrivée, puis rythme des suivants (ms) */
export const FIRST_REPORT_MS = 10000;
export const REPORT_EVERY_MS = 60000;

/** Nombre maximal d'envois par visite */
export const MAX_REPORTS = 60;
