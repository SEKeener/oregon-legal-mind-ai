const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static('public'));

// Session management with Redis
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL
  });
  redisClient.connect().catch(console.error);
  
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'oregon-legal-mind-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  }));
} else {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'oregon-legal-mind-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  }));
}

// Routes
const leadsRoutes = require('./routes/leads');
const legalbotRoutes = require('./routes/legalbot');
const demoRoutes = require('./routes/demo');

app.use('/api/leads', leadsRoutes);
app.use('/api/legalbot', legalbotRoutes);
app.use('/api/demo', demoRoutes);

// Main landing page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// Pricing page
app.get('/pricing', (req, res) => {
  res.sendFile('pricing.html', { root: './public' });
});

// Contact page
app.get('/contact', (req, res) => {
  res.sendFile('contact.html', { root: './public' });
});

// Demo page
app.get('/demo', (req, res) => {
  res.sendFile('demo.html', { root: './public' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile('404.html', { root: './public' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Oregon Legal Mind.ai server running on port ${PORT}`);
  console.log(`🤖 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Domain: ${process.env.DOMAIN || 'localhost'}`);
  if (process.env.LEGALBOT_PHONE_NUMBER) {
    console.log(`☎️  LegalBot available at: ${process.env.LEGALBOT_PHONE_NUMBER}`);
  }
});

module.exports = app;