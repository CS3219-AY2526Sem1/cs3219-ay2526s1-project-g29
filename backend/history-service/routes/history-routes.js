const express = require('express');
const router = express.Router();
const { saveHistory, getAllUserHistory, getSessionHistory } = require('../controllers/history-controller');

//save history
router.post('/saveHistory', saveHistory);

//get user history
router.get('/users/:userId', getAllUserHistory);
router.get('/session/:sessionId', getSessionHistory);

// //get specific history
// router.get('/:historyId', getHistoryById);

module.exports = router;
