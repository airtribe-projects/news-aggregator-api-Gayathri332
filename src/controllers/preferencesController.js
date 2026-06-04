const UserStore = require('../utils/userStore');

const VALID_CATEGORIES = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];

const getPreferences = (req, res) => {
  res.json({ preferences: req.user.preferences });
};

const updatePreferences = (req, res) => {
  const { categories, sources, language } = req.body;

  if (!categories && !sources && !language) {
    return res.status(400).json({ error: 'At least one preference field is required (categories, sources, language)' });
  }

  if (categories) {
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'categories must be an array' });
    }
    const invalid = categories.filter(c => !VALID_CATEGORIES.includes(c));
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `Invalid categories: ${invalid.join(', ')}. Valid: ${VALID_CATEGORIES.join(', ')}`
      });
    }
  }

  if (sources && !Array.isArray(sources)) {
    return res.status(400).json({ error: 'sources must be an array' });
  }

  if (language && typeof language !== 'string') {
    return res.status(400).json({ error: 'language must be a string' });
  }

  const updated = UserStore.updatePreferences(req.user.id, {
    ...(categories && { categories }),
    ...(sources && { sources }),
    ...(language && { language })
  });

  res.json({ message: 'Preferences updated', preferences: updated.preferences });
};

module.exports = { getPreferences, updatePreferences };
