const { model, Schema } = require("mongoose");

const projectSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Active', 'On-hold', 'Completed'],
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: [{
        type: Schema.Types.ObjectId,
        ref: 'Note'
    }],
    files: [{
        type: Schema.Types.ObjectId,
        ref: "File"
    }],
}, {
    timestamps: true
});

module.exports = model('Project', projectSchema);
