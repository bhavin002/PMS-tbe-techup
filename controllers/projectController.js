const Project = require('../models/projectModel');
const Joi = require('joi');
const Note = require('../models/noteModel');
const File = require('../models/fileModel');
const mongoose = require('mongoose');
const { S3Client, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

const projectSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  status: Joi.string().valid('Draft', 'Active', 'On-hold', 'Completed').required(),
});

// Create Project

exports.createProject = async (req, res) => {
  const { error } = projectSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { title, description, start_date, end_date, status } = req.body;

  try {
    const project = new Project({
      title,
      description,
      start_date,
      end_date,
      status,
      user: req.user.userId,
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Projects with Filters (Status, Keyword, Date Range)

exports.getAllProjects = async (req, res) => {
  const { status, keyword, start_date, end_date } = req.query;

  try {
    let filter = { user: req.user.userId };

    if (status) filter.status = status;
    if (keyword) filter.title = { $regex: keyword, $options: 'i' };  // Case-insensitive search
    if (start_date && end_date) {
      filter.start_date = { $gte: new Date(start_date) };
      filter.end_date = { $lte: new Date(end_date) };
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a Single Project by ID

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('notes')
      .populate('files')

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Project

exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Only update fields that are present in the request body
    Object.assign(project, req.body);

    await project.save();

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const project = await Project.findById(req.params.id).session(session);
    if (!project) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.user.userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete associated notes
    await Note.deleteMany({ _id: { $in: project.notes } }).session(session);

    // Delete associated files
    const files = await File.find({ _id: { $in: project.files } }).session(session);

    // Delete files from S3
    if (files.length > 0) {
      const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SECRET_KEY,
        },
      });

      const deleteCommand = new DeleteObjectsCommand({
        Bucket: process.env.BUCKET_NAME,
        Delete: {
          Objects: files.map(file => ({ Key: file.s3_key })),
        },
      });

      await s3Client.send(deleteCommand);
    }

    // Delete file records from database
    await File.deleteMany({ _id: { $in: project.files } }).session(session);

    // Delete the project
    await Project.findByIdAndDelete(req.params.id).session(session);

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Project and associated data deleted successfully' });
  } catch (err) {
    // If an error occurred, abort the transaction
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Server error' });
  }
};
