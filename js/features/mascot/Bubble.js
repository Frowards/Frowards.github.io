/**
 * Bubble - la bulle de contact de la mascotte.
 *
 * Fenêtre (role="dialog") ancrée au-dessus de Pierre : e-mail, téléphone,
 * LinkedIn, copie de l'adresse, lien vers la section Contact, et « Masquer
 * la mascotte » (elle revient par le panneau de thème). Pendant
 * qu'elle est ouverte, Pierre montre la bulle du doigt puis fait la fête.
 * Elle se ferme par son bouton, Échap ou un clic en dehors.
 */
import { t } from '../../core/Lang.js';
import Events from '../../core/Events.js';
import Icon from '../../components/Icon.js';
import { esc, el } from '../../utils/dom.js';
import Contact from '../contact/Contact.js';
import Pierre from './Pierre.js';
import Behavior from './Behavior.js';
import FetchGame from './FetchGame.js';
import { scene, viewportWidth } from './scene.js';

const LINKEDIN_URL = 'https://www.linkedin.com/in/pierre-bernard-darmann-b636a7172/';

/** Marges de la bulle : bords de l'écran, écart au-dessus de Pierre, pointe (px) */
const EDGE = 8;
const GAP = 6;
const TAIL_INSET = 18;

let bubble = null;

/** Une entrée de la liste : lien (a) ou bouton, avec son icône */
function item(tag, attrs, icon, label) {
    return `<li><${tag} ${attrs}>${Icon.svg(icon)}<span>${esc(label)}</span></${tag}></li>`;
}

/** Contenu de la bulle dans la langue courante */
function render() {
    const subject = encodeURIComponent(t('MASCOT.MAIL_SUBJECT'));
    bubble.innerHTML = [
        `<button type="button" class="mascot-bubble__close" data-m="close" aria-label="${esc(t('MASCOT.CLOSE'))}">${Icon.svg('mascot-close')}</button>`,
        `<p class="mascot-bubble__title" id="mascot-title">${esc(t('MASCOT.HELLO'))}</p>`,
        `<p class="mascot-bubble__text">${esc(t('MASCOT.TEXT'))}</p>`,
        '<ul class="mascot-bubble__list">',
        item('a', `href="mailto:${Contact.mail}?subject=${subject}"`, 'mascot-mail', t('MASCOT.MAIL')),
        item('a', `href="tel:${Contact.tel}"`, 'mascot-tel', t('MASCOT.CALL', { tel: Contact.telShown })),
        item('a', `href="${LINKEDIN_URL}" target="_blank" rel="noopener"`, 'mascot-linkedin', t('MASCOT.LINKEDIN')),
        item('button', 'type="button" data-m="copy"', 'mascot-copy', t('MASCOT.COPY')),
        item('a', 'href="#contact" data-m="section"', 'mascot-contact', t('MASCOT.SECTION')),
        '</ul>',
        '<p class="mascot-bubble__status" role="status" aria-live="polite"></p>',
        /* CV : à part des moyens de contact, mis en avant */
        `<a class="mascot-bubble__cv" href="${Contact.cv}" target="_blank" rel="noopener nofollow">${Icon.svg('mascot-cv')}<span>${esc(t('MASCOT.CV'))}</span></a>`,
        `<p class="mascot-bubble__tip">${esc(t('MASCOT.TIP'))}</p>`,
        /* Hors de la liste de contact : simple lien discret, en pied de bulle */
        `<button type="button" class="mascot-bubble__hide" data-m="hide">${Icon.svg('mascot-hide')}<span>${esc(t('MASCOT.HIDE'))}</span></button>`
    ].join('');
}

/** Copie l'adresse e-mail ; affiche l'adresse elle-même si la copie échoue */
function copyMail() {
    const status = bubble.querySelector('.mascot-bubble__status');
    const showMail = () => { status.textContent = Contact.mail; };
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(Contact.mail).then(() => { status.textContent = t('MASCOT.COPIED'); }, showMail);
    } else {
        showMail();
    }
}

