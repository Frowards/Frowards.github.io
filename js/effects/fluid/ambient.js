/**
 * ambient - pinceau invisible qui peint tout seul dans le fluide (réglage
 * 'ambient' > 0) : au repos (après IDLE_DELAY sans mouvement) ou en
 * permanence, il trace des rubans, des figures ou des mots (réglage 'motif').
 */
import { FIGURES, pathPos, ribbonPath, figurePath, wordPath } from './motifs.js';
import { colorFor, scaleColor } from './colors.js';
import { IDLE_DELAY, SPLAT_FORCE } from './config.js';

/** Ordre des motifs en mode 'mix' */
const MIX_ORDER = ['ribbons', 'figures', 'words'];
/** Longueur max parcourue entre deux taches (en unités de hauteur d'écran) */
const MAX_STRIDE = 0.006;
/** Taches max par image */
const MAX_STEPS = 8;
/** Durée de vie (s) d'une couleur aléatoire du pinceau */
const COLOR_PERIOD = 1.2;

export default class AmbientBrush {
    constructor() {
        this.path = null;       // tracé en cours
        this.prev = null;       // dernière position peinte
        this.d = 0;             // distance parcourue sur le tracé
        this.wait = 0;          // pause (s) avant le tracé suivant
        this.color = null;      // couleur courante (voir colorFor)
        this.timer = 0;
        this.mode = '';
        this.mixIdx = 0;        // prochain motif en mode 'mix'
        this.wordIdx = 0;       // prochain mot
        this.lastFigure = '';   // évite de tracer deux fois la même figure
    }

    /** Figure au hasard, différente de la précédente si possible */
    pickFigure() {
        let name;
        let tries = 0;
        do {
            name = FIGURES[Math.floor(Math.random() * FIGURES.length)];
            tries++;
        } while (name === this.lastFigure && tries < 5);
        this.lastFigure = name;
        return name;
    }

    /** Prochain tracé selon le motif choisi (repli sur un ruban) */
    nextPath(view, settings) {
        let motif = settings.motif;
        let path = null;
        if (motif === 'mix') {
            motif = MIX_ORDER[this.mixIdx % MIX_ORDER.length];
            this.mixIdx++;
        }
        if (motif === 'words') {
            const words = settings.words;
            const word = words[this.wordIdx % words.length];
            this.wordIdx++;
            path = wordPath(view, word);
        } else if (motif === 'figures') {
            path = figurePath(view, this.pickFigure());
        }
        return path || ribbonPath(view);
    }

    /**
     * Fait avancer le pinceau d'une image.
     * @param {number} dt  temps écoulé (s)
     * @param {number} now horodatage (ms)
     * @param {Object} env {
     *     settings  réglages courants du fluide,
     *     lastMove  horodatage du dernier mouvement du pointeur (ms),
     *     painter   { width, height, splat, dyeAmount, correctDX, correctDY }
     * }
     */
    step(dt, now, { settings, lastMove, painter }) {
        if (settings.ambient <= 0 || (settings.ambientMode !== 'always' && now - lastMove < IDLE_DELAY)) {
            this.path = null;
            this.wait = 0;
            return;
        }
        const vivid = settings.ambient / 100;
        let path = this.path;
        if (!path) {
            if (this.wait > 0) {
                this.wait -= dt;
                return;
            }
            path = this.path = this.nextPath(painter, settings);
            if (!path) return;
            this.d = 0;
            this.prev = pathPos(path, 0);
        }
        const speed = path.total / path.duration * (0.5 + vivid);
        const d0 = this.d;
        const d1 = Math.min(path.total, d0 + speed * dt);
        const steps = Math.max(1, Math.min(MAX_STEPS, Math.ceil((d1 - d0) / MAX_STRIDE)));
        const base = colorFor(this, settings, now, dt, COLOR_PERIOD);
        const color = scaleColor(base, painter.dyeAmount() * (0.35 + 0.65 * vivid) * path.dye / Math.sqrt(steps));
        const force = SPLAT_FORCE * path.force * (0.5 + vivid) * steps;
        for (let i = 1; i <= steps; i++) {
            const pos = pathPos(path, d0 + (d1 - d0) * i / steps);
            if (!pos.lifted) {
                painter.splat(pos.x, pos.y,
                    painter.correctDX(pos.x - this.prev.x) * force,
                    painter.correctDY(pos.y - this.prev.y) * force,
                    color, path.radius);
            }
            this.prev = pos;
        }
        this.d = d1;
        if (d1 >= path.total) {
            this.path = null;
            this.wait = Math.max(0.4, 1.5 - vivid);
        }
    }
}
