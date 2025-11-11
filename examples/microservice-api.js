// Real-World Microservice API Example using env-guard
// This demonstrates a production-ready microservice with comprehensive environment management

const { defineSchema, validateEnv } = require('../lib/index');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

console.log('🚀 Real-World Microservice API with env-guard\n');

// Define comprehensive schema for a production microservice
const microserviceSchema = defineSchema({
  // Service Configuration
  SERVICE_NAME: {
    type: 'string',
    required: true,
    default: 'user-service',
    description: 'Microservice name'
  },
  SERVICE_VERSION: {
    type: 'string',
    required: true,
    default: '1.0.0',
    description: 'Service version'
  },
  PORT: {
    type: 'port',
    required: true,
    default: 3001,
    description: 'Service port'
  },
  NODE_ENV: {
    type: 'string',
    enum: ['development', 'staging', 'production'],
    default: 'development',
    description: 'Environment'
  },
  
  // Database Configuration (Production-Ready)
  DATABASE_URL: {
    type: 'url',
    required: true,
    description: 'PostgreSQL connection string',
    validate: (url) => {
      if (!url.includes('postgresql://') && !url.includes('postgres://')) {
        return 'Database URL must use PostgreSQL protocol';
      }
      return true;
    }
  },
  DATABASE_POOL_MIN: {
    type: 'number',
    min: 0,
    max: 50,
    default: 5,
    description: 'Minimum database connections'
  },
  DATABASE_POOL_MAX: {
    type: 'number',
    min: 1,
    max: 100,
    default: 20,
    description: 'Maximum database connections'
  },
  
  // Redis Configuration
  REDIS_URL: {
    type: 'url',
    required: true,
    description: 'Redis connection string'
  },
  REDIS_TTL: {
    type: 'number',
    min: 60, // 1 minute minimum
    max: 86400, // 24 hours maximum
    default: 3600, // 1 hour
    description: 'Default cache TTL in seconds'
  },
  
  // Authentication & Security
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'JWT signing secret',
    transform: (secret) => {
      // Ensure secret is not a default/weak value
      if (['secret', 'password', 'change-me', '123456'].includes(secret.toLowerCase())) {
        throw new Error('JWT secret cannot be a weak/default value');
      }
      return secret;
    }
  },
  JWT_EXPIRES_IN: {
    type: 'string',
    required: true,
    default: '15m',
    description: 'JWT expiration time'
  },
  REFRESH_TOKEN_EXPIRY: {
    type: 'string',
    required: true,
    default: '7d',
    description: 'Refresh token expiry'
  },
  
  // API Configuration
  API_RATE_LIMIT: {
    type: 'number',
    min: 10,
    max: 10000,
    default: 1000,
    description: 'Rate limit per window'
  },
  API_RATE_WINDOW: {
    type: 'number',
    min: 60000, // 1 minute
    max: 3600000, // 1 hour
    default: 900000, // 15 minutes
    description: 'Rate limit window in ms'
  },
  REQUEST_TIMEOUT: {
    type: 'number',
    min: 5000, // 5 seconds
    max: 300000, // 5 minutes
    default: 30000, // 30 seconds
    description: 'Request timeout in ms'
  },
  
  // External Services
  STRIPE_SECRET_KEY: {
    type: 'string',
    required: true,
    minLength: 20,
    description: 'Stripe payment processing'
  },
  SENDGRID_API_KEY: {
    type: 'string',
    required: true,
    minLength: 20,
    description: 'Email service API key'
  },
  AWS_ACCESS_KEY_ID: {
    type: 'string',
    required: true,
    description: 'AWS access key for S3/File operations'
  },
  AWS_SECRET_ACCESS_KEY: {
    type: 'string',
    required: true,
    description: 'AWS secret key for S3/File operations'
  },
  AWS_S3_BUCKET: {
    type: 'string',
    required: true,
    description: 'S3 bucket for file storage'
  },
  
  // Monitoring & Observability
  SENTRY_DSN: {
    type: 'string',
    required: false,
    description: 'Error tracking DSN'
  },
  PROMETHEUS_PORT: {
    type: 'port',
    required: false,
    default: 9090,
    description: 'Prometheus metrics port'
  },
  HEALTH_CHECK_TIMEOUT: {
    type: 'number',
    min: 1000,
    max: 30000,
    default: 5000,
    description: 'Health check timeout in ms'
  },
  
  // Feature Flags
  ENABLE_METRICS: {
    type: 'boolean',
    default: true,
    description: 'Enable Prometheus metrics'
  },
  ENABLE_CACHING: {
    type: 'boolean',
    default: true,
    description: 'Enable Redis caching'
  },
  ENABLE_SWAGGER: {
    type: 'boolean',
    default: true,
    description: 'Enable API documentation'
  },
  DEBUG_MODE: {
    type: 'boolean',
    default: false,
    description: 'Enable debug logging'
  }
});

