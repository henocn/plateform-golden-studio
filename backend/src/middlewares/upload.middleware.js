'use strict';

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Allowed MIME types by category
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
  media: [
    'video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
  ],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
};

const ALL_ALLOWED_MIMES = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents,
  ...ALLOWED_MIME_TYPES.media,
  ...ALLOWED_MIME_TYPES.archives,
];

/**
 * Storage config — save to disk with UUID filenames
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

/**
 * File filter — reject disallowed MIME types
 */
const fileFilter = (allowedMimes = ALL_ALLOWED_MIMES) => (_req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`File type "${file.mimetype}" is not allowed`), false);
  }
};

/**
 * Create a multer instance with configured limits
 *
 * @param {Object} options
 * @param {number} [options.maxFileSize] - Max file size in bytes (default from env)
 * @param {number} [options.maxFiles] - Max number of files (default: 5)
 * @param {string[]} [options.allowedMimes] - Allowed MIME types (default: ALL_ALLOWED_MIMES)
 * @returns {multer.Multer}
 */
const createUpload = ({ maxFileSize, maxFiles = 5, allowedMimes } = {}) => multer({
  storage,
  limits: {
    fileSize: maxFileSize || env.MAX_FILE_SIZE,
    files: maxFiles,
  },
  fileFilter: fileFilter(allowedMimes),
});

// Pre-configured instances
const uploadSingle = (fieldName = 'file', options = {}) => createUpload(options).single(fieldName);
const uploadMultiple = (fieldName = 'files', maxCount = 5, options = {}) => createUpload({ ...options, maxFiles: maxCount }).array(fieldName, maxCount);

module.exports = {
  createUpload,
  uploadSingle,
  uploadMultiple,
  ALLOWED_MIME_TYPES,
  ALL_ALLOWED_MIMES,
};
