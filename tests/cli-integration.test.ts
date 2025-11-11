// Test suite for CLI integration
import { execSync } from 'child_process';
import { existsSync, unlinkSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('CLI Integration Tests', () => {
  const cliPath = join(__dirname, '../bin/env-guard.js');
  const tempDir = join(__dirname, '../temp-test');

  beforeAll(() => {
    // Create temp directory for test files
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up temp directory
    const fs = require('fs');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // Clear process environment variables that might interfere
    const varsToClear = ['PORT', 'NODE_ENV', 'DEBUG', 'DATABASE_URL', 'API_KEY'];
    varsToClear.forEach(varName => {
      delete process.env[varName];
    });
  });

  describe('Help Commands', () => {
    it('should show global help', () => {
      expect(() => {
        execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });
      }).not.toThrow();
    });

    it('should show command-specific help', () => {
      const validateHelp = execSync(`node ${cliPath} validate --help`, { encoding: 'utf-8' });
      expect(validateHelp).toContain('validate');
      
      const generateHelp = execSync(`node ${cliPath} generate --help`, { encoding: 'utf-8' });
      expect(generateHelp).toContain('generate');
      
      const checkHelp = execSync(`node ${cliPath} check --help`, { encoding: 'utf-8' });
      expect(checkHelp).toContain('check');
    });
  });

  describe('Validate Command', () => {
    const testSchema = {
      PORT: {
        type: 'port',
        required: true,
        default: 3000,
        description: 'Server port'
      },
      NODE_ENV: {
        type: 'string',
        required: false,
        default: 'development',
        enum: ['development', 'production', 'test'],
        description: 'Environment'
      },
      DEBUG: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Debug mode'
      }
    };

    const testEnvFile = join(tempDir, '.env.test');
    const testSchemaFile = join(tempDir, 'test-schema.js');

    beforeEach(() => {
      // Create test files
      writeFileSync(testSchemaFile, `module.exports = ${JSON.stringify(testSchema, null, 2)};`);
      writeFileSync(testEnvFile, 'PORT=8080\nNODE_ENV=production\nDEBUG=true\n');
    });

    afterEach(() => {
      // Clean up test files
      [testEnvFile, testSchemaFile].forEach(file => {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      });
    });

    it('should validate with schema and env file', () => {
      const output = execSync(
        `node ${cliPath} validate --schema ${testSchemaFile} --env-file ${testEnvFile}`,
        { encoding: 'utf-8' }
      );
      
      expect(output).toContain('Validation successful');
      expect(output).toContain('PORT: 8080');
      expect(output).toContain('NODE_ENV: production');
    });

    it('should output JSON format', () => {
      const output = execSync(
        `node ${cliPath} validate --schema ${testSchemaFile} --env-file ${testEnvFile} --format json`,
        { encoding: 'utf-8' }
      );
      
      const result = JSON.parse(output);
      expect(result.success).toBe(true);
      expect(result.data.PORT).toBe(8080); // PORT is coerced to number
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required vars', () => {
      const emptyEnvFile = join(tempDir, '.env.empty');
      writeFileSync(emptyEnvFile, '');
      
      try {
        execSync(
          `node ${cliPath} validate --schema ${testSchemaFile} --env-file ${emptyEnvFile}`,
          { encoding: 'utf-8' }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('Validation failed');
        expect(error.stdout).toContain('Required');
      } finally {
        unlinkSync(emptyEnvFile);
      }
    });

    it('should handle environment context', () => {
      const schemaWithEnv = {
        ...testSchema,
        DATABASE_URL: {
          type: 'url',
          required: false,
          description: 'Database URL'
        },
        _environments: {
          production: {
            DATABASE_URL: {
              required: true
            }
          }
        }
      };

      const prodSchemaFile = join(tempDir, 'prod-schema.js');
      writeFileSync(prodSchemaFile, `module.exports = ${JSON.stringify(schemaWithEnv, null, 2)};`);
      
      try {
        execSync(
          `node ${cliPath} validate --schema ${prodSchemaFile} --env-file ${testEnvFile} --env production`,
          { encoding: 'utf-8' }
        );
        fail('Should have thrown an error for missing DATABASE_URL in production');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('Required');
      } finally {
        unlinkSync(prodSchemaFile);
      }
    });
  });

  describe('Generate Command', () => {
    const testSchema = {
      PORT: {
        type: 'port',
        required: true,
        default: 3000,
        description: 'Server port number'
      },
      DATABASE_URL: {
        type: 'url',
        required: false,
        default: 'postgresql://localhost:5432/db',
        description: 'Database connection URL'
      }
    };

    const testSchemaFile = join(tempDir, 'generate-schema.js');
    const outputFile = join(tempDir, '.env.example');

    beforeEach(() => {
      writeFileSync(testSchemaFile, `module.exports = ${JSON.stringify(testSchema, null, 2)};`);
    });

    afterEach(() => {
      [testSchemaFile, outputFile].forEach(file => {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      });
    });

    it('should generate .env.example file', () => {
      execSync(
        `node ${cliPath} generate --schema ${testSchemaFile} --output ${outputFile}`,
        { encoding: 'utf-8' }
      );
      
      expect(existsSync(outputFile)).toBe(true);
      const content = require('fs').readFileSync(outputFile, 'utf-8');
      expect(content).toContain('PORT=');
      expect(content).toContain('DATABASE_URL=');
    });

    it('should include comments when requested', () => {
      execSync(
        `node ${cliPath} generate --schema ${testSchemaFile} --output ${outputFile} --include-comments`,
        { encoding: 'utf-8' }
      );
      
      const content = require('fs').readFileSync(outputFile, 'utf-8');
      expect(content).toContain('# Server port number');
      expect(content).toContain('# Database connection URL');
    });
  });

  describe('Check Command', () => {
    const validSchema = {
      PORT: {
        type: 'port',
        required: true,
        description: 'Server port'
      }
    };

    const invalidSchema = {
      PORT: {
        required: true,
        // Missing type
        description: 'Server port'
      }
    };

    const validSchemaFile = join(tempDir, 'valid-schema.js');
    const invalidSchemaFile = join(tempDir, 'invalid-schema.js');

    beforeEach(() => {
      writeFileSync(validSchemaFile, `module.exports = ${JSON.stringify(validSchema, null, 2)};`);
      writeFileSync(invalidSchemaFile, `module.exports = ${JSON.stringify(invalidSchema, null, 2)};`);
    });

    afterEach(() => {
      [validSchemaFile, invalidSchemaFile].forEach(file => {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      });
    });

    it('should validate valid schema', () => {
      const output = execSync(
        `node ${cliPath} check --schema ${validSchemaFile}`,
        { encoding: 'utf-8' }
      );
      
      expect(output).toContain('Schema is valid');
    });

    it('should detect invalid schema', () => {
      try {
        execSync(
          `node ${cliPath} check --schema ${invalidSchemaFile}`,
          { encoding: 'utf-8' }
        );
        fail('Should have thrown an error for invalid schema');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('Schema validation failed');
      }
    });

    it('should provide detailed schema information', () => {
      const output = execSync(
        `node ${cliPath} check --schema ${validSchemaFile} --detailed`,
        { encoding: 'utf-8' }
      );
      
      expect(output).toContain('Schema Details');
      expect(output).toContain('Fields:');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing schema file', () => {
      try {
        execSync(
          `node ${cliPath} validate --schema non-existent-file.js`,
          { encoding: 'utf-8' }
        );
        fail('Should have thrown an error for missing schema file');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('Schema file not found:');
      }
    });

    it('should handle invalid JSON in schema', () => {
      const invalidJsonFile = join(tempDir, 'invalid.json');
      writeFileSync(invalidJsonFile, '{ invalid json ');
      
      try {
        execSync(
          `node ${cliPath} validate --schema ${invalidJsonFile}`,
          { encoding: 'utf-8' }
        );
        fail('Should have thrown an error for invalid JSON');
      } catch (error: any) {
        expect(error.status).toBe(1);
      } finally {
        unlinkSync(invalidJsonFile);
      }
    });

    it('should handle non-existent command', () => {
      try {
        execSync(
          `node ${cliPath} non-existent-command`,
          { encoding: 'utf-8' }
        );
        fail('Should have thrown an error for non-existent command');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('Unknown command');
      }
    });
  });
});