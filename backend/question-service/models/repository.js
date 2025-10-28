const Question = require('./question-model');

class QuestionRepository {
    // Get all questions with filters and pagination
    static async findAll(filters = {}, options = {}) {
        const {
            difficulty,
            topics,
            isActive = true,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const query = { isActive };

        if (difficulty) query.difficulty = difficulty;
        if (topics && topics.length > 0) {
            query.topics = { $in: Array.isArray(topics) ? topics : [topics] };
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const [questions, total] = await Promise.all([
            Question.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Question.countDocuments(query)
        ]);

        return {
            questions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Get a specific question by ID
    static async findById(id) {
        return Question.findById(id).lean();
    }

    // Get a random question by difficulty and topics
    static async findRandomByDifficultyAndTopic(difficulty, topics = []) {
        const query = { isActive: true, difficulty };
        if (topics.length > 0) query.topics = { $in: topics };

        const pipeline = [{ $match: query }, { $sample: { size: 1 } }];
        const [question] = await Question.aggregate(pipeline);
        return question || null;
    }

    // Get a random question excluding specific IDs
    static async findRandomExcluding(difficulty, topics = [], excludeIds = []) {
        const query = {
            isActive: true,
            difficulty,
            _id: { $nin: excludeIds }
        };
        if (topics.length > 0) query.topics = { $in: topics };

        const count = await Question.countDocuments(query);
        if (count === 0) {
            // fallback
            return this.findRandomByDifficultyAndTopic(difficulty, topics);
        }

        const pipeline = [{ $match: query }, { $sample: { size: 1 } }];
        const [question] = await Question.aggregate(pipeline);
        return question || null;
    }

    // Create new question
    static async create(questionData) {
        const question = new Question(questionData);
        return question.save();
    }

    // Update existing question
    static async update(id, updateData) {
        return Question.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
    }

    // Soft delete (set inactive)
    static async softDelete(id) {
        return Question.findByIdAndUpdate(
            id,
            { isActive: false, updatedAt: new Date() },
            { new: true }
        );
    }

    // Get all distinct topics
    static async getTopics() {
        return Question.distinct('topics', { isActive: true });
    }

    // Search questions (if there's text index)
    static async search(searchTerm, filters = {}) {
        const query = {
            $text: { $search: searchTerm },
            isActive: true
        };

        if (filters.difficulty) query.difficulty = filters.difficulty;

        return Question.find(query)
            .sort({ score: { $meta: 'textScore' } })
            .limit(20)
            .lean();
    }

    // Get popular questions by attempts
    static async getPopular(limit = 10, difficulty = null) {
        const query = { isActive: true };
        if (difficulty) query.difficulty = difficulty;

        return Question.find(query)
            .sort({ 'stats.attempts': -1 })
            .limit(limit)
            .lean();
    }
}

module.exports = QuestionRepository;
