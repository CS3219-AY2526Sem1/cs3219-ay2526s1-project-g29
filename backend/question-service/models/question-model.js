const mongoose = require('mongoose');

const { Schema } = mongoose;

const SolutionSchema = new Schema({
    code: { type: String },
    notes: { type: String }
}, { _id: false });

const StatsSchema = new Schema({
    attempts: { type: Number, default: 0 },
    successfulAttempts: { type: Number, default: 0 },
}, { _id: false });

const QuestionSchema = new Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, index: true, unique: false },
    description: { type: String, required: true },
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard'],
        index: true
    },
    topics: { type: [String], index: true, default: [] },
    solutions: { type: [SolutionSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    stats: { type: StatsSchema, default: () => ({}) },
}, { timestamps: true });

//Search question by keywords, can remove if not gonna add search
// QuestionSchema.index({
//     title: 'text',
//     description: 'text',
//     topics: 'text',
// }, { weights: { title: 5, description: 2, topics: 3 } });

QuestionSchema.index({ difficulty: 1, isActive: 1, topics: 1 });

// QuestionSchema.index({ 'stats.attempts': -1 }); // For popularity ranking
// QuestionSchema.index({ createdAt: -1 });

QuestionSchema.pre('save', function (next) {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
    next();
});

module.exports = mongoose.model('Question', QuestionSchema);
