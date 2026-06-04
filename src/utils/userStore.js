// In-memory user store (replace with DB in production)
const users = [];
let nextId = 1;

const UserStore = {
  findByEmail: (email) => users.find(u => u.email === email),
  findById: (id) => users.find(u => u.id === id),
  create: ({ name, email, passwordHash }) => {
    const user = {
      id: nextId++,
      name,
      email,
      passwordHash,
      preferences: { categories: [], sources: [], language: 'en' },
      readArticles: [],
      favoriteArticles: []
    };
    users.push(user);
    return user;
  },
  updatePreferences: (id, preferences) => {
    const user = users.find(u => u.id === id);
    if (!user) return null;
    user.preferences = { ...user.preferences, ...preferences };
    return user;
  },
  markRead: (userId, articleId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    if (!user.readArticles.includes(articleId)) {
      user.readArticles.push(articleId);
    }
    return user;
  },
  markFavorite: (userId, article) => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    const exists = user.favoriteArticles.find(a => a.id === article.id);
    if (!exists) user.favoriteArticles.push(article);
    return user;
  },
  removeFavorite: (userId, articleId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    user.favoriteArticles = user.favoriteArticles.filter(a => a.id !== articleId);
    return user;
  }
};

module.exports = UserStore;
