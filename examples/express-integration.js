// Express.js Integration Example for env-guard
// This example shows how to integrate env-guard with Express.js

const express = require('express');
const { defineSchema, validateEnv } = require('../lib/index');

const app = express();

// Define environment variable schema
const schema = defineSchema({
  PORT: {
    type: 'port',
    required: true,
    default: 3000,
    description: 'Express server port'
  },
  NODE_ENV: {
    type: 'string',
    enum: ['development', 'production', 'test'],
    default: 'development',
    description: 'Environment mode'
  },
  DATABASE_URL: {
    type: 'url',
    required: true,
    description: 'PostgreSQL database connection string'
  },
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'JWT signing secret key'
  },
  DEBUG: {
    type: 'boolean',
    default: false,
    description: 'Enable debug logging'
  },
  CORS_ORIGIN: {
    type: 'string',
    required: false,
    default: 'http://localhost:3000',
    description: 'Allowed CORS origin'
  },
  RATE_LIMIT_WINDOW: {
    type: 'number',
    min: 60000, // 1 minute minimum
    max: 3600000, // 1 hour maximum
    default: 900000, // 15 minutes
    description: 'Rate limit window in milliseconds'
  }
});

console.log('🛡️ Env-Guard Express Integration Example\n');

// Validate environment variables
const envValidation = validateEnv(schema, process.env);

if (!envValidation.success) {
  console.log('❌ Environment validation failed:');
  envValidation.errors.forEach(error => {
    console.log(`  - ${error.field}: ${error.message}`);
  });
  console.log('\nPlease check your environment variables and try again.');
  process.exit(1);
}

console.log('✅ Environment validation successful!');
const env = envValidation.data;

// Configure Express app
app.set('port', env.PORT);
app.set('env', env.NODE_ENV);

// Set up middleware based on environment
if (env.NODE_ENV === 'development') {
  app.use(require('morgan')('dev'));
  if (env.DEBUG) {
    console.log('🔧 Debug mode enabled');
  }
}

// Basic middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: env.CORS_ORIGIN,
  optionsSuccessStatus: 200
};
app.use(require('cors')(corsOptions));

// Rate limiting
app.use(require('express-rate-limit')({
  windowMs: env.RATE_LIMIT_WINDOW,
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.'
}));

// Sample routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to env-guard Express example!',
    env: {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      hasDatabaseUrl: !!env.DATABASE_URL,
      hasJwtSecret: !!env.JWT_SECRET,
      debugMode: env.DEBUG
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV
  });
});

app.get('/config', (req, res) => {
  // Safe config response (no sensitive data)
  res.json({
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    debugMode: env.DEBUG,
    corsOrigin: env.CORS_ORIGIN,
    rateLimitWindow: env.RATE_LIMIT_WINDOW
  });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('❌ Server error:', err.message);
  
  res.status(500).json({
    error: env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/', '/health', '/config']
  });
});

// Start server
const server = app.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT} (${env.NODE_ENV} mode)`);
  console.log(`📊 Health check: http://localhost:${env.PORT}/health`);
  console.log(`🔧 Config: http://localhost:${env.PORT}/config`);
  
  if (env.NODE_ENV === 'production') {
    console.log('🔒 Production mode: Sensitive data logging disabled');
  } else {
    console.log(`🗄️ Database URL: ${env.DATABASE_URL.substring(0, 30)}...`);
    console.log(`🔑 JWT Secret: ${env.JWT_SECRET.substring(0, 20)}...`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⏹️  SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⏹️  SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;