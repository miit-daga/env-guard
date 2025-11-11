# 🐛 Troubleshooting Guide & FAQ

Common issues, solutions, and frequently asked questions about env-guard.

## Table of Contents

- [Common Installation Issues](#common-installation-issues)
- [Schema Definition Problems](#schema-definition-problems)
- [Validation Errors](#validation-errors)
- [CLI Issues](#cli-issues)
- [TypeScript Problems](#typescript-problems)
- [Framework Integration Issues](#framework-integration-issues)
- [Performance Issues](#performance-issues)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Getting Help](#getting-help)

## Common Installation Issues

### Installation Fails

**Problem:**
```bash
npm ERR! peer dep missing
```

**Solution:**
```bash
# Install with peer dependencies
npm install @miit-daga/env-guard --legacy-peer-deps

# Or update npm
npm install -g npm@latest
```

### TypeScript Types Not Found

**Problem:**
```typescript
// Error: Could not find a declaration file for module 'env-guard'
import { defineSchema } from 'env-guard';
```

**Solution:**
```bash
# Install TypeScript types
npm install --save-dev @types/node

# Or add to your tsconfig.json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

### CommonJS vs ES Modules

**Problem:**
```javascript
// Error: Cannot use import statement outside a module
import { defineSchema } from 'env-guard';
```

**Solution:**
```javascript
// Use require for CommonJS
const { defineSchema } = require('env-guard');

// Or update package.json
{
  "type": "module"
}
```

## Schema Definition Problems

### Missing Type Property

**Problem:**
```javascript
const schema = defineSchema({
  PORT: {
    // Missing 'type' property
    required: true
  }
});
```

**Error:**
```
SchemaError: Field "PORT" must specify a type
```

**Solution:**
```javascript
const schema = defineSchema({
  PORT: {
    type: 'port',  // Add required type
    required: true
  }
});
```

### Invalid Enum Values

**Problem:**
```javascript
const schema = defineSchema({
  NODE_ENV: {
    type: 'string',
    enum: ['development', 'production'],
    default: 'staging'  // Not in enum
  }
});
```

**Error:**
```
ValidationError: Value must be one of: development, production
```

**Solution:**
```javascript
const schema = defineSchema({
  NODE_ENV: {
    type: 'string',
    enum: ['development', 'production', 'staging'],
    default: 'development'
  }
});
```

### Custom Validator Not Working

**Problem:**
```javascript
const schema = defineSchema({
  EMAIL: {
    type: 'string',
    validate: (value) => {
      if (!value.includes('@')) {
        return false;  // Should return string for error
      }
      return true;
    }
  }
});
```

**Solution:**
```javascript
const schema = defineSchema({
  EMAIL: {
    type: 'string',
    validate: (value) => {
      if (!value.includes('@')) {
        return 'Must be a valid email address';
      }
      return true;
    }
  }
});
```

## Validation Errors

### Required Field Missing

**Problem:**
```
Required environment variable "DATABASE_URL" is missing
```

**Solutions:**
1. **Set the environment variable:**
   ```bash
   export DATABASE_URL=postgresql://localhost:5432/mydb
   ```

2. **Add a default value:**
   ```javascript
   const schema = defineSchema({
     DATABASE_URL: {
       type: 'url',
       required: false,  // Make it optional
       default: 'postgresql://localhost:5432/default'
     }
   });
   ```

3. **Use environment-specific rules:**
   ```javascript
   const schema = defineSchema({
     DATABASE_URL: {
       type: 'url',
       required: false
     },
     _environments: {
       production: {
         DATABASE_URL: { required: true }
       }
     }
   });
   ```

### Type Coercion Failures

**Problem:**
```
Cannot coerce to number
```

**Common Causes:**
1. **Non-numeric string:**
   ```bash
   # Wrong
   export PORT=3000a
   
   # Correct
   export PORT=3000
   ```

2. **Invalid boolean format:**
   ```bash
   # Wrong
   export DEBUG=maybe
   
   # Correct
   export DEBUG=true  # or '1', 'yes', 'on'
   export DEBUG=false # or '0', 'no', 'off'
   ```

### URL Validation Issues

**Problem:**
```
Invalid URL format
```

**Solutions:**
1. **Add protocol:**
   ```bash
   # Wrong
   export API_URL=localhost:3000
   
   # Correct
   export API_URL=http://localhost:3000
   ```

2. **Use correct protocols:**
   ```javascript
   // Accept only HTTPS in production
   const schema = defineSchema({
     API_URL: {
       type: 'url',
       protocols: ['https:']  // Only HTTPS allowed
     }
   });
   ```

### Port Range Errors

**Problem:**
```
Port must be an integer between 1 and 65535
```

**Common Issues:**
```bash
# Out of range
export PORT=70000  # Too high

# Not a number
export PORT=not-a-number

# Decimal port
export PORT=3000.5  # Not allowed
```

## CLI Issues

### Schema File Not Found

**Problem:**
```bash
Error: Schema file not found: schema.js
```

**Solutions:**
1. **Check file path:**
   ```bash
   # Use absolute path
   env-guard validate --schema /full/path/to/schema.js
   
   # Use relative path from current directory
   env-guard validate --schema ./config/schema.js
   ```

2. **Verify file exists:**
   ```bash
   ls -la schema.js
   ```

### Command Not Found

**Problem:**
```bash
bash: env-guard: command not found
```

**Solutions:**
1. **Install globally:**
   ```bash
   npm install -g @miit-daga/env-guard
   ```

2. **Use npx:**
   ```bash
   npx env-guard validate --schema schema.js
   ```

3. **Use local installation:**
   ```bash
   ./node_modules/.bin/env-guard validate --schema schema.js
   ```

### Permission Errors

**Problem:**
```bash
Error: EACCES: permission denied
```

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Or use a version manager like nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
```

## TypeScript Problems

### Type Inference Issues

**Problem:**
```typescript
const result = validateEnv(schema, process.env);
// Type: any instead of proper types
```

**Solution:**
```typescript
// Define your schema types
interface AppConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
}

// Use proper typing
const result = validateEnv<typeof schema, AppConfig>(schema, process.env);
if (result.success) {
  const port: number = result.data.PORT;  // Properly typed
}
```

### Declaration File Issues

**Problem:**
```typescript
// Error: Module '"env-guard"' has no exported member 'defineSchema'
```

**Solution:**
1. **Check TypeScript version:**
   ```bash
   npm install --save-dev typescript@latest
   ```

2. **Add type reference:**
   ```typescript
   /// <reference types="node" />
   import { defineSchema } from 'env-guard';
   ```

3. **Update tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "esModuleInterop": true,
       "allowSyntheticDefaultImports": true
     }
   }
   ```

## Framework Integration Issues

### Express.js Issues

**Problem:**
```javascript
// Validation runs but server doesn't start
```

**Solution:**
```javascript
// Always check validation result
const result = validateEnv(schema, process.env);
if (!result.success) {
  console.error('Environment validation failed:', result.errors);
  process.exit(1);  // Exit if validation fails
}

const app = express();
// Continue with app setup...
```

### Next.js Issues

**Problem:**
```javascript
// Error: process.env is not available during build
```

**Solution:**
```javascript
// next.config.js
const { defineSchema, validateEnv } = require('@miit-daga/env-guard');

const schema = defineSchema({
  DATABASE_URL: { type: 'url', required: true }
});

const envValidation = validateEnv(schema, process.env);
if (!envValidation.success) {
  console.error('Environment validation failed');
  process.exit(1);
}

module.exports = {
  env: {
    DATABASE_URL: envValidation.data.DATABASE_URL
  }
};
```

### NestJS Issues

**Problem:**
```javascript
// ConfigService not working with env-guard
```

**Solution:**
```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';
import { defineSchema, validateEnv } from 'env-guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => {
        const schema = defineSchema({
          PORT: { type: 'port', required: true, default: 3000 }
        });
        return validateEnv(schema, process.env).data;
      }]
    })
  ]
})
export class AppModule {}
```

## Performance Issues

### Slow Validation

**Problem:**
```javascript
// Validation takes too long
```

**Solutions:**
1. **Compile schema once:**
   ```javascript
   // Cache the compiled schema
   const compiledSchema = defineSchema(schema);
   
   // Reuse for multiple validations
   const result1 = validateEnv(compiledSchema, env1);
   const result2 = validateEnv(compiledSchema, env2);
   ```

2. **Validate selectively:**
   ```javascript
   // Only validate critical environment variables on startup
   const criticalSchema = defineSchema({
     DATABASE_URL: { type: 'url', required: true },
     PORT: { type: 'port', required: true }
   });
   ```

### Memory Usage

**Problem:**
```javascript
// High memory usage with many environment variables
```

**Solution:**
```javascript
// Validate in batches
const batchSize = 10;
for (let i = 0; i < envVars.length; i += batchSize) {
  const batch = envVars.slice(i, i + batchSize);
  validateEnv(schema, batch);
}
```

## Frequently Asked Questions

### Q: Can I use env-guard with Docker?

**A:** Yes! Here's how:

**Dockerfile:**
```dockerfile
# Validate environment on build
RUN env-guard validate --schema schema.js --exit-on-error

