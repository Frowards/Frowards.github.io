/**
 * Contact - coordonnées protégées des robots collecteurs d'adresses.
 *
 * Le CV (PDF) suit la même règle : son adresse n'apparaît pas dans les
 * sources ([data-pb-contact="cv"]) ; robots.txt écarte aussi /assets/ des
 * moteurs de recherche.
 *
 * L'e-mail et le téléphone ne figurent nulle part en clair dans les sources :
 * ils sont stockés à l'envers, en morceaux, puis reconstitués à l'exécution.
 * Les liens de la page marqués [data-pb-contact="mail" | "tel"] sont remplis
 * par hydrate() ; leur libellé éventuel est l'enfant [data-pb-contact-text].
 *
 *     <a href="#contact" data-pb-contact="mail">
 *         <span data-pb-contact-text>E-mail</span>
 *     </a>
 */
import { qsa } from '../../utils/dom.js';

/** Remet une chaîne à l'endroit */
const reverse = (text) => [...text].reverse().join('');

/* Morceaux inversés : [domaine, nom] de l'adresse, puis les chiffres du numéro */
const MAIL_PARTS = ['moc.liamg', 'erreip.nnamrad.dranreb'];
const DIGITS = reverse('1501002860');
const AT = String.fromCharCode(64);

/* Préfixes des liens découpés : aucun « mailto: » ni « tel: » complet à repérer */
const MAILTO = ['mai', 'lto:'].join('');
/* Chemin du CV, en morceaux inversés */
const CV_PARTS = ['vc/stessa', 'nnamraD-dranreB-erreiP-VC', 'fdp.'];
const TEL = ['te', 'l:'].join('');

const Contact = {
    /** Adresse e-mail */
    mail: `${reverse(MAIL_PARTS[1])}${AT}${reverse(MAIL_PARTS[0])}`,

    /** Numéro au format international, pour les liens tel: */
    tel: `+33${DIGITS.slice(1)}`,

    /** Numéro affiché, groupé par paires de chiffres */
    telShown: DIGITS.replace(/(\d{2})(?=\d)/g, '$1 '),

    /** Adresse du CV (PDF) */
    cv: `${reverse(CV_PARTS[0])}/${reverse(CV_PARTS[1])}${reverse(CV_PARTS[2])}`,

    /**
     * Remplit les liens [data-pb-contact] présents sous root : adresse du
     * lien et, s'il existe, texte du libellé [data-pb-contact-text].
     * @param {ParentNode} [root=document]
     */
    hydrate(root = document) {
        qsa('[data-pb-contact]', root).forEach((link) => {
            const kind = link.getAttribute('data-pb-contact');
            const label = link.querySelector('[data-pb-contact-text]');
            if (kind === 'mail') {
                link.href = `${MAILTO}${Contact.mail}`;
                if (label) label.textContent = Contact.mail;
            } else if (kind === 'cv') {
                link.href = Contact.cv;
            } else if (kind === 'tel') {
                link.href = `${TEL}${Contact.tel}`;
                if (label) label.textContent = Contact.telShown;
            }
        });
    }
};

export default Contact;
