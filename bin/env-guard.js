#!/usr/bin/env node

// CLI entry point for env-guard
// Phase 3: CLI Tool Development

const fs = require('fs');
const path = require('path');

// Import core library functions
const {
  version,
  defineSchema,
  validateEnv
} = require('../lib/index');

// =============================================================================
// CLI FRAMEWORK
// =============================================================================

/**
 * CLI argument parser - zero dependency
 */
class CLIArgumentParser {
  constructor(args) {
    this.args = args;
    this.parsed = {
      command: null,
      options: {},
      positional: []
    };
    this.parse();
  }

  parse() {
    if (this.args.length < 3) {
      return;
    }

    // First check for global flags
    this.parseGlobalFlags();

    // Then identify command
    let i = 2;
    
    // Skip global flags to find command
    while (i < this.args.length && this.args[i].startsWith('-')) {
      i++;
    }
    
    if (i < this.args.length) {
      this.parsed.command = this.args[i++];
    }

    // Parse remaining arguments
    while (i < this.args.length) {
      const arg = this.args[i];
      
      if (arg.startsWith('--')) {
        // Long option
        const [key, value] = arg.substring(2).split('=');
        if (value !== undefined) {
          this.parsed.options[key] = value;
        } else {
          // Check if next arg is value
          if (i + 1 < this.args.length && !this.args[i + 1].startsWith('--')) {
            this.parsed.options[key] = this.args[i + 1];
            i++;
          } else {
            this.parsed.options[key] = true;
          }
        }
      } else if (arg.startsWith('-')) {
        // Short option (single character)
        const key = arg.substring(1);
        if (i + 1 < this.args.length && !this.args[i + 1].startsWith('-')) {
          this.parsed.options[key] = this.args[i + 1];
          i++;
        } else {
          this.parsed.options[key] = true;
        }
      } else {
        // Positional argument
        this.parsed.positional.push(arg);
      }
      
      i++;
    }
  }

  parseGlobalFlags() {
    // Parse only initial flags
    let i = 2;
    while (i < this.args.length && this.args[i].startsWith('-')) {
      const arg = this.args[i];
      
      if (arg === '--help' || arg === '-h') {
        this.parsed.options.help = true;
      } else if (arg === '--version' || arg === '-v') {
        this.parsed.options.version = true;
      } else {
        // Regular option, add to parsed
        const [key, value] = arg.startsWith('--') ? [arg.substring(2), undefined] : [arg.substring(1), undefined];
        if (value !== undefined) {
          this.parsed.options[key] = value;
        } else if (i + 1 < this.args.length && !this.args[i + 1].startsWith('-')) {
          this.parsed.options[key] = this.args[i + 1];
          i++;
        } else {
          this.parsed.options[key] = true;
        }
      }
      i++;
    }
  }

  getOption(key) {
    return this.parsed.options[key];
  }

  hasOption(key) {
    return Object.prototype.hasOwnProperty.call(this.parsed.options, key);
  }

  getPositional(index = 0) {
    return this.parsed.positional[index];
  }

  getAllOptions() {
    return this.parsed.options;
  }
}

/**
 * CLI output formatter
 */
class CLIOutput {
  static text(data) {
    if (data.success) {
      console.log('✅ Validation successful');
      if (data.data) {
        console.log('\nValidated environment variables:');
        Object.entries(data.data).forEach(([key, value]) => {
          console.log(`  ${key}: ${value} (${typeof value})`);
        });
      }
    } else {
      console.log('❌ Validation failed');
      if (data.errors && data.errors.length > 0) {
        console.log('\nErrors found:');
        data.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.field}: ${error.message}`);
          console.log(`     Type: ${error.type}, Value: ${error.value}`);
        });
      }
    }
  }

  static json(data) {
    console.log(JSON.stringify(data, null, 2));
  }

  static error(message, code = 1) {
    console.log(`❌ Error: ${message}`);
    process.exit(code);
  }

  static success(message) {
    console.log(`✅ ${message}`);
  }

  static info(message) {
    console.log(`ℹ️  ${message}`);
  }
}

/**
 * CLI help system
 */
class CLIHelp {
  static showGlobalHelp() {
    console.log(`
env-guard v${version} - Schema-based validator for environment variables

Usage: env-guard <command> [options]

Commands:
  validate    Validate environment variables against a schema
  generate    Generate .env.example file from a schema
  check       Validate schema definition syntax

Global Options:
  --help, -h          Show help for a command
  --version, -v       Show version information

Examples:
  env-guard validate --schema schema.js
  env-guard generate --schema schema.js --output .env.example
  env-guard check --schema schema.js

For more information on a specific command, use:
  env-guard <command> --help
`);
  }

  static showCommandHelp(command) {
    const helpText = {
      validate: `
Usage: env-guard validate [options]

Validate environment variables against a schema definition.

Options:
  --schema <file>     Schema file to use (required)
  --env-file <file>   .env file to validate (default: process.env)
  --env <name>        Environment context (development, production, etc.)
  --format <format>   Output format: text or json (default: text)
  --strict            Exit with error code on validation failure
  --help, -h          Show this help

Examples:
  env-guard validate --schema schema.js
  env-guard validate --schema schema.js --env-file .env.local
  env-guard validate --schema schema.js --env production --format json
`,
      generate: `
Usage: env-guard generate [options]

Generate .env.example file from a schema definition.

Options:
  --schema <file>           Schema file to use (required)
  --output <file>           Output file path (default: .env.example)
  --env <name>              Environment context
  --include-comments        Include field descriptions as comments
  --help, -h                Show this help

Examples:
  env-guard generate --schema schema.js
  env-guard generate --schema schema.js --output my-env.example
  env-guard generate --schema schema.js --include-comments
`,
      check: `
Usage: env-guard check [options]

Validate schema definition syntax and structure.

Options:
  --schema <file>     Schema file to check (required)
  --detailed          Show detailed validation information
  --format <format>   Output format: text or json (default: text)
  --help, -h          Show this help

Examples:
  env-guard check --schema schema.js
  env-guard check --schema schema.js --detailed --format json
`
    };

    console.log(helpText[command] || 'Unknown command');
  }
}

// =============================================================================
// FILE UTILITIES
// =============================================================================

/**
 * Read and parse schema file
 */
class SchemaFileLoader {
  static load(filePath) {
    const fullPath = path.resolve(filePath);
    
    // Security check: ensure the resolved path is within the current working directory
    const cwd = process.cwd();
    if (!fullPath.startsWith(cwd + path.sep) && fullPath !== cwd) {
      throw new Error(`Schema file path must be within the current working directory: ${filePath}`);
    }
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Schema file not found: ${filePath}`);
    }