# Or validate in your entrypoint
ENTRYPOINT ["node", "-e", "
  const { validateEnv, defineSchema } = require('./lib/index.js');
  const schema = require('./schema.js');
  const result = validateEnv(schema, process.env);
  if (!result.success) {
    console.error('Environment validation failed');
    process.exit(1);
  }
  require('./src/index.js');
"]
```

**docker-compose.yml:**
```yaml
services:
  app:
    build: .
    environment:
      - DATABASE_URL=postgresql://db:5432/app
      - NODE_ENV=production
```

### Q: How do I handle secrets in CI/CD?

**A:** Use environment variables in your CI/CD platform:

**GitHub Actions:**
```yaml
- name: Validate Environment
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    API_KEY: ${{ secrets.API_KEY }}
  run: env-guard validate --schema schema.js
```

**GitLab CI:**
```yaml
validate:
  variables:
    DATABASE_URL: $DATABASE_URL
  script:
    - env-guard validate --schema schema.js
```

### Q: Can I use env-guard with environment files?

**A:** Yes, combine with dotenv:

```javascript
require('dotenv').config();

const { validateEnv } = require('@miit-daga/env-guard');
const schema = require('./schema');

const result = validateEnv(schema, process.env);
```

### Q: How do I test with env-guard?

**A:** Use test environment variables:

```javascript
// test/setup.js
const { defineSchema, validateEnv } = require('@miit-daga/env-guard');

const testSchema = defineSchema({
  TEST_DATABASE_URL: { type: 'url', default: 'sqlite:///:memory:' },
  TEST_MODE: { type: 'boolean', default: true }
});

// Set test environment before requiring app
process.env.TEST_DATABASE_URL = 'sqlite:///:memory:';
process.env.TEST_MODE = 'true';
```

### Q: Can I validate nested objects?

**A:** Currently, env-guard validates flat environment variables. For nested configs:

```javascript
// Instead of nested, use prefixes
const schema = defineSchema({
  DB_HOST: { type: 'string', required: true },
  DB_PORT: { type: 'port', required: true },
  DB_NAME: { type: 'string', required: true }
});

// In your code
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  name: process.env.DB_NAME
};
```

### Q: How do I handle missing optional variables?

**A:** Use conditional logic:

```javascript
const result = validateEnv(schema, process.env);

