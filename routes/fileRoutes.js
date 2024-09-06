const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadPreSignedUrl, createFiles, getPresignedUrl, deleteFile } = require('../controllers/fileController');

const router = express.Router();

router.post('/upload-signed-urls', authenticate, uploadPreSignedUrl);
router.post("/create", authenticate, createFiles);
router.post("/get-signed-url", authenticate, getPresignedUrl);
router.delete("/:id", authenticate, deleteFile);

module.exports = router;