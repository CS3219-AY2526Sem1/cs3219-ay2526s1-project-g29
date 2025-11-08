const History = require('../models/history-model.js');

async function saveHistory(req, res) {
    try {
        const {
            sessionId,
            userId,
            username,
            questionId,
            submittedCode,
            language = 'javascript'
        } = req.body;

        console.log('Saving history with language:', language);

        if (!sessionId || !userId || !questionId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let codeToSave = submittedCode;
        if (typeof submittedCode === 'object' && submittedCode !== null && submittedCode.code) {
            codeToSave = submittedCode.code;
        }

        let history = await History.findOne({ sessionId });

        if (!history) {
            history = new History({
                sessionId,
                participants: [{
                    id: userId,
                    username: username || 'anonymous',
                }],
                questionId,
                latestCode: codeToSave || '',
                language: language,
            });
        } else {
            const participantIdx = history.participants.findIndex(p => p.id === userId);
            if (participantIdx === -1) {
                history.participants.push({
                    id: userId,
                    username: username || 'anonymous',
                    latestCode: codeToSave || '',
                    language,
                });
            } else {
                history.participants[participantIdx].latestCode = codeToSave || '';
                history.participants[participantIdx].language = language;
            }

            history.latestCode = codeToSave || '';
            history.language = language;

        }

        await history.save();

        return res.status(201).json({
            message: 'history saved/updated successfully',
            sessionId: history.sessionId,
            language: history.language
        });

    } catch (err) {
        console.error('Error saving history:', err);
        return res.status(500).json({ message: 'Failed to save history' });
    }
}

async function getAllUserHistory(req, res) {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const histories = await History.find({ "participants.id": userId })
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        return res.status(200).json({
            message: 'User history fetched successfully',
            data: histories
        });

    } catch (err) {
        console.error('Error fetching history:', err);
        return res.status(500).json({ message: 'Failed to fetch history' });
    }
}

module.exports = {
    saveHistory,
    getAllUserHistory
};