if (result.success && result.data.OPTIONAL_VAR) {
  // Use optional variable if provided
  useOptionalFeature(result.data.OPTIONAL_VAR);
} else {
  // Use default behavior
  useDefaultFeature();
}
```

### Q: Can I validate arrays or complex types?

**A:** Not directly, but you can validate JSON:

```javascript
const schema = defineSchema({
  ALLOWED_HOSTS: {
    type: 'json',
    default: '[]',
    transform: (value) => JSON.parse(value)
  }
});

const result = validateEnv(schema, process.env);
const hosts = result.data.ALLOWED_HOSTS; // Array
```

### Q: How do I handle environment-specific configurations?

**A:** Use environment overrides:

```javascript
const schema = defineSchema({
  API_URL: {
    type: 'url',
    required: false,
    default: 'http://localhost:3000'
  },
  _environments: {
    production: {
      API_URL: {
        required: true,
        default: 'https://api.production.com'
      }
    }
  }
});

// Validate with environment
const result = validateEnv(schema, process.env, 'production');
```

### Q: What's the difference between `required: true` and having no default?

**A:**
- `required: true` - Variable must be set in environment
- `required: false` with default - Variable is optional, uses default if not set
- `required: false` without default - Variable is optional, undefined if not set

### Q: Can I use env-guard with serverless functions?

**A:** Yes! Here's for Vercel:

```javascript
// vercel.json
{
  "functions": {
    "api/index.js": {
      "env": {
        "DATABASE_URL": "@database-url"
      }
    }
  }
}

