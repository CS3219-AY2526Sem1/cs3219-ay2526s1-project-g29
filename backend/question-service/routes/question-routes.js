const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question-controller');
const { validateQuestionInput } = require('../middleware/validation');

// Metadata endpoints
router.get('/metadata/topics', questionController.getTopics);
router.get('/metadata/stats', questionController.getStats);

//Specific query
router.get('/random', questionController.getRandomQuestion);
router.get('/search', questionController.searchQuestions);
router.get('/popular', questionController.getPopularQuestions);

//CRUD
router.post('/', validateQuestionInput, questionController.createQuestion);
router.get('/', questionController.getQuestions);
router.get('/:id', questionController.getQuestionById);
router.put('/:id', validateQuestionInput, questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

//Analytics
router.post('/:id/attempt', questionController.recordAttempt);

module.exports = router;
