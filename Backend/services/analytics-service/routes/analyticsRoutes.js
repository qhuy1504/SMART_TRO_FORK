import express from 'express';
import {
  getPriceTrends,
  getPriceRanges,
  getRegionComparison,
  getNewsSentiment,
  getMarketInsights
} from '../controllers/analyticsController.js';

const router = express.Router();

// Price trends by region and time
router.get('/price-trends', getPriceTrends);

// Price ranges distribution
router.get('/price-ranges', getPriceRanges);

// Region comparison data
router.get('/region-comparison', getRegionComparison);

// News sentiment analysis
router.get('/news-sentiment', getNewsSentiment);

// Market insights
router.get('/market-insights', getMarketInsights);

export default router;
