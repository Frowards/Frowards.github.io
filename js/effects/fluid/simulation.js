/**
 * simulation - solveur de Navier-Stokes simplifié, entièrement sur le GPU.
 *
 * À chaque image : rotationnel, confinement de vorticité, divergence,
 * pression (itérations de Jacobi), soustraction du gradient (vitesse
 * incompressible), puis advection semi-lagrangienne de la vitesse et de
 * la couleur. Les taches (splat) injectent poussée et couleur.
 *
 * D'après "WebGL Fluid Simulation" de Pavel Dobryakov (licence MIT),
 * réécrit sans bloom ni sunrays.
 */
import { Program, compileShader, detectFormats } from './webgl.js';
import { RenderTarget, DoubleTarget, fieldResolution } from './framebuffers.js';
import {
    VERT_SRC, CLEAR_FS, DISPLAY_FS, SPLAT_FS, ADVECT_FS, DIVERGENCE_FS,
    CURL_FS, VORTICITY_FS, PRESSURE_FS, GRADIENT_FS, fragmentSource
} from './shaders.js';
import { SIM_RES, DYE_RES, PRESSURE, PRESSURE_ITER, CURL, VELOCITY_DISSIPATION } from './config.js';

export default class FluidSimulation {
    /** @param {WebGLRenderingContext} gl contexte du canvas d'affichage */
    constructor(gl) {
        this.gl = gl;
        this.formats = null;
        this.vertexShader = null;
        this.programs = null;
        this.buffers = null;
        this.dye = null;          // couleur (double tampon)
        this.velocity = null;     // vitesse (double tampon)
        this.divergence = null;
        this.curl = null;
        this.pressure = null;     // pression (double tampon)
    }

    /** Compile les programmes et prépare le quad plein écran (lève une erreur si impossible) */
    init() {
        const { gl } = this;
        this.formats = detectFormats(gl);
        this.vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
        const manual = this.formats.linear ? [] : ['MANUAL_FILTERING'];
        const make = (body, keywords) => new Program(gl, this.vertexShader, fragmentSource(body, keywords, this.formats.packed));
        this.programs = {
            clear: make(CLEAR_FS),
            display: make(DISPLAY_FS),
            splatVel: make(SPLAT_FS),
            splatDye: make(SPLAT_FS, ['DYE']),
            advVel: make(ADVECT_FS, manual),
            advDye: make(ADVECT_FS, ['DYE'].concat(manual)),
            divergence: make(DIVERGENCE_FS),
            curl: make(CURL_FS),
            vorticity: make(VORTICITY_FS),
            pressure: make(PRESSURE_FS),
            gradient: make(GRADIENT_FS)
        };
        /* Quad plein écran (2 triangles), attribut 0 = aPosition */
        this.buffers = { vb: gl.createBuffer(), ib: gl.createBuffer() };
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.disable(gl.BLEND);
    }

    /** (Re)crée les champs, seulement si leur résolution a changé */
    resizeFields() {
        const { gl, formats } = this;
        const sim = fieldResolution(gl, SIM_RES);
        const dyeRes = fieldResolution(gl, DYE_RES);
        if (this.velocity && this.velocity.width === sim.w && this.velocity.height === sim.h
            && this.dye.width === dyeRes.w && this.dye.height === dyeRes.h) return;
        this.deleteFields();
        const filter = formats.linear ? gl.LINEAR : gl.NEAREST;
        this.dye = new DoubleTarget(gl, formats, dyeRes.w, dyeRes.h, formats.rgba, filter, false);
        this.velocity = new DoubleTarget(gl, formats, sim.w, sim.h, formats.rg, filter, true);
        this.divergence = new RenderTarget(gl, formats, sim.w, sim.h, formats.r, gl.NEAREST, true);
        this.curl = new RenderTarget(gl, formats, sim.w, sim.h, formats.r, gl.NEAREST, true);
        this.pressure = new DoubleTarget(gl, formats, sim.w, sim.h, formats.r, gl.NEAREST, true);
    }

    deleteFields() {
        ['dye', 'velocity', 'divergence', 'curl', 'pressure'].forEach((name) => {
            if (this[name]) this[name].destroy();
            this[name] = null;
        });
    }