// In your function
const { validateEnv } = require('@miit-daga/env-guard');
const schema = require('./schema');

export default function handler(req, res) {
  const result = validateEnv(schema, process.env);
  if (!result.success) {
    return res.status(500).json({ error: 'Invalid environment' });
  }
  
  // Use result.data
}
```

## Getting Help

### Enable Debug Mode

```javascript
const result = validateEnv(schema, process.env);
if (result.hasErrors) {
  console.log('Debug information:');
  result.errors.forEach(error => {
    console.log(`Field: ${error.field}`);
    console.log(`Message: ${error.message}`);
    console.log(`Value: ${error.value}`);
    console.log(`Expected: ${error.expected}`);
    console.log(`Received: ${error.received}`);
    console.log('---');
  });
}
```

### Check Schema Validity

```bash
# Use CLI to check schema
env-guard check --schema schema.js --detailed
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testNamePattern="validation"
```

### Validate Examples

```bash
# Test basic usage
node examples/basic-usage.js

# Test framework integrations
node examples/express-integration.js
```

### Common Debugging Commands

```bash
# Check what environment variables are set
env | grep -E "(NODE_ENV|PORT|DATABASE)"

# Test CLI with verbose output
env-guard validate --schema schema.js --verbose

# Generate example to see expected format
env-guard generate --schema schema.js --include-comments
```

### Create Minimal Reproduction

If you need help, create a minimal example:

```javascript
// minimal-example.js
const { defineSchema, validateEnv } = require('@miit-daga/env-guard');

const schema = defineSchema({
  TEST_VAR: {
    type: 'string',
    required: true
  }
});

const result = validateEnv(schema, {
  TEST_VAR: 'test-value'  // Your test case
});

console.log('Result:', result);
```

### Support Channels

1. **Check examples** - Look in `examples/` directory
2. **Read documentation** - API.md, CLI.md, QUICKSTART.md
3. **Run tests** - `npm test` to ensure everything works
4. **Check schema** - `env-guard check --schema your-schema.js`

## Summary

Most issues with env-guard fall into these categories:

1. **Schema Definition Errors** - Missing types, invalid enums, wrong validators
2. **Environment Variable Issues** - Missing variables, wrong formats, type coercion failures
3. **CLI Problems** - File paths, permissions, command syntax
4. **Framework Integration** - Load order, build-time vs runtime, configuration

**Key Takeaways:**
- ✅ Always check validation results
- ✅ Use `env-guard check` to validate schemas
- ✅ Enable debug mode for detailed error information
- ✅ Start with simple examples and gradually add complexity
- ✅ Use environment-specific rules for different deployment targets

**Remember:** env-guard is designed to be helpful - if something isn't working as expected, the error messages are designed to guide you to a solution!