/**
 * framebuffers - champs de la simulation stockés dans des textures GPU.
 *
 *   RenderTarget  une texture + son framebuffer (on peut y dessiner)
 *   DoubleTarget  deux RenderTarget : on lit `read`, on écrit `write`, puis swap()
 */

/** Une texture de champ et son framebuffer */
export class RenderTarget {
    /**
     * @param {WebGLRenderingContext} gl
     * @param {Object} formats  résultat de detectFormats (type, packed)
     * @param {number} width
     * @param {number} height
     * @param {{internal: number, format: number}} fmt format de la texture
     * @param {number} filter   gl.LINEAR ou gl.NEAREST
     * @param {boolean} signed  champ signé (zéro encodé à 128 en repli RGBA8)
     */
    constructor(gl, formats, width, height, fmt, filter, signed) {
        this.gl = gl;
        this.packed = formats.packed;
        this.width = width;
        this.height = height;
        this.tsx = 1 / width;
        this.tsy = 1 / height;
        this.signed = signed;

        gl.activeTexture(gl.TEXTURE0);
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internal, width, height, 0, fmt.format, formats.type, null);
        this.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
        this.clear();
    }

    /**
     * Lie la texture à l'unité de texture id (pour la lire dans un shader).
     * @returns {number} id, à passer à l'uniform sampler2D
     */
    attach(id) {
        const { gl } = this;
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        return id;
    }

    /** Remet le champ à zéro */
    clear() {
        const { gl } = this;
        const zero = this.signed && this.packed ? 128 / 255 : 0;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.viewport(0, 0, this.width, this.height);
        gl.clearColor(zero, zero, zero, zero);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    destroy() {
        this.gl.deleteTexture(this.tex);
        this.gl.deleteFramebuffer(this.fbo);
    }
}

/** Double tampon : lecture dans `read`, écriture dans `write`, puis swap() */
export class DoubleTarget {
    /** Mêmes paramètres que RenderTarget */
    constructor(gl, formats, width, height, fmt, filter, signed) {
        this.width = width;
        this.height = height;
        this.tsx = 1 / width;
        this.tsy = 1 / height;
        this.read = new RenderTarget(gl, formats, width, height, fmt, filter, signed);
        this.write = new RenderTarget(gl, formats, width, height, fmt, filter, signed);
    }

    swap() {
        [this.read, this.write] = [this.write, this.read];
    }

    clear() {
        this.read.clear();
        this.write.clear();
    }

    destroy() {
        this.read.destroy();
        this.write.destroy();
    }
}

/**
 * Résolution d'un champ : `res` texels sur le petit côté du canvas,
 * proportionnelle sur le grand.
 * @param {WebGLRenderingContext} gl
 * @param {number} res
 * @returns {{w: number, h: number}}
 */
export function fieldResolution(gl, res) {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    let aspect = w / h;
    if (aspect < 1) aspect = 1 / aspect;
    const min = Math.round(res);
    const max = Math.round(res * aspect);
    return w > h ? { w: max, h: min } : { w: min, h: max };
}
