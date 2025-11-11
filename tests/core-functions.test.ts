// Test suite for core functions: defineSchema and validateEnv
import { 
  defineSchema, 
  validateEnv, 
  ValidationError, 
  SchemaError, 
  ValidationResult,
  CompiledSchemaWithEnvironments
} from '../src/index';

describe('Core Functions', () => {
  describe('defineSchema', () => {
    it('should compile simple schema', () => {
      const schema = {
        PORT: {
          type: 'string' as const,
          required: true
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.PORT).toBeDefined();
      expect(result.schema.PORT.type).toBe('string');
      expect(result.schema.PORT.required).toBe(true);
    });

    it('should compile schema with defaults', () => {
      const schema = {
        NODE_ENV: {
          type: 'string' as const,
          required: false,
          default: 'development'
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.NODE_ENV.default).toBe('development');
    });

    it('should compile schema with enums', () => {
      const schema = {
        ENV_TYPE: {
          type: 'string' as const,
          required: true,
          enum: ['dev', 'prod', 'test']
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.ENV_TYPE.enum).toEqual(['dev', 'prod', 'test']);
    });

    it('should compile schema with custom validator', () => {
      const schema = {
        USERNAME: {
          type: 'string' as const,
          required: true,
          validate: (value: string) => value.length > 3
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.USERNAME.validator).toBeDefined();
    });

    it('should compile schema with transform', () => {
      const schema = {
        API_KEY: {
          type: 'string' as const,
          required: true,
          transform: (value: string) => value.toUpperCase()
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.API_KEY.transform).toBeDefined();
    });

    it('should handle numeric schemas with range validation', () => {
      const schema = {
        PORT: {
          type: 'number' as const,
          required: true,
          min: 1000,
          max: 65535
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.PORT.validator).toBeDefined();
    });

    it('should handle string schemas with length validation', () => {
      const schema = {
        USERNAME: {
          type: 'string' as const,
          required: true,
          minLength: 3,
          maxLength: 20
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.USERNAME.validator).toBeDefined();
    });

    it('should handle URL schemas with protocol options', () => {
      const schema = {
        API_URL: {
          type: 'url' as const,
          required: true,
          protocols: ['https:'],
          requireProtocol: true
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.API_URL.validator).toBeDefined();
    });

    it('should handle port schemas', () => {
      const schema = {
        SERVER_PORT: {
          type: 'port' as const,
          required: true
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.SERVER_PORT.type).toBe('port');
    });

    it('should handle port schemas with common validation', () => {
      const schema = {
        SERVER_PORT: {
          type: 'port' as const,
          required: true,
          common: ['80', '443'] as any
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.SERVER_PORT.validator).toBeDefined();
    });

    it('should handle email schemas', () => {
      const schema = {
        ADMIN_EMAIL: {
          type: 'email' as const,
          required: true
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.ADMIN_EMAIL.type).toBe('email');
    });

    it('should handle email schemas with allowPlus validation', () => {
      const schema = {
        ADMIN_EMAIL: {
          type: 'email' as const,
          required: true,
          allowPlus: true
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.ADMIN_EMAIL.validator).toBeDefined();
    });

    it('should handle IP schemas with version constraints', () => {
      const schema = {
        SERVER_IP: {
          type: 'ip' as const,
          required: true,
          version: 'ipv4' as const
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.SERVER_IP.type).toBe('ip');
    });

    it('should handle regex schemas', () => {
      const schema = {
        API_KEY: {
          type: 'regex' as const,
          required: true,
          pattern: /^[A-Z0-9]{32}$/
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.API_KEY.type).toBe('regex');
      expect(result.schema.API_KEY.validator).toBeDefined();
    });

    it('should handle boolean schemas', () => {
      const schema = {
        DEBUG_MODE: {
          type: 'boolean' as const,
          required: false,
          default: false
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.DEBUG_MODE.type).toBe('boolean');
      expect(result.schema.DEBUG_MODE.default).toBe(false);
    });

    it('should handle JSON schemas', () => {
      const schema = {
        CONFIG: {
          type: 'json' as const,
          required: false
        }
      };

      const result = defineSchema(schema);
      expect(result.schema.CONFIG.type).toBe('json');
    });

    it('should throw SchemaError for missing type', () => {
      const schema = {
        INVALID_FIELD: {
          required: true
        }
      };

      expect(() => defineSchema(schema as any)).toThrow(SchemaError);
      expect(() => defineSchema(schema as any)).toThrow('must specify a type');
    });

    it('should throw SchemaError for invalid definition', () => {
      const schema = {
        INVALID_FIELD: null
      };

      expect(() => defineSchema(schema as any)).toThrow(SchemaError);
    });

    it('should handle function defaults', () => {
      const schema = {
        TIMESTAMP: {
          type: 'number' as const,
          required: false,
          default: () => Date.now()
        }
      };

      const result = defineSchema(schema);
      expect(typeof result.schema.TIMESTAMP.default).toBe('function');
    });

    it('should preserve environment overrides', () => {
      const schema = {
        TEST_VAR: {
          type: 'string' as const,
          required: false
        },
        _environments: {
          production: {
            TEST_VAR: {
              required: true
            }
          }
        }
      };

      const result = defineSchema(schema as any);
      expect(result._environments).toBeDefined();
      expect(result._environments?.production?.TEST_VAR?.required).toBe(true);
    });

    it('should preserve environment overrides in specific test', () => {
      const schema = {
        SOME_VAR: {
          type: 'string' as const,
          required: false
        },
        _environments: {
          test: {
            SOME_VAR: {
              required: true
            }
          }
        }
      };

      const result = defineSchema(schema as any);
      expect(result._environments).toBeDefined();
      expect(result._environments?.test?.SOME_VAR?.required).toBe(true);
    });

    it('should not modify original schema', () => {
      const originalSchema = {
        TEST_VAR: {
          type: 'string' as const,
          required: true
        }
      };

      const schemaCopy = JSON.parse(JSON.stringify(originalSchema));
      const result = defineSchema(originalSchema);
      
      expect(originalSchema).toEqual(schemaCopy);
    });
  });

  describe('validateEnv', () => {
    let compiledSchema: CompiledSchemaWithEnvironments;

    beforeEach(() => {
      compiledSchema = defineSchema({
        PORT: {
          type: 'number' as const,
          required: true
        },
        NODE_ENV: {
          type: 'string' as const,
          required: false,
          default: 'development',
          enum: ['development', 'production', 'test']
        },
        DEBUG: {
          type: 'boolean' as const,
          required: false,
          default: false
        }
      });
    });

    it('should validate successful environment', () => {
      const envVars = {
        PORT: '3000',
        NODE_ENV: 'production',
        DEBUG: 'true'
      };

      const result = validateEnv(compiledSchema, envVars);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.PORT).toBe(3000);
      expect(result.data?.NODE_ENV).toBe('production');
      expect(result.data?.DEBUG).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply default values when env vars are missing', () => {
      const envVars = {
        PORT: '3000'
        // NODE_ENV and DEBUG are missing
      };

      const result = validateEnv(compiledSchema, envVars);
      
      expect(result.success).toBe(true);
      expect(result.data?.NODE_ENV).toBe('development');
      expect(result.data?.DEBUG).toBe(false);
    });

    it('should fail validation for missing required vars', () => {
      const envVars = {
        // PORT is required but missing
        NODE_ENV: 'production'
      };

      const result = validateEnv(compiledSchema, envVars);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('RequiredError');
      expect(result.errors[0].field).toBe('PORT');
    });

    it('should perform type coercion', () => {
      const envVars = {
        PORT: '8080',
        DEBUG: '1'
      };

      const result = validateEnv(compiledSchema, envVars);
      
      expect(result.success).toBe(true);
      expect(typeof result.data?.PORT).toBe('number');
      expect(result.data?.PORT).toBe(8080);
      expect(typeof result.data?.DEBUG).toBe('boolean');
      expect(result.data?.DEBUG).toBe(true);
    });

    it('should validate enum constraints', () => {
      const schemaWithEnum = defineSchema({
        ENV_TYPE: {
          type: 'string' as const,
          required: true,
          enum: ['dev', 'prod', 'test']
        }
      });

      const envVars = {
        ENV_TYPE: 'staging' // Not in enum
      };

      const result = validateEnv(schemaWithEnum, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('FormatError');
    });

    it('should apply transforms', () => {
      const schemaWithTransform = defineSchema({
        API_KEY: {
          type: 'string' as const,
          required: true,
          transform: (value: string) => value.toUpperCase()
        }
      });

      const envVars = {
        API_KEY: 'test-key'
      };

      const result = validateEnv(schemaWithTransform, envVars);
      
      expect(result.success).toBe(true);
      expect(result.data?.API_KEY).toBe('TEST-KEY');
    });

    it('should apply custom validators', () => {
      const schemaWithValidator = defineSchema({
        USERNAME: {
          type: 'string' as const,
          required: true,
          validate: (value: string) => value.length > 3
        }
      });

      const envVars = {
        USERNAME: 'ab' // Too short
      };

      const result = validateEnv(schemaWithValidator, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('FormatError');
    });

    it('should handle transform errors', () => {
      const schemaWithBadTransform = defineSchema({
        EMAIL: {
          type: 'string' as const,
          required: true,
          transform: () => {
            throw new Error('Transform failed');
          }
        }
      });

      const envVars = {
        EMAIL: 'test@example.com'
      };

      const result = validateEnv(schemaWithBadTransform, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('TransformError');
    });

    it('should respect environment overrides', () => {
      const schemaWithEnv = defineSchema({
        DATABASE_URL: {
          type: 'url' as const,
          required: false
        },
        _environments: {
          production: {
            DATABASE_URL: {
              required: true
            }
          }
        }
      } as any);

      const envVars = {
        NODE_ENV: 'development'
        // DATABASE_URL missing
      };

      const result = validateEnv(schemaWithEnv, envVars, 'production');
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('RequiredError');
    });

    it('should handle type coercion errors', () => {
      const envVars = {
        PORT: 'invalid-number'
      };

      const result = validateEnv(compiledSchema, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('FormatError');
    });

    it('should handle generic errors during validation', () => {
      // Create a schema that will cause a generic error (not ValidationError)
      const schemaWithBadValidator = defineSchema({
        TEST_FIELD: {
          type: 'string' as const,
          required: true,
          validate: () => {
            throw new Error('Custom validation error');
          }
        }
      });

      const envVars = {
        TEST_FIELD: 'test'
      };

      const result = validateEnv(schemaWithBadValidator, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('TypeError');
      expect(result.errors[0].message).toBe('Custom validation error');
    });

    it('should validate URL format', () => {
      const schemaWithUrl = defineSchema({
        API_URL: {
          type: 'url' as const,
          required: true
        }
      });

      const envVars = {
        API_URL: 'not-a-url'
      };

      const result = validateEnv(schemaWithUrl, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('FormatError');
    });

    it('should validate port range', () => {
      const schemaWithPort = defineSchema({
        SERVER_PORT: {
          type: 'port' as const,
          required: true
        }
      });

      const envVars = {
        SERVER_PORT: '70000' // Out of range
      };

      const result = validateEnv(schemaWithPort, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('FormatError');
    });

    it('should validate email format', () => {
      const schemaWithEmail = defineSchema({
        ADMIN_EMAIL: {
          type: 'email' as const,
          required: true
        }
      });

      const envVars = {
        ADMIN_EMAIL: 'invalid-email'
      };

      const result = validateEnv(schemaWithEmail, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('FormatError');
    });

    it('should validate IP format', () => {
      const schemaWithIp = defineSchema({
        SERVER_IP: {
          type: 'ip' as const,
          required: true
        }
      });

      const envVars = {
        SERVER_IP: '999.999.999.999'
      };

      const result = validateEnv(schemaWithIp, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('FormatError');
    });

    it('should validate JSON format', () => {
      const schemaWithJson = defineSchema({
        CONFIG: {
          type: 'json' as const,
          required: true
        }
      });

      const envVars = {
        CONFIG: '{ invalid json }'
      };

      const result = validateEnv(schemaWithJson, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('FormatError');
    });

    it('should validate regex patterns', () => {
      const schemaWithRegex = defineSchema({
        API_KEY: {
          type: 'regex' as const,
          required: true,
          pattern: /^[A-Z]{10}$/
        }
      });

      const envVars = {
        API_KEY: 'wronglength'
      };

      const result = validateEnv(schemaWithRegex, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('TypeError');
    });

    it('should handle empty environment gracefully', () => {
      const envVars = {};

      const result = validateEnv(compiledSchema, envVars);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.field === 'PORT')).toBe(true);
    });

    it('should validate successfully when all constraints are met', () => {
      const envVars = {
        PORT: '3000',
        NODE_ENV: 'production',
        DEBUG: 'false'
      };

      const result = validateEnv(compiledSchema, envVars);
      
      expect(result.success).toBe(true);
      expect(result.hasErrors).toBe(false);
      expect(result.data).toEqual({
        PORT: 3000,
        NODE_ENV: 'production',
        DEBUG: false
      });
    });
  });

  describe('ValidationError Class', () => {
    it('should create ValidationError with all properties', () => {
      const error = new ValidationError(
        'testField',
        'Test error message',
        'testValue',
        'expectedValue',
        'receivedValue',
        'ENV_VAR',
        'TypeError'
      );

      expect(error.field).toBe('testField');
      expect(error.message).toBe('Test error message');
      expect(error.value).toBe('testValue');
      expect(error.expected).toBe('expectedValue');
      expect(error.received).toBe('receivedValue');
      expect(error.envVarName).toBe('ENV_VAR');
      expect(error.type).toBe('TypeError');
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with default values', () => {
      const error = new ValidationError('field', 'message', 'value');

      expect(error.field).toBe('field');
      expect(error.message).toBe('message');
      expect(error.value).toBe('value');
      expect(error.type).toBe('FormatError'); // default
    });

    it('should provide toString method', () => {
      const error = new ValidationError('testField', 'Test error', 'value');
      const stringResult = error.toString();

      expect(stringResult).toContain('ValidationError in field "testField": Test error');
    });

    it('should provide toJSON method', () => {
      const error = new ValidationError('field', 'message', 'value', 'expected', 'received', 'env', 'TypeError');
      const jsonResult = error.toJSON();

      expect(jsonResult).toEqual({
        name: 'ValidationError',
        message: 'message',
        field: 'field',
        value: 'value',
        expected: 'expected',
        received: 'received',
        envVarName: 'env',
        type: 'TypeError'
      });
    });
  });

  describe('SchemaError Class', () => {
    it('should create SchemaError with all properties', () => {
      const error = new SchemaError('Test schema error', 'schema.path', { detail: 'test' });

      expect(error.message).toBe('Test schema error');
      expect(error.schemaPath).toBe('schema.path');
      expect(error.validationDetails).toEqual({ detail: 'test' });
      expect(error.name).toBe('SchemaError');
    });

    it('should provide toString method', () => {
      const error = new SchemaError('Schema error message', 'field.path');
      const stringResult = error.toString();

      expect(stringResult).toContain('SchemaError at "field.path": Schema error message');
    });

    it('should provide toJSON method', () => {
      const error = new SchemaError('message', 'path', { detail: 'test' });
      const jsonResult = error.toJSON();

      expect(jsonResult).toEqual({
        name: 'SchemaError',
        message: 'message',
        schemaPath: 'path',
        validationDetails: { detail: 'test' }
      });
    });
  });
});