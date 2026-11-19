/**
 * Pierre - le personnage : élément .mascot, sprite, animation et placement.
 *
 * L'élément est un bouton (role="button") qui ouvre la bulle de contact ;
 * il porte aussi l'infobulle « Cliquez sur moi » (.mascot__hint).
 */
import { t } from '../../core/Lang.js';
import { el } from '../../utils/dom.js';
import SpriteAnimator from './SpriteAnimator.js';
import { PIERRE_ANIMS } from './anims.js';
import { PIERRE_SHEET, cellOffset } from './sprites.js';
import { scene, cellWidth, cellHeight } from './scene.js';

const animator = new SpriteAnimator(PIERRE_ANIMS, 'stand');
let hint = null;

/** Affiche la case courante de l'animation */
function draw() {
    const offset = cellOffset(animator.cell, PIERRE_SHEET.cols, cellWidth(), cellHeight());
    scene.sprite.style.backgroundPosition = `${offset.x}px ${offset.y}px`;
}

const Pierre = {
    /** Animation en cours */
    get anim() {
        return animator.name;
    },

    /** Rang de l'image affichée dans l'animation en cours */
    get frame() {
        return animator.frame;
    },

    /** Crée l'élément .mascot et l'ajoute à la page */
    mount() {
        scene.el = el('div', {
            className: 'mascot',
            role: 'button',
            tabindex: '0',
            'aria-haspopup': 'dialog',
            'aria-expanded': 'false'
        });
        scene.sprite = el('div', { className: 'mascot__sprite' });
        scene.sprite.style.backgroundImage = `url("${PIERRE_SHEET.src}")`;
        hint = el('span', { className: 'mascot__hint' });
        scene.el.append(scene.sprite, hint);
        document.body.appendChild(scene.el);
    },

    /** Textes de l'élément dans la langue courante */
    translate() {
        scene.el.setAttribute('aria-label', t('MASCOT.ARIA'));
        hint.textContent = t('MASCOT.HINT');
    },

    /**
     * Lance une animation depuis sa première image.
     * @param {string} name       nom dans PIERRE_ANIMS
     * @param {Function} [onEnd]  suite, appelée à la fin d'une animation non bouclée
     */
    play(name, onEnd = null) {
        animator.play(name, onEnd);
        draw();
    },

    /** Avance l'animation de dt secondes */
    update(dt) {
        animator.update(dt);
        draw();
    },

    /** Place l'élément à sa position et l'oriente selon son regard */
    place() {
        scene.el.style.transform = `translate(${Math.round(scene.x)}px,${Math.round(-scene.y)}px)`;
        scene.sprite.style.transform = scene.dir < 0 ? 'scaleX(-1)' : '';
    },

    /** Adapte le sprite à l'échelle courante */
    resize() {
        const { style } = scene.sprite;
        style.width = `${cellWidth()}px`;
        style.height = `${cellHeight()}px`;
        style.backgroundSize = `${PIERRE_SHEET.cols * cellWidth()}px auto`;
    }
};

export default Pierre;
