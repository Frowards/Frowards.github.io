/**
 * Calendrier des thèmes d'événements (registre calqué sur CeresEventTheme).
 *
 * Chaque événement s'applique de daysBefore jours avant sa date à daysAfter
 * jours après, bornes incluses. Pendant sa période, il remplace l'accent,
 * l'effet et les décorations du visiteur. Si plusieurs événements sont
 * actifs, le premier de la liste gagne.
 */

/**
 * Dimanche de Pâques de l'année donnée (algorithme de Meeus / Jones / Butcher,
 * calendrier grégorien).
 * @param {number} year
 * @returns {Date}
 */
export function easterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

/**
 * Événements reconnus. date : { month, day } fixe, ou fonction (année) => Date
 * pour une fête mobile.
 */
export const EVENTS = [
    {
        key: 'halloween', date: { month: 10, day: 31 }, daysBefore: 7, daysAfter: 2,
        accent: '#F97316', effect: 'halloween', decorations: { top: 'cobweb' }
    },
    {
        key: 'christmas', date: { month: 12, day: 25 }, daysBefore: 15, daysAfter: 6,
        accent: '#E5484D', effect: 'snow', decorations: { top: 'garland', bottom: 'snow' }
    },
    {
        key: 'easter', date: easterDate, daysBefore: 7, daysAfter: 1,
        accent: '#E879A9', effect: 'easter', decorations: { bottom: 'flowers' }
    },
    {
        key: 'pinkoctober', date: { month: 10, day: 1 }, daysBefore: 0, daysAfter: 30,
        accent: '#EC4899', effect: 'ribbons', decorations: { bottom: 'hearts' }
    }
];

/** Date de l'événement pour une année donnée */
function eventDate(ev, year) {
    return typeof ev.date === 'function' ? ev.date(year) : new Date(year, ev.date.month - 1, ev.date.day);
}

/** Début du jour (00:00) de la date */
function dayStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Date décalée de n jours */
function addDays(date, n) {
    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + n);
    return shifted;
}

/**
 * Période de l'événement : celle en cours si elle existe, sinon la prochaine.
 * Les années voisines sont examinées pour les périodes à cheval sur deux années.
 * @param {Object} ev événement de EVENTS
 * @param {Date} [ref] date de référence (aujourd'hui par défaut)
 * @returns {{from: Date, to: Date, active: boolean}|null}
 */
export function eventWindow(ev, ref = new Date()) {
    const today = dayStart(ref);
    let current = null;
    let next = null;
    [-1, 0, 1].forEach((offset) => {
        const center = eventDate(ev, today.getFullYear() + offset);
        const from = addDays(center, -ev.daysBefore);
        const to = addDays(center, ev.daysAfter);
        if (today >= from && today <= to) current = { from, to, active: true };
        else if (from > today && (!next || from < next.from)) next = { from, to, active: false };
    });
    return current || next;
}
