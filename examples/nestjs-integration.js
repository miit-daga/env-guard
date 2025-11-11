// NestJS Integration Example for env-guard
// This example shows how to integrate env-guard with NestJS

const { defineSchema, validateEnv } = require('../lib/index');

console.log('🛡️ Env-Guard NestJS Integration Example\n');

// Define environment variable schema for NestJS
const nestjsSchema = defineSchema({
  // Application Configuration
  PORT: {
    type: 'port',
    required: true,
    default: 3001,
    description: 'NestJS application port'
  },
  NODE_ENV: {
    type: 'string',
    enum: ['development', 'production', 'test', 'staging'],
    default: 'development',
    description: 'Application environment'
  },
  APP_NAME: {
    type: 'string',
    required: true,
    default: 'NestJS API',
    description: 'Application name'
  },
  API_VERSION: {
    type: 'string',
    required: true,
    default: 'v1',
    description: 'API version prefix'
  },
  
  // Database Configuration
  DATABASE_HOST: {
    type: 'string',
    required: true,
    default: 'localhost',
    description: 'Database host address'
  },
  DATABASE_PORT: {
    type: 'port',
    required: true,
    default: 5432,
    description: 'Database port'
  },
  DATABASE_NAME: {
    type: 'string',
    required: true,
    default: 'nestjs_app',
    description: 'Database name'
  },
  DATABASE_USER: {
    type: 'string',
    required: true,
    default: 'postgres',
    description: 'Database username'
  },
  DATABASE_PASSWORD: {
    type: 'string',
    required: true,
    description: 'Database password'
  },
  
  // Redis Configuration
  REDIS_HOST: {
    type: 'string',
    required: true,
    default: 'localhost',
    description: 'Redis host address'
  },
  REDIS_PORT: {
    type: 'port',
    required: true,
    default: 6379,
    description: 'Redis port'
  },
  
  // Authentication & Security
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'JWT signing secret'
  },
  JWT_EXPIRES_IN: {
    type: 'string',
    required: true,
    default: '24h',
    description: 'JWT token expiration time'
  },
  BCRYPT_SALT_ROUNDS: {
    type: 'number',
    min: 10,
    max: 15,
    default: 12,
    description: 'BCrypt salt rounds for password hashing'
  },
  
  // External Services
  STRIPE_SECRET_KEY: {
    type: 'string',
    required: true,
    minLength: 20,
    description: 'Stripe secret key for payments'
  },
  SENDGRID_API_KEY: {
    type: 'string',
    required: true,
    minLength: 20,
    description: 'SendGrid API key for emails'
  },
  AWS_S3_BUCKET: {
    type: 'string',
    required: true,
    description: 'AWS S3 bucket name for file storage'
  },
  AWS_REGION: {
    type: 'string',
    required: true,
    default: 'us-east-1',
    description: 'AWS region for S3 operations'
  },
  
  // Rate Limiting & Security
  RATE_LIMIT_MAX: {
    type: 'number',
    min: 10,
    max: 1000,
    default: 100,
    description: 'Maximum requests per window'
  },
  RATE_LIMIT_WINDOW: {
    type: 'number',
    min: 60000, // 1 minute
    max: 3600000, // 1 hour
    default: 900000, // 15 minutes
    description: 'Rate limit window in milliseconds'
  },
  
  // Logging & Monitoring
  LOG_LEVEL: {
    type: 'string',
    enum: ['error', 'warn', 'info', 'debug', 'verbose'],
    default: 'info',
    description: 'Application log level'
  },
  SENTRY_DSN: {
    type: 'string',
    required: false,
    description: 'Sentry DSN for error tracking'
  },
  
  // Feature Flags
  ENABLE_CACHING: {
    type: 'boolean',
    default: true,
    description: 'Enable Redis caching'
  },
  ENABLE_METRICS: {
    type: 'boolean',
    default: false,
    description: 'Enable application metrics'
  },
  ENABLE_SWAGGER: {
    type: 'boolean',
    default: true,
    description: 'Enable Swagger API documentation'
  }
});

console.log('📋 NestJS Environment Schema:');
console.log('- Application configuration');
console.log('- Database & Redis setup');
console.log('- Authentication & security');
console.log('- External service integrations');
console.log('- Rate limiting & monitoring');
console.log('- Feature flags\n');

// Validate environment variables
const envValidation = validateEnv(nestjsSchema, process.env);

if (!envValidation.success) {
  console.log('❌ Environment validation failed:');
  envValidation.errors.forEach(error => {
    console.log(`  - ${error.field}: ${error.message}`);
  });
  console.log('\nPlease check your environment variables and try again.\n');
  process.exit(1);
}

console.log('✅ Environment validation successful!');
const env = envValidation.data;

// NestJS Configuration Service
class AppConfig {
  constructor(env) {
    this.env = env;
  }
  
  // Database Configuration
  get databaseConfig() {
    return {
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      database: env.DATABASE_NAME,
      username: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
    };
  }
  
  // Redis Configuration
  get redisConfig() {
    return {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    };
  }
  
