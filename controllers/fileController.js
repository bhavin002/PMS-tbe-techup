const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Joi = require('joi');
const File = require('../models/fileModel');
const Project = require('../models/projectModel');

const fileSchema = Joi.object({
    files: Joi.array().items(
        Joi.object({
            file_name: Joi.string().required(),
            file_extension: Joi.string().required(),
            s3_key: Joi.string().required(),
        })
    ).required(),
    projectId: Joi.string().required()
});


const getPresignedUrl = Joi.object({
    key: Joi.string().required()
});

// Generate Pre-Signed URLs for Files Upload

exports.uploadPreSignedUrl = async (req, res) => {
    const { files } = req.body;
    try {
        const client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
            },
        });

        let preSignedUrls = await Promise.all(
            files?.map(async (file) => {
                const key = `${req.user.userId}/${file}`;
                const command = new PutObjectCommand({
                    Bucket: process.env.BUCKET_NAME,
                    Key: key,
                });
                const url = await getSignedUrl(client, command, { expiresIn: 3600 });

                return {
                    key,
                    URL: url
                };
            })
        );

        res.status(200).json({
            status: "success",
            message: "Pre-signed URLs generated successfully",
            preSignedUrls,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Create Files

exports.createFiles = async (req, res) => {
    const { error } = fileSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const { files, projectId } = req.body;

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const savedFiles = [];

        for (let fileData of files) {
            const { file_name, file_extension, s3_key } = fileData;

            const file = new File({
                file_name,
                file_extension,
                s3_key,
                project: projectId
            });

            const savedFile = await file.save();
            savedFiles.push(savedFile);

            project.files.push(savedFile._id);
        }

        await project.save();

        res.status(201).json({
            message: 'Files uploaded and project updated successfully',
            files: savedFiles
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


// Get Files by Project ID

exports.getFilesByProjectId = async (req, res) => {
    const { projectId } = req.params;
    try {
        const files = await File.find({ project: projectId });
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Presigned URL for File Download and preview

exports.getPresignedUrl = async (req, res) => {
    const { error } = getPresignedUrl.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const { key } = req.body;

    try {
        const client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
            },
        });

        const command = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: key,
        });

        const url = await getSignedUrl(client, command, { expiresIn: 604800 });
        res.status(200).json({ url });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

// Delete File

exports.deleteFile = async (req, res) => {
    const { id } = req.params;

    try {
        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const project = await Project.findById(file.project);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.files = project.files.filter((fileId) => fileId.toString() !== id);
        await project.save();

        await File.findByIdAndDelete(id);
        const command = new DeleteObjectsCommand({
            Bucket: process.env.BUCKET_NAME,
            Delete: {
                Objects: [{ Key: file.s3_key }],
            },
        });
        const client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
            },
        });
        await client.send(command);
        res.json({ message: 'File deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};