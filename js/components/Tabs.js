/**
 * Tabs - onglets accessibles (motif WAI-ARIA « Tabs » : l'onglet est
 * sélectionné au clic comme aux flèches du clavier).
 *
 * Balisage attendu :
 *   <div role="tablist">
 *     <button role="tab" data-tab="nom" aria-controls="id-du-volet" aria-selected="true">...</button>
 *     ...
 *   </div>
 *   <div role="tabpanel" id="id-du-volet">...</div>
 *
 * - Un seul onglet est atteignable à la tabulation (tabindex 0), les autres
 *   au clavier par Flèche gauche / droite (en boucle), Début et Fin.
 * - Le volet de chaque onglet (aria-controls) est affiché ou masqué (hidden).
 *
 * Utilisation :
 *   const tabs = new Tabs(tablist, { onSelect: (name) => { ... } });
 *   tabs.select('style');
 *   tabs.focusSelected();
 */
export default class Tabs {
    /**
     * @param {HTMLElement} tablist élément role="tablist"
     * @param {{ onSelect?: (name: string) => void }} [options]
     *        onSelect : appelé après chaque changement d'onglet
     */
    constructor(tablist, { onSelect } = {}) {
        this.tablist = tablist;
        this.tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        this.onSelect = onSelect || null;
        tablist.addEventListener('click', (e) => this.handleClick(e));
        tablist.addEventListener('keydown', (e) => this.handleKey(e));
    }

    /** Nom de l'onglet sélectionné (data-tab), ou null */
    get selected() {
        const tab = this.tabs.find((t) => t.getAttribute('aria-selected') === 'true');
        return tab ? tab.dataset.tab : null;
    }

    /**
     * Sélectionne l'onglet name et affiche son volet.
     * @param {string} name valeur data-tab de l'onglet
     * @param {{ focus?: boolean }} [options] focus : donne le focus à l'onglet
     */
    select(name, { focus = false } = {}) {
        this.tabs.forEach((tab) => {
            const on = tab.dataset.tab === name;
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
            tab.tabIndex = on ? 0 : -1;
            if (on && focus) tab.focus();
            const pane = document.getElementById(tab.getAttribute('aria-controls'));
            if (pane) pane.hidden = !on;
        });
        if (this.onSelect) this.onSelect(name);
    }

    /** Donne le focus à l'onglet sélectionné */
    focusSelected() {
        const tab = this.tabs.find((t) => t.getAttribute('aria-selected') === 'true');
        if (tab) tab.focus();
    }

    /** Clic sur un onglet */
    handleClick(e) {
        const tab = e.target.closest('[role="tab"]');
        if (tab && this.tabs.includes(tab)) this.select(tab.dataset.tab);
    }

    /** Navigation au clavier entre les onglets */
    handleKey(e) {
        const index = this.tabs.indexOf(document.activeElement);
        if (index === -1) return;
        const count = this.tabs.length;
        let next;
        switch (e.key) {
            case 'ArrowRight': next = (index + 1) % count; break;
            case 'ArrowLeft': next = (index - 1 + count) % count; break;
            case 'Home': next = 0; break;
            case 'End': next = count - 1; break;
            default: return;
        }
        e.preventDefault();
        this.select(this.tabs[next].dataset.tab, { focus: true });
    }
}
