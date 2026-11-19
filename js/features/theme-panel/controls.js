/**
 * Briques de balisage des réglages générés en JS (réglages d'effet, fond de
 * page, décorations, événements) et petits outils partagés par les vues.
 *
 * Les fonctions renvoient des chaînes HTML : chaque texte et chaque valeur
 * est échappé ici ; `attrs` est un fragment d'attributs déjà construit par
 * l'appelant (ex. 'data-ep="speed"').
 */
import { t } from '../../core/Lang.js';
import { esc } from '../../utils/dom.js';

/**
 * Partie de clé de traduction d'un nom : 'borderW' -> 'BORDER_W'.
 * @param {string} name
 * @returns {string}
 */
export const keyPart = (name) => String(name).replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();

/** Nom traduit d'un thème d'événement ('pinkoctober' -> « Octobre rose ») */
export const eventName = (key) => t(`THEME.EV_${keyPart(key)}`);

/** Paragraphe de note */
export function note(text) {
    return `<p class="theme-note">${esc(text)}</p>`;
}

/**
 * Petit bouton arrondi.
 * @param {string} label
 * @param {string} attrs attributs d'action (ex. 'data-ep-reset')
 * @param {{ active?: boolean }} [options]
 */
export function miniButton(label, attrs, { active = false } = {}) {
    return `<button type="button" class="mini-btn${active ? ' active' : ''}" ${attrs}>${esc(label)}</button>`;
}

/**
 * Pastille qui montre une couleur et ouvre le sélecteur natif.
 * @param {{ label: string, value: string, attrs: string }} options
 */
export function colorSwatch({ label, value, attrs }) {
    return `<label class="swatch-custom swatch-value" style="--sw:${esc(value)}" title="${esc(label)}">`
        + `<input type="color" ${attrs} value="${esc(value)}" aria-label="${esc(label)}"></label>`;
}

/**
 * Ligne « libellé + curseur + valeur ».
 * @param {{ label: string, attrs: string, min: number, max: number, step: number,
 *           value: number, output: string }} options
 */
export function sliderRow({ label, attrs, min, max, step, value, output }) {
    return `<label class="slider-row"><span>${esc(label)}</span>`
        + `<input type="range" ${attrs} min="${esc(min)}" max="${esc(max)}" step="${esc(step)}" value="${esc(value)}">`
        + `<output>${esc(output)}</output></label>`;
}

/**
 * Ligne « libellé + liste déroulante ».
 * @param {{ label: string, attrs: string,
 *           options: Array<{ value: string, label: string, selected?: boolean }> }} options
 */
export function selectRow({ label, attrs, options }) {
    const items = options.map((option) => (
        `<option value="${esc(option.value)}"${option.selected ? ' selected' : ''}>${esc(option.label)}</option>`
    )).join('');
    return `<label class="select-row"><span>${esc(label)}</span><select class="pb-select" ${attrs}>${items}</select></label>`;
}

/**
 * Interrupteur (case à cocher stylée).
 * @param {{ attrs: string, checked: boolean, title?: string, ariaLabel?: string }} options
 */
export function switchControl({ attrs, checked, title, ariaLabel }) {
    const titleAttr = title ? ` title="${esc(title)}"` : '';
    const ariaAttr = ariaLabel ? ` aria-label="${esc(ariaLabel)}"` : '';
    return `<span class="switch"${titleAttr}><input type="checkbox" ${attrs}${checked ? ' checked' : ''}${ariaAttr}>`
        + '<span class="track"></span></span>';
}

/**
 * Ligne « libellé + interrupteur ».
 * @param {{ label: string, attrs: string, checked: boolean }} options
 */
export function switchRow({ label, ...control }) {
    return `<label class="switch-row"><span>${esc(label)}</span>${switchControl(control)}</label>`;
}

/**
 * Fait suivre aux pastilles .swatch-value la couleur choisie dans leur
 * sélecteur, pendant le choix.
 * @param {HTMLElement} root conteneur surveillé
 */
export function trackSwatchValues(root) {
    root.addEventListener('input', (e) => {
        const input = e.target;
        if (input.type === 'color' && input.parentNode.classList.contains('swatch-value')) {
            input.parentNode.style.setProperty('--sw', input.value);
        }
    });
}
