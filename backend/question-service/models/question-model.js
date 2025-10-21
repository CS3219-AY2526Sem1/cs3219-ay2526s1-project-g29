const mongoose = require('mongoose');

const { Schema } = mongoose;

const ExampleSchema = new Schema({
    input: { type: Schema.Types.Mixed, required: true },
    output: { type: Schema.Types.Mixed, required: true },
    explanation: { type: String, trim: true }
}, { _id: false });

const TestCaseSchema = new Schema({
    input: { type: Schema.Types.Mixed, required: true },
    output: { type: Schema.Types.Mixed, required: true },
    hidden: { type: Boolean, default: true },
    weight: { type: Number, default: 1 }
}, { _id: false });

const SolutionSchema = new Schema({
    language: { type: String, trim: true },
    code: { type: String },
    notes: { type: String }
}, { _id: false });

const StatsSchema = new Schema({
    attempts: { type: Number, default: 0 },
    successfulAttempts: { type: Number, default: 0 },
    averageTimeMs: { type: Number, default: 0 },
    avgAttemptsPerSuccess: { type: Number, default: 0 }
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
    tags: { type: [String], default: [] },
    examples: { type: [ExampleSchema], default: [] },
    constraints: { type: String, trim: true },
    hints: { type: [String], default: [] },
    canonicalSolutions: { type: [SolutionSchema], default: [] },
    testCases: { type: [TestCaseSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    timeLimitMs: { type: Number, default: 2000 },
    memoryLimitKb: { type: Number, default: 65536 },
    stats: { type: StatsSchema, default: () => ({}) },
}, { timestamps: true });

QuestionSchema.index({
    title: 'text',
    description: 'text',
    topics: 'text',
    tags: 'text'
}, { weights: { title: 5, description: 2, topics: 3 } });

QuestionSchema.index({ difficulty: 1, isActive: 1, topics: 1 });
QuestionSchema.index({ difficulty: 1, isActive: 1 });
QuestionSchema.index({ topics: 1, isActive: 1 });
QuestionSchema.index({ 'stats.attempts': -1 }); // For popularity ranking
QuestionSchema.index({ createdAt: -1 });

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
