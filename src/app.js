const express = require('express');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const preferencesRoutes = require('./routes/preferences');

const app = express();

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api', preferencesRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
