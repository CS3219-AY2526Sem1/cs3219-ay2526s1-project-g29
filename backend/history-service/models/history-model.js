const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    id: { type: String, required: true },
    username: { type: String, default: 'anonymous' },
});

const historySchema = new mongoose.Schema({
    sessionId: { type: String, required: true, index: true },
    participants: { type: [participantSchema], required: true },
    questionId: { type: String, required: true },
    latestCode: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
}, {
    timestamps: true
});

historySchema.index({ "participants.id": 1 });

module.exports = mongoose.model('History', historySchema);
