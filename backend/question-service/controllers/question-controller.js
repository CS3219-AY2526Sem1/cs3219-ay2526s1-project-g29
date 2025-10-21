const QuestionRepository = require('../models/repository');

const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * POST /questions
 * Create a new question
 */
async function createQuestion(req, res) {
    try {
        const { title, description, difficulty, topics, tags = [], examples = [] } = req.body;

        // Validation
        if (!title || !description || !difficulty) {
            return res.status(400).json({
                message: 'title, description, and difficulty are required'
            });
        }

        if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
            return res.status(400).json({
                message: `difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(', ')}`
            });
        }

        if (!topics || topics.length === 0) {
            return res.status(400).json({
                message: 'At least one topic is required (F7.2)'
            });
        }

        const question = await QuestionRepository.create({
            title,
            description,
            difficulty,
            topics: Array.isArray(topics) ? topics : [topics],
            tags,
            examples
        });

        return res.status(201).json({
            message: 'Question created successfully',
            data: question
        });
    } catch (err) {
        console.error('createQuestion error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * GET /questions/:id
 * Get question by ID
 */
async function getQuestionById(req, res) {
    try {
        const { id } = req.params;
        const { includeTestCases, includeSolutions } = req.query;

        const question = await QuestionRepository.findById(
            id,
            includeTestCases === 'true',
            includeSolutions === 'true'
        );

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        return res.status(200).json({ data: question });
    } catch (err) {
        console.error('getQuestionById error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * GET /questions/random
 * Get random question for matched session
 */
async function getRandomQuestion(req, res) {
    try {
        const { difficulty, topics, excludeIds } = req.query;

        if (!difficulty) {
            return res.status(400).json({
                message: 'difficulty query parameter is required'
            });
        }

        if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
            return res.status(400).json({
                message: `difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(', ')}`
            });
        }

        const topicsArray = topics ? topics.split(',').map(t => t.trim()) : [];
        const excludeIdsArray = excludeIds ? excludeIds.split(',') : [];

        const question = excludeIdsArray.length > 0
            ? await QuestionRepository.findRandomExcluding(difficulty, topicsArray, excludeIdsArray)
            : await QuestionRepository.findRandomByDifficultyAndTopic(difficulty, topicsArray);

        if (!question) {
            return res.status(404).json({
                message: 'No question found for the given difficulty and topics'
            });
        }

        return res.status(200).json({ data: question });
    } catch (err) {
        console.error('getRandomQuestion error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * GET /questions
 */
async function getQuestions(req, res) {
    try {
        const {
            difficulty,
            topics,
            tags,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        if (difficulty && !ALLOWED_DIFFICULTIES.includes(difficulty)) {
            return res.status(400).json({
                message: `difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(', ')}`
            });
        }

        const topicsArray = topics ? topics.split(',').map(t => t.trim()) : [];
        const tagsArray = tags ? tags.split(',').map(t => t.trim()) : [];

        const result = await QuestionRepository.findAll({}, {
            difficulty,
            topics: topicsArray,
            tags: tagsArray,
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder
        });

        return res.status(200).json({
            data: result.questions,
            pagination: result.pagination
        });
    } catch (err) {
        console.error('getQuestions error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * PUT /questions/:id
 * Update question
 */
async function updateQuestion(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.difficulty && !ALLOWED_DIFFICULTIES.includes(updates.difficulty)) {
            return res.status(400).json({
                message: `difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(', ')}`
            });
        }

        const question = await QuestionRepository.update(id, updates);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        return res.status(200).json({
            message: 'Question updated successfully',
            data: question
        });
    } catch (err) {
        console.error('updateQuestion error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * DELETE /questions/:id
 * Soft delete question for now
 */
async function deleteQuestion(req, res) {
    try {
        const { id } = req.params;
        const question = await QuestionRepository.softDelete(id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        return res.status(200).json({
            message: 'Question deleted successfully'
        });
    } catch (err) {
        console.error('deleteQuestion error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * POST /questions/:id/attempt
 * Record question attempt
 */
async function recordAttempt(req, res) {
    try {
        const { id } = req.params;
        const { success, timeMs } = req.body;

        await QuestionRepository.recordAttempt(
            id,
            success === true,
            timeMs || 0
        );

        return res.status(200).json({
            message: 'Attempt recorded successfully'
        });
    } catch (err) {
        console.error('recordAttempt error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * GET /questions/metadata/topics
 * Get all available topics
 */
async function getTopics(req, res) {
    try {
        const topics = await QuestionRepository.getTopics();
        return res.status(200).json({ data: topics });
    } catch (err) {
        console.error('getTopics error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * GET /questions/metadata/stats
 * Get question statistics
 */
async function getStats(req, res) {
    try {
        const stats = await QuestionRepository.getStats();
        return res.status(200).json({ data: stats });
    } catch (err) {
        console.error('getStats error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * GET /questions/search
 * Search questions
 */
async function searchQuestions(req, res) {
    try {
        const { q, difficulty } = req.query;

        if (!q) {
            return res.status(400).json({
                message: 'Search query (q) is required'
            });
        }

        const questions = await QuestionRepository.search(q, { difficulty });
        return res.status(200).json({ data: questions });
    } catch (err) {
        console.error('searchQuestions error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * GET /questions/popular
 * Get popular questions
 */
async function getPopularQuestions(req, res) {
    try {
        const { limit = 10, difficulty } = req.query;
        const questions = await QuestionRepository.getPopular(
            parseInt(limit),
            difficulty
        );
        return res.status(200).json({ data: questions });
    } catch (err) {
        console.error('getPopularQuestions error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    createQuestion,
    getQuestionById,
    getRandomQuestion,
    getQuestions,
    updateQuestion,
    deleteQuestion,
    recordAttempt,
    getTopics,
    getStats,
    searchQuestions,
    getPopularQuestions
};