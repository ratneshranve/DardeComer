import multer from 'multer';

const storage = multer.memoryStorage();

// Set generous file size limit for APK camera uploads (4 high-res photos can be 20-40MB)
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 20,                   // max 20 files per request (registration needs ~14)
  },
});

