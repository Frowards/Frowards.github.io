/**
 * ContactForm - formulaire de contact de la section Contact (#contact-form).
 *
 * Le site est statique (GitHub Pages) : le message part vers Web3Forms
 * (api.web3forms.com), qui le transfère par e-mail. La clé d'accès
 * identifie la boîte de réception sans l'exposer ; elle est faite pour
 * figurer dans le code d'une page publique. L'adresse saisie par le
 * visiteur devient l'adresse de réponse.
 *
 * Anti-spam : case piège (botcheck) invisible pour les humains.
 * États affichés dans la zone [data-cf-status] (aria-live) : envoi en
 * cours, envoyé, échec (avec l'adresse e-mail en secours).
 */
import { t } from '../../core/Lang.js';
import Contact from './Contact.js';

const ENDPOINT = 'https://api.web3forms.com/submit';
const ACCESS_KEY = '9ba03e1f-cc52-43ef-8f53-a15610b5375a';
/** Délai maximal d'attente de la réponse (ms) */
const TIMEOUT_MS = 15000;

let form = null;
let status = null;
let button = null;

/**
 * Affiche un état dans la zone de statut.
 * @param {'sending'|'sent'|'error'|''} state
 */
function setStatus(state) {
    form.setAttribute('data-state', state);
    status.textContent = '';
    if (state === 'sending') status.textContent = t('CT.F_SENDING');
    if (state === 'sent') status.textContent = t('CT.F_SENT');
    if (state === 'error') {
        status.append(`${t('CT.F_ERROR')} `);
        const link = document.createElement('a');
        link.href = `${['mai', 'lto:'].join('')}${Contact.mail}`;
        link.textContent = Contact.mail;
        status.append(link, '.');
    }
}

/** Envoie le formulaire à Web3Forms ; vrai si le message est parti */
async function send(data) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        const result = await response.json().catch(() => ({}));
        return response.ok && result.success === true;
    } catch (e) {
        return false;
    } finally {
        clearTimeout(timer);
    }
}

async function onSubmit(e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    /* Case piège cochée : un robot ; on fait comme si tout allait bien */
    if (fields.get('botcheck')) { setStatus('sent'); form.reset(); return; }

    const name = String(fields.get('name') || '').trim();
    button.disabled = true;
    setStatus('sending');
    const ok = await send({
        access_key: ACCESS_KEY,
        subject: t('CT.F_SUBJECT', { name }),
        from_name: 'Portfolio',
        name,
        email: String(fields.get('email') || '').trim(),
        message: String(fields.get('message') || '').trim()
    });
    button.disabled = false;
    setStatus(ok ? 'sent' : 'error');
    if (ok) form.reset();
}

const ContactForm = {
    /** Relie le formulaire de la page, s'il existe */
    init() {
        form = document.getElementById('contact-form');
        if (!form) return;
        status = form.querySelector('[data-cf-status]');
        button = form.querySelector('button[type="submit"]');
        form.addEventListener('submit', onSubmit);
        /* Le visiteur réécrit : l'ancien message d'état disparaît */
        form.addEventListener('input', () => {
            if (form.getAttribute('data-state') !== 'sending') setStatus('');
        });
    }
};

export default ContactForm;
