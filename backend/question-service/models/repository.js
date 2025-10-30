const Question = require('./question-model');

class QuestionRepository {
    //get all questions with filters and pagination
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

        if (difficulty) {
            query.difficulty = difficulty;
        }

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
                .select('-testCases -canonicalSolutions') // Don't expose solutions/tests
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

    //get specific question by id
    static async findById(id, includeTestCases = false, includeSolutions = false) {
        const select = {};
        if (!includeTestCases) select.testCases = 0;
        if (!includeSolutions) select.canonicalSolutions = 0;

        return Question.findById(id).select(select).lean();
    }

    static async findRandomByDifficultyAndTopic(difficulty, topics = []) {
        const query = {
            isActive: true,
            difficulty
        };

        if (topics.length > 0) {
            query.topics = { $in: topics };
        }

        const pipeline = [
            { $match: query },
            { $sample: { size: 1 } }
        ];

        const [question] = await Question.aggregate(pipeline);

        if (question) {
            // Don't expose solutions/test cases initially
            delete question.canonicalSolutions;
            delete question.testCases;
        }

        return question;
    }

    static async findRandomExcluding(difficulty, topics, excludeIds = []) {
        const query = {
            isActive: true,
            difficulty,
            _id: { $nin: excludeIds }
        };

        if (topics.length > 0) {
            query.topics = { $in: topics };
        }

        const count = await Question.countDocuments(query);
        if (count === 0) {
            // Fallback: return without exclusion
            return this.findRandomByDifficultyAndTopic(difficulty, topics);
        }

        const pipeline = [
            { $match: query },
            { $sample: { size: 1 } }
        ];

        const [question] = await Question.aggregate(pipeline);

        if (question) {
            delete question.canonicalSolutions;
            delete question.testCases;
        }

        return question;
    }

    //create new question
    static async create(questionData) {
        const question = new Question(questionData);
        return question.save();
    }

    //update existing question
    static async update(id, updateData) {
        return Question.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
    }

    static async softDelete(id) {
        return Question.findByIdAndUpdate(
            id,
            { isActive: false, updatedAt: new Date() },
            { new: true }
        );
    }

    static async recordAttempt(id, wasSuccessful = false, timeMs = 0) {
        const question = await Question.findById(id);
        if (!question) return null;

        const stats = question.stats || {};
        const attempts = (stats.attempts || 0) + 1;
        const successfulAttempts = (stats.successfulAttempts || 0) + (wasSuccessful ? 1 : 0);

        // Calculate new average time
        const totalTime = (stats.averageTimeMs || 0) * (stats.attempts || 0) + timeMs;
        const averageTimeMs = totalTime / attempts;

        // Calculate avg attempts per success
        const avgAttemptsPerSuccess = successfulAttempts > 0
            ? attempts / successfulAttempts
            : 0;

        return Question.findByIdAndUpdate(
            id,
            {
                $set: {
                    'stats.attempts': attempts,
                    'stats.successfulAttempts': successfulAttempts,
                    'stats.averageTimeMs': averageTimeMs,
                    'stats.avgAttemptsPerSuccess': avgAttemptsPerSuccess,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );
    }

    static async getTopics() {
        return Question.distinct('topics', { isActive: true });
    }

    static async getStats() {
        const [stats, totalCount] = await Promise.all([
            Question.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$difficulty',
                        count: { $sum: 1 },
                        avgAttempts: { $avg: '$stats.attempts' },
                        avgSuccessRate: {
                            $avg: {
                                $cond: [
                                    { $gt: ['$stats.attempts', 0] },
                                    {
                                        $multiply: [
                                            { $divide: ['$stats.successfulAttempts', '$stats.attempts'] },
                                            100
                                        ]
                                    },
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),
            Question.countDocuments({ isActive: true })
        ]);

        return {
            total: totalCount,
            byDifficulty: stats.reduce((acc, stat) => {
                acc[stat._id] = {
                    count: stat.count,
                    avgAttempts: Math.round(stat.avgAttempts),
                    avgSuccessRate: Math.round(stat.avgSuccessRate)
                };
                return acc;
            }, {})
        };
    }

    static async search(searchTerm, filters = {}) {
        const query = {
            $text: { $search: searchTerm },
            isActive: true
        };

        if (filters.difficulty) {
            query.difficulty = filters.difficulty;
        }

        return Question.find(query)
            .select('-testCases -canonicalSolutions')
            .sort({ score: { $meta: 'textScore' } })
            .limit(20)
            .lean();
    }

    //get popular questions
    static async getPopular(limit = 10, difficulty = null) {
        const query = { isActive: true };
        if (difficulty) {
            query.difficulty = difficulty;
        }

        return Question.find(query)
            .sort({ 'stats.attempts': -1 })
            .limit(limit)
            .select('-testCases -canonicalSolutions')
            .lean();
    }
}

module.exports = QuestionRepository;