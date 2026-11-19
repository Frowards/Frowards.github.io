/**
 * Lang - traductions du site (français / anglais).
 *
 * - Dictionnaires enregistrés par register({ fr, en }) (voir languages/index.js)
 * - Clés au format "CATEGORIE.CLE", paramètres {nom} remplacés par t()
 * - Traduction du DOM par attributs :
 *     data-i18n        texte de l'élément
 *     data-i18n-html   contenu HTML (réservé aux clés maîtrisées des dictionnaires)
 *     data-i18n-aria   attribut aria-label
 *     data-i18n-title  attribut title
 * - Langue par défaut : celle du navigateur ; choix mémorisé (Storage)
 * - Chaque changement émet lang:change (Events)
 */
import Storage, { KEYS } from './Storage.js';
import Events from './Events.js';
import { qsa } from '../utils/dom.js';

const LANGS = ['fr', 'en'];
const dicts = { fr: {}, en: {} };
let current = 'fr';

const ATTRIBUTES = [
    ['data-i18n', (node, txt) => { node.textContent = txt; }],
    ['data-i18n-html', (node, txt) => { node.innerHTML = txt; }],
    ['data-i18n-aria', (node, txt) => { node.setAttribute('aria-label', txt); }],
    ['data-i18n-title', (node, txt) => { node.setAttribute('title', txt); }]
];

function browserLang() {
    return (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

const Lang = {
    get lang() { return current; },

    /** Ajoute des traductions ({ fr: {...}, en: {...} }) */
    register(bundle) {
        LANGS.forEach((lang) => Object.assign(dicts[lang], bundle[lang] || {}));
    },

    /** Texte traduit de key, avec remplacement des {paramètres} */
    t(key, params) {
        let txt = dicts[current][key];
        if (txt === undefined) return key;
        if (params) {
            Object.entries(params).forEach(([name, value]) => {
                txt = txt.split(`{${name}}`).join(value);
            });
        }
        return txt;
    },

    /** Traduit les éléments marqués sous root (toute la page par défaut) */
    translate(root = document) {
        ATTRIBUTES.forEach(([attr, apply]) => {
            qsa(`[${attr}]`, root).forEach((node) => {
                const txt = dicts[current][node.getAttribute(attr)];
                if (txt !== undefined) apply(node, txt);
            });
        });
    },

    /** Applique la langue courante à toute la page et prévient les modules */
    apply() {
        document.documentElement.lang = current;
        Lang.translate();
        document.title = Lang.t('PAGE.TITLE');
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', Lang.t('PAGE.DESC'));
        Events.emit('lang:change', { lang: current });
    },

    set(lang) {
        current = LANGS.includes(lang) ? lang : 'fr';
        Storage.set(KEYS.LANG, current);
        Lang.apply();
    },

    toggle() {
        Lang.set(current === 'fr' ? 'en' : 'fr');
    },

    /** Raccourci d'abonnement à lang:change */
    onChange(fn) {
        return Events.on('lang:change', ({ lang }) => fn(lang));
    },

    init() {
        const stored = Storage.get(KEYS.LANG);
        current = LANGS.includes(stored) ? stored : browserLang();
        Lang.apply();
    }
};

/** Raccourci pratique : import { t } from '../core/Lang.js' */
export const t = (key, params) => Lang.t(key, params);

export default Lang;