  // JWT Configuration
  get jwtConfig() {
    return {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }
  
  // Security Configuration
  get securityConfig() {
    return {
      rateLimitMax: env.RATE_LIMIT_MAX,
      rateLimitWindow: env.RATE_LIMIT_WINDOW,
      bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
    };
  }
  
  // External Services
  get externalServices() {
    return {
      stripe: {
        secretKey: env.STRIPE_SECRET_KEY,
      },
      sendgrid: {
        apiKey: env.SENDGRID_API_KEY,
      },
      aws: {
        bucket: env.AWS_S3_BUCKET,
        region: env.AWS_REGION,
      },
    };
  }
  
  // Feature Flags
  get features() {
    return {
      caching: env.ENABLE_CACHING,
      metrics: env.ENABLE_METRICS,
      swagger: env.ENABLE_SWAGGER,
    };
  }
  
  // Application Configuration
  get app() {
    return {
      name: env.APP_NAME,
      port: env.PORT,
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      logLevel: env.LOG_LEVEL,
    };
  }
  
  // Computed Properties
  get isDevelopment() {
    return env.NODE_ENV === 'development';
  }
  
  get isProduction() {
    return env.NODE_ENV === 'production';
  }
  
  get isTest() {
    return env.NODE_ENV === 'test';
  }
  
  get isStaging() {
    return env.NODE_ENV === 'staging';
  }
  
  // Connection Strings
  get databaseUrl() {
    return `postgresql://${env.DATABASE_USER}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`;
  }
  
  get redisUrl() {
    return `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;
  }
}

// Create configuration instance
const config = new AppConfig(env);

// NestJS Module Configuration Example
const nestjsModuleConfig = {
  // App Module
  app: {
    module: `
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({
        app: {
          name: '${config.app.name}',
          port: ${config.app.port},
          version: '${config.app.version}',
          environment: '${config.app.environment}',
        },
        database: ${JSON.stringify(config.databaseConfig, null, 8)},
        redis: ${JSON.stringify(config.redisConfig, null, 8)},
        jwt: ${JSON.stringify(config.jwtConfig, null, 8)},
        features: ${JSON.stringify(config.features, null, 8)},
      })]
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT),
        database: process.env.DATABASE_NAME,
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV === 'development',
      }),
    }),
    
    // Redis (if enabled)
    ...(config.features.caching ? [
      RedisModule.forRootAsync({
        useFactory: () => ({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        }),
      })
    ] : []),
  ],
})
export class AppModule { }`,
    
    usage: `
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private configService: ConfigService) {}
  
  @Get()
  getHealth() {
    const app = this.configService.get('app');
    return {
      status: 'ok',
      name: app.name,
      version: app.version,
      environment: app.environment,
      timestamp: new Date().toISOString(),
    };
  }
}`
  },
  
  // Security Configuration
  security: {
    module: `
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: ${config.securityConfig.rateLimitWindow},
      limit: ${config.securityConfig.rateLimitMax},
    }]),
  ],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard
  }],
})
export class SecurityModule {}`
  }
};

console.log('🏗️ NestJS Configuration Summary:');
console.log(`  Application: ${config.app.name} v${config.app.version}`);
console.log(`  Port: ${config.app.port} (${config.app.environment})`);
console.log(`  Database: ${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`);
console.log(`  Redis: ${env.REDIS_HOST}:${env.REDIS_PORT}`);
console.log(`  JWT: ${config.jwtConfig.expiresIn} expiration`);
console.log(`  Rate Limit: ${config.securityConfig.rateLimitMax} requests per ${config.securityConfig.rateLimitWindow}ms`);

console.log('\n🌟 Feature Flags:');
console.log(`  Caching: ${config.features.caching ? '✅' : '❌'}`);
console.log(`  Metrics: ${config.features.metrics ? '✅' : '❌'}`);
console.log(`  Swagger: ${config.features.swagger ? '✅' : '❌'}`);

if (config.isProduction) {
  console.log('\n🔒 Production Security:');
  console.log('  - Database connections encrypted');
  console.log('  - JWT secrets protected');
  console.log('  - Rate limiting active');
  console.log('  - External service security');
  console.log('  - Error tracking with Sentry');
} else {
  console.log('\n🔧 Development Features:');
  console.log('  - Database synchronization enabled');
  console.log('  - Hot reloading active');
  console.log('  - Full error details shown');
  console.log('  - Debug logging enabled');
}

if (config.features.metrics) {
  console.log('\n📊 Metrics Configuration:');
  console.log('  - Application metrics enabled');
  console.log('  - Performance monitoring active');
  console.log('  - Health check endpoints available');
}

if (config.features.swagger) {
  console.log(`\n📖 API Documentation: http://localhost:${config.app.port}/api/docs`);
}

// Configuration validation for specific features
const configChecks = [
  {
    name: 'Database Connection',
    check: () => env.DATABASE_PORT >= 1 && env.DATABASE_PORT <= 65535,
    error: 'Database port should be between 1-65535'
  },
  {
    name: 'JWT Secret Length',
    check: () => env.JWT_SECRET.length >= 32,
    error: 'JWT secret should be at least 32 characters'
  },
  {
    name: 'Redis Port',
    check: () => env.REDIS_PORT >= 1 && env.REDIS_PORT <= 65535,
    error: 'Redis port should be between 1-65535'
  }
];

console.log('\n🧪 Configuration Validation:');
configChecks.forEach(check => {
  const result = check.check();
  console.log(`  ${check.name}: ${result ? '✅' : '❌'}`);
  if (!result && config.isDevelopment) {
    console.log(`    Warning: ${check.error}`);
  }
});

console.log('\n📁 Integration Steps:');
console.log('1. Copy this configuration to your NestJS project');
console.log('2. Install required NestJS modules:');
console.log('   npm install @nestjs/config @nestjs/typeorm @nestjs/redis');
console.log('3. Add environment variables to your .env file');
console.log('4. Import configuration in your modules');
console.log('5. Use ConfigService throughout your application');

module.exports = {
  config,
  env,
  nestjsModuleConfig
};