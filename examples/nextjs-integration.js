// Next.js Integration Example for env-guard
// This example shows how to integrate env-guard with Next.js

const { defineSchema, validateEnv } = require('../lib/index');

console.log('🛡️ Env-Guard Next.js Integration Example\n');

// Define environment variable schema for Next.js
const nextjsSchema = defineSchema({
  // Database Configuration
  DATABASE_URL: {
    type: 'url',
    required: true,
    description: 'PostgreSQL database connection string',
    transform: (url) => {
      // Add connection pool settings for production
      if (url.includes('localhost')) {
        return url + '?connection_limit=10&pool_timeout=60';
      }
      return url;
    }
  },
  
  // API Configuration
  API_URL: {
    type: 'url',
    required: true,
    description: 'Backend API base URL'
  },
  NEXT_PUBLIC_API_URL: {
    type: 'url',
    required: true,
    description: 'Public API URL for client-side usage'
  },
  
  // Authentication
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'JWT signing secret key'
  },
  NEXTAUTH_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'NextAuth.js secret for session encryption'
  },
  NEXTAUTH_URL: {
    type: 'url',
    required: true,
    description: 'NextAuth.js site URL'
  },
  
  // External Services
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
    description: 'Stripe publishable key for client-side'
  },
  SENDGRID_API_KEY: {
    type: 'string',
    required: true,
    minLength: 20,
    description: 'SendGrid API key for email sending'
  },
  
  // Application Settings
  NODE_ENV: {
    type: 'string',
    enum: ['development', 'production', 'test'],
    default: 'development',
    description: 'Node.js environment'
  },
  PORT: {
    type: 'port',
    required: false,
    default: 3000,
    description: 'Development server port'
  },
  DEBUG: {
    type: 'boolean',
    default: false,
    description: 'Enable debug logging'
  },
  
  // Feature Flags
  ENABLE_REGISTRATION: {
    type: 'boolean',
    default: true,
    description: 'Allow new user registrations'
  },
  ENABLE_PAYMENTS: {
    type: 'boolean',
    default: false,
    description: 'Enable payment processing features'
  },
  MAINTENANCE_MODE: {
    type: 'boolean',
    default: false,
    description: 'Enable maintenance mode'
  }
});

console.log('📋 Next.js Environment Schema:');
console.log('- Database configuration');
console.log('- API URLs (server & client)');
console.log('- Authentication secrets');
console.log('- External service keys');
console.log('- Feature flags\n');

// Validate environment variables
const envValidation = validateEnv(nextjsSchema, process.env);

if (!envValidation.success) {
  console.log('❌ Environment validation failed:');
  envValidation.errors.forEach(error => {
    console.log(`  - ${error.field}: ${error.message}`);
  });
  console.log('\nPlease check your .env file and ensure all required variables are set.\n');
  process.exit(1);
}

console.log('✅ Environment validation successful!');
const env = envValidation.data;

// Next.js configuration function
const nextConfig = {
  env: {
    // Public environment variables (client-side accessible)
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: env.NEXTAUTH_URL,
    
    // Server-side environment variables
    NODE_ENV: env.NODE_ENV,
    DEBUG: env.DEBUG,
    ENABLE_REGISTRATION: env.ENABLE_REGISTRATION,
    ENABLE_PAYMENTS: env.ENABLE_PAYMENTS,
    MAINTENANCE_MODE: env.MAINTENANCE_MODE
  },
  
  // Build configuration
  reactStrictMode: true,
  swcMinify: true,
  
  // Development configuration
  experimental: {
    // Enable if using Next.js 13+ app directory
    // appDir: true
  }
};

// Server-side environment variables (for API routes, server components, etc.)
const serverEnv = {
  DATABASE_URL: env.DATABASE_URL,
  API_URL: env.API_URL,
  JWT_SECRET: env.JWT_SECRET,
  NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: env.NEXTAUTH_URL,
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  SENDGRID_API_KEY: env.SENDGRID_API_KEY
};

