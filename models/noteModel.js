const { Schema, model } = require('mongoose');

const noteSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
}, {
    timestamps: true
});

module.exports = model('Note', noteSchema);
