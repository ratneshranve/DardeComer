import express from 'express';
import { upload } from '../../../middleware/upload.js';
import { uploadMediaBufferDetailed } from '../../../services/cloudinary.service.js';

const router = express.Router();

// POST /v1/uploads/image
router.post('/image', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const folder = typeof req.body?.folder === 'string' && req.body.folder.trim()
            ? req.body.folder.trim()
            : 'uploads';

        const uploaded = await uploadMediaBufferDetailed(
            req.file.buffer,
            folder,
            req.file.mimetype,
            req.file.originalname
        );

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url: uploaded?.secure_url || '',
                publicId: uploaded?.public_id || null,
                resourceType: uploaded?.resource_type || null,
                format: uploaded?.format || null
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;

