/**
 * SegmentedControl - groupe de boutons à choix unique.
 *
 * Sert au contrôle segmenté (.seg) comme aux grilles de choix (.fx-grid) :
 * chaque bouton porte sa valeur dans un attribut data-<nom>, le bouton de la
 * valeur courante porte la classe .active.
 *
 *   <div class="seg" id="opt-mode">
 *     <button type="button" data-mode="auto">Auto</button>
 *     <button type="button" data-mode="light">Clair</button>
 *   </div>
 *
 *   const mode = new SegmentedControl(el, { attr: 'mode', onChange: (v) => ... });
 *   mode.select('light');
 *
 * Le composant ne garde aucun état : la valeur affichée est celle passée à
 * select(), généralement relue dans la configuration après chaque choix.
 */
export default class SegmentedControl {
    /**
     * @param {HTMLElement} root conteneur des boutons
     * @param {{ attr: string, onChange: (value: string) => void }} options
     *        attr : nom de l'attribut de valeur (sans « data- ») ;
     *        onChange : appelé au clic sur un bouton actif
     */
    constructor(root, { attr, onChange }) {
        this.root = root;
        this.attr = `data-${attr}`;
        root.addEventListener('click', (e) => {
            const button = e.target.closest(`button[${this.attr}]`);
            if (button && !button.disabled) onChange(button.getAttribute(this.attr));
        });
    }

    /** Boutons du groupe */
    get buttons() {
        return Array.from(this.root.querySelectorAll(`button[${this.attr}]`));
    }

    /**
     * Marque le bouton de la valeur donnée (aucun si null).
     * @param {string|null} value
     */
    select(value) {
        this.buttons.forEach((button) => {
            button.classList.toggle('active', value !== null && button.getAttribute(this.attr) === value);
        });
    }

    /**
     * Désactive ou réactive tout le groupe (classe .is-disabled sur le conteneur).
     * @param {boolean} disabled
     */
    setDisabled(disabled) {
        this.root.classList.toggle('is-disabled', disabled);
        this.buttons.forEach((button) => { button.disabled = disabled; });
    }
}
