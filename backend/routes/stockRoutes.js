const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.get('/market/overview', stockController.getMarketOverview);
router.get('/search', stockController.searchStocks);
router.get('/:firebaseUid', stockController.getRecommendations);
router.post('/generate', stockController.generateRecommendations);

module.exports = router;
