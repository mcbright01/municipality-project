const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');

// Configure S3 client if environment variables provided
const s3Enabled = !!process.env.S3_BUCKET_NAME && !!process.env.S3_REGION && !!process.env.S3_ACCESS_KEY_ID && !!process.env.S3_SECRET_ACCESS_KEY;
let s3Client = null;
if (s3Enabled) {
  s3Client = new S3Client({ region: process.env.S3_REGION, credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  }});
}

async function saveFileMetadata({ originalName, storageName, pathOnDisk, mimeType, size, uploaderId, complaintId, s3Key }) {
  const result = await pool.query(
    `INSERT INTO files (original_name, storage_name, path, mime_type, size_bytes, uploader_id, complaint_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [originalName, storageName, pathOnDisk || (s3Key ? `s3://${process.env.S3_BUCKET_NAME}/${s3Key}` : path.join('uploads', storageName)), mimeType, size, uploaderId || null, complaintId || null]
  );
  return result.rows[0];
}

async function getFileById(fileId) {
  const res = await pool.query('SELECT * FROM files WHERE file_id = $1', [fileId]);
  return res.rows[0];
}

async function listFilesForComplaint(complaintId) {
  const res = await pool.query('SELECT * FROM files WHERE complaint_id = $1 ORDER BY created_at ASC', [complaintId]);
  return res.rows;
}

async function uploadToS3(buffer, originalName, mimeType) {
  if (!s3Enabled) throw new Error('S3 not configured');
  const key = `${uuidv4()}${path.extname(originalName)}`;
  const cmd = new PutObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key, Body: buffer, ContentType: mimeType });
  await s3Client.send(cmd);
  return key;
}

async function deleteFileById(fileId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query('SELECT storage_name, path FROM files WHERE file_id = $1 FOR UPDATE', [fileId]);
    if (res.rows.length === 0) return null;
    const file = res.rows[0];

    // Remove DB row
    await client.query('DELETE FROM files WHERE file_id = $1', [fileId]);
    await client.query('COMMIT');

    // If the path references s3:// then delete from S3
    if (file.path && file.path.startsWith('s3://') && s3Enabled) {
      const key = file.path.split(`s3://${process.env.S3_BUCKET_NAME}/`)[1];
      if (key) {
        try { await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key })); } catch (e) { }
      }
    } else {
      // Remove file from disk; ignore errors
      try { await fs.promises.unlink(path.resolve(__dirname, '..', file.path)).catch(() => {}); } catch (e) { }
    }

    return file;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { UPLOAD_DIR, saveFileMetadata, getFileById, listFilesForComplaint, deleteFileById, uploadToS3, s3Enabled };
