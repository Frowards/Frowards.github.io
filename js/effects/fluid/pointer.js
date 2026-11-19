/**
 * pointer - entrées du pointeur pour le fluide : chaque mouvement injecte
 * de la couleur et une poussée, chaque clic une éclaboussure en rond.
 *
 * Les événements ne font qu'accumuler ; tout est appliqué une fois par
 * image (flush), au rythme de la simulation.
 */
import { pickColor, colorFor, scaleColor } from './colors.js';
import { SPLAT_FORCE } from './config.js';

/** Au-delà de ce saut (uv), le mouvement est ignoré : sortie / retour de fenêtre */
const MAX_JUMP = 0.25;
/** Durée de vie (s) d'une couleur aléatoire du pointeur */
const COLOR_PERIOD = 0.25;
/** Gouttes projetées autour d'un clic */
const SPLASH_DROPS = 10;

export default class PointerInput {
    constructor() {
        this.has = false;      // position connue
        this.x = 0;            // position uv
        this.y = 0;
        this.dx = 0;           // déplacement accumulé depuis la dernière image
        this.dy = 0;
        this.moved = false;
        this.color = null;     // couleur courante (voir colorFor)
        this.timer = 0;
        this.mode = '';
        this.clicks = [];      // clics en attente
    }

    /** Oublie les mouvements, clics et couleur en cours (arrêt du fluide) */
    reset() {
        this.clicks = [];
        this.has = false;
        this.moved = false;
        this.dx = 0;
        this.dy = 0;
        this.color = null;
    }

    /** Vrai s'il reste des entrées à appliquer */
    get pending() {
        return this.moved || this.clicks.length > 0;
    }

    /** Nouveau point de passage du pointeur (uv) */
    move(p) {
        if (this.has) {
            const dx = p.x - this.x;
            const dy = p.y - this.y;
            if (Math.abs(dx) < MAX_JUMP && Math.abs(dy) < MAX_JUMP) {
                this.dx += dx;
                this.dy += dy;
                this.moved = true;
            }
        }
        this.x = p.x;
        this.y = p.y;
        this.has = true;
    }

    /** Clic principal en p (uv) */
    press(p) {
        this.x = p.x;
        this.y = p.y;
        this.has = true;
        this.clicks.push(p);
    }

    /**
     * Applique les entrées accumulées à la simulation.
     * @param {number} dt  temps écoulé (s)
     * @param {number} now horodatage (ms)
     * @param {Object} settings réglages courants du fluide
     * @param {Object} painter  { width, height, splat, dyeAmount, correctDX, correctDY }
     */
    flush(dt, now, settings, painter) {
        if (this.moved) {
            const { dx, dy } = this;
            this.moved = false;
            this.dx = 0;
            this.dy = 0;
            if (dx !== 0 || dy !== 0) {
                const c = scaleColor(colorFor(this, settings, now, dt, COLOR_PERIOD), painter.dyeAmount());
                painter.splat(this.x, this.y, painter.correctDX(dx) * SPLAT_FORCE, painter.correctDY(dy) * SPLAT_FORCE, c, 1);
            }
        }
        while (this.clicks.length) {
            const k = this.clicks.shift();
            splash(k.x, k.y, now, settings, painter);
        }
    }
}

/** Éclaboussure : une grosse tache au clic et des gouttes projetées en rond */
function splash(x, y, now, settings, painter) {
    const w = painter.width;
    const h = painter.height;
    const s = Math.min(w, h) * 0.02;
    const base = pickColor(settings, now);
    const multi = settings.colors === 'random' || settings.colors === 'pastel';
    painter.splat(x, y, 0, 0, scaleColor(base, painter.dyeAmount() * 4), 1.2);
    for (let i = 0; i < SPLASH_DROPS; i++) {
        const a = (i / SPLASH_DROPS) * Math.PI * 2 + Math.random() * 0.3;
        const c = multi ? pickColor(settings, now) : base;
        painter.splat(x + Math.cos(a) * s / w, y + Math.sin(a) * s / h,
            Math.cos(a) * 600, Math.sin(a) * 600, scaleColor(c, painter.dyeAmount() * 1.5), 0.45);
    }
}
