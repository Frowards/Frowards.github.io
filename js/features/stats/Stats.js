/**
 * Stats - mesure d'audience anonyme du portfolio.
 *
 * Aucun cookie, aucun identifiant conservé sur l'appareil : le numéro de
 * visite est tiré au hasard à chaque chargement et ne vit qu'en mémoire. Seul
 * le REFUS du visiteur est mémorisé (Storage KEYS.STATS).
 *
 * Chaque envoi (sendBeacon) porte l'état complet de la visite, avec un numéro
 * d'ordre : un envoi perdu ou en retard ne fausse rien. Rien n'est mesuré si
 * le visiteur a refusé, si son navigateur demande à ne pas être suivi, ou si
 * aucun service de collecte n'est configuré (config.js).
 */
import Events from '../../core/Events.js';
import Lang from '../../core/Lang.js';
import Storage, { KEYS } from '../../core/Storage.js';
import Theme from '../theme/Theme.js';
import Tour from '../tour/Tour.js';
import { currentExp } from '../experience/state.js';
import { STEPS, collectSteps } from '../tour/steps.js';
import { ENDPOINT, LOCAL_ENDPOINT, PARAMS, IDLE_MS, FIRST_REPORT_MS, REPORT_EVERY_MS, MAX_REPORTS } from './config.js';
import { actionOf, automationSignals, deviceKind, doNotTrack } from './signals.js';
import StatsNotice from './StatsNotice.js';

const GESTURES = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
const TICK_MS = 1000;

let endpoint = '';
let visit = null;       // état de la visite en cours, null si rien n'est mesuré
let steps = [];
let lastGesture = 0;
let lastReport = 0;

/** Lit les paramètres de l'adresse, puis les retire (lien repartagé = lien propre) */
function readParams() {
    const names = Object.values(PARAMS);
    const params = new URLSearchParams(location.search);
    const found = Object.fromEntries(names.map((name) => [name, (params.get(name) || '').toLowerCase()]));
    if (names.some((name) => params.has(name))) {
        names.forEach((name) => params.delete(name));
        const query = params.toString();
        history.replaceState(history.state, '', location.pathname + (query ? `?${query}` : '') + location.hash);
    }
    return found;
}

/** Site d'origine (nom seul, sans l'adresse de la page) */
function referrerHost(forwarded) {
    if (forwarded) return forwarded;
    try {
        const { hostname, origin } = new URL(document.referrer);
        return origin === location.origin ? '' : hostname;
    } catch (e) { return ''; }
}

function welcomeOpen() {
    const overlay = document.getElementById('pb-welcome');
    return Boolean(overlay && !overlay.hidden);
}

/** Clé de l'étape à l'écran */
function currentStep() {
    if (welcomeOpen()) return 'welcome';
    if (Tour.active) return STEPS[Tour.index]?.key || 'hero';
    const mid = window.innerHeight * 0.4;
    return steps.reduce((key, step) => (step.el.getBoundingClientRect().top <= mid ? step.key : key), 'hero');
}

/** Rang d'une étape dans la page (-1 pour l'écran d'accueil) */
function rank(key) {
    return STEPS.findIndex((step) => step.key === key);
}

/** Note l'étape affichée, l'expérience et le type de visite */
function observe() {
    const key = currentStep();
    visit.last = key;
    if (rank(key) >= rank(visit.furthest)) visit.furthest = key;
    if (key === 'welcome') return;
    visit.exp = currentExp();
    visit.tour = Tour.active ? 'guided' : 'free';
}

function send(body) {
    navigator.sendBeacon(`${endpoint}/c`, JSON.stringify(body));
}

/** Envoie l'état de la visite */
function report() {
    if (!visit || visit.seq >= MAX_REPORTS) return;
    observe();
    visit.seq += 1;
    visit.lang = Lang.lang;
    visit.mode = Theme.effectiveMode();
    lastReport = Date.now();
    send(visit);
}

function count(action) {
    if (!visit) return;
    visit.actions[action] = (visit.actions[action] || 0) + 1;
    report();
}

/** Chaque seconde : temps actif de la section affichée, bilan régulier */
function tick() {
    if (!visit || document.hidden || Date.now() - lastGesture > IDLE_MS) return;
    observe();
    visit.active += 1;
    visit.sections[visit.last] = (visit.sections[visit.last] || 0) + 1;
    const wait = visit.active < REPORT_EVERY_MS / TICK_MS ? FIRST_REPORT_MS : REPORT_EVERY_MS;
    if (Date.now() - lastReport >= wait) report();
}

function onGesture(event) {
    /* Un geste fabriqué par un script ne compte pas */
    if (!visit || !event.isTrusted) return;
    lastGesture = Date.now();
    visit.inter += 1;
    /* Premier geste : la visite n'est plus « douteuse » */
    if (visit.inter === 1) report();
}

function onLink(event) {
    const action = event.isTrusted && event.target instanceof Element ? actionOf(event.target) : '';
    if (action) count(action);
}

function listen() {
    GESTURES.forEach((name) => window.addEventListener(name, onGesture, { passive: true, capture: true }));
    /* Capture : le clic est compté même si le module visé arrête sa propagation */
    document.addEventListener('click', onLink, true);
    /* Clic du milieu (ouverture dans un nouvel onglet) */
    document.addEventListener('auxclick', (event) => { if (event.button === 1) onLink(event); }, true);
    document.addEventListener('visibilitychange', () => { if (document.hidden) report(); });
    Events.on('contact:sent', () => count('form'));
    Events.on('mascot:open', () => count('mascot'));
    setInterval(tick, TICK_MS);
}

function start(params) {
    steps = collectSteps();
    visit = {
        id: crypto.randomUUID(), seq: 0,
        ref: referrerHost(params[PARAMS.REF]), src: params[PARAMS.SRC],
        lang: Lang.lang, device: deviceKind(), exp: '', mode: '', tour: '',
        furthest: 'welcome', last: 'welcome', active: 0, inter: 0,
        sections: {}, actions: {}, sig: automationSignals()
    };
    lastGesture = Date.now();
    listen();
    report();
}

const Stats = {
    /** Le visiteur accepte la mesure (aucun refus enregistré) */
    get allowed() { return Storage.get(KEYS.STATS) !== 'off'; },

    /**
     * Refus ou accord du visiteur. Un refus efface aussi la visite en cours
     * côté serveur ; un accord reprend à la prochaine ouverture de la page.
     */
    setAllowed(allowed) {
        if (allowed) { Storage.remove(KEYS.STATS); return; }
        Storage.set(KEYS.STATS, 'off');
        if (visit) send({ id: visit.id, forget: true });
        visit = null;
    },

    /** À appeler en dernier : l'expérience et la visite doivent être prêtes */
    init() {
        const params = readParams();
        const asked = params[PARAMS.STATS];
        if (asked === 'off' || asked === 'on') Stats.setAllowed(asked === 'on');
        const local = ['localhost', '127.0.0.1'].includes(location.hostname);
        if (local) endpoint = asked === 'local' ? LOCAL_ENDPOINT : '';
        else endpoint = ENDPOINT;
        if (!endpoint || !navigator.sendBeacon || !crypto.randomUUID) return;
        StatsNotice.init({ allowed: Stats.allowed, onChange: Stats.setAllowed });
        if (!Stats.allowed || doNotTrack()) return;
        /* Page préchargée en arrière-plan : la visite commence à l'affichage */
        if (document.prerendering) document.addEventListener('prerenderingchange', () => start(params), { once: true });
        else start(params);
    }
};

export default Stats;