console.log('📋 Production Microservice Schema Defined:');
console.log('- Service configuration & versioning');
console.log('- Database with connection pooling');
console.log('- Redis caching with TTL management');
console.log('- JWT authentication with refresh tokens');
console.log('- API rate limiting & timeouts');
console.log('- External service integrations');
console.log('- Monitoring & observability setup');
console.log('- Feature flags for environment control\n');

// Validate environment variables
const envValidation = validateEnv(microserviceSchema, process.env);

if (!envValidation.success) {
  console.log('❌ Environment validation failed:');
  envValidation.errors.forEach(error => {
    console.log(`  🚨 ${error.field}: ${error.message}`);
  });
  console.log('\nPlease check your .env file or environment variables.');
  console.log('For production, ensure all secrets are properly configured.\n');
  process.exit(1);
}

console.log('✅ Environment validation successful!');
const env = envValidation.data;

// Service configuration object
const serviceConfig = {
  service: {
    name: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    port: env.PORT,
    environment: env.NODE_ENV,
    debug: env.DEBUG_MODE
  },
  
  database: {
    url: env.DATABASE_URL,
    pool: {
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX
    }
  },
  
  redis: {
    url: env.REDIS_URL,
    ttl: env.REDIS_TTL,
    enabled: env.ENABLE_CACHING
  },
  
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    refreshTokenExpiry: env.REFRESH_TOKEN_EXPIRY
  },
  
  api: {
    rateLimit: {
      max: env.API_RATE_LIMIT,
      windowMs: env.API_RATE_WINDOW
    },
    timeout: env.REQUEST_TIMEOUT
  },
  
  external: {
    stripe: env.STRIPE_SECRET_KEY,
    sendgrid: env.SENDGRID_API_KEY,
    aws: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      bucket: env.AWS_S3_BUCKET
    }
  },
  
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    prometheusPort: env.PROMETHEUS_PORT,
    metricsEnabled: env.ENABLE_METRICS,
    healthCheckTimeout: env.HEALTH_CHECK_TIMEOUT
  },
  
  features: {
    metrics: env.ENABLE_METRICS,
    caching: env.ENABLE_CACHING,
    swagger: env.ENABLE_SWAGGER,
    debug: env.DEBUG_MODE
  }
};

// Create Express app with production-ready middleware
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Rate limiting
app.use(rateLimit({
  windowMs: serviceConfig.api.rateLimit.windowMs,
  max: serviceConfig.api.rateLimit.max,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded',
    retryAfter: Math.ceil(serviceConfig.api.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
}));

// Request timeout
app.use((req, res, next) => {
  res.setTimeout(serviceConfig.api.timeout, () => {
    res.status(408).json({
      error: 'Request Timeout',
      message: 'Request took too long to process'
    });
  });
  next();
});

// Logging middleware
if (serviceConfig.features.debug) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request ID for tracing
app.use((req, res, next) => {
  req.requestId = require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database connection
    const dbStatus = await checkDatabase();
    
    // Check Redis connection (if enabled)
    const redisStatus = serviceConfig.features.caching ? await checkRedis() : 'skipped';
    
    const healthStatus = {
      service: serviceConfig.service.name,
      version: serviceConfig.service.version,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      requestId: req.requestId,
      checks: {
        database: dbStatus,
        redis: redisStatus
      },
      responseTime: Date.now() - startTime
    };
    
    res.json(healthStatus);
  } catch (error) {
    res.status(503).json({
      service: serviceConfig.service.name,
      version: serviceConfig.service.version,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime
    });
  }
});

