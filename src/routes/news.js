const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getNews, searchArticles,
  markRead, markFavorite, removeFavorite,
  getFavorites, getReadHistory
} = require('../controllers/newsController');

router.get('/', authenticate, getNews);
router.get('/search', authenticate, searchArticles);
router.post('/:id/read', authenticate, markRead);
router.post('/favorites', authenticate, markFavorite);
router.delete('/favorites/:id', authenticate, removeFavorite);
router.get('/favorites', authenticate, getFavorites);
router.get('/read', authenticate, getReadHistory);

module.exports = router;
