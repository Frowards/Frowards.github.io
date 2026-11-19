/**
 * Onglet « Couleurs » : mode clair / sombre / auto, couleur d'accent
 * (pastilles + couleur libre), couleur des bordures et note « événement
 * en cours » (l'événement impose alors son accent).
 */
import { t } from '../../../core/Lang.js';
import { qsa } from '../../../utils/dom.js';
import SegmentedControl from '../../../components/SegmentedControl.js';
import Theme from '../../theme/Theme.js';
import { eventName } from '../controls.js';

/**
 * Branche l'onglet Couleurs.
 * @param {import('../ThemePanel.js').PanelContext} ctx
 * @returns {{ sync: (snapshot: Object) => void }}
 */
export default function mountColors({ find, change }) {
    const mode = new SegmentedControl(find('#opt-mode'), {
        attr: 'mode',
        onChange: (value) => change(() => Theme.set({ mode: value }))
    });

    /* Pastilles d'accent (data-default = cyan Ceres, enregistré comme « aucun accent ») */
    const accentGrid = find('#opt-accent');
    const swatches = qsa('.swatch[data-accent]', accentGrid);
    const customAccent = find('#opt-accent-custom');
    const customSwatch = customAccent.closest('.swatch-custom');
    accentGrid.addEventListener('click', (e) => {
        const swatch = e.target.closest('.swatch[data-accent]');
        if (!swatch || swatch.disabled) return;
        const accent = swatch.hasAttribute('data-default') ? null : swatch.getAttribute('data-accent');
        change(() => Theme.set({ accent }));
    });
    customAccent.addEventListener('input', () => change(() => Theme.set({ accent: customAccent.value })));

    /* Couleur des bordures : personnalisée, ou « Auto » (couleur du thème) */
    const borderColor = find('#opt-bordercolor');
    const borderAuto = find('#opt-bordercolor-auto');
    borderColor.addEventListener('input', () => change(() => Theme.set({ borderColor: borderColor.value })));
    borderAuto.addEventListener('click', () => change(() => Theme.set({ borderColor: null })));

    const eventNote = find('#opt-event-note');

    return {
        sync({ config, eventKey, previewKey }) {
            mode.select(config.mode);

            /* Pendant un événement, l'accent est imposé : les pastilles sont bloquées */
            let isPreset = false;
            swatches.forEach((swatch) => {
                const on = (config.accent || '') === swatch.getAttribute('data-accent')
                    || (!config.accent && swatch.hasAttribute('data-default'));
                swatch.classList.toggle('active', on);
                swatch.disabled = Boolean(eventKey);
                if (on) isPreset = true;
            });
            customSwatch.classList.toggle('active', Boolean(config.accent) && !isPreset);
            customAccent.disabled = Boolean(eventKey);
            if (config.accent) customAccent.value = config.accent;

            eventNote.hidden = !eventKey;
            if (eventKey) {
                const key = previewKey ? 'THEME.EV_NOTE_PREVIEW' : 'THEME.EV_NOTE';
                eventNote.textContent = t(key, { name: eventName(eventKey) });
            }

            if (config.borderColor) borderColor.value = config.borderColor;
            borderAuto.classList.toggle('active', !config.borderColor);
        }
    };
}
