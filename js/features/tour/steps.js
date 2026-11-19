/**
 * Étapes du parcours, partagées par la visite guidée et le HUD des
 * expériences : chaque étape associe une clé (nom traduit EXP.SEC_<CLE>)
 * à la section de la page qui la porte.
 */
import { t } from '../../core/Lang.js';
import { qs } from '../../utils/dom.js';

/** Étapes dans l'ordre de lecture de la page */
export const STEPS = Object.freeze([
    { key: 'hero', sel: '.hero' },
    { key: 'ceres', sel: '#ceres' },
    { key: 'journey', sel: '#parcours' },
    { key: 'skills', sel: '#competences' },
    { key: 'projects', sel: '#projets' },
    { key: 'philosophy', sel: '#philosophie' },
    { key: 'contact', sel: '#contact' }
]);

/** Nom traduit d'une étape à partir de sa clé ('ceres' -> « Ceres ») */
export function sectionName(key) {
    return t(`EXP.SEC_${key.toUpperCase()}`);
}

/**
 * Étapes présentes dans la page, avec leur élément.
 * @returns {{ key: string, el: HTMLElement }[]}
 */
export function collectSteps() {
    return STEPS
        .map(({ key, sel }) => ({ key, el: qs(sel) }))
        .filter((step) => Boolean(step.el));
}

/** Nombre sur deux chiffres (7 -> « 07 ») */
export function pad2(n) {
    return String(n).padStart(2, '0');
}
