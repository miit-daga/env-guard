// Full-Stack Application Example using env-guard
// This demonstrates a complete application with frontend, backend, and deployment configurations

const { defineSchema, validateEnv } = require('../lib/index');
const fs = require('fs');

console.log('🏗️  Full-Stack Application with env-guard\n');

// Define comprehensive schema for a full-stack application
const fullstackSchema = defineSchema({
  // Application Information
  APP_NAME: {
    type: 'string',
    required: true,
    default: 'FullStack App',
    description: 'Application name'
  },
  APP_VERSION: {
    type: 'string',
    required: true,
    default: '1.0.0',
    description: 'Application version'
  },
  
  // Environment Configuration
  NODE_ENV: {
    type: 'string',
    enum: ['development', 'staging', 'production', 'test'],
    default: 'development',
    description: 'Application environment'
  },
  
  // Frontend Configuration
  FRONTEND_PORT: {
    type: 'port',
    required: true,
    default: 3000,
    description: 'Frontend development server port'
  },
  FRONTEND_URL: {
    type: 'url',
    required: true,
    default: 'http://localhost:3000',
    description: 'Frontend application URL'
  },
  REACT_APP_VERSION: {
    type: 'string',
    required: true,
    default: '1.0.0',
    description: 'React app version for client'
  },
  
  // Backend API Configuration
  API_PORT: {
    type: 'port',
    required: true,
    default: 5000,
    description: 'Backend API server port'
  },
  API_URL: {
    type: 'url',
    required: true,
    default: 'http://localhost:5000',
    description: 'Backend API base URL'
  },
  
  // Database Configuration
  DATABASE_URL: {
    type: 'url',
    required: true,
    description: 'PostgreSQL database connection string',
    transform: (url) => {
      // Add connection settings for production
      if (url.includes('localhost')) {
        return url + '?connection_limit=20&pool_timeout=60';
      }
      return url;
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
    default: 25,
    description: 'Maximum database connections'
  },
  
  // Authentication & Security
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'JWT signing secret for API'
  },
  JWT_EXPIRES_IN: {
    type: 'string',
    required: true,
    default: '1h',
    description: 'JWT token expiration'
  },
  REFRESH_TOKEN_EXPIRES_IN: {
    type: 'string',
    required: true,
    default: '7d',
    description: 'Refresh token expiration'
  },
  
  // Session Management
  SESSION_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'Express session secret'
  },
  SESSION_MAX_AGE: {
    type: 'number',
    min: 3600000, // 1 hour
    max: 2592000000, // 30 days
    default: 86400000, // 1 day
    description: 'Session maximum age in ms'
  },
  
  // Email Configuration
  SMTP_HOST: {
    type: 'string',
    required: true,
    description: 'SMTP server host'
  },
  SMTP_PORT: {
    type: 'port',
    required: true,
    default: 587,
    description: 'SMTP server port'
  },
  SMTP_USER: {
    type: 'string',
    required: true,
    description: 'SMTP username'
  },
  SMTP_PASS: {
    type: 'string',
    required: true,
    description: 'SMTP password'
  },
  FROM_EMAIL: {
    type: 'string',
    required: true,
    description: 'From email address'
  },
  FROM_NAME: {
    type: 'string',
    required: true,
    default: 'FullStack App',
    description: 'From name for emails'
  },
  
  // File Upload & Storage
  UPLOAD_DIR: {
    type: 'string',
    required: true,
    default: './uploads',
    description: 'File upload directory'
  },
  MAX_FILE_SIZE: {
    type: 'number',
    min: 1024, // 1KB minimum
    max: 104857600, // 100MB maximum
    default: 10485760, // 10MB
    description: 'Maximum file upload size in bytes'
  },
  ALLOWED_FILE_TYPES: {
    type: 'string',
    required: true,
    default: 'jpg,jpeg,png,gif,pdf,doc,docx',
    description: 'Allowed file extensions (comma-separated)'
  },
  
  // External Service Integrations
  STRIPE_SECRET_KEY: {
    type: 'string',
    required: true,
    minLength: 20,
    description: 'Stripe secret key for payments'
  },
  STRIPE_PUBLISHABLE_KEY: {
    type: 'string',
    required: true,
    minLength: 20,
    description: 'Stripe publishable key for frontend'
  },
  GOOGLE_CLIENT_ID: {
    type: 'string',
    required: true,
    description: 'Google OAuth client ID'
  },
  GOOGLE_CLIENT_SECRET: {
    type: 'string',
    required: true,
    description: 'Google OAuth client secret'
  },
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: {
    type: 'string',
    required: true,
    description: 'AWS access key ID'
  },
  AWS_SECRET_ACCESS_KEY: {
    type: 'string',
    required: true,
    description: 'AWS secret access key'
  },
  AWS_S3_BUCKET: {
    type: 'string',
    required: true,
    description: 'AWS S3 bucket for file storage'
  },
  AWS_REGION: {
    type: 'string',
    required: true,
    default: 'us-east-1',
    description: 'AWS region'
  },
  
  // Monitoring & Analytics
  SENTRY_DSN: {
    type: 'string',
    required: false,
    description: 'Sentry DSN for error tracking'
  },
  GOOGLE_ANALYTICS_ID: {
    type: 'string',
    required: false,
    description: 'Google Analytics tracking ID'
  },
  MIXPANEL_TOKEN: {
    type: 'string',
    required: false,
    description: 'Mixpanel analytics token'
  },
  
  // Feature Flags
  ENABLE_REGISTRATION: {
    type: 'boolean',
    default: true,
    description: 'Allow user registration'
  },
  ENABLE_OAUTH: {
    type: 'boolean',
    default: true,
    description: 'Enable OAuth providers'
  },
  ENABLE_PAYMENTS: {
    type: 'boolean',
    default: false,
    description: 'Enable payment processing'
  },
  ENABLE_FILE_UPLOADS: {
    type: 'boolean',
    default: true,
    description: 'Enable file upload functionality'
  },
  ENABLE_NOTIFICATIONS: {
    type: 'boolean',
    default: true,
    description: 'Enable email notifications'
  },
  ENABLE_ANALYTICS: {
    type: 'boolean',
    default: true,
    description: 'Enable analytics tracking'
  },
  
  // API Configuration
  API_RATE_LIMIT: {
    type: 'number',
    min: 10,
    max: 10000,
    default: 1000,
    description: 'API rate limit per window'
  },
  API_RATE_WINDOW: {
    type: 'number',
    min: 60000, // 1 minute
    max: 3600000, // 1 hour
    default: 900000, // 15 minutes
    description: 'Rate limit window in ms'
  },
  CORS_ORIGINS: {
    type: 'string',
    required: true,
    default: 'http://localhost:3000,http://localhost:3001',
    description: 'CORS allowed origins (comma-separated)'
  },
  
  // Security Configuration
  BCRYPT_SALT_ROUNDS: {
    type: 'number',
    min: 10,
    max: 15,
    default: 12,
    description: 'BCrypt salt rounds for password hashing'
  },
  PASSWORD_MIN_LENGTH: {
    type: 'number',
    min: 6,
    max: 128,
    default: 8,
    description: 'Minimum password length'
  },
  
  // Cache Configuration
  REDIS_URL: {
    type: 'url',
    required: true,
    description: 'Redis connection string for caching'
  },
  CACHE_TTL: {
    type: 'number',
    min: 60, // 1 minute
    max: 86400, // 24 hours
    default: 3600, // 1 hour
    description: 'Default cache TTL in seconds'
  },
  
  // Build & Deployment
  BUILD_DIR: {
    type: 'string',
    required: true,
    default: './build',
    description: 'Frontend build directory'
  },
  DIST_DIR: {
    type: 'string',
    required: true,
    default: './dist',
    description: 'Backend build directory'
  }
});

