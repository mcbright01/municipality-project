const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const { execFile } = require('child_process');
const { UPLOAD_DIR, saveFileMetadata, getFileById, listFilesForComplaint, deleteFileById, uploadToS3, s3Enabled } = require('../services/fileService');
const { logAction } = require('../utils/audit');

const virusScanEnabled = process.env.VIRUS_SCAN === '1' || process.env.VIRUS_SCAN === 'true';

async function scanBufferWithClam(buffer) {
  // Requires `clamscan` to be installed on the host. We'll write a temp file and call clamscan.
  const tmpName = `${uuidv4()}`;
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const tmpPath = path.join(UPLOAD_DIR, tmpName);
  await fs.promises.writeFile(tmpPath, buffer);
  return new Promise((resolve, reject) => {
    execFile('clamscan', ['--no-summary', tmpPath], (err, stdout, stderr) => {
      // clean up temp file
      fs.promises.unlink(tmpPath).catch(() => {});
      if (err) {
        // clamscan returns exit code 1 if infected, 2 on error
        if (err.code === 1) return resolve({ infected: true, output: stdout + stderr });
        return reject(err);
      }
      return resolve({ infected: false, output: stdout + stderr });
    });
  });
}

async function uploadFiles(req, res) {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded.' });

    const complaintId = req.body.complaint_id ? Number(req.body.complaint_id) : null;
    const saved = [];
    for (const f of req.files) {
      const buffer = f.buffer;
      const originalName = f.originalname;
      const mimeType = f.mimetype || mime.lookup(originalName) || 'application/octet-stream';
      const size = f.size;

      // Optional virus scan
      if (virusScanEnabled && clamScanner) {
        try {
          const resScan = await clamScanner.scanBuffer(buffer);
          if (resScan && resScan.includes('FOUND')) {
            return res.status(400).json({ message: 'Uploaded file failed virus scan.' });
          }
        } catch (e) {
          console.error('ClamAV scan error', e.message || e);
          return res.status(500).json({ message: 'Virus scan failed.' });
        }
      }

      // If S3 enabled, upload to S3 and save s3 key in metadata path
      let storageName = `${uuidv4()}${path.extname(originalName)}`;
      let s3Key = null;
      let pathOnDisk = null;
      if (s3Enabled) {
        try {
          s3Key = await uploadToS3(buffer, originalName, mimeType);
        } catch (e) {
          console.error('S3 upload error', e.message || e);
          return res.status(500).json({ message: 'Could not upload to storage.' });
        }
      } else {
        // ensure upload dir exists
        if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        const outPath = path.join(UPLOAD_DIR, storageName);
        await fs.promises.writeFile(outPath, buffer);
        pathOnDisk = path.join('uploads', storageName);
      }

      const meta = await saveFileMetadata({ originalName, storageName, pathOnDisk, mimeType, size, uploaderId: req.user.id, complaintId, s3Key });
      saved.push(meta);
      await logAction(req.user.id, 'UPLOAD_FILE', 'files', meta.file_id, JSON.stringify({ originalName, complaintId }));
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not save uploaded files.' });
  }
}

async function downloadFile(req, res) {
  try {
    const fileId = Number(req.params.id);
    const file = await getFileById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found.' });

    // Access control: citizens can only fetch files tied to their own complaints
    if (req.user.role === 'Citizen' && file.complaint_id) {
      const pool = require('../db');
      const r = await pool.query('SELECT citizen_id FROM complaints WHERE complaint_id = $1', [file.complaint_id]);
      if (r.rows.length === 0 || r.rows[0].citizen_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to access this file.' });
      }
    }

    const filePath = path.resolve(__dirname, '..', file.path);
    if (!fs.existsSync(filePath)) return res.status(410).json({ message: 'File no longer exists on server.' });

    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name.replace(/"/g, '')}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not download file.' });
  }
}

async function removeFile(req, res) {
  try {
    const fileId = Number(req.params.id);
    const file = await getFileById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found.' });

    // Only uploader, Supervisor, or Admin can delete
    if (req.user.id !== file.uploader_id && !['Supervisor', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this file.' });
    }

    await deleteFileById(fileId);
    await logAction(req.user.id, 'DELETE_FILE', 'files', fileId, null);
    res.json({ message: 'File deleted.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not delete file.' });
  }
}

async function filesForComplaint(req, res) {
  try {
    const complaintId = Number(req.params.id);
    if (!complaintId) return res.status(400).json({ message: 'Invalid complaint id.' });

    // Citizens only see files for their own complaints
    if (req.user.role === 'Citizen') {
      const pool = require('../db');
      const r = await pool.query('SELECT citizen_id FROM complaints WHERE complaint_id = $1', [complaintId]);
      if (r.rows.length === 0 || r.rows[0].citizen_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view these files.' });
      }
    }

    const list = await listFilesForComplaint(complaintId);
    res.json(list);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not load files.' });
  }
}

module.exports = { uploadFiles, downloadFile, removeFile, filesForComplaint };