    const ext = path.extname(fullPath).toLowerCase();
    
    try {
      if (ext === '.js' || ext === '.ts' || ext === '.json') {
        return SchemaFileLoader.loadJSFile(fullPath);
      } else {
        throw new Error(`Unsupported schema file format: ${ext}. Supported: .js, .ts, .json`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load schema file: ${error.message}`);
      }
      throw error;
    }
  }

  static loadJSFile(filePath) {
    delete require.cache[require.resolve(filePath)];
    const schemaModule = require(filePath);
    
    // Handle different export patterns
    if (schemaModule.default) {
      return schemaModule.default;
    } else if (schemaModule.schema) {
      return schemaModule.schema;
    } else if (typeof schemaModule === 'object' && !Array.isArray(schemaModule)) {
      return schemaModule;
    } else {
      throw new Error('Schema file must export an object');
    }
  }
}

/**
 * Read .env file
 */
class EnvFileLoader {
  static load(filePath) {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Environment file not found: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const envVars = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  }
}

// =============================================================================
// COMMAND HANDLERS
// =============================================================================

/**
 * Validate command handler
 */
class ValidateCommand {
  static async execute(options) {
    if (!options.schema) {
      CLIOutput.error('--schema option is required', 2);
      return;
    }

    try {
      // Load schema
      if (options.format !== 'json') {
        CLIOutput.info('Loading schema...');
      }
      const schema = SchemaFileLoader.load(options.schema);

      // Compile schema
      const compiledSchemaResult = defineSchema(schema);

      // Load environment variables
      let envVars;
      if (options['env-file']) {
        if (options.format !== 'json') {
          CLIOutput.info(`Loading environment file: ${options['env-file']}`);
        }
        envVars = EnvFileLoader.load(options['env-file']);
      } else {
        if (options.format !== 'json') {
          CLIOutput.info('Using process environment variables');
        }
        envVars = process.env;
      }

      // Validate environment variables
      if (options.format !== 'json') {
        CLIOutput.info('Validating environment variables...');
      }
      const result = validateEnv(compiledSchemaResult, envVars, options.env);

      // Output results
      const format = options.format || 'text';
      if (format === 'json') {
        // Clear any info messages before outputting JSON
        process.stdout.write(JSON.stringify(result, null, 2));
      } else {
        CLIOutput.text(result);
      }

      // Exit codes
      if (!result.success && options.strict) {
        process.exit(1);
      } else if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }

    } catch (error) {
      CLIOutput.error(error.message, 1);
    }
  }
}

/**
 * Generate command handler
 */
class GenerateCommand {
  static async execute(options) {
    if (!options.schema) {
      CLIOutput.error('--schema option is required', 2);
      return;
    }

    try {
      // Load schema
      CLIOutput.info('Loading schema...');
      const schema = SchemaFileLoader.load(options.schema);

      // Compile schema
      const compiledSchemaResult = defineSchema(schema);

      // Generate .env.example content
      CLIOutput.info('Generating .env.example content...');
      const exampleContent = GenerateCommand.generateExampleContent(compiledSchemaResult, {
        includeComments: options['include-comments']
      });

      // Write to file
      const outputPath = options.output || '.env.example';
      fs.writeFileSync(outputPath, exampleContent, 'utf8');
      
      CLIOutput.success(`Generated ${outputPath} successfully`);

    } catch (error) {
      CLIOutput.error(error.message, 1);
    }
  }

  static generateExampleContent(compiledSchema, options = {}) {
    const { includeComments = false } = options;
    let content = '# Environment Variables Example\n';
    content += '# Generated by env-guard\n\n';

    // Handle both old and new schema structures
    const schemaToIterate = compiledSchema.schema || compiledSchema;

    Object.entries(schemaToIterate).forEach(([fieldName, fieldSchema]) => {
      if (fieldName.startsWith('_')) {
        return; // Skip special properties
      }

      // Add comment if available and requested
      if (includeComments && fieldSchema.description) {
        content += `# ${fieldSchema.description}\n`;
      }

      // Determine example value
      let exampleValue;
      if (fieldSchema.default !== undefined) {
        if (typeof fieldSchema.default === 'function') {
          exampleValue = fieldSchema.default();
        } else {
          exampleValue = fieldSchema.default;
        }
      } else {
        // Generate example based on type
        exampleValue = GenerateCommand.generateExampleValue(fieldSchema);
      }

      content += `${fieldName}=${exampleValue}\n\n`;
    });