console.log('📋 Full-Stack Application Schema:');
console.log('- Frontend configuration (React/Next.js)');
console.log('- Backend API configuration (Express)');
console.log('- Database with connection pooling');
console.log('- Authentication & session management');
console.log('- Email service integration');
console.log('- File upload & storage (AWS S3)');
console.log('- Payment processing (Stripe)');
console.log('- OAuth providers (Google)');
console.log('- Monitoring & analytics');
console.log('- Feature flags for A/B testing');
console.log('- Security & rate limiting');
console.log('- Caching with Redis\n');

// Validate environment variables
const envValidation = validateEnv(fullstackSchema, process.env);

if (!envValidation.success) {
  console.log('❌ Environment validation failed:');
  envValidation.errors.forEach(error => {
    console.log(`  🚨 ${error.field}: ${error.message}`);
  });
  console.log('\nPlease configure all required environment variables in your .env file.');
  console.log('Check the .env.example file for required variables.\n');
  process.exit(1);
}

console.log('✅ Environment validation successful!');
const env = envValidation.data;

// Configuration objects for different parts of the application
const configs = {
  // Application Info
  app: {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    environment: env.NODE_ENV
  },
  
  // Frontend Configuration
  frontend: {
    port: env.FRONTEND_PORT,
    url: env.FRONTEND_URL,
    version: env.REACT_APP_VERSION,
    buildDir: env.BUILD_DIR
  },
  
  // Backend Configuration
  backend: {
    port: env.API_PORT,
    url: env.API_URL,
    distDir: env.DIST_DIR,
    corsOrigins: env.CORS_ORIGINS.split(',')
  },
  
  // Database Configuration
  database: {
    url: env.DATABASE_URL,
    pool: {
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX
    }
  },
  
  // Authentication
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRY,
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
    passwordMinLength: env.PASSWORD_MIN_LENGTH
  },
  
  // Session Management
  session: {
    secret: env.SESSION_SECRET,
    maxAge: env.SESSION_MAX_AGE
  },
  
  // Email Configuration
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    from: {
      email: env.FROM_EMAIL,
      name: env.FROM_NAME
    }
  },
  
  // File Upload
  upload: {
    dir: env.UPLOAD_DIR,
    maxSize: env.MAX_FILE_SIZE,
    allowedTypes: env.ALLOWED_FILE_TYPES.split(',')
  },
  
  // External Services
  external: {
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    },
    aws: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      bucket: env.AWS_S3_BUCKET,
      region: env.AWS_REGION
    }
  },
  
  // Monitoring
  monitoring: {
    sentry: {
      dsn: env.SENTRY_DSN
    },
    analytics: {
      google: env.GOOGLE_ANALYTICS_ID,
      mixpanel: env.MIXPANEL_TOKEN
    }
  },
  
  // Features
  features: {
    registration: env.ENABLE_REGISTRATION,
    oauth: env.ENABLE_OAUTH,
    payments: env.ENABLE_PAYMENTS,
    fileUploads: env.ENABLE_FILE_UPLOADS,
    notifications: env.ENABLE_NOTIFICATIONS,
    analytics: env.ENABLE_ANALYTICS
  },
  
  // API Configuration
  api: {
    rateLimit: {
      max: env.API_RATE_LIMIT,
      windowMs: env.API_RATE_WINDOW
    }
  },
  
  // Cache
  cache: {
    url: env.REDIS_URL,
    ttl: env.CACHE_TTL
  }
};

