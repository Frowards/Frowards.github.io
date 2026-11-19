/**
 * shaders - sources GLSL (WebGL 1) de la simulation de fluide.
 *
 * Algorithme d'après "WebGL Fluid Simulation" de Pavel Dobryakov
 * https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
 * Copyright (c) 2017 Pavel Dobryakov - licence MIT.
 *
 * Chaque fragment shader est précédé de FRAG_HEAD, et éventuellement de
 * #define (voir fragmentSource) :
 *   - PACKED + RANGE   repli RGBA8 : champs signés encodés dans [0, 1]
 *   - DYE              la cible est la couleur (sinon un champ de vitesse)
 *   - MANUAL_FILTERING interpolation bilinéaire faite à la main
 */
import { PACK_RANGE } from './config.js';

/* Vertex shader commun : quad plein écran, uv du texel et de ses 4 voisins */
export const VERT_SRC = [
    'precision highp float;',
    'attribute vec2 aPosition;',
    'uniform vec2 texelSize;',
    'varying vec2 vUv;',
    'varying vec2 vL;',
    'varying vec2 vR;',
    'varying vec2 vT;',
    'varying vec2 vB;',
    'void main () {',
    '    vUv = aPosition * 0.5 + 0.5;',
    '    vL = vUv - vec2(texelSize.x, 0.0);',
    '    vR = vUv + vec2(texelSize.x, 0.0);',
    '    vT = vUv + vec2(0.0, texelSize.y);',
    '    vB = vUv - vec2(0.0, texelSize.y);',
    '    gl_Position = vec4(aPosition, 0.0, 1.0);',
    '}'
].join('\n');

/* En-tête commun des fragment shaders. dec/enc : en repli RGBA8 (PACKED),
   les champs signés (vitesse, pression...) sont stockés v / RANGE * 127 + 128,
   troncature vers zéro pour que l'amortissement finisse bien à 0. */
export const FRAG_HEAD = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    'precision highp sampler2D;',
    '#else',
    'precision mediump float;',
    'precision mediump sampler2D;',
    '#endif',
    '#ifdef PACKED',
    'vec4 dec (vec4 c) { return (c * 255.0 - 128.0) * (RANGE / 127.0); }',
    'vec4 enc (vec4 v) {',
    '    vec4 s = clamp(v * (127.0 / RANGE), -127.0, 127.0);',
    '    s = sign(s) * floor(abs(s));',
    '    return (s + 128.0) / 255.0;',
    '}',
    '#else',
    'vec4 dec (vec4 c) { return c; }',
    'vec4 enc (vec4 v) { return v; }',
    '#endif',
    'varying vec2 vUv;',
    'varying vec2 vL;',
    'varying vec2 vR;',
    'varying vec2 vT;',
    'varying vec2 vB;',
    ''
].join('\n');

/* Multiplie un champ signé (sert à atténuer la pression d'une frame à l'autre) */
export const CLEAR_FS = [
    'uniform sampler2D uTexture;',
    'uniform float value;',
    'void main () { gl_FragColor = enc(value * dec(texture2D(uTexture, vUv))); }'
].join('\n');

/* Affichage : alpha = composante max, couleur déjà prémultipliée */
export const DISPLAY_FS = [
    'uniform sampler2D uTexture;',
    'void main () {',
    '    vec3 c = clamp(texture2D(uTexture, vUv).rgb, 0.0, 1.0);',
    '    float a = max(c.r, max(c.g, c.b));',
    '    gl_FragColor = vec4(c, a);',
    '}'
].join('\n');

/* Tache gaussienne ajoutée à la cible (couleur si DYE, sinon vitesse) */
export const SPLAT_FS = [
    'uniform sampler2D uTarget;',
    'uniform float aspectRatio;',
    'uniform vec3 color;',
    'uniform vec2 point;',
    'uniform float radius;',
    'void main () {',
    '    vec2 p = vUv - point;',
    '    p.x *= aspectRatio;',
    '    vec3 s = exp(-dot(p, p) / radius) * color;',
    '#ifdef DYE',
    '    gl_FragColor = vec4(texture2D(uTarget, vUv).rgb + s, 1.0);',
    '#else',
    '    gl_FragColor = enc(vec4(dec(texture2D(uTarget, vUv)).xyz + s, 1.0));',
    '#endif',
    '}'
].join('\n');

/* Advection semi-lagrangienne : on remonte le courant et on lit la source */
export const ADVECT_FS = [
    'uniform sampler2D uVelocity;',
    'uniform sampler2D uSource;',
    'uniform vec2 velTexel;',
    'uniform vec2 srcTexel;',
    'uniform float dt;',
    'uniform float dissipation;',
    'vec4 fetch (sampler2D sam, vec2 uv, vec2 ts) {',
    '#ifdef MANUAL_FILTERING',
    '    vec2 st = uv / ts - 0.5;',
    '    vec2 iuv = floor(st);',
    '    vec2 fuv = fract(st);',
    '    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * ts);',
    '    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * ts);',
    '    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * ts);',
    '    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * ts);',
    '    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);',
    '#else',
    '    return texture2D(sam, uv);',
    '#endif',
    '}',
    'void main () {',
    '    vec2 coord = vUv - dt * dec(fetch(uVelocity, vUv, velTexel)).xy * velTexel;',
    '    vec4 src = fetch(uSource, coord, srcTexel);',
    '    float decay = 1.0 + dissipation * dt;',
    '#ifdef DYE',
    '    gl_FragColor = vec4(src.rgb / decay, 1.0);',
    '#else',
    '    gl_FragColor = enc(vec4(dec(src).xy / decay, 0.0, 1.0));',
    '#endif',
    '}'
].join('\n');

