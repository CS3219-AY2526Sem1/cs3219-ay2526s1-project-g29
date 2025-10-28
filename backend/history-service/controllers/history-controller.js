const History = require('../models/history-model.js');

async function saveHistory(req, res) {
    try {
        const {
            sessionId,
            userId,
            username,
            questionId,
            submittedCode,
        } = req.body;

        if (!sessionId || !userId || !questionId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let history = await History.findOne({ sessionId });

        if (!history) {
            history = new History({
                sessionId,
                participants: [{
                    id: userId,
                    username: username || 'anonymous',
                    latestCode: submittedCode || '',
                }],
                questionId,
            });
        } else {
            const idx = history.participants.findIndex(p => p.id === userId);
            if (idx !== -1) {
                history.participants[idx].latestCode = submittedCode || '';
                if (username) history.participants[idx].username = username;
            }
        }

        await history.save();

        return res.status(201).json({
            message: 'history saved/updated successfully',
            sessionId: history.sessionId
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
            .sort({ createdAt: -1 })
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