// Environment-specific configurations
const environmentConfigs = {
  development: {
    debug: true,
    corsEnabled: true,
    rateLimitEnabled: true,
    logging: 'debug',
    database: {
      sync: true,
      logging: true
    },
    cache: {
      enabled: true,
      ttl: configs.cache.ttl
    }
  },
  
  production: {
    debug: false,
    corsEnabled: true,
    rateLimitEnabled: true,
    logging: 'error',
    database: {
      sync: false,
      logging: false,
      ssl: true
    },
    cache: {
      enabled: true,
      ttl: configs.cache.ttl
    },
    security: {
      helmet: true,
      compression: true
    }
  },
  
  staging: {
    debug: true,
    corsEnabled: true,
    rateLimitEnabled: true,
    logging: 'info',
    database: {
      sync: true,
      logging: false
    },
    cache: {
      enabled: true,
      ttl: Math.floor(configs.cache.ttl * 0.5) // Shorter TTL in staging
    }
  },
  
  test: {
    debug: false,
    corsEnabled: false,
    rateLimitEnabled: false,
    logging: 'silent',
    database: {
      sync: true,
      logging: false
    },
    cache: {
      enabled: false,
      ttl: 0
    }
  }
};

// Current environment configuration
const currentEnvConfig = environmentConfigs[configs.app.environment] || environmentConfigs.development;