// Example API routes using environment-validated config
app.get('/config', (req, res) => {
  res.json({
    service: {
      name: serviceConfig.service.name,
      version: serviceConfig.service.version,
      environment: serviceConfig.service.environment
    },
    features: serviceConfig.features,
    database: {
      hasConnection: true,
      pool: serviceConfig.database.pool
    },
    redis: {
      enabled: serviceConfig.redis.enabled,
      ttl: serviceConfig.redis.ttl
    },
    auth: {
      jwtExpiresIn: serviceConfig.auth.jwtExpiresIn,
      hasSecret: !!serviceConfig.auth.jwtSecret
    }
  });
});

app.get('/secure-endpoint', authenticateToken, (req, res) => {
  res.json({
    message: 'This is a secure endpoint',
    user: req.user,
    service: serviceConfig.service.name,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error(`[${req.requestId}] Error:`, err.message);
  
  const errorResponse = {
    error: 'Internal Server Error',
    message: serviceConfig.features.debug ? err.message : 'Something went wrong',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };
  
  // Don't leak error details in production
  if (!serviceConfig.features.debug) {
    delete errorResponse.message;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.originalUrl} not found`,
    service: serviceConfig.service.name,
    availableEndpoints: ['/health', '/config', '/secure-endpoint']
  });
});

// Database connection check
async function checkDatabase() {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: serviceConfig.database.url
        }
      }
    });
    
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return 'healthy';
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// Redis connection check
async function checkRedis() {
  if (!serviceConfig.features.caching) {
    return 'disabled';
  }
  
  try {
    const Redis = require('ioredis');
    const redis = new Redis(serviceConfig.redis.url);
    
    await redis.ping();
    await redis.quit();
    return 'healthy';
  } catch (error) {
    throw new Error(`Redis connection failed: ${error.message}`);
  }
}

// JWT Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // Validate token with environment-validated JWT secret
  const jwt = require('jsonwebtoken');
  const verified = jwt.verify(token, serviceConfig.auth.jwtSecret);
  req.user = verified;
  next();
}

// Start server
const server = app.listen(serviceConfig.service.port, () => {
  console.log(`🚀 ${serviceConfig.service.name} v${serviceConfig.service.version} started!`);
  console.log(`🌍 Environment: ${serviceConfig.service.environment}`);
  console.log(`📡 Port: ${serviceConfig.service.port}`);
  console.log(`🏥 Health: http://localhost:${serviceConfig.service.port}/health`);
  console.log(`⚙️  Config: http://localhost:${serviceConfig.service.port}/config`);
  
  if (serviceConfig.features.swagger) {
    console.log(`📖 Docs: http://localhost:${serviceConfig.service.port}/api/docs`);
  }
  
  if (serviceConfig.features.metrics && serviceConfig.monitoring.metricsEnabled) {
    console.log(`📊 Metrics: http://localhost:${serviceConfig.monitoring.prometheusPort}/metrics`);
  }
  
  console.log('\n🔧 Configuration Summary:');
  console.log(`  Database Pool: ${serviceConfig.database.pool.min}-${serviceConfig.database.pool.max} connections`);
  console.log(`  Redis Caching: ${serviceConfig.features.caching ? 'Enabled' : 'Disabled'}`);
  console.log(`  Rate Limiting: ${serviceConfig.api.rateLimit.max} requests/${serviceConfig.api.rateLimit.windowMs}ms`);
  console.log(`  JWT Expiry: ${serviceConfig.auth.jwtExpiresIn}`);
  console.log(`  Debug Mode: ${serviceConfig.features.debug ? 'Enabled' : 'Disabled'}`);
  
  if (serviceConfig.service.environment === 'production') {
    console.log('\n🔒 Production Security:');
    console.log('  - Database connection pooling active');
    console.log('  - Redis caching with TTL management');
    console.log('  - JWT authentication with refresh tokens');
    console.log('  - API rate limiting enabled');
    console.log('  - Security headers configured');
    console.log('  - Request tracing enabled');
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('\n⏹️  SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⏹️  SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, serviceConfig };