const express = require('express');
const { createProject, getAllProjects, getProjectById, updateProject, deleteProject } = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create', authenticate, createProject);
router.get('/', authenticate, getAllProjects);
router.get('/:id', authenticate, getProjectById);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

module.exports = router;
