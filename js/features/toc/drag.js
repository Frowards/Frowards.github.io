/**
 * Bouton du sommaire déplaçable : on le saisit (doigt ou souris), on le
 * pose ou on le lance, il file dans la direction du geste puis s'aimante
 * au bord le plus proche (gauche, droite, haut ou bas) et y reste.
 *
 * La position est mémorisée (Storage KEYS.TOC_POS) sous la forme « bord +
 * position le long du bord (0 à 1) » : elle reste juste quand la fenêtre
 * change de taille ou que le téléphone pivote.
 *
 * Un simple appui (sans déplacement) reste un clic : wasDragged() permet au
 * sommaire de ne pas s'ouvrir à la fin d'un glisser.
 */
import Storage, { KEYS } from '../../core/Storage.js';
import { clamp } from '../../utils/motion.js';

/** Déplacement (px) au-delà duquel l'appui devient un glisser */
const DRAG_THRESHOLD = 6;
/** Marge entre le bouton et le bord de l'écran (px) */
const EDGE_MARGIN = 12;
/** Projection du lancer : distance parcourue = vitesse x ce temps (s),
    plafonnée : un lancer oriente le bouton, il ne l'envoie pas à l'autre bout */
const THROW_TIME = 0.08;
const THROW_MAX = 140;
/** Vitesse mesurée sur les derniers mouvements (ms) */
const VELOCITY_WINDOW = 90;
const SIDES = ['left', 'right', 'top', 'bottom'];
const DEFAULT_POS = { side: 'right', t: 1 };

let el = null;
let handle = null;
let pos = null;
let dragged = false;

/** Limites de la zone où le bouton peut se poser (sous le header, au-dessus du sol) */
function bounds() {
    const cs = getComputedStyle(document.documentElement);
    const rem = parseFloat(cs.fontSize) || 16;
    const toPx = (value) => {
        const v = parseFloat(value) || 0;
        return /rem\s*$/.test(value) ? v * rem : v;
    };
    const header = toPx(cs.getPropertyValue('--xp-header-h')) || 56;
    const floor = toPx(cs.getPropertyValue('--mascot-floor'));
    const { width, height } = handle.getBoundingClientRect();
    return {
        minX: EDGE_MARGIN,
        maxX: Math.max(EDGE_MARGIN, innerWidth - width - EDGE_MARGIN),
        minY: header + EDGE_MARGIN,
        maxY: Math.max(header + EDGE_MARGIN, innerHeight - floor - height - EDGE_MARGIN),
        width,
        height
    };
}

/** Coordonnées écran (coin haut gauche) d'une position « bord + t » */
function toXY({ side, t }) {
    const b = bounds();
    const along = (min, max) => min + clamp(t, 0, 1) * (max - min);
    if (side === 'left') return { x: b.minX, y: along(b.minY, b.maxY) };
    if (side === 'right') return { x: b.maxX, y: along(b.minY, b.maxY) };
    if (side === 'top') return { x: along(b.minX, b.maxX), y: b.minY };
    return { x: along(b.minX, b.maxX), y: b.maxY };
}

/** Bord le plus proche d'un point (coin haut gauche), et position le long du bord */
function nearestEdge(x, y) {
    const b = bounds();
    const cx = clamp(x, b.minX, b.maxX);
    const cy = clamp(y, b.minY, b.maxY);
    const dist = { left: cx - b.minX, right: b.maxX - cx, top: cy - b.minY, bottom: b.maxY - cy };
    const side = SIDES.reduce((best, s) => (dist[s] < dist[best] ? s : best), 'right');
    const ratio = (v, min, max) => (max > min ? (v - min) / (max - min) : 0);
    const t = side === 'left' || side === 'right' ? ratio(cy, b.minY, b.maxY) : ratio(cx, b.minX, b.maxX);
    return { side, t };
}

/** Pose le bouton, et oriente la liste vers l'intérieur de l'écran */
function place(x, y) {
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
    const b = bounds();
    el.classList.toggle('toc--below', y + b.height / 2 < innerHeight / 2);
    el.classList.toggle('toc--start', x + b.width / 2 < innerWidth / 2);
}

function applySaved() {
    const { x, y } = toXY(pos);
    place(x, y);
}

/** Saisie, glisser et lancer (événements pointeur : souris, doigt, stylet) */
function bindPointer() {
    let start = null;
    let offset = null;
    let samples = [];

    handle.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        const rect = el.getBoundingClientRect();
        start = { x: e.clientX, y: e.clientY };
        offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        samples = [{ x: e.clientX, y: e.clientY, time: e.timeStamp }];
        dragged = false;
        handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointermove', (e) => {
        if (!start) return;
        if (!dragged && Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_THRESHOLD) return;
        if (!dragged) { dragged = true; el.classList.add('is-dragging'); }
        samples.push({ x: e.clientX, y: e.clientY, time: e.timeStamp });
        samples = samples.filter((s) => e.timeStamp - s.time <= VELOCITY_WINDOW);
        place(e.clientX - offset.x, e.clientY - offset.y);
    });

    const release = (e) => {
        if (!start) return;
        start = null;
        if (!dragged) return;
        el.classList.remove('is-dragging');
        /* Lancer : on prolonge le geste selon sa vitesse, puis on s'aimante */
        const first = samples[0];
        const dt = Math.max(1, e.timeStamp - first.time) / 1000;
        const vx = (e.clientX - first.x) / dt;
        const vy = (e.clientY - first.y) / dt;
        const rect = el.getBoundingClientRect();
        const dx = vx * THROW_TIME;
        const dy = vy * THROW_TIME;
        const reach = Math.hypot(dx, dy);
        const k = reach > THROW_MAX ? THROW_MAX / reach : 1;
        pos = nearestEdge(rect.left + dx * k, rect.top + dy * k);
        Storage.setJSON(KEYS.TOC_POS, pos);
        applySaved();
    };
    handle.addEventListener('pointerup', release);
    handle.addEventListener('pointercancel', release);
}

/** Position mémorisée valide, sinon en bas à droite */
function loadPos() {
    const saved = Storage.getJSON(KEYS.TOC_POS, null);
    return saved && SIDES.includes(saved.side) && Number.isFinite(saved.t) ? saved : { ...DEFAULT_POS };
}

/**
 * Rend le sommaire déplaçable.
 * @param {HTMLElement} root    conteneur fixe du sommaire (.toc)
 * @param {HTMLElement} button  bouton que l'on saisit
 * @returns {{ wasDragged: () => boolean, refresh: () => void }}
 */
export function makeDraggable(root, button) {
    el = root;
    handle = button;
    pos = loadPos();
    el.classList.add('is-placed');
    bindPointer();
    window.addEventListener('resize', applySaved);
    applySaved();
    return {
        /** Vrai si le dernier appui était un glisser (et non un clic) ; la
            réponse est consommée : un clic clavier suivant reste un clic */
        wasDragged: () => {
            const was = dragged;
            dragged = false;
            return was;
        },
        /** Replace le bouton (taille du bouton ou du header changée) */
        refresh: applySaved
    };
}
