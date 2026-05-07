/**
 * Utility to compress images on the client side before uploading.
 * Reduces both dimensions (max width/height) and quality.
 */

/**
 * Compresses an image file.
 * @param {File} file - The original image file.
 * @param {Object} options - Compression options.
 * @param {number} options.maxWidth - Max width in pixels (default: 1200).
 * @param {number} options.maxHeight - Max height in pixels (default: 1200).
 * @param {number} options.quality - Image quality from 0 to 1 (default: 0.7).
 * @returns {Promise<File>} - Resolves with the compressed File object.
 */
export const compressImage = (file, options = {}) => {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.7 } = options;

  return new Promise((resolve, reject) => {
    // Only compress images
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    // Skip small files (under 200KB)
    if (file.size < 200 * 1024) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas to Blob conversion failed'));
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Compresses an array of image files.
 */
export const compressImages = async (files, options = {}) => {
  const compressed = await Promise.all(
    Array.from(files).map((file) => compressImage(file, options))
  );
  return compressed;
};
