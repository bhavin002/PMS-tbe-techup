const express = require('express');
const { createNote, getNotesByProjectId, updateNote, deleteNote } = require('../controllers/noteController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', authenticate, createNote);
router.get('/:projectId', authenticate, getNotesByProjectId);
router.put('/:id', authenticate, updateNote);
router.delete('/:id', authenticate, deleteNote);

module.exports = router;