/**
 * Onglet « Style » : arrondis (0-200 %), épaisseur des bordures (1-4 px),
 * polices des titres et du texte, taille du texte et transparence (verre).
 *
 * Les curseurs appliquent le réglage en direct sans resynchroniser le
 * panneau (le curseur manipulé ne doit pas être réécrit pendant le geste).
 */
import Theme from '../../theme/Theme.js';

/**
 * Branche l'onglet Style.
 * @param {import('../ThemePanel.js').PanelContext} ctx
 * @returns {{ sync: (snapshot: Object) => void }}
 */
export default function mountStyle({ find, change }) {
    /** Curseurs : réglage du thème (clé de configuration) + valeur affichée avec son unité */
    const sliders = [
        { input: find('#opt-radius'), output: find('#opt-radius-val'), key: 'radiusPct', unit: '%' },
        { input: find('#opt-borderw'), output: find('#opt-borderw-val'), key: 'borderW', unit: 'px' },
        { input: find('#opt-fontscale'), output: find('#opt-fontscale-val'), key: 'fontScale', unit: '%' }
    ];
    sliders.forEach(({ input, output, key, unit }) => {
        input.addEventListener('input', () => {
            change(() => Theme.set({ [key]: Number(input.value) }), { resync: false });
            output.textContent = `${input.value}${unit}`;
        });
    });

    /* Listes de polices et interrupteur de transparence */
    const fontTitle = find('#opt-font-title');
    const fontBody = find('#opt-font-body');
    const glass = find('#opt-glass');
    fontTitle.addEventListener('change', () => change(() => Theme.set({ fontTitle: fontTitle.value }), { resync: false }));
    fontBody.addEventListener('change', () => change(() => Theme.set({ fontBody: fontBody.value }), { resync: false }));
    glass.addEventListener('change', () => change(() => Theme.set({ glass: glass.checked }), { resync: false }));

    return {
        sync({ config }) {
            sliders.forEach(({ input, output, key, unit }) => {
                input.value = config[key];
                output.textContent = `${config[key]}${unit}`;
            });
            glass.checked = Boolean(config.glass);
            fontTitle.value = config.fontTitle;
            fontBody.value = config.fontBody;
        }
    };
}
