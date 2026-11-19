/**
 * Onglet « Fond et effets », partie fond de page : Standard, Dégradé,
 * Sous l'eau ou Image, avec les réglages du type choisi (couleurs par mode,
 * animation, image importée et son opacité).
 */
import { t } from '../../../core/Lang.js';
import { esc } from '../../../utils/dom.js';
import SegmentedControl from '../../../components/SegmentedControl.js';
import Theme from '../../theme/Theme.js';
import { imageOpacity } from '../../theme/page-background.js';
import { note, miniButton, colorSwatch, sliderRow, switchRow } from '../controls.js';
import { downscaleImage } from '../image.js';

/** Image importée : côté le plus long et qualité JPEG après réduction */
const IMAGE_OPTIONS = { maxSize: 1920, type: 'image/jpeg', quality: 0.82 };

/** Libellés des couleurs de chaque type de fond */
const COLOR_LABELS = {
    gradient: ['THEME.PAGEBG_C1', 'THEME.PAGEBG_C2', 'THEME.PAGEBG_C3'],
    water: ['THEME.PAGEBG_SURFACE', 'THEME.PAGEBG_DEPTH']
};

/** Réglages des fonds en couleurs (dégradé, sous l'eau) : couleurs du mode affiché + animation */
function colorsMarkup(type, pageBg) {
    const kind = type === 'gradient' ? 'gradient' : 'water';
    const labels = COLOR_LABELS[kind].map((key) => t(key));
    const swatches = Theme.pageBgColors(kind)
        .map((color, i) => colorSwatch({ label: labels[i], value: color, attrs: `data-bg-color="${kind}" data-i="${i}"` }))
        .join('');
    const modeText = t(Theme.effectiveMode() === 'dark' ? 'THEME.PAGEBG_FOR_DARK' : 'THEME.PAGEBG_FOR_LIGHT');
    return note(modeText)
        + `<div class="color-row"><span>${esc(t('THEME.PAGEBG_COLORS'))}</span><span class="fx-params__colors">`
        + swatches
        + miniButton(t('THEME.PAGEBG_RESET_COLORS'), `data-bg-reset="${kind}"`)
        + '</span></div>'
        + switchRow({ label: t('THEME.PAGEBG_ANIMATED'), attrs: 'data-bg-animated', checked: pageBg.animated !== false });
}

/** Réglages du fond image : vignette, choix / retrait de l'image, opacité */
function imageMarkup(pageBg) {
    const image = Theme.bgImage;
    let markup = '<div class="fx-params__img">'
        + (image ? `<span class="fx-params__thumb" style="background-image:url(&quot;${esc(image)}&quot;)"></span>` : '')
        + miniButton(t(image ? 'THEME.PAGEBG_CHANGE' : 'THEME.PAGEBG_PICK'), 'data-bg-pick')
        + (image ? miniButton(t('THEME.PAGEBG_REMOVE'), 'data-bg-remove') : '')
        + '</div>';
    if (image) {
        const opacity = imageOpacity(pageBg);
        markup += sliderRow({
            label: t('THEME.PAGEBG_OPACITY'),
            attrs: 'data-bg-opacity',
            min: 15,
            max: 100,
            step: 5,
            value: opacity,
            output: `${opacity}%`
        });
    } else {
        markup += note(t('THEME.PAGEBG_IMAGE_HINT'));
    }
    return markup;
}

/**
 * Branche la partie fond de page de l'onglet « Fond et effets ».
 * @param {import('../ThemePanel.js').PanelContext} ctx
 * @returns {{ sync: (snapshot: Object) => void }}
 */
export default function mountPageBg({ find, change, snapshot }) {
    const params = find('#opt-pagebg-params');
    const fileInput = find('#opt-pagebg-file');

    const type = new SegmentedControl(find('#opt-pagebg'), {
        attr: 'bg',
        onChange: (value) => {
            change(() => Theme.setPageBg({ type: value }));
            /* Fond image sans image : ouvre directement le choix du fichier */
            if (value === 'image' && !Theme.bgImage) fileInput.click();
        }
    });

    /** Réglages du type de fond choisi */
    function renderParams({ config }) {
        const pageBg = config.pageBg || {};
        const current = pageBg.type || 'default';
        let markup = '';
        if (current === 'gradient' || current === 'underwater') markup = colorsMarkup(current, pageBg);
        else if (current === 'image') markup = imageMarkup(pageBg);
        params.innerHTML = markup;
        params.hidden = !markup;
    }

    params.addEventListener('input', (e) => {
        const input = e.target;
        if (input.hasAttribute('data-bg-color')) {
            const kind = input.getAttribute('data-bg-color');
            const index = Number(input.getAttribute('data-i'));
            change(() => Theme.setPageBgColor(kind, index, input.value), { resync: false });
        } else if (input.hasAttribute('data-bg-opacity')) {
            change(() => Theme.setPageBg({ opacity: Number(input.value) }), { resync: false });
            input.parentNode.querySelector('output').textContent = `${input.value}%`;
        }
    });

    params.addEventListener('change', (e) => {
        if (e.target.hasAttribute('data-bg-animated')) {
            change(() => Theme.setPageBg({ animated: e.target.checked }), { resync: false });
        }
    });

    params.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        if (button.hasAttribute('data-bg-pick')) {
            fileInput.click();
        } else if (button.hasAttribute('data-bg-remove')) {
            change(() => Theme.setBgImage(null), { resync: false });
            renderParams(snapshot());
        } else if (button.hasAttribute('data-bg-reset')) {
            change(() => Theme.resetPageBgColors(button.getAttribute('data-bg-reset')), { resync: false });
            renderParams(snapshot());
        }
    });

    /* Image du PC : réduite dans le navigateur avant d'être gardée */
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files && fileInput.files[0];
        fileInput.value = '';
        if (!file || !/^image\//.test(file.type)) return;
        const dataUrl = await downscaleImage(file, IMAGE_OPTIONS);
        if (!dataUrl) return;
        change(() => {
            Theme.setBgImage(dataUrl);
            Theme.setPageBg({ type: 'image' });
        });
    });

    return {
        sync(state) {
            const { pageBg } = state.config;
            type.select((pageBg && pageBg.type) || 'default');
            renderParams(state);
        }
    };
}
