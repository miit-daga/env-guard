// Basic usage example for env-guard library
const { defineSchema, validateEnv, validators } = require('../lib/index.js');

console.log('=== Env-Guard Basic Usage Test ===\n');

// Test 1: Basic schema definition
console.log('1. Testing basic schema definition...');
const basicSchema = defineSchema({
  PORT: {
    type: 'port',
    required: true,
    default: 3000
  },
  NODE_ENV: {
    type: 'string',
    enum: ['development', 'production', 'test'],
    default: 'development'
  },
  DEBUG: {
    type: 'boolean',
    default: false
  },
  API_URL: {
    type: 'url',
    required: false
  }
});

console.log('✓ Schema defined successfully');
console.log('Compiled schema keys:', Object.keys(basicSchema));

// Test 2: Type coercion
console.log('\n2. Testing type coercion...');
const testEnv = {
  PORT: '8080',        // String should be coerced to number
  NODE_ENV: 'production',
  DEBUG: 'true',       // String should be coerced to boolean
  API_URL: 'https://api.example.com'
};

const result = validateEnv(basicSchema, testEnv);
console.log('Validation result:', {
  success: result.success,
  data: result.data,
  hasErrors: result.hasErrors,
  errorCount: result.errors.length
});

if (result.data) {
  console.log('Type coercion results:');
  console.log('- PORT type:', typeof result.data.PORT, '(should be number)');
  console.log('- NODE_ENV type:', typeof result.data.NODE_ENV, '(should be string)');
  console.log('- DEBUG type:', typeof result.data.DEBUG, '(should be boolean)');
  console.log('- API_URL type:', typeof result.data.API_URL, '(should be string)');
}

// Test 3: Built-in validators
console.log('\n3. Testing built-in validators...');

const urlTests = [
  'https://example.com',
  'http://localhost:3000',
  'ftp://files.example.com',
  'invalid-url'
];

const portTests = [80, 443, 8080, 3000, 70000, 'not-a-number'];
const emailTests = ['user@example.com', 'invalid-email', 'test@domain.co.uk'];
const ipTests = ['192.168.1.1', '::1', 'invalid-ip', '256.256.256.256'];

console.log('URL Validation:');
urlTests.forEach(url => {
  const result = validators.url(url);
  console.log(`  "${url}" -> ${result === true ? 'VALID' : result}`);
});

console.log('\nPort Validation:');
portTests.forEach(port => {
  const result = validators.port(port);
  console.log(`  "${port}" -> ${result === true ? 'VALID' : result}`);
});

console.log('\nEmail Validation:');
emailTests.forEach(email => {
  const result = validators.email(email);
  console.log(`  "${email}" -> ${result === true ? 'VALID' : result}`);
});

console.log('\nIP Validation:');
ipTests.forEach(ip => {
  const result = validators.ip(ip);
  console.log(`  "${ip}" -> ${result === true ? 'VALID' : result}`);
});

// Test 4: Error handling
console.log('\n4. Testing error handling...');
const errorEnv = {
  PORT: 'invalid-port',
  NODE_ENV: 'invalid-env',
  DEBUG: 'maybe',
  API_URL: 'not-a-url'
};

const errorResult = validateEnv(basicSchema, errorEnv);
console.log('Error handling test:');
console.log('  Success:', errorResult.success);
console.log('  Error count:', errorResult.errors.length);
errorResult.errors.forEach((error, index) => {
  console.log(`  Error ${index + 1}: ${error.field} - ${error.message} (${error.type})`);
});

// Test 5: Default values
console.log('\n5. Testing default values...');
const minimalEnv = {};
const minimalResult = validateEnv(basicSchema, minimalEnv);
console.log('Default values test:');
console.log('  Success:', minimalResult.success);
if (minimalResult.data) {
  console.log('  PORT (default):', minimalResult.data.PORT);
  console.log('  NODE_ENV (default):', minimalResult.data.NODE_ENV);
  console.log('  DEBUG (default):', minimalResult.data.DEBUG);
  console.log('  API_URL (not set, no default):', minimalResult.data.API_URL);
}

console.log('\n=== Test completed ===');