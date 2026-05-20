import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret
});

export const uploadImageBuffer = async (buffer, folder = 'uploads') => {
    if (!buffer) {
        throw new Error('File buffer is required');
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result.secure_url);
            }
        );

        stream.end(buffer);
    });
};

export const uploadImageBufferDetailed = async (buffer, folder = 'uploads') => {
    if (!buffer) {
        throw new Error('File buffer is required');
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            }
        );

        stream.end(buffer);
    });
};

const sanitizePdfBaseName = (value = '') =>
    String(value || '')
        .trim()
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 80) || `document-${Date.now()}`;

export const uploadMediaBufferDetailed = async (
    buffer,
    folder = 'uploads',
    mimeType = '',
    originalName = ''
) => {
    if (!buffer) {
        throw new Error('File buffer is required');
    }

    const normalizedMime = String(mimeType || '').toLowerCase();
    const isPdf = normalizedMime === 'application/pdf';
    const resourceType = isPdf ? 'raw' : 'image';
    const uploadOptions = { folder, resource_type: resourceType };

    if (isPdf) {
        const safeBase = sanitizePdfBaseName(originalName);
        uploadOptions.use_filename = true;
        uploadOptions.unique_filename = true;
        // For raw files, public_id should include extension so downloaded file keeps .pdf
        uploadOptions.public_id = `${safeBase}-${Date.now()}.pdf`;
        uploadOptions.filename_override = `${safeBase}.pdf`;
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            }
        );

        stream.end(buffer);
    });
};

export const uploadMediaBuffer = async (buffer, folder = 'uploads', mimeType = '', originalName = '') => {
    const result = await uploadMediaBufferDetailed(buffer, folder, mimeType, originalName);
    return result?.secure_url;
};

export const uploadVideoBuffer = async (buffer, folder = 'uploads') => {
    if (!buffer) {
        throw new Error('File buffer is required');
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result.secure_url);
            }
        );

        stream.end(buffer);
    });
};