/* Divergence de la vitesse (bords : parois qui renvoient le flux) */
export const DIVERGENCE_FS = [
    'uniform sampler2D uVelocity;',
    'void main () {',
    '    float L = dec(texture2D(uVelocity, vL)).x;',
    '    float R = dec(texture2D(uVelocity, vR)).x;',
    '    float T = dec(texture2D(uVelocity, vT)).y;',
    '    float B = dec(texture2D(uVelocity, vB)).y;',
    '    vec2 C = dec(texture2D(uVelocity, vUv)).xy;',
    '    if (vL.x < 0.0) { L = -C.x; }',
    '    if (vR.x > 1.0) { R = -C.x; }',
    '    if (vT.y > 1.0) { T = -C.y; }',
    '    if (vB.y < 0.0) { B = -C.y; }',
    '    gl_FragColor = enc(vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0));',
    '}'
].join('\n');

/* Rotationnel de la vitesse (intensité des tourbillons) */
export const CURL_FS = [
    'uniform sampler2D uVelocity;',
    'void main () {',
    '    float L = dec(texture2D(uVelocity, vL)).y;',
    '    float R = dec(texture2D(uVelocity, vR)).y;',
    '    float T = dec(texture2D(uVelocity, vT)).x;',
    '    float B = dec(texture2D(uVelocity, vB)).x;',
    '    gl_FragColor = enc(vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0));',
    '}'
].join('\n');

/* Confinement de vorticité : relance les petits tourbillons */
export const VORTICITY_FS = [
    'uniform sampler2D uVelocity;',
    'uniform sampler2D uCurl;',
    'uniform float curl;',
    'uniform float dt;',
    'void main () {',
    '    float L = dec(texture2D(uCurl, vL)).x;',
    '    float R = dec(texture2D(uCurl, vR)).x;',
    '    float T = dec(texture2D(uCurl, vT)).x;',
    '    float B = dec(texture2D(uCurl, vB)).x;',
    '    float C = dec(texture2D(uCurl, vUv)).x;',
    '    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));',
    '    force /= length(force) + 0.0001;',
    '    force *= curl * C;',
    '    force.y *= -1.0;',
    '    vec2 vel = dec(texture2D(uVelocity, vUv)).xy + force * dt;',
    '    vel = clamp(vel, -1000.0, 1000.0);',
    '    gl_FragColor = enc(vec4(vel, 0.0, 1.0));',
    '}'
].join('\n');

/* Une itération de Jacobi pour l'équation de Poisson de la pression */
export const PRESSURE_FS = [
    'uniform sampler2D uPressure;',
    'uniform sampler2D uDivergence;',
    'void main () {',
    '    float L = dec(texture2D(uPressure, vL)).x;',
    '    float R = dec(texture2D(uPressure, vR)).x;',
    '    float T = dec(texture2D(uPressure, vT)).x;',
    '    float B = dec(texture2D(uPressure, vB)).x;',
    '    float div = dec(texture2D(uDivergence, vUv)).x;',
    '    gl_FragColor = enc(vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0));',
    '}'
].join('\n');

/* Soustrait le gradient de pression : la vitesse devient incompressible */
export const GRADIENT_FS = [
    'uniform sampler2D uPressure;',
    'uniform sampler2D uVelocity;',
    'void main () {',
    '    float L = dec(texture2D(uPressure, vL)).x;',
    '    float R = dec(texture2D(uPressure, vR)).x;',
    '    float T = dec(texture2D(uPressure, vT)).x;',
    '    float B = dec(texture2D(uPressure, vB)).x;',
    '    vec2 vel = dec(texture2D(uVelocity, vUv)).xy - vec2(R - L, T - B);',
    '    gl_FragColor = enc(vec4(vel, 0.0, 1.0));',
    '}'
].join('\n');

/**
 * Source complète d'un fragment shader : #define éventuels, en-tête commun,
 * puis le corps.
 * @param {string} body      corps du shader (une des constantes *_FS)
 * @param {string[]} keywords mots-clés à définir (DYE, MANUAL_FILTERING)
 * @param {boolean} packed    repli RGBA8 (champs signés encodés)
 * @returns {string} source GLSL prête à compiler
 */
export function fragmentSource(body, keywords = [], packed = false) {
    let defines = packed ? `#define PACKED\n#define RANGE ${PACK_RANGE}\n` : '';
    keywords.forEach((keyword) => { defines += `#define ${keyword}\n`; });
    return defines + FRAG_HEAD + body;
}
