/**
 * Réduction d'une image dans le navigateur avant de la garder : une photo
 * d'appareil (plusieurs Mo) ne tiendrait pas dans le stockage local.
 */

/**
 * Redimensionne une image (côté le plus long borné à maxSize) et la
 * réencode en data URL.
 * @param {File} file image choisie par le visiteur
 * @param {{ maxSize?: number, type?: string, quality?: number }} [options]
 *        maxSize : côté le plus long en px ; type et quality : encodage de sortie
 * @returns {Promise<string|null>} data URL, ou null si l'image est illisible
 */
export function downscaleImage(file, { maxSize = 1920, type = 'image/jpeg', quality = 0.82 } = {}) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const ratio = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
            canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL(type, quality));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        img.src = url;
    });
}
