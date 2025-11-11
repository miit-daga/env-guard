// Additional tests to boost coverage to 85-90%
import { defineSchema, validateEnv } from '../src/index';

describe('Coverage Boost Tests', () => {
  describe('Type-Specific Validator Combinations', () => {
    it('should test string validator with minLength combined with custom validator', () => {
      const schema = defineSchema({
        USERNAME: {
          type: 'string' as const,
          required: true,
          minLength: 3,
          maxLength: 20,
          validate: (value: string) => /^[a-z]+$/.test(value) // Only lowercase letters
        }
      });

      // This should test lines 575-581
      expect(schema.schema.USERNAME.validator).toBeDefined();
      
      // Test valid combination
      const envVars = { USERNAME: 'validname' };
      const result = validateEnv(schema, envVars);
      expect(result.success).toBe(true);
    });

    it('should test number validator with min/max combined with custom validator', () => {
      const schema = defineSchema({
        PORT: {
          type: 'number' as const,
          required: true,
          min: 1000,
          max: 65535,
          validate: (value: number) => value % 2 === 0 // Must be even
        }
      });

      // This should test lines 590-596
      expect(schema.schema.PORT.validator).toBeDefined();
      
      // Test valid combination
      const envVars = { PORT: '3000' }; // 3000 is even, within range
      const result = validateEnv(schema, envVars);
      expect(result.success).toBe(true);
    });

    it('should test URL validator with protocols combined with custom validator', () => {
      const schema = defineSchema({
        API_URL: {
          type: 'url' as const,
          required: true,
          protocols: ['https:'],
          requireProtocol: true,
          validate: (value: string) => value.includes('api')
        }
      });

      // This should test lines 605-611
      expect(schema.schema.API_URL.validator).toBeDefined();
      
      // Test valid combination
      const envVars = { API_URL: 'https://api.example.com' };
      const result = validateEnv(schema, envVars);
      expect(result.success).toBe(true);
    });

    it('should test port validator with common ports combined with custom validator', () => {
      const schema = defineSchema({
        SERVER_PORT: {
          type: 'port' as const,
          required: true,
          common: ['80', '443', '3000', '8080'],
          validate: (value: number) => value > 1000
        }
      });

      // This should test lines 618-623
      expect(schema.schema.SERVER_PORT.validator).toBeDefined();
      
      // Test valid combination
      const envVars = { SERVER_PORT: '3000' };
      const result = validateEnv(schema, envVars);
      expect(result.success).toBe(true);
    });

    it('should test email validator with allowPlus combined with custom validator', () => {
      const schema = defineSchema({
        ADMIN_EMAIL: {
          type: 'email' as const,
          required: true,
          allowPlus: true,
          validate: (value: string) => value.includes('admin')
        }
      });

      // This should test lines 630-635
      expect(schema.schema.ADMIN_EMAIL.validator).toBeDefined();
      
      // Test valid combination
      const envVars = { ADMIN_EMAIL: 'admin@example.com' };
      const result = validateEnv(schema, envVars);
      expect(result.success).toBe(true);
    });

    it('should test IP validator with version combined with custom validator', () => {
      const schema = defineSchema({
        SERVER_IP: {
          type: 'ip' as const,
          required: true,
          version: 'ipv4' as const,
          validate: (value: string) => value.startsWith('192.168.')
        }
      });

      // This should test lines 644-647
      expect(schema.schema.SERVER_IP.validator).toBeDefined();
      
      // Test valid combination
      const envVars = { SERVER_IP: '192.168.1.1' };
      const result = validateEnv(schema, envVars);
      expect(result.success).toBe(true);
    });

    it('should test regex pattern validation coverage', () => {
      const schema = defineSchema({
        API_KEY: {
          type: 'regex' as const,
          required: true,
          pattern: /^[A-Z0-9]{32}$/
        }
      });

      // This should test lines 655-656 for regex validation coverage
      expect(schema.schema.API_KEY.validator).toBeDefined();
    });
  });

  describe('Edge Cases for Coverage', () => {
    it('should test empty environment handling (line 730)', () => {
      const schema = defineSchema({
        OPTIONAL_VAR: {
          type: 'string' as const,
          required: false,
          // No default provided
        }
      });

      const envVars = {}; // Completely empty environment
      const result = validateEnv(schema, envVars);
      
      // This should test line 730 - no value and no default, skip field
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.OPTIONAL_VAR).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should test multiple optional fields with no defaults', () => {
      const schema = defineSchema({
        VAR1: {
          type: 'string' as const,
          required: false
        },
        VAR2: {
          type: 'number' as const,
          required: false
        },
        VAR3: {
          type: 'boolean' as const,
          required: false
        }
      });

      const envVars = {}; // No environment variables
      const result = validateEnv(schema, envVars);
      
      // This should test the "skip field" logic multiple times
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Object.keys(result.data || {})).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should test schema with only optional fields and some defaults', () => {
      const schema = defineSchema({
        WITH_DEFAULT: {
          type: 'string' as const,
          required: false,
          default: 'default-value'
        },
        WITHOUT_DEFAULT: {
          type: 'string' as const,
          required: false
        }
      });

      const envVars = {}; // No environment variables
      const result = validateEnv(schema, envVars);
      
      // Should have one field with default, one skipped
      expect(result.success).toBe(true);
      expect(result.data?.WITH_DEFAULT).toBe('default-value');
      expect(result.data?.WITHOUT_DEFAULT).toBeUndefined();
    });

    it('should test combined enum and custom validator', () => {
      const schema = defineSchema({
        ENVIRONMENT: {
          type: 'string' as const,
          required: true,
          enum: ['development', 'production', 'test'],
          validate: (value: string) => value.length > 5
        }
      });

      // Enum validation should be added to custom validator
      const envVars = { ENVIRONMENT: 'production' }; // valid enum, valid length
      const result = validateEnv(schema, envVars);
      expect(result.success).toBe(true);
      
      // Test invalid enum
      const result2 = validateEnv(schema, { ENVIRONMENT: 'staging' });
      expect(result2.success).toBe(false);
      expect(result2.errors[0].message).toContain('Value must be one of: development, production, test');
      
      // Test invalid length (enum passes but custom validator fails)
      const result3 = validateEnv(schema, { ENVIRONMENT: 'dev' });
      expect(result3.success).toBe(false);
    });
  });

  describe('Advanced Validator Combinations', () => {
    it('should test URL with multiple options combined', () => {
      const schema = defineSchema({
        API_ENDPOINT: {
          type: 'url' as const,
          required: true,
          protocols: ['https:'],
          requireProtocol: true,
          validate: (value: string) => value.includes('/v1/')
        }
      });

      // Test valid combination
      const envVars = { API_ENDPOINT: 'https://api.example.com/v1/endpoint' };
      const result = validateEnv(schema, envVars);
      expect(result.success).toBe(true);
    });

    it('should test complex number validation with constraints', () => {
      const schema = defineSchema({
        TIMEOUT_MS: {
          type: 'number' as const,
          required: true,
          min: 1000,
          max: 60000,
          validate: (value: number) => value % 1000 === 0 // Must be multiple of 1000
        }
      });

      // Test valid
      const envVars = { TIMEOUT_MS: '5000' };
      const result = validateEnv(schema, envVars);
      expect(result.success).toBe(true);
      
      // Test invalid - not multiple of 1000
      const result2 = validateEnv(schema, { TIMEOUT_MS: '5500' });
      expect(result2.success).toBe(false);
    });
  });
});