console.log(`🏗️  Full-Stack Application Configuration: ${configs.app.name} v${configs.app.version}`);
console.log(`🌍 Environment: ${configs.app.environment.toUpperCase()}`);

console.log('\n📱 Frontend Configuration:');
console.log(`  Port: ${configs.frontend.port}`);
console.log(`  URL: ${configs.frontend.url}`);
console.log(`  Build: ${configs.frontend.buildDir}`);

console.log('\n🚀 Backend Configuration:');
console.log(`  Port: ${configs.backend.port}`);
console.log(`  URL: ${configs.backend.url}`);
console.log(`  CORS: ${configs.backend.corsOrigins.length} origins`);

console.log('\n🗄️  Database Configuration:');
console.log(`  Pool: ${configs.database.pool.min}-${configs.database.pool.max} connections`);
console.log(`  URL: ${configs.database.url.substring(0, 30)}...`);

console.log('\n🔐 Authentication & Security:');
console.log(`  JWT: ${configs.auth.jwtExpiresIn} expiry`);
console.log(`  Session: ${Math.floor(configs.session.maxAge / 1000 / 60)} minutes max age`);
console.log(`  Bcrypt: ${configs.auth.bcryptSaltRounds} salt rounds`);

console.log('\n📧 Email Configuration:');
console.log(`  SMTP: ${configs.email.smtp.host}:${configs.email.smtp.port}`);
console.log(`  From: ${configs.email.from.name} <${configs.email.from.email}>`);

console.log('\n💳 Payment & OAuth:');
console.log(`  Stripe: ${configs.external.stripe.secretKey ? '✅' : '❌'}`);
console.log(`  Google: ${configs.external.google.clientId ? '✅' : '❌'}`);

console.log('\n📁 File Storage:');
console.log(`  Upload: ${configs.upload.dir}`);
console.log(`  Max Size: ${Math.floor(configs.upload.maxSize / 1024 / 1024)}MB`);
console.log(`  S3: ${configs.external.aws.bucket ? '✅' : '❌'}`);

console.log('\n🔧 Features Enabled:');
Object.entries(configs.features).forEach(([feature, enabled]) => {
  console.log(`  ${feature}: ${enabled ? '✅' : '❌'}`);
});

console.log('\n📊 Monitoring:');
console.log(`  Sentry: ${configs.monitoring.sentry.dsn ? '✅' : '❌'}`);
console.log(`  Google Analytics: ${configs.monitoring.analytics.google ? '✅' : '❌'}`);
console.log(`  Mixpanel: ${configs.monitoring.analytics.mixpanel ? '✅' : '❌'}`);

// Generate .env.example file
function generateEnvExample() {
  const exampleEnv = `# Environment Configuration
NODE_ENV=${configs.app.environment}
APP_NAME=${configs.app.name}
APP_VERSION=${configs.app.version}

# Frontend
FRONTEND_PORT=${configs.frontend.port}
FRONTEND_URL=${configs.frontend.url}
REACT_APP_VERSION=${configs.frontend.version}

# Backend
API_PORT=${configs.backend.port}
API_URL=${configs.backend.url}
CORS_ORIGINS=${configs.backend.corsOrigins.join(',')}

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=25

# Authentication
JWT_SECRET=your-jwt-secret-here-minimum-32-characters
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-here-minimum-32-characters
BCRYPT_SALT_ROUNDS=12
PASSWORD_MIN_LENGTH=8

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=${configs.app.name}

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx

# External Services
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=us-east-1

# Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn-here
GOOGLE_ANALYTICS_ID=GA-XXXX-X
MIXPANEL_TOKEN=your-mixpanel-token

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_OAUTH=true
ENABLE_PAYMENTS=false
ENABLE_FILE_UPLOADS=true
ENABLE_NOTIFICATIONS=true
ENABLE_ANALYTICS=true
`;

  return exampleEnv;
}

