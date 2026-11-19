/**
 * Outils DOM partagés.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Échappe une valeur pour l'insérer dans du HTML */
export function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Premier élément correspondant au sélecteur */
export function qs(selector, root = document) {
    return root.querySelector(selector);
}

/** Tous les éléments correspondant au sélecteur, en tableau */
export function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

/** Crée un élément à partir d'un fragment HTML (un seul élément racine) */
export function html(markup) {
    const tpl = document.createElement('template');
    tpl.innerHTML = markup.trim();
    return tpl.content.firstElementChild;
}

/** Crée un élément avec ses attributs (className, dataset et attributs simples) */
export function el(tag, attrs = {}, content = '') {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([name, value]) => {
        if (value === null || value === undefined || value === false) return;
        if (name === 'className') node.className = value;
        else if (name === 'dataset') Object.assign(node.dataset, value);
        else node.setAttribute(name, value === true ? '' : value);
    });
    if (content) node.innerHTML = content;
    return node;
}

/** Exécute fn quand le DOM est prêt (immédiatement s'il l'est déjà) */
export function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
}
