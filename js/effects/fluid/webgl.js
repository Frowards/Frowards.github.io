/**
 * webgl - outils WebGL de bas niveau : contexte, shaders, programmes et
 * détection des formats de texture utilisables comme cible de rendu.
 */

/** Attributs du contexte : canvas transparent, alpha prémultiplié, sans profondeur */
const CONTEXT_ATTRIBUTES = Object.freeze({
    alpha: true, depth: false, stencil: false, antialias: false,
    premultipliedAlpha: true, preserveDrawingBuffer: false
});

/**
 * Contexte WebGL 2 si possible, sinon WebGL 1.
 * @param {HTMLCanvasElement} canvas
 * @returns {WebGLRenderingContext|WebGL2RenderingContext|null} null si indisponible
 */
export function createContext(canvas) {
    try {
        return canvas.getContext('webgl2', CONTEXT_ATTRIBUTES)
            || canvas.getContext('webgl', CONTEXT_ATTRIBUTES)
            || canvas.getContext('experimental-webgl', CONTEXT_ATTRIBUTES);
    } catch (err) {
        return null;
    }
}

/**
 * Compile un shader ; lève une erreur avec le journal du compilateur en cas d'échec.
 * @param {WebGLRenderingContext} gl
 * @param {number} type   gl.VERTEX_SHADER ou gl.FRAGMENT_SHADER
 * @param {string} source source GLSL
 * @returns {WebGLShader}
 */
export function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`[Fluid] shader : ${log}`);
    }
    return shader;
}

/**
 * Programme GPU (vertex shader partagé + fragment shader propre) avec
 * raccourcis d'uniforms : un uniform absent (optimisé par le compilateur)
 * est simplement ignoré.
 */
export class Program {
    /**
     * @param {WebGLRenderingContext} gl
     * @param {WebGLShader} vertexShader vertex shader commun (attribut 0 = aPosition)
     * @param {string} fragmentSrc       source complète du fragment shader
     */
    constructor(gl, vertexShader, fragmentSrc) {
        this.gl = gl;
        this.fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
        this.prog = gl.createProgram();
        gl.attachShader(this.prog, vertexShader);
        gl.attachShader(this.prog, this.fs);
        gl.bindAttribLocation(this.prog, 0, 'aPosition');
        gl.linkProgram(this.prog);
        if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
            const log = gl.getProgramInfoLog(this.prog);
            gl.deleteProgram(this.prog);
            gl.deleteShader(this.fs);
            throw new Error(`[Fluid] programme : ${log}`);
        }
        this.uniforms = {};
        const count = gl.getProgramParameter(this.prog, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(this.prog, i);
            if (info) this.uniforms[info.name] = gl.getUniformLocation(this.prog, info.name);
        }
    }

    /** Active le programme ; renvoie lui-même pour enchaîner */
    use() {
        this.gl.useProgram(this.prog);
        return this;
    }

    int(name, v) {
        if (this.uniforms[name]) this.gl.uniform1i(this.uniforms[name], v);
    }

    float(name, v) {
        if (this.uniforms[name]) this.gl.uniform1f(this.uniforms[name], v);
    }

    vec2(name, a, b) {
        if (this.uniforms[name]) this.gl.uniform2f(this.uniforms[name], a, b);
    }

    vec3(name, a, b, c) {
        if (this.uniforms[name]) this.gl.uniform3f(this.uniforms[name], a, b, c);
    }

    /** Libère le programme et son fragment shader */
    destroy() {
        this.gl.deleteProgram(this.prog);
        this.gl.deleteShader(this.fs);
    }
}

/** Vrai si une texture de ce format peut servir de cible de rendu */
function canRender(gl, internal, format, type) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    return ok;
}

/**
 * Formats des champs : demi-flottants si possible (WebGL 2 RGBA16F / RG16F /
 * R16F, ou OES_texture_half_float en WebGL 1), sinon repli RGBA8 où les
 * champs signés sont encodés (packed).
 * @param {WebGLRenderingContext} gl
 * @returns {{packed: boolean, linear: boolean, type: number,
 *            rgba: Object, rg: Object, r: Object}} formats { internal, format } par champ
 */
export function detectFormats(gl) {
    const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    let f = null;
    if (isGL2) {
        gl.getExtension('EXT_color_buffer_float');
        gl.getExtension('EXT_color_buffer_half_float');
        if (canRender(gl, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT)) {
            const rgba = { internal: gl.RGBA16F, format: gl.RGBA };
            f = { packed: false, linear: true, type: gl.HALF_FLOAT, rgba };
            f.rg = canRender(gl, gl.RG16F, gl.RG, gl.HALF_FLOAT) ? { internal: gl.RG16F, format: gl.RG } : rgba;
            f.r = canRender(gl, gl.R16F, gl.RED, gl.HALF_FLOAT) ? { internal: gl.R16F, format: gl.RED } : f.rg;
        }
    } else {
        const hf = gl.getExtension('OES_texture_half_float');
        if (hf && canRender(gl, gl.RGBA, gl.RGBA, hf.HALF_FLOAT_OES)) {
            const rgba = { internal: gl.RGBA, format: gl.RGBA };
            f = {
                packed: false, linear: !!gl.getExtension('OES_texture_half_float_linear'),
                type: hf.HALF_FLOAT_OES, rgba, rg: rgba, r: rgba
            };
        }
    }
    if (!f) {
        const rgba = { internal: gl.RGBA, format: gl.RGBA };
        f = { packed: true, linear: true, type: gl.UNSIGNED_BYTE, rgba, rg: rgba, r: rgba };
    }
    return f;
}