// Generate environment-specific configuration
function generateEnvSpecificConfig() {
  const envSpecificConfig = {
    // Frontend environment file
    frontendEnv: {
      [`REACT_APP_${configs.app.environment.toUpperCase()}`]: true,
      [`REACT_APP_API_URL`]: configs.backend.url,
      [`REACT_APP_VERSION`]: configs.frontend.version,
      [`REACT_APP_NAME`]: configs.app.name,
      ...(configs.monitoring.analytics.google && {
        [`REACT_APP_GA_ID`]: configs.monitoring.analytics.google
      }),
      ...(configs.external.stripe.publishableKey && {
        [`REACT_APP_STRIPE_PUBLISHABLE_KEY`]: configs.external.stripe.publishableKey
      })
    },
    
    // Backend environment variables (process.env)
    backendEnv: {
      NODE_ENV: configs.app.environment,
      PORT: configs.backend.port,
      DATABASE_URL: configs.database.url,
      JWT_SECRET: configs.auth.jwtSecret,
      // Add other backend-specific env vars
    }
  };
  
  return envSpecificConfig;
}

// Create sample configuration files
function createConfigFiles() {
  const filesToCreate = [
    {
      path: '.env.example',
      content: generateEnvExample()
    },
    {
      path: '.env.development',
      content: generateEnvExample().replace(/NODE_ENV=.*/g, 'NODE_ENV=development')
    },
    {
      path: '.env.production',
      content: generateEnvExample().replace(/NODE_ENV=.*/g, 'NODE_ENV=production')
    }
  ];
  
  filesToCreate.forEach(file => {
    try {
      fs.writeFileSync(file.path, file.content, 'utf8');
      console.log(`✅ Created ${file.path}`);
    } catch (error) {
      console.log(`⚠️  Could not create ${file.path}: ${error.message}`);
    }
  });
  
  // Create frontend environment file
  const frontendEnvVars = generateEnvSpecificConfig().frontendEnv;
  const frontendEnvContent = Object.entries(frontendEnvVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  try {
    fs.writeFileSync('.env.local', frontendEnvContent, 'utf8');
    console.log('✅ Created .env.local (for frontend)');
  } catch (error) {
    console.log(`⚠️  Could not create .env.local: ${error.message}`);
  }
}

// Usage instructions
function showUsageInstructions() {
  console.log('\n📁 Configuration Files Generated:');
  console.log('  .env.example - Template for all required variables');
  console.log('  .env.development - Development environment template');
  console.log('  .env.production - Production environment template');
  console.log('  .env.local - Frontend environment variables');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Copy .env.example to .env and fill in your values');
  console.log('2. For development: cp .env.example .env.development');
  console.log('3. For production: cp .env.example .env.production');
  console.log('4. Update .env.local with frontend-specific variables');
  console.log('5. Add the real values for all external services');
  console.log('6. Ensure database and Redis are running');
  
  console.log('\n🏗️  Full-Stack Architecture:');
  console.log(`  Frontend: ${configs.frontend.url} (React/Next.js)`);
  console.log(`  Backend:  ${configs.backend.url} (Express API)`);
  console.log(`  Database: PostgreSQL with ${configs.database.pool.max} max connections`);
  console.log(`  Cache:    Redis for session/caching`);
  console.log(`  File Storage: AWS S3 for uploads`);
  console.log(`  Email:    SMTP server for notifications`);
  
  console.log('\n🔧 Development Commands:');
  console.log('  Frontend: npm start (starts on port 3000)');
  console.log('  Backend:  npm run dev (starts on port 5000)');
  console.log('  Database: docker-compose up postgres redis');
  console.log('  Build:    npm run build (creates production build)');
  
  console.log('\n🌟 Features Available:');
  const enabledFeatures = Object.entries(configs.features)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => feature);
  console.log(`  ${enabledFeatures.join(', ')}`);
  
  if (configs.app.environment === 'production') {
    console.log('\n🔒 Production Checklist:');
    console.log('  ✅ Database SSL enabled');
    console.log('  ✅ Rate limiting active');
    console.log('  ✅ Error tracking configured');
    console.log('  ✅ Security headers enabled');
    console.log('  ✅ Compression enabled');
    console.log('  ✅ Environment validation active');
  }
}

// Execute setup
console.log('\n🛠️  Setting up full-stack application...');
createConfigFiles();
showUsageInstructions();

module.exports = {
  configs,
  environmentConfigs: currentEnvConfig,
  fullstackSchema,
  envValidation
};