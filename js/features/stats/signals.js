/**
 * Indices techniques d'une visite (fonctions pures, sans stockage) :
 * type d'appareil, signes d'un navigateur automatisé, nature d'un clic.
 */

/** 'mobile' | 'tablette' | 'ordinateur' */
export function deviceKind() {
    if (!window.matchMedia('(pointer: coarse)').matches) return 'ordinateur';
    return Math.min(screen.width, screen.height) < 600 ? 'mobile' : 'tablette';
}

/** Signes d'automatisation : 1 si présent, 0 sinon */
export function automationSignals() {
    /* iOS annonce parfois une fenêtre de taille nulle */
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    return {
        wd: navigator.webdriver ? 1 : 0,
        nolang: navigator.languages && navigator.languages.length ? 0 : 1,
        zero: !ios && (window.outerWidth === 0 || window.outerHeight === 0) ? 1 : 0
    };
}

/** Le navigateur demande à ne pas être suivi */
export function doNotTrack() {
    return navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
}

/** Nature d'un lien ou d'un bouton cliqué, ou '' s'il n'est pas compté */
export function actionOf(target) {
    if (target.closest('[data-m="copy"]')) return 'copy';
    const link = target.closest('a[href]');
    if (!link) return '';
    if (link.protocol === 'mailto:') return 'mail';
    if (link.protocol === 'tel:') return 'tel';
    if (link.origin === location.origin) return link.pathname.endsWith('.pdf') ? 'cv' : '';
    if (/(^|\.)linkedin\.com$/.test(link.hostname)) return 'linkedin';
    return link.protocol.startsWith('http') ? 'ext' : '';
}
