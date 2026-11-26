/**
 * Dictionnaires du site, assemblés par domaine.
 *
 * Chaque domaine possède sa paire fr.js / en.js (mêmes clés des deux côtés) ;
 * main.js enregistre l'ensemble auprès de Lang.
 */
import siteFr from './site/fr.js';
import siteEn from './site/en.js';
import themeFr from './theme/fr.js';
import themeEn from './theme/en.js';
import experienceFr from './experience/fr.js';
import experienceEn from './experience/en.js';
import tourFr from './tour/fr.js';
import tourEn from './tour/en.js';
import mascotFr from './mascot/fr.js';
import mascotEn from './mascot/en.js';
import statsFr from './stats/fr.js';
import statsEn from './stats/en.js';

export default {
    fr: { ...siteFr, ...themeFr, ...experienceFr, ...tourFr, ...mascotFr, ...statsFr },
    en: { ...siteEn, ...themeEn, ...experienceEn, ...tourEn, ...mascotEn, ...statsEn }
};
