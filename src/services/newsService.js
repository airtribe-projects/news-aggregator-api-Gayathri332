const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600 });

const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const BASE = 'https://gnews.io/api/v4';

const fetchNews = async ({ query, category, language = 'en', page = 1, pageSize = 10 }) => {
  const cacheKey = JSON.stringify({ query, category, language, page, pageSize });
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const params = {
    token: NEWS_API_KEY,
    lang: language,
    max: pageSize,
    page
  };

  let endpoint = `${BASE}/top-headlines`;
  if (query) params.q = query;
  if (category) params.topic = category;

  try {
    const response = await axios.get(endpoint, { params });
    const result = {
      totalResults: response.data.totalArticles,
      articles: (response.data.articles || []).map((a, i) => ({
        id: `${Date.now()}-${i}`,
        title: a.title,
        description: a.description,
        content: a.content,
        url: a.url,
        urlToImage: a.image,
        source: a.source,
        publishedAt: a.publishedAt,
        category: category || 'general'
      }))
    };
    cache.set(cacheKey, result);
    return { ...result, fromCache: false };
  } catch (err) {
    if (err.response) throw new Error(err.response.data.errors?.[0] || 'News API error');
    throw new Error('Failed to fetch news');
  }
};

const searchNews = async ({ query, language = 'en', from, to, sortBy = 'publishedAt', page = 1, pageSize = 10 }) => {
  if (!query) throw new Error('Search query is required');

  const cacheKey = JSON.stringify({ query, language, from, to, sortBy, page, pageSize });
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const params = {
    token: NEWS_API_KEY,
    q: query,
    lang: language,
    max: pageSize,
    page,
    sortby: sortBy === 'publishedAt' ? 'publishedAt' : 'relevance'
  };
  if (from) params.from = from;
  if (to) params.to = to;

  try {
    const response = await axios.get(`${BASE}/search`, { params });
    const result = {
      totalResults: response.data.totalArticles,
      articles: (response.data.articles || []).map((a, i) => ({
        id: `${Date.now()}-${i}`,
        title: a.title,
        description: a.description,
        content: a.content,
        url: a.url,
        urlToImage: a.image,
        source: a.source,
        publishedAt: a.publishedAt
      }))
    };
    cache.set(cacheKey, result);
    return { ...result, fromCache: false };
  } catch (err) {
    if (err.response) throw new Error(err.response.data.errors?.[0] || 'News API error');
    throw new Error('Failed to search news');
  }
};

module.exports = { fetchNews, searchNews };