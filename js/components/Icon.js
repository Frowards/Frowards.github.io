/**
 * Icon - icônes SVG du site, toutes rangées dans des registres.
 *
 * Deux familles :
 *   - 'line'  : pictos au trait (24 x 24, stroke = currentColor), classe .li
 *   - 'brand' : logos pleins Simple Icons (24 x 24, fill), classe .si
 *
 * Chaque domaine enregistre ses icônes (Icon.register) au lieu de recopier du
 * SVG dans son balisage :
 *     Icon.register({ mail: '<rect .../><path .../>' });            // trait
 *     Icon.register({ php: '<path d="..."/>' }, 'brand');           // logo
 *
 * Utilisation :
 *   - en JS      : Icon.svg('mail')  ->  '<svg class="li" ...>...</svg>'
 *   - en HTML    : <svg data-icon="mail"></svg>   puis Icon.hydrate()
 *                  (les classes et attributs déjà posés sur le <svg> sont gardés)
 */
const registry = new Map();          // nom -> { body, family }

const FAMILY_CLASS = { line: 'li', brand: 'si' };

function attrs(family, extraClass) {
    const cls = [FAMILY_CLASS[family], extraClass].filter(Boolean).join(' ');
    return `class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"`;
}

const Icon = {
    /** Enregistre des icônes { nom: contenu SVG } dans la famille donnée */
    register(icons, family = 'line') {
        Object.entries(icons).forEach(([name, body]) => registry.set(name, { body, family }));
    },

    has(name) {
        return registry.has(name);
    },

    /** Balisage SVG complet de l'icône (chaîne vide si inconnue) */
    svg(name, extraClass = '') {
        const icon = registry.get(name);
        if (!icon) {
            console.warn(`[Icon] icône inconnue : ${name}`);
            return '';
        }
        return `<svg ${attrs(icon.family, extraClass)}>${icon.body}</svg>`;
    },

    /** Remplit tous les <svg data-icon="nom"> présents sous root */
    hydrate(root = document) {
        root.querySelectorAll('svg[data-icon]').forEach((node) => {
            const icon = registry.get(node.dataset.icon);
            if (!icon) {
                console.warn(`[Icon] icône inconnue : ${node.dataset.icon}`);
                return;
            }
            node.classList.add(FAMILY_CLASS[icon.family]);
            if (!node.hasAttribute('viewBox')) node.setAttribute('viewBox', '0 0 24 24');
            if (!node.hasAttribute('aria-label')) node.setAttribute('aria-hidden', 'true');
            node.setAttribute('focusable', 'false');
            node.innerHTML = icon.body;
            node.removeAttribute('data-icon');
        });
    }
};

export default Icon;