function onClick(event) {
    const action = event.target.closest('[data-m]');
    if (!action) return;
    const name = action.getAttribute('data-m');
    if (name === 'close') Bubble.close(true);
    else if (name === 'section') Bubble.close(false);
    else if (name === 'copy') copyMail();
    else if (name === 'hide') Events.emit('mascot:request', { visible: false });
}

function onKeydown(event) {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    Bubble.close(true);
}

/** Crée la bulle à sa première ouverture */
function create() {
    bubble = el('div', {
        className: 'mascot-bubble',
        role: 'dialog',
        'aria-labelledby': 'mascot-title',
        hidden: true
    });
    document.body.appendChild(bubble);
    bubble.addEventListener('click', onClick);
    bubble.addEventListener('keydown', onKeydown);
}

const Bubble = {
    /** Vrai si la bulle est ouverte */
    isOpen() {
        return Boolean(bubble && !bubble.hidden);
    },

    /** Ferme la bulle sur Échap ou sur un clic hors de la bulle et de Pierre */
    init() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && Bubble.isOpen()) Bubble.close(true);
        });
        document.addEventListener('click', (event) => {
            if (Bubble.isOpen() && !event.target.closest('.mascot-bubble, .mascot')) Bubble.close(false);
        });
    },

    /** Ouvre la bulle : Pierre s'arrête, la montre du doigt puis fait la fête */
    open() {
        if (!bubble) create();
        FetchGame.end();
        if (scene.state !== 'fall' && scene.state !== 'drag') {
            scene.state = 'idle';
            scene.y = 0;
        }
        render();
        bubble.hidden = false;
        Pierre.play('wave', () => Pierre.play('celebrate'));
        Bubble.position();
        requestAnimationFrame(() => {
            bubble.classList.add('is-in');
            const first = bubble.querySelector('a, button:not(.mascot-bubble__close)');
            if (first) first.focus({ preventScroll: true });
        });
        scene.el.setAttribute('aria-expanded', 'true');
    },

    /**
     * Ferme la bulle ; Pierre reprend ses occupations.
     * @param {boolean} focusBack  rend le focus à Pierre (fermeture au clavier ou par le bouton)
     */
    close(focusBack) {
        if (!Bubble.isOpen()) return;
        bubble.classList.remove('is-in');
        bubble.hidden = true;
        scene.el.setAttribute('aria-expanded', 'false');
        if (scene.state === 'idle') Behavior.chooseIdle();
        if (focusBack) scene.el.focus({ preventScroll: true });
    },

    /** Ouvre la bulle, ou la ferme si elle l'est déjà */
    toggle() {
        if (Bubble.isOpen()) Bubble.close(true);
        else Bubble.open();
    },

    /**
     * Place la bulle au-dessus de Pierre, dans l'écran ; la pointe (--tail)
     * vise son centre. Trop haute pour tenir au-dessus de lui, elle se pose
     * en bas de l'écran.
     */
    position() {
        if (!Bubble.isOpen()) return;
        const sprite = scene.sprite.getBoundingClientRect();
        const width = bubble.offsetWidth;
        const height = bubble.offsetHeight;
        const center = sprite.left + sprite.width / 2;
        const left = Math.max(EDGE, Math.min(viewportWidth() - width - EDGE, center - width / 2));
        bubble.style.left = `${left}px`;
        bubble.style.bottom = `${window.innerHeight - sprite.top + GAP}px`;
        bubble.style.setProperty('--tail', `${Math.max(TAIL_INSET, Math.min(width - TAIL_INSET, center - left))}px`);
        if (height > sprite.top - 10) bubble.style.bottom = `${EDGE}px`;
    },

    /** Traduit la bulle ouverte après un changement de langue */
    translate() {
        if (!Bubble.isOpen()) return;
        render();
        Bubble.position();
    }
};

export default Bubble;
