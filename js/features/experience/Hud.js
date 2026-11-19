/**
 * Hud - indicateur de progression dans le parcours (#pb-journey), habillé
 * selon l'expérience (css/features/experience/hud.css) :
 *   - Classique : fine barre de progression sous le header
 *   - Rétro     : ligne de commande « C:\PIERRE\CERES>  42% » en bas d'écran
 *   - Spatial   : boîtier d'analyse « SECTEUR 02/07 » (dans le cockpit)
 *   - Gamer     : niveau, barre d'XP pixelisée et points d'expérience
 * Purement visuel (aria-hidden) : la progression est déjà portée par la page.
 */
import { t } from '../../core/Lang.js';
import { esc, qs } from '../../utils/dom.js';

let hud = null;

/** Squelette du HUD de chaque expérience */
const LAYOUTS = {
    classic: () => '<span class="xp-hud__fill"></span>',
    retro: () => '<span class="xp-hud__path"></span><b class="xp-hud__cursor"></b><span class="xp-hud__pct"></span>',
    future: () => [
        `<span class="xp-hud__label">${esc(t('EXP.HUD_FUTURE'))}</span>`,
        '<span class="xp-hud__sec"></span>',
        '<span class="xp-hud__meter"><i class="xp-hud__fill"></i></span>',
        '<span class="xp-hud__pct"></span>'
    ].join(''),
    gamer: () => '<span class="xp-hud__lvl"></span><span class="xp-hud__bar"><i class="xp-hud__fill"></i></span><span class="xp-hud__xp"></span>'
};

/** Écrit un texte dans la partie sel du HUD */
function setText(sel, text) {
    qs(sel, hud).textContent = text;
}

/** Remplit la jauge (0 à 100 %) */
function setFill(pct) {
    qs('.xp-hud__fill', hud).style.transform = `scaleX(${pct / 100})`;
}

/** Mise à jour propre à chaque expérience */
const UPDATERS = {
    classic: ({ pct }) => setFill(pct),
    retro: ({ pct, name }) => {
        setText('.xp-hud__path', t('EXP.HUD_RETRO_PATH', { name: name.toUpperCase().replace(/\s+/g, '_') }));
        setText('.xp-hud__pct', `${pct}%`);
    },
    future: ({ pct, index, total, name }) => {
        setText('.xp-hud__sec', t('EXP.HUD_SECTOR', { nn: `0${index + 1}`, total: `0${total}`, name: name.toUpperCase() }));
        setFill(pct);
        setText('.xp-hud__pct', `${pct}%`);
    },
    gamer: ({ pct, index, name }) => {
        setText('.xp-hud__lvl', t('EXP.HUD_LVL', { n: index + 1, name: name.toUpperCase() }));
        setFill(pct);
        setText('.xp-hud__xp', t('EXP.HUD_XP', { xp: pct * 10 }));
    }
};

const Hud = {
    /** Vrai une fois le HUD créé */
    get built() { return Boolean(hud); },

    /** Crée le HUD (une seule fois) et l'habille pour l'expérience exp */
    build(exp) {
        if (!hud) {
            hud = document.createElement('div');
            hud.id = 'pb-journey';
            hud.setAttribute('aria-hidden', 'true');
            document.body.appendChild(hud);
        }
        hud.className = `xp-hud xp-hud--${exp}`;
        hud.innerHTML = (LAYOUTS[exp] || LAYOUTS.gamer)();
    },

    /**
     * Affiche la progression.
     * @param {string} exp  expérience (celle du dernier build)
     * @param {object} progress
     * @param {number} progress.pct    progression (0 à 100)
     * @param {number} progress.index  étape en cours (à partir de 0)
     * @param {number} progress.total  nombre d'étapes
     * @param {string} progress.name   nom traduit de l'étape
     */
    update(exp, progress) {
        if (!hud) return;
        (UPDATERS[exp] || UPDATERS.gamer)(progress);
    }
};

export default Hud;
