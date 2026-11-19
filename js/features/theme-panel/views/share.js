/**
 * Onglet « Partage » : export du thème dans un fichier JSON et import d'un
 * thème exporté (couleurs, style, effets, fond de page et décorations).
 */
import { t } from '../../../core/Lang.js';
import Theme from '../../theme/Theme.js';

/** Nom du fichier proposé au téléchargement */
const FILE_NAME = 'theme-portfolio-pierre-bernard-darmann.json';

/**
 * Propose le téléchargement de données JSON.
 * @param {Object} data
 * @param {string} fileName
 */
function downloadJson(data, fileName) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
        link.remove();
    }, 0);
}

/**
 * Branche l'onglet Partage.
 * @param {import('../ThemePanel.js').PanelContext} ctx
 */
export default function mountShare({ find, change }) {
    const message = find('#opt-share-msg');
    const importInput = find('#opt-import-file');

    /** Message de résultat (zone role="status", lue par les lecteurs d'écran) */
    function status(key, isError = false) {
        message.textContent = t(key);
        message.classList.toggle('is-error', isError);
    }

    find('#opt-export').addEventListener('click', () => {
        downloadJson(Theme.exportTheme(), FILE_NAME);
        status('THEME.EXPORT_OK');
    });

    find('#opt-import').addEventListener('click', () => importInput.click());

    importInput.addEventListener('change', async () => {
        const file = importInput.files && importInput.files[0];
        importInput.value = '';
        if (!file) return;
        try {
            const text = await file.text();
            change(() => Theme.importTheme(JSON.parse(text)));
            status('THEME.IMPORT_OK');
        } catch (err) {
            /* Fichier illisible, JSON invalide ou fichier qui n'est pas un thème */
            status('THEME.IMPORT_ERROR', true);
        }
    });
}