    /** Dessine le quad dans la cible (null = le canvas) */
    blit(target) {
        const { gl } = this;
        if (target) {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        } else {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    /**
     * Fait avancer la simulation.
     * @param {number} dt                 pas de temps (s)
     * @param {number} densityDissipation vitesse d'effacement de la couleur
     */
    step(dt, densityDissipation) {
        const { programs, velocity, pressure, dye } = this;
        const sx = velocity.tsx;
        const sy = velocity.tsy;
        let p;

        p = programs.curl.use();
        p.vec2('texelSize', sx, sy);
        p.int('uVelocity', velocity.read.attach(0));
        this.blit(this.curl);

        p = programs.vorticity.use();
        p.vec2('texelSize', sx, sy);
        p.int('uVelocity', velocity.read.attach(0));
        p.int('uCurl', this.curl.attach(1));
        p.float('curl', CURL);
        p.float('dt', dt);
        this.blit(velocity.write);
        velocity.swap();

        p = programs.divergence.use();
        p.vec2('texelSize', sx, sy);
        p.int('uVelocity', velocity.read.attach(0));
        this.blit(this.divergence);

        p = programs.clear.use();
        p.int('uTexture', pressure.read.attach(0));
        p.float('value', PRESSURE);
        this.blit(pressure.write);
        pressure.swap();

        p = programs.pressure.use();
        p.vec2('texelSize', sx, sy);
        p.int('uDivergence', this.divergence.attach(0));
        for (let i = 0; i < PRESSURE_ITER; i++) {
            p.int('uPressure', pressure.read.attach(1));
            this.blit(pressure.write);
            pressure.swap();
        }

        p = programs.gradient.use();
        p.vec2('texelSize', sx, sy);
        p.int('uPressure', pressure.read.attach(0));
        p.int('uVelocity', velocity.read.attach(1));
        this.blit(velocity.write);
        velocity.swap();

        p = programs.advVel.use();
        p.vec2('velTexel', sx, sy);
        p.vec2('srcTexel', sx, sy);
        const velocityId = velocity.read.attach(0);
        p.int('uVelocity', velocityId);
        p.int('uSource', velocityId);
        p.float('dt', dt);
        p.float('dissipation', VELOCITY_DISSIPATION);
        this.blit(velocity.write);
        velocity.swap();

        p = programs.advDye.use();
        p.vec2('velTexel', sx, sy);
        p.vec2('srcTexel', dye.tsx, dye.tsy);
        p.int('uVelocity', velocity.read.attach(0));
        p.int('uSource', dye.read.attach(1));
        p.float('dt', dt);
        p.float('dissipation', densityDissipation);
        this.blit(dye.write);
        dye.swap();
    }

    /** Affiche la couleur sur le canvas */
    render() {
        const p = this.programs.display.use();
        p.int('uTexture', this.dye.read.attach(0));
        this.blit(null);
    }

    /**
     * Injecte une poussée (dx, dy) et, si color, une tache de couleur en (x, y).
     * @param {number} x      abscisse uv (0 à 1, de gauche à droite)
     * @param {number} y      ordonnée uv (0 à 1, de bas en haut)
     * @param {number} dx     poussée horizontale
     * @param {number} dy     poussée verticale
     * @param {?{r: number, g: number, b: number}} color couleur (null : poussée seule)
     * @param {number} radius rayon de la tache gaussienne (avant correction d'aspect)
     */
    splat(x, y, dx, dy, color, radius) {
        const { canvas } = this.gl;
        const aspect = canvas.width / canvas.height;
        const r = aspect > 1 ? radius * aspect : radius;
        let p = this.programs.splatVel.use();
        p.int('uTarget', this.velocity.read.attach(0));
        p.float('aspectRatio', aspect);
        p.vec2('point', x, y);
        p.vec3('color', dx, dy, 0);
        p.float('radius', r);
        this.blit(this.velocity.write);
        this.velocity.swap();
        if (!color) return;
        p = this.programs.splatDye.use();
        p.int('uTarget', this.dye.read.attach(0));
        p.float('aspectRatio', aspect);
        p.vec2('point', x, y);
        p.vec3('color', color.r, color.g, color.b);
        p.float('radius', r);
        this.blit(this.dye.write);
        this.dye.swap();
    }

    /** Vide le canvas d'affichage (transparent) */
    clearCanvas() {
        const { gl } = this;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    /** Plus rien à animer : remet couleur, vitesse et pression à zéro et vide le canvas */
    clearAll() {
        this.dye.clear();
        this.velocity.clear();
        this.pressure.clear();
        this.clearCanvas();
    }

    /** Libère toutes les ressources GPU (y compris après une initialisation partielle) */
    destroy() {
        const { gl } = this;
        this.deleteFields();
        if (this.programs) Object.values(this.programs).forEach((program) => program.destroy());
        if (this.vertexShader) gl.deleteShader(this.vertexShader);
        if (this.buffers) {
            gl.deleteBuffer(this.buffers.vb);
            gl.deleteBuffer(this.buffers.ib);
        }
        this.clearCanvas();
    }
}
