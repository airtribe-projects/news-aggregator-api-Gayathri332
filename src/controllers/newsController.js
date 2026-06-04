const { fetchNews, searchNews } = require('../services/newsService');
const UserStore = require('../utils/userStore');

const getNews = async (req, res) => {
  try {
    const { category, source, language, page, pageSize } = req.query;
    const user = req.user;

    // Use user preferences as defaults if not specified
    const resolvedCategory = category || (user.preferences.categories[0] || undefined);
    const resolvedLanguage = language || user.preferences.language || 'en';

    const result = await fetchNews({
      category: resolvedCategory,
      source,
      language: resolvedLanguage,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10
    });

    res.json(result);
  } catch (err) {
    console.error('GetNews error:', err.message);
    res.status(502).json({ error: err.message });
  }
};

const searchArticles = async (req, res) => {
  try {
    const { q, language, from, to, sortBy, page, pageSize } = req.query;

    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

    const result = await searchNews({
      query: q,
      language: language || req.user.preferences.language || 'en',
      from,
      to,
      sortBy,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10
    });

    res.json(result);
  } catch (err) {
    console.error('SearchArticles error:', err.message);
    res.status(502).json({ error: err.message });
  }
};

const markRead = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Article ID required' });

  UserStore.markRead(req.user.id, id);
  res.json({ message: 'Article marked as read' });
};

const markFavorite = (req, res) => {
  const article = req.body;
  if (!article || !article.id) {
    return res.status(400).json({ error: 'Article with id required in body' });
  }

  UserStore.markFavorite(req.user.id, article);
  res.json({ message: 'Article added to favorites' });
};

const removeFavorite = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Article ID required' });

  UserStore.removeFavorite(req.user.id, id);
  res.json({ message: 'Article removed from favorites' });
};

const getFavorites = (req, res) => {
  res.json({ favorites: req.user.favoriteArticles });
};

const getReadHistory = (req, res) => {
  res.json({ readArticles: req.user.readArticles });
};

module.exports = { getNews, searchArticles, markRead, markFavorite, removeFavorite, getFavorites, getReadHistory };
