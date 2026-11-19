/**
 * Onglet « Fond et effets », partie effets : effet de fond (registre des
 * effets de Ceres), réglages propres à l'effet choisi (registre
 * EFFECT_PARAMS) et interaction souris.
 *
 * Pendant un thème d'événement, l'effet est imposé : la grille montre
 * l'effet de l'événement et se bloque, les réglages disparaissent.
 */
import { t } from '../../../core/Lang.js';
import { esc } from '../../../utils/dom.js';
import SegmentedControl from '../../../components/SegmentedControl.js';
import Particles from '../../../effects/particles/Particles.js';
import Theme from '../../theme/Theme.js';
import { keyPart, note, miniButton, colorSwatch, sliderRow, selectRow } from '../controls.js';

/** Libellé traduit d'un réglage d'effet (ex. 'speed' -> THEME.EP_SPEED) */
const paramLabel = (key) => t(`THEME.EP_${keyPart(key)}`);

/**
 * Contrôle d'un réglage d'effet selon son type (liste, couleur ou curseur).
 * @param {Object} param définition du registre EFFECT_PARAMS
 * @param {*} value valeur courante
 * @returns {string} HTML
 */
function paramControl(param, value) {
    const label = paramLabel(param.key);
    const attrs = `data-ep="${esc(param.key)}"`;
    if (param.type === 'select') {
        return selectRow({
            label,
            attrs,
            options: param.options.map((option) => ({
                value: option,
                label: t(`THEME.EP_${keyPart(param.key)}_${keyPart(option)}`),
                selected: option === value
            }))
        });
    }
    if (param.type === 'color') {
        return `<div class="color-row"><span>${esc(label)}</span>${colorSwatch({ label, value, attrs })}</div>`;
    }
    return sliderRow({
        label,
        attrs,
        min: param.min,
        max: param.max,
        step: param.step || 1,
        value,
        output: `${value}${param.unit || ''}`
    });
}

/**
 * Branche la partie effets de l'onglet « Fond et effets ».
 * @param {import('../ThemePanel.js').PanelContext} ctx
 * @returns {{ sync: (snapshot: Object) => void }}
 */
export default function mountEffects({ find, change, snapshot }) {
    const effect = new SegmentedControl(find('#opt-fx'), {
        attr: 'fx',
        onChange: (value) => change(() => Theme.set({ effect: value }))
    });
    const interaction = new SegmentedControl(find('#opt-inter'), {
        attr: 'inter',
        onChange: (value) => change(() => Theme.set({ interaction: value }))
    });
    const params = find('#opt-fx-params');

    /** Définition d'un réglage de l'effet choisi par le visiteur */
    const paramDef = (key) => (Particles.EFFECT_PARAMS[Theme.config.effect] || []).find((p) => p.key === key) || null;

    /** Réglages de l'effet choisi (aucun pendant un événement) */
    function renderParams({ config, eventKey }) {
        const current = eventKey ? null : config.effect;
        const list = (current && Particles.EFFECT_PARAMS[current]) || null;
        let markup = '';
        if (current === 'fluid') {
            markup += note(t(Particles.fluidSupported() ? 'THEME.FLUID_HINT' : 'THEME.FLUID_UNSUPPORTED'));
        }
        if (list) {
            const values = Object.fromEntries(list.map((p) => [p.key, Particles.param(current, p.key)]));
            list.forEach((p) => {
                /* Réglage conditionnel : affiché seulement si les réglages showIf ont la bonne valeur */
                if (p.showIf && Object.keys(p.showIf).some((k) => values[k] !== p.showIf[k])) return;
                markup += paramControl(p, values[p.key]);
            });
            markup += miniButton(t('THEME.EP_RESET'), 'data-ep-reset');
        }
        params.innerHTML = markup;
        params.hidden = !markup;
    }

    params.addEventListener('input', (e) => {
        const control = e.target.closest('[data-ep]');
        if (!control) return;
        const def = paramDef(control.getAttribute('data-ep'));
        if (!def) return;
        const value = def.type === 'select' || def.type === 'color' ? control.value : Number(control.value);
        change(() => Theme.setEffectParam(Theme.config.effect, def.key, value, def.def), { resync: false });
        const output = control.parentNode.querySelector('output');
        if (output) output.textContent = `${value}${def.unit || ''}`;
        /* Une liste peut afficher ou masquer d'autres réglages (showIf) */
        if (def.type === 'select') renderParams(snapshot());
    });

    params.addEventListener('click', (e) => {
        if (!e.target.closest('[data-ep-reset]')) return;
        const { effect: current, effectParams } = Theme.config;
        delete effectParams[current];
        change(() => Theme.set({ effectParams }), { resync: false });
        renderParams(snapshot());
    });

    return {
        sync(state) {
            const { config, eventKey } = state;
            /* Pendant un événement, l'effet affiché est celui de l'événement */
            const shown = eventKey ? (Particles.current || config.effect) : config.effect;
            effect.select(shown);
            effect.setDisabled(Boolean(eventKey));

            /* Interaction souris : sans objet pour les effets sans particules */
            const noInteraction = Particles.NO_INTERACTION.includes(shown);
            interaction.setDisabled(noInteraction);
            interaction.select(noInteraction ? null : config.interaction);

            renderParams(state);
        }
    };
}
