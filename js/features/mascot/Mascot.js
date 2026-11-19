/**
 * Mascot - Pierre, la mascotte du portfolio, et son petit dragon.
 *
 * Planches reprises de la mascotte de Ceres, moteur léger réécrit pour le
 * portfolio. Pierre se balade en bas de l'écran (au-dessus de la barre de
 * visite guidée ou de la ligne de commande Rétro, via --mascot-floor) ; un
 * clic ouvre sa bulle de contact ; on peut l'attraper et le lancer ; un
 * bouton le masque (choix mémorisé). Si l'utilisateur préfère réduire les
 * animations, il reste immobile et sa bulle reste disponible.
 *
 * Ce module assemble les autres et fait tourner la boucle d'animation :
 *   scene.js        état partagé et mesures d'écran
 *   Pierre.js       le personnage (élément, animation, placement)
 *   Behavior.js     balade, pauses, sieste
 *   FetchGame.js    jeu de la pomme rapportée
 *   Pet.js          le dragon
 *   DragThrow.js    attraper / lancer, chute et rebonds
 *   Bubble.js       bulle de contact
 */
import Lang from '../../core/Lang.js';
import Events from '../../core/Events.js';
import Storage, { KEYS } from '../../core/Storage.js';
import { prefersReducedMotion } from '../../utils/motion.js';
import './icons.js';
import Pierre from './Pierre.js';
import Behavior from './Behavior.js';
import FetchGame from './FetchGame.js';
import Pet from './Pet.js';
import DragThrow from './DragThrow.js';
import Bubble from './Bubble.js';
import { scene, viewportWidth, cellWidth } from './scene.js';

/** Largeur d'écran sous laquelle la mascotte rapetisse (px) et échelles associées */
const SMALL_SCREEN = 600;
/** Hauteur d'écran sous laquelle la mascotte est réduite (téléphone en paysage) */
const SHORT_SCREEN = 500;
const SCALE_SMALL = 0.72;
const SCALE_LARGE = 0.9;

/** Plus long pas de temps accepté (ms) : évite un bond après un onglet en veille */
const MAX_FRAME_TIME = 64;

/** Délai avant l'entrée en scène, après l'arrivée sur la page (ms) */
const ENTRANCE_DELAY = 1800;

let raf = 0;
let last = 0;

/** Une image de la boucle d'animation */
function tick(now) {
    const dt = Math.min(MAX_FRAME_TIME, now - (last || now)) / 1000;
    last = now;
    if (!scene.visible || !scene.el) {
        raf = 0;
        return;
    }
    Pierre.update(dt);
    if (scene.state === 'fall') DragThrow.fall(dt, now);
    else if (scene.state !== 'drag' && !Bubble.isOpen()) Behavior.update(dt, now);
    /* En drag, Pierre suit le pointeur (DragThrow) ; bulle ouverte, il reste sur place */
    Pet.update(dt);
    Pierre.place();
    raf = requestAnimationFrame(tick);
}

/** Lance la boucle si elle ne tourne pas déjà */
function start() {
    if (raf || prefersReducedMotion()) return;
    last = 0;
    raf = requestAnimationFrame(tick);
}

/** Affiche ou masque la mascotte, mémorise le choix et le fait savoir
    (mascot:change : interrupteur du panneau de thème) */
function setVisible(on) {
    scene.visible = Boolean(on);
    Storage.set(KEYS.MASCOT, scene.visible ? 'on' : 'off');
    if (!scene.visible) {
        Bubble.close(false);
        FetchGame.end();
    }
    scene.el.hidden = !scene.visible;
    Pet.show(scene.visible);
    Events.emit('mascot:change', { visible: scene.visible });
    if (scene.visible) {
        /* Retour : il rentre par le bord le plus proche */
        scene.x = Math.random() < 0.5 ? -cellWidth() : viewportWidth();
        scene.y = 0;
        scene.pet.x = null;
        Behavior.chooseWalk();
        Pierre.place();
        start();
    }
}

/** Adapte les tailles à l'écran (petit, ou peu haut comme un téléphone en paysage) */
function resize() {
    const compact = viewportWidth() < SMALL_SCREEN || window.innerHeight < SHORT_SCREEN;
    scene.scale = compact ? SCALE_SMALL : SCALE_LARGE;
    Pierre.resize();
    Pet.resize();
    FetchGame.resize();
    /* Écran rétréci : Pierre revient dans l'écran, à 8 px du bord droit */
    if (scene.x > viewportWidth() - cellWidth()) scene.x = Math.max(0, viewportWidth() - cellWidth() - 8);
    Bubble.position();
}

/** Textes de la mascotte dans la langue courante */
function translate() {
    Pierre.translate();
    Bubble.translate();
}

/** Clavier sur Pierre : Entrée ou Espace ouvrent / ferment la bulle */
function onKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    Bubble.toggle();
}

const Mascot = {
    /** Crée la mascotte, branche ses commandes et la fait entrer en scène */
    init() {
        Pierre.mount();
        Pet.mount();
        FetchGame.mount();
        /* Masquer / faire revenir : depuis la bulle de Pierre ou le panneau de thème */
        Events.on('mascot:request', ({ visible }) => { if (visible !== scene.visible) setVisible(visible); });

        translate();
        Lang.onChange(translate);

        DragThrow.bind(scene.el);
        /* Animations réduites : pas de saisie au pointeur, un clic ouvre la bulle */
        scene.el.addEventListener('click', () => {
            if (prefersReducedMotion()) Bubble.toggle();
        });
        scene.el.addEventListener('keydown', onKeydown);
        Bubble.init();
        window.addEventListener('resize', resize);

        scene.visible = Storage.get(KEYS.MASCOT) !== 'off';
        resize();
        scene.el.hidden = !scene.visible;
        Pet.show(scene.visible);

        if (prefersReducedMotion()) {
            scene.x = 12;
            scene.dir = 1;
            Pierre.play('stand');
            Pierre.place();
            Pet.update(0);
            return;
        }
        /* Entrée en scène par la gauche, un peu après l'arrivée sur la page */
        scene.x = -cellWidth();
        Pierre.place();
        if (scene.visible) {
            setTimeout(() => {
                Behavior.enter();
                start();
            }, ENTRANCE_DELAY);
        }
    },

    /** Fait revenir la mascotte */
    show() {
        setVisible(true);
    },

    /** Masque la mascotte */
    hide() {
        setVisible(false);
    },

    /** Ouvre la bulle de contact */
    open() {
        Bubble.open();
    }
};

export default Mascot;