// Configuration object for easy export
const config = {
  // Next.js config
  nextConfig,
  
  // Environment variables
  env: env,
  serverEnv: serverEnv,
  
  // Computed values
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Feature flags
  features: {
    registration: env.ENABLE_REGISTRATION,
    payments: env.ENABLE_PAYMENTS,
    maintenance: env.MAINTENANCE_MODE,
    debug: env.DEBUG
  },
  
  // URLs
  urls: {
    api: env.API_URL,
    client: env.NEXT_PUBLIC_API_URL,
    site: env.NEXTAUTH_URL
  }
};

console.log('🔧 Next.js Configuration Summary:');
console.log(`  Environment: ${env.NODE_ENV}`);
console.log(`  Development: ${config.isDevelopment ? '✅' : '❌'}`);
console.log(`  Production: ${config.isProduction ? '✅' : '❌'}`);
console.log(`  Debug Mode: ${env.DEBUG ? '✅' : '❌'}`);
console.log(`  Registration: ${env.ENABLE_REGISTRATION ? '✅' : '❌'}`);
console.log(`  Payments: ${env.ENABLE_PAYMENTS ? '✅' : '❌'}`);
console.log(`  Maintenance: ${env.MAINTENANCE_MODE ? '⚠️  ACTIVE' : '✅'}`);
console.log(`  Database: ${env.DATABASE_URL ? '✅' : '❌'}`);
console.log(`  API URLs: ${env.API_URL && env.NEXT_PUBLIC_API_URL ? '✅' : '❌'}`);
console.log(`  Auth: ${env.JWT_SECRET && env.NEXTAUTH_SECRET ? '✅' : '❌'}`);

if (config.isProduction) {
  console.log('\n🔒 Production Security:');
  console.log('  - Database URL hidden from client');
  console.log('  - API secrets not exposed to browser');
  console.log('  - JWT secrets protected');
  console.log('  - External service keys secured');
} else {
  console.log('\n🔧 Development Notes:');
  console.log('  - Debug logging enabled');
  console.log('  - Hot reloading active');
  console.log('  - Full error details shown');
}

if (config.features.maintenance) {
  console.log('\n⚠️  WARNING: Maintenance mode is active!');
  console.log('  Users will see maintenance page');
  console.log('  Most functionality will be disabled');
}

// Environment validation for specific features
const validationChecks = [
  {
    name: 'Database Connection',
    check: () => env.DATABASE_URL.startsWith('postgresql://') || env.DATABASE_URL.startsWith('postgres://'),
    error: 'Database URL should use PostgreSQL protocol'
  },
  {
    name: 'API URLs',
    check: () => env.API_URL !== env.NEXT_PUBLIC_API_URL,
    error: 'Server API URL should be different from public API URL'
  },
  {
    name: 'Authentication Setup',
    check: () => env.NEXTAUTH_URL === `http${config.isProduction ? 's' : ''}://localhost:${env.PORT}` || env.NODE_ENV === 'production',
    error: 'NextAuth URL should match the current domain'
  }
];

console.log('\n🧪 Additional Validation Checks:');
validationChecks.forEach(check => {
  const result = check.check();
  console.log(`  ${check.name}: ${result ? '✅' : '❌'}`);
  if (!result && env.NODE_ENV === 'development') {
    console.log(`    Warning: ${check.error}`);
  }
});

console.log('\n📁 Usage Instructions:');
console.log('1. Export this configuration from a config file');
console.log('2. Import env variables in your Next.js pages/api');
console.log('3. Use public env vars in client components');
console.log('4. Keep secrets server-side only');

// Example of how to use in Next.js
console.log('\n💡 Example Usage:');
console.log(`// In pages/_app.js or app/layout.js
// import config from './config';
// const env = config.env;`);

console.log(`\n// In API routes (pages/api/ or app/api/)
// import { defineSchema, validateEnv } from 'env-guard';
// const { env } = require('../config');`);

console.log(`\n// In client components
// const { NEXT_PUBLIC_API_URL } = process.env;`);

module.exports = config;