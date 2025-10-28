const express = require('express');
const router = express.Router();
const { saveHistory, getAllUserHistory } = require('../controllers/history-controller');

//save history
router.post('/saveHistory', saveHistory);

//get user history
router.get('/users/:userId', getAllUserHistory);

// //get specific history
// router.get('/:historyId', getHistoryById);

module.exports = router;