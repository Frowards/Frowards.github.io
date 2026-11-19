/**
 * SpriteAnimator - lecture d'une animation image par image.
 *
 * Avance dans les cases d'une table d'animations (anims.js) au rythme de son
 * fps, à partir du temps écoulé à chaque image de la boucle principale.
 * L'affichage reste à la charge de l'appelant, qui lit la case courante (cell).
 *
 * Fin d'une animation non bouclée :
 *   - si une suite a été donnée à play(), elle est appelée une fois ;
 *   - sinon, si le lecteur a une animation de repli, celle-ci est lancée ;
 *   - sinon, l'animation reste sur sa dernière image.
 */
export default class SpriteAnimator {
    /**
     * @param {Object} anims      table nom -> { f, fps, loop }
     * @param {string} first      animation de départ
     * @param {string|null} [fallback=null]  animation lancée à la fin d'une animation non bouclée sans suite
     */
    constructor(anims, first, fallback = null) {
        this.anims = anims;
        this.fallback = fallback;
        this.name = first;
        this.frame = 0;          // rang de l'image dans l'animation
        this.elapsed = 0;        // temps accumulé depuis l'image courante (s)
        this.onEnd = null;
    }

    /** Case de la planche à afficher */
    get cell() {
        const { f } = this.anims[this.name];
        return f[Math.min(this.frame, f.length - 1)];
    }

    /** Lance l'animation name depuis sa première image ; onEnd est appelée à sa fin */
    play(name, onEnd = null) {
        this.name = name;
        this.frame = 0;
        this.elapsed = 0;
        this.onEnd = onEnd;
    }

    /** Lance l'animation name seulement si elle n'est pas déjà en cours */
    ensure(name) {
        if (this.name !== name) this.play(name);
    }

    /** Avance l'animation de dt secondes */
    update(dt) {
        this.elapsed += dt;
        let anim = this.anims[this.name];
        let step = 1 / anim.fps;
        while (this.elapsed >= step) {
            this.elapsed -= step;
            this.frame += 1;
            if (this.frame < anim.f.length) continue;
            if (anim.loop) {
                this.frame = 0;
                continue;
            }
            this.frame = anim.f.length - 1;
            const next = this.onEnd;
            if (next) {
                this.onEnd = null;
                next();
            } else if (this.fallback) {
                this.play(this.fallback);
            }
            /* La suite a pu lancer une autre animation : on continue avec elle */
            anim = this.anims[this.name];
            step = 1 / anim.fps;
        }
    }
}
