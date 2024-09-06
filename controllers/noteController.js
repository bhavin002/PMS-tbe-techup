const Note = require('../models/noteModel');
const Project = require('../models/projectModel');
const Joi = require('joi');

const createNoteSchema = Joi.object({
    content: Joi.string().required(),
    projectId: Joi.string().required()
});

// Note create

exports.createNote = async (req, res) => {
    const { error } = createNoteSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { content, projectId } = req.body;

    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const note = new Note({
            content,
            project: projectId,
        });

        await note.save();

        if (!project.notes) {
            project.notes = [];
        }

        project.notes.push(note._id);
        await project.save();

        res.status(201).json(note);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Note

exports.updateNote = async (req, res) => {
    const { content } = req.body;

    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ message: 'Note not found' });

        note.content = content || note.content;
        await note.save();

        res.json(note);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Note

exports.deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ message: 'Note not found' });

        await Note.findByIdAndDelete(req.params.id);

        const project = await Project.findById(note.project);
        if (project) {
            project.notes = project.notes.filter(id => !id.equals(req.params.id));
            await project.save();
        }

        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
