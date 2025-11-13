exports.validateQuestionInput = (req, res, next) => {
    const { title, difficulty, description, topics } = req.body;

    if (!title || !difficulty || !description) {
        return res.status(400).json({
            error: "Title, difficulty, and description are required (F9.1)"
        });
    }

    // difficulty validation
    const allowedDifficulties = ['easy', 'medium', 'hard'];
    if (!allowedDifficulties.includes(difficulty)) {
        return res.status(400).json({
            error: `Difficulty must be one of: ${allowedDifficulties.join(', ')} (F7.1)`
        });
    }

    // topic validation
    if (!topics || (Array.isArray(topics) && topics.length === 0)) {
        return res.status(400).json({
            error: "At least one topic is required (F7.2)"
        });
    }

    next();
};
