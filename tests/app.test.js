const request = require('supertest');
const app = require('../src/app');

let authToken = '';
let secondUserToken = '';

const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const secondUser = {
  name: 'Second User',
  email: 'second@example.com',
  password: 'password456'
};

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      authToken = res.body.token;
    });

    it('should register a second user', async () => {
      const res = await request(app).post('/api/auth/register').send(secondUser);
      expect(res.statusCode).toBe(201);
      secondUserToken = res.body.token;
    });

    it('should fail with missing fields', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail with invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: 'notanemail', password: '123456' });
      expect(res.statusCode).toBe(400);
    });

    it('should fail with short password', async () => {
      const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: 'new@example.com', password: '123' });
      expect(res.statusCode).toBe(400);
    });

    it('should fail on duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword'
      });
      expect(res.statusCode).toBe(401);
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123'
      });
      expect(res.statusCode).toBe(401);
    });

    it('should fail with missing fields', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email });
      expect(res.statusCode).toBe(400);
    });
  });
});

describe('Preferences Endpoints', () => {
  it('should get preferences', async () => {
    const res = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('preferences');
  });

  it('should update preferences with valid categories', async () => {
    const res = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ categories: ['technology', 'science'], language: 'en' });
    expect(res.statusCode).toBe(200);
    expect(res.body.preferences.categories).toContain('technology');
  });

  it('should reject invalid categories', async () => {
    const res = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ categories: ['invalid-category'] });
    expect(res.statusCode).toBe(400);
  });

  it('should reject non-array categories', async () => {
    const res = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ categories: 'technology' });
    expect(res.statusCode).toBe(400);
  });

  it('should fail without auth token', async () => {
    const res = await request(app).get('/api/preferences');
    expect(res.statusCode).toBe(401);
  });

  it('should fail with invalid token', async () => {
    const res = await request(app)
      .get('/api/preferences')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });
});

describe('News Endpoints (Auth required)', () => {
  it('should reject unauthenticated requests to /api/news', async () => {
    const res = await request(app).get('/api/news');
    expect(res.statusCode).toBe(401);
  });

  it('should reject unauthenticated search requests', async () => {
    const res = await request(app).get('/api/news/search?q=test');
    expect(res.statusCode).toBe(401);
  });
});

describe('Favorites & Read History', () => {
  const testArticle = {
    id: 'article-123',
    title: 'Test Article',
    description: 'Test description',
    url: 'https://example.com/test',
    publishedAt: new Date().toISOString()
  };

  it('should get empty favorites initially', async () => {
    const res = await request(app)
      .get('/api/news/favorites')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.favorites).toEqual([]);
  });

  it('should add article to favorites', async () => {
    const res = await request(app)
      .post('/api/news/favorites')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testArticle);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/favorite/i);
  });

  it('should list favorites after adding', async () => {
    const res = await request(app)
      .get('/api/news/favorites')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.favorites.length).toBe(1);
    expect(res.body.favorites[0].id).toBe(testArticle.id);
  });

  it('should remove article from favorites', async () => {
    const res = await request(app)
      .delete(`/api/news/favorites/${testArticle.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
  });

  it('should have empty favorites after removal', async () => {
    const res = await request(app)
      .get('/api/news/favorites')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.favorites).toEqual([]);
  });

  it('should mark article as read', async () => {
    const res = await request(app)
      .post('/api/news/article-abc/read')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
  });

  it('should get read history', async () => {
    const res = await request(app)
      .get('/api/news/read')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.readArticles).toContain('article-abc');
  });

  it('should not mix favorites between users', async () => {
    // Add to user1 favorites
    await request(app)
      .post('/api/news/favorites')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testArticle);

    // Check user2 has no favorites
    const res = await request(app)
      .get('/api/news/favorites')
      .set('Authorization', `Bearer ${secondUserToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.favorites).toEqual([]);
  });

  it('should fail adding favorite without article id', async () => {
    const res = await request(app)
      .post('/api/news/favorites')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'No ID article' });
    expect(res.statusCode).toBe(400);
  });
});

describe('Search Endpoint', () => {
  it('should require q parameter', async () => {
    const res = await request(app)
      .get('/api/news/search')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Health Check', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toBe(404);
  });
});
