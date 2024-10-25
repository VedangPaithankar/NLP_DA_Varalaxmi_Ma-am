const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const sentimentController = require('../controllers/sentimentController');
const entityController = require('../controllers/entityController');
const keywordController = require('../controllers/keywordController');
const topicController = require('../controllers/topicController');
const similarityController = require('../controllers/similarityController');
const classificationController = require('../controllers/classificationController');
const translationController = require('../controllers/translationController');
const searchController = require('../controllers/searchController');

// Define your routes
router.post('/summarize_article', articleController.summarizeArticle);
router.post('/analyze_sentiment', sentimentController.analyzeArticleSentiment);
router.post('/extract_entities', entityController.extractEntitiesFromArticle);
router.post('/extract_keywords', keywordController.extractKeywordsFromArticle);
router.post('/get_topics', topicController.getTopics);
router.post('/get_similar_articles', similarityController.getSimilarArticles);
router.post('/classify_article', classificationController.classifyArticle);
router.post('/translate_article', translationController.translateArticle);
router.post('/search_articles', searchController.searchArticles);

module.exports = router;