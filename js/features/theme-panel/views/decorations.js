/**
 * Onglet « Fond et effets », partie décorations des cartes : un motif au
 * choix par côté (haut, bas, gauche, droite). Pendant un thème d'événement,
 * les décorations sont imposées et les listes bloquées.
 */
import { t } from '../../../core/Lang.js';
import { qsa } from '../../../utils/dom.js';
import Theme from '../../theme/Theme.js';
import { keyPart, selectRow } from '../controls.js';

/**
 * Branche le choix des décorations.
 * @param {import('../ThemePanel.js').PanelContext} ctx
 * @returns {{ sync: (snapshot: Object) => void }}
 */
export default function mountDecorations({ find, change }) {
    const grid = find('#opt-deco');

    grid.addEventListener('change', (e) => {
        const select = e.target.closest('select[data-deco]');
        if (!select) return;
        change(() => Theme.setDecoration(select.getAttribute('data-deco'), select.value || null), { resync: false });
    });

    /** Liste d'un côté : « Aucune » puis chaque motif */
    function sideSelect(side, current) {
        return selectRow({
            label: t(`THEME.DECO_${keyPart(side)}`),
            attrs: `data-deco="${side}"`,
            options: [
                { value: '', label: t('THEME.DECO_NONE') },
                ...Theme.DECORATIONS.map((key) => ({
                    value: key,
                    label: t(`THEME.DECO_${keyPart(key)}`),
                    selected: current === key
                }))
            ]
        });
    }

    return {
        sync({ config, eventKey }) {
            const decorations = config.decorations || {};
            grid.innerHTML = Theme.DECORATION_SIDES.map((side) => sideSelect(side, decorations[side])).join('');
            qsa('select', grid).forEach((select) => { select.disabled = Boolean(eventKey); });
        }
    };
}
