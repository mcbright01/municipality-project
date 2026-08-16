const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadFiles, downloadFile, removeFile, filesForComplaint } = require('../controllers/fileController');
const { UPLOAD_DIR } = require('../services/fileService');

const router = express.Router();
router.use(requireAuth);

// Use memory storage so we can optionally scan and/or upload to S3 before persisting
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB per file limit

// Upload one or more files. Optionally include complaint_id in the body.
router.post('/upload', upload.array('files', 12), uploadFiles);

// List files for a complaint
router.get('/complaint/:id', filesForComplaint);

// Download file by id
router.get('/:id', downloadFile);

// Delete file by id (uploader, Supervisor, Admin)
router.delete('/:id', removeFile);

module.exports = router;
