const { Schema, model } = require('mongoose');

const fileSchema = new Schema({
    file_name: {
        type: String,
        required: true
    },
    file_extension: {
        type: String,
        required: true
    },
    s3_key: {
        type: String,
        required: true
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    }
}, {
    timestamps: true
});

module.exports = model('File', fileSchema);
