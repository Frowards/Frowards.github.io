/**
 * StatsNotice - note d'information sur la mesure d'audience (#stats-notice,
 * section Contact) et interrupteur pour la refuser.
 *
 * La note est masquée dans le balisage : elle n'apparaît que si la mesure est
 * en service.
 */
import { qs } from '../../utils/dom.js';

const StatsNotice = {
    /**
     * @param {{ allowed: boolean, onChange: (allowed: boolean) => void }} options
     */
    init({ allowed, onChange }) {
        const notice = document.getElementById('stats-notice');
        if (!notice) return;
        const input = qs('input', notice);
        input.checked = allowed;
        input.addEventListener('change', () => onChange(input.checked));
        notice.hidden = false;
    }
};

export default StatsNotice;