    return content;
  }

  static generateExampleValue(fieldSchema) {
    switch (fieldSchema.type) {
      case 'string':
        return 'example';
      case 'number':
        return 3000;
      case 'boolean':
        return 'false';
      case 'url':
        return 'https://example.com';
      case 'port':
        return 3000;
      case 'email':
        return 'user@example.com';
      case 'ip':
        return '127.0.0.1';
      case 'json':
        return '{"key": "value"}';
      case 'regex':
        return 'example';
      default:
        return 'example';
    }
  }
}

/**
 * Check command handler
 */
class CheckCommand {
  static async execute(options) {
    if (!options.schema) {
      CLIOutput.error('--schema option is required', 2);
      return;
    }

    try {
      // Load schema
      CLIOutput.info('Loading schema...');
      const schema = SchemaFileLoader.load(options.schema);

      // Try to compile schema
      if (options.format !== 'json') {
        CLIOutput.info('Validating schema structure...');
      }
      const compiledSchemaResult = defineSchema(schema);
      const compiledSchema = compiledSchemaResult.schema;

      // Prepare result
      const result = {
        success: true,
        message: 'Schema is valid',
        details: {
          fieldCount: Object.keys(compiledSchema).filter(k => !k.startsWith('_')).length,
          environments: compiledSchema._environments ? Object.keys(compiledSchema._environments) : []
        }
      };

      if (options.detailed) {
        result.details.fields = Object.keys(compiledSchema)
          .filter(k => !k.startsWith('_'))
          .map(fieldName => ({
            name: fieldName,
            type: compiledSchema[fieldName].type,
            required: compiledSchema[fieldName].required,
            hasDefault: compiledSchema[fieldName].default !== undefined
          }));
      }

      // Output results
      const format = options.format || 'text';
      if (format === 'json') {
        CLIOutput.json(result);
      } else {
        CLIOutput.success(result.message);
        if (options.detailed) {
          console.log(`\nSchema Details:`);
          console.log(`  Fields: ${result.details.fieldCount}`);
          console.log(`  Environments: ${result.details.environments.length || 0}`);
        }
      }

    } catch (error) {
      const result = {
        success: false,
        error: 'Schema validation failed',
        type: error.constructor.name
      };

      const format = options.format || 'text';
      if (format === 'json') {
        CLIOutput.json(result);
      } else {
        CLIOutput.error('Schema validation failed', 1);
      }
    }
  }
}

// =============================================================================
// MAIN CLI ENTRY POINT
// =============================================================================

/**
 * Main CLI router
 */
function main() {
  const parser = new CLIArgumentParser(process.argv);
  const command = parser.parsed.command;
  const options = parser.getAllOptions();

  // Handle global flags first
  if (options.help || options.h) {
    if (command) {
      CLIHelp.showCommandHelp(command);
    } else {
      CLIHelp.showGlobalHelp();
    }
    return;
  }

  if (options.version || options.v) {
    console.log(version);
    return;
  }

  // If no command provided, show help
  if (!command) {
    CLIHelp.showGlobalHelp();
    process.exit(1);
  }

  // Route to appropriate command
  try {
    switch (command) {
      case 'validate':
        ValidateCommand.execute(options);
        break;
      case 'generate':
        GenerateCommand.execute(options);
        break;
      case 'check':
        CheckCommand.execute(options);
        break;
      default:
        CLIOutput.error(`Unknown command: ${command}`, 1);
    }
  } catch (error) {
    CLIOutput.error(error.message, 1);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = {
  CLIArgumentParser,
  CLIOutput,
  CLIHelp,
  SchemaFileLoader,
  EnvFileLoader,
  ValidateCommand,
  GenerateCommand,
  CheckCommand
};
