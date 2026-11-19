/**
 * Starfield - ciel étoilé en 3D de l'expérience Spatial (canvas #pb-space).
 *
 * Les étoiles viennent vers le spectateur (projection en perspective) :
 * points clairs sur ciel noir en mode sombre, points foncés sur ciel blanc
 * en mode clair (<html data-pb-mode>). Vitesse de croisière lente ;
 * warp(ms) lance un saut en hyperespace (les étoiles s'étirent en
 * traînées) ; push(v) accélère brièvement le vaisseau (défilement en visite
 * libre).
 *
 * Effet autonome : il ne connaît que son canvas. onFrame(fn) permet au
 * cockpit d'afficher la vitesse à chaque image. Animation suspendue quand
 * l'onglet est masqué ; une seule image fixe si l'utilisateur demande à
 * réduire les animations.
 */
import { prefersReducedMotion } from '../../../utils/motion.js';
import { makeBody } from './bodies.js';
import { skyLayer } from './sky.js';

const TAU = 6.2832;

const CRUISE = 0.06;           // vitesse de croisière (profondeur par seconde)
const WARP = 2.6;              // supplément de vitesse au sommet d'un saut
const STREAK_SPEED = 0.25;     // au-delà, les corps laissent une traînée
const BOOST_MAX = 1.1;         // accélération maximale due au défilement
const BOOST_DECAY = 0.08;      // part de l'accélération restant après 1 s
const MAX_FRAME_MS = 50;       // pas de temps maximal (après une pause)
const MAX_DPR = 1.5;           // densité de pixels maximale du canvas
const MAX_BODIES = 900;        // nombre maximal de corps
const PIXELS_PER_BODY = 1600;  // un corps pour 1600 px² d'écran
const MARGIN = 50;             // marge hors écran avant recyclage (px)

let canvas = null;
let ctx = null;
let raf = 0;
let last = 0;
let bodies = [];
let speed = CRUISE;
let warpStart = 0;
let warpDur = 0;
let boost = 0;
let frameListener = null;

/** Projection du corps en cours de dessin (objet réutilisé : aucune
    allocation par image dans la boucle d'animation) */
const view = { x: 0, y: 0, fromX: 0, fromY: 0, alpha: 0, radius: 0, streak: false, scale: 1, dt: 0 };

/** Adapte le canvas et le nombre de corps à la taille de la fenêtre */
function resize() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(MAX_BODIES, innerWidth * innerHeight / PIXELS_PER_BODY));
    while (bodies.length < count) bodies.push(makeBody(false));
    bodies.length = count;
}

/** Vitesse de l'image : courbe du saut en cours, sinon croisière + élan */
function updateSpeed(now, dt) {
    if (warpDur) {
        /* L'horodatage de l'image peut précéder l'appel à warp() :
           une progression négative donnerait pow(négatif, 1.6) = NaN */
        const progress = Math.max(0, (now - warpStart) / warpDur);
        if (progress >= 1) { warpDur = 0; speed = CRUISE; }
        else speed = CRUISE + WARP * Math.pow(Math.sin(Math.PI * progress), 1.6);
    } else {
        /* Visite libre : le vaisseau accélère quand on fait défiler */
        boost *= Math.pow(BOOST_DECAY, dt);
        speed = CRUISE + boost;
    }
    /* Garde-fou : une vitesse invalide viderait le ciel pour de bon */
    if (!isFinite(speed)) { speed = CRUISE; boost = 0; }
}

/** Étoile : point, ou traînée pendant un saut (teinte selon le mode) */
function drawStar(body, light) {
    const color = `rgba(${light ? body.ink : body.c},${view.alpha})`;
    if (view.streak) {
        ctx.strokeStyle = color;
        ctx.lineWidth = view.radius;
        ctx.beginPath(); ctx.moveTo(view.fromX, view.fromY); ctx.lineTo(view.x, view.y); ctx.stroke();
    } else {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(view.x, view.y, view.radius, 0, TAU); ctx.fill();
    }
}

/** Dessine une image et programme la suivante */
function frame(now) {
    const dt = Math.min(MAX_FRAME_MS, now - (last || now)) / 1000;
    last = now;
    updateSpeed(now, dt);

    const w = innerWidth;
    const h = innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const focal = Math.max(w, h) * 0.55;
    const scale = Math.max(w, h) / 900;
    const streak = speed > STREAK_SPEED;
    const light = document.documentElement.getAttribute('data-pb-mode') === 'light';
    view.streak = streak;
    view.scale = scale;
    view.dt = dt;

    /* Fond peint dans le canvas : il suit le mode à chaque image */
    ctx.drawImage(skyLayer(w, h, light), 0, 0, w, h);

    for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        const prevZ = body.z;
        body.z -= speed * dt;
        /* !(> 0.02) : une profondeur invalide (NaN) est aussi recyclée */
        if (!(body.z > 0.02)) { bodies[i] = makeBody(true); continue; }
        const x = cx + body.x / body.z * focal;
        const y = cy + body.y / body.z * focal;
        if (x < -MARGIN || x > w + MARGIN || y < -MARGIN || y > h + MARGIN) { bodies[i] = makeBody(true); continue; }
        view.x = x;
        view.y = y;
        view.fromX = cx + body.x / prevZ * focal;
        view.fromY = cy + body.y / prevZ * focal;
        view.alpha = Math.min(1, (1 - body.z) * 1.3);
        view.radius = (1 - body.z) * 1.9 + 0.25;
        drawStar(body, light);
    }

    if (frameListener) frameListener(speed);
    raf = requestAnimationFrame(frame);
}

/** Onglet masqué : pause ; de retour : reprise (si le ciel est affiché) */
function onVisibilityChange() {
    if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
    } else if (canvas && !canvas.hidden && !raf && !prefersReducedMotion()) {
        last = 0;
        raf = requestAnimationFrame(frame);
    }
}

/** Crée le canvas en tout premier enfant de <body> (derrière la page) */
function createCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'pb-space';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibilityChange);
}

const Starfield = {
    /** Affiche le ciel et lance l'animation (image fixe si mouvement réduit) */
    start() {
        if (!canvas) createCanvas();
        canvas.hidden = false;
        resize();
        if (prefersReducedMotion()) {
            speed = 0;
            frame(performance.now());
            cancelAnimationFrame(raf);
            raf = 0;
            return;
        }
        if (!raf) {
            last = 0;
            raf = requestAnimationFrame(frame);
        }
    },

    /** Arrête l'animation et masque le ciel */
    stop() {
        cancelAnimationFrame(raf);
        raf = 0;
        if (canvas) canvas.hidden = true;
    },

    /** Saut en hyperespace de ms millisecondes (accélération puis freinage) */
    warp(ms) {
        warpStart = performance.now();
        warpDur = ms;
    },

    /** Élan ponctuel (cumulable, plafonné) */
    push(amount) {
        boost = Math.min(BOOST_MAX, boost + amount);
    },

    /** Abonne fn(vitesse) à chaque image dessinée (une seule fonction) */
    onFrame(fn) {
        frameListener = fn;
    }
};

export default Starfield;
