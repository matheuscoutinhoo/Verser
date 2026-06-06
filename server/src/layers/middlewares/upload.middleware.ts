import multer from 'multer';
import { UPLOAD } from '@verser/shared';
import { env } from '../../config/env';
import { ValidationError } from '../../errors';

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!(UPLOAD.ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      callback(new ValidationError(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    callback(null, true);
  },
});
