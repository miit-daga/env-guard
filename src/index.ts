// Main entry point for env-guard library
import { readFileSync } from 'fs';
import { join } from 'path';

const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
export const version = packageJson.version;

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Environment types supported by env-guard
 */
export type EnvType = 'string' | 'number' | 'boolean' | 'url' | 'port' | 'email' | 'ip' | 'json' | 'regex';

/**
 * Base schema definition interface
 */
export interface BaseSchemaDefinition<T = any> {
  type: EnvType;
  required?: boolean;
  default?: T | (() => T);
  enum?: T[];
  validate?: (_value: T) => boolean | string;
  transform?: (_value: any) => T;
  description?: string;
}

/**
 * Specific schema definitions for each      // Type coercion for basic types
      if (['string', 'number', 'boolean'].includes(effectiveSchema.type)) {
        const coercedValue = coerceValue(value as string, effectiveSchema.type as 'string' | 'number' | 'boolean');
        value = coercedValue;
      }

      // Special coercion for port type
      if (effectiveSchema.type === 'port' && typeof value === 'string') {
        const coercedValue = coerceValue(value, 'number');
        value = coercedValue;
      }
 */
export interface StringSchemaDefinition extends BaseSchemaDefinition<string> {
  type: 'string';
  minLength?: number;
  maxLength?: number;
}

export interface NumberSchemaDefinition extends BaseSchemaDefinition<number> {
  type: 'number';
  min?: number;
  max?: number;
}

export interface BooleanSchemaDefinition extends BaseSchemaDefinition<boolean> {
  type: 'boolean';
}

export interface UrlSchemaDefinition extends BaseSchemaDefinition<string> {
  type: 'url';
  protocols?: string[];
  requireProtocol?: boolean;
}

export interface PortSchemaDefinition extends BaseSchemaDefinition<number> {
  type: 'port';
  common?: string[];
}

export interface EmailSchemaDefinition extends BaseSchemaDefinition<string> {
  type: 'email';
  allowPlus?: boolean;
}

export interface IpSchemaDefinition extends BaseSchemaDefinition<string> {
  type: 'ip';
  version?: 'ipv4' | 'ipv6' | 'any';
}

export interface JsonSchemaDefinition extends BaseSchemaDefinition<any> {
  type: 'json';
  schema?: any;
}

export interface RegexSchemaDefinition extends BaseSchemaDefinition<string> {
  type: 'regex';
  pattern: RegExp;
  flags?: string;
}

export type SchemaDefinition = 
  | StringSchemaDefinition 
  | NumberSchemaDefinition 
  | BooleanSchemaDefinition 
  | UrlSchemaDefinition 
  | PortSchemaDefinition 
  | EmailSchemaDefinition 
  | IpSchemaDefinition 
  | JsonSchemaDefinition 
  | RegexSchemaDefinition;

/**
 * Environment-specific schema overrides
 */
export interface EnvironmentOverrides {
  [environment: string]: {
    [fieldName: string]: Partial<SchemaDefinition>;
  };
}

/**
 * Schema with environment overrides
 */
export type SchemaWithEnvironments = {
  [fieldName: string]: SchemaDefinition;
} & {
  _environments?: EnvironmentOverrides;
};

/**
 * Validation error interface for result objects
 */
export interface ValidationErrorResult {
  field: string;
  message: string;
  value: any;
  expected?: string;
  received?: string;
  envVarName: string;
  type: 'TypeError' | 'FormatError' | 'RequiredError' | 'TransformError';
}

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors: ValidationErrorResult[];
  hasErrors: boolean;
}

export interface ValidatedEnv {
  [key: string]: any;
}

/**
 * Validator option interfaces
 */
export interface StringValidatorOptions {
  minLength?: number;
  maxLength?: number;
}

export interface NumberValidatorOptions {
  min?: number;
  max?: number;
}

export interface UrlValidatorOptions {
  protocols?: string[];
  requireProtocol?: boolean;
}

export interface IpValidatorOptions {
  version?: 'ipv4' | 'ipv6' | 'any';
}

/**
 * Schema compilation result
 */
export interface CompiledSchema {
  [fieldName: string]: CompiledFieldSchema;
}

export interface CompiledFieldSchema {
  type: EnvType;
  required: boolean;
  default: any;
  validator?: (_value: any) => boolean | string;
  transform?: (_value: any) => any;
  enum?: any[];
  description?: string;
}

/**
 * Complete compiled schema with environment overrides
 */
export interface CompiledSchemaWithEnvironments {
  schema: CompiledSchema;
  _environments?: EnvironmentOverrides;
}

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  public field: string;
  public value: any;
  public expected?: string;
  public received?: string;
  public envVarName: string;
  public type: 'TypeError' | 'FormatError' | 'RequiredError' | 'TransformError';

  constructor(
    field: string,
    message: string,
    value: any,
    expected?: string,
    received?: string,
    envVarName?: string,
    type: 'TypeError' | 'FormatError' | 'RequiredError' | 'TransformError' = 'FormatError'
  ) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.expected = expected;
    this.received = received;
    this.envVarName = envVarName || field;
    this.type = type;
  }

  toString(): string {
    return `${this.name} in field "${this.field}": ${this.message}`;
  }

  toJSON(): any {
    return {
      name: this.name,
      message: this.message,
      field: this.field,
      value: this.value,
      expected: this.expected,
      received: this.received,
      envVarName: this.envVarName,
      type: this.type
    };
  }
}

/**
 * Custom error class for schema definition errors
 */
export class SchemaError extends Error {
  public schemaPath: string;
  public validationDetails?: any;

  constructor(message: string, schemaPath: string, validationDetails?: any) {
    super(message);
    this.name = 'SchemaError';
    this.schemaPath = schemaPath;
    this.validationDetails = validationDetails;
  }

  toString(): string {
    return `${this.name} at "${this.schemaPath}": ${this.message}`;
  }

  toJSON(): any {
    return {
      name: this.name,
      message: this.message,
      schemaPath: this.schemaPath,
      validationDetails: this.validationDetails
    };
  }
}

// =============================================================================
// TYPE COERCION SYSTEM
// =============================================================================

/**
 * Type coercion function for basic types
 */
export function coerceValue(value: any, type: 'string' | 'number' | 'boolean' | 'port'): any {
  if (value === undefined || value === null) {
    return value;
  }

  // Security check: prevent calling toString() on objects
  if (typeof value === 'object' && value !== null) {
    throw new ValidationError('value', 'Cannot coerce object to primitive type', value, 'string, number, or boolean', 'object', 'TypeError');
  }

  switch (type) {
    case 'string':
      return typeof value === 'string' ? value.trim() : String(value);
    
    case 'number': {
      if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) {
          throw new ValidationError('value', 'Number value is invalid (NaN or infinite)', value, 'valid number');
        }
        return value;
      }
      
      const numValue = parseFloat(value.toString());
      if (isNaN(numValue) || !isFinite(numValue)) {
        throw new ValidationError('value', 'Cannot coerce to number', value, 'numeric string', String(value), 'TypeError');
      }
      return numValue;
    }
    
    case 'boolean': {
      if (typeof value === 'boolean') {
        return value;
      }
      
      const stringValue = value.toString().toLowerCase().trim();
      const truthyValues = ['true', '1', 'yes', 'on'];
      const falsyValues = ['false', '0', 'no', 'off'];
      
      if (truthyValues.includes(stringValue)) {
        return true;
      }
      if (falsyValues.includes(stringValue)) {
        return false;
      }
      
      throw new ValidationError('value', 'Cannot coerce to boolean', value, 'true/false/1/0/yes/no/on/off', stringValue, 'TypeError');
    }
    
    case 'port': {
      // Ports are treated like numbers
      if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) {
          throw new ValidationError('value', 'Port value is invalid (NaN or infinite)', value, 'valid number');
        }
        return value;
      }
      
      const numValue = parseFloat(value.toString());
      if (isNaN(numValue) || !isFinite(numValue)) {
        throw new ValidationError('value', 'Cannot coerce to port number', value, 'numeric string', String(value), 'TypeError');
      }
      return numValue;
    }
    
    default:
      return value;
  }
}

// =============================================================================
// BUILT-IN VALIDATORS
// =============================================================================

/**
 * URL validator with protocol and domain validation
 */
export function validateUrl(url: string, options?: UrlValidatorOptions): boolean | string {
  if (typeof url !== 'string') {
    return 'Value must be a string';
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return 'URL cannot be empty';
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return 'Invalid URL format';
  }

  const protocols = options?.protocols || ['http:', 'https:', 'ftp:'];
  if (!protocols.includes(parsedUrl.protocol)) {
    return `Protocol must be one of: ${protocols.join(', ')}`;
  }

  if (options?.requireProtocol !== false && !parsedUrl.protocol) {
    return 'URL must include protocol (http://, https://, etc.)';
  }

  if (parsedUrl.hostname && parsedUrl.hostname.length > 253) {
    return 'Domain name is too long';
  }

  return true;
}

/**
 * Port validator with range and common port validation
 */
export function validatePort(port: number | string): boolean | string {
  if (typeof port === 'string') {
    const parsed = parseInt(port, 10);
    port = parsed;
  }

  if (typeof port !== 'number' || isNaN(port)) {
    return 'Port must be a valid number';
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return 'Port must be an integer between 1 and 65535';
  }

  return true;
}

/**
 * Email validator with RFC 5322 compliance
 */
export function validateEmail(email: string): boolean | string {
  if (typeof email !== 'string') {
    return 'Email must be a string';
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return 'Email cannot be empty';
  }

  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailPattern.test(trimmedEmail)) {
    return 'Invalid email format';
  }

  if (trimmedEmail.includes(' ')) {
    return 'Email cannot contain spaces';
  }

  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return 'Email must contain exactly one @ symbol';
  }

  return true;
}

/**
 * IP validator with IPv4/IPv6 support
 */
export function validateIp(ip: string, options?: IpValidatorOptions): boolean | string {
  if (typeof ip !== 'string') {
    return 'IP must be a string';
  }

  const trimmedIp = ip.trim();
  if (!trimmedIp) {
    return 'IP cannot be empty';
  }

  const version = options?.version || 'any';

  const ipv4Pattern = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  
  const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:)((:[0-9a-fA-F]{1,4}){1,6})|(:((:[0-9a-fA-F]{1,4}){1,7}|:)))$/;

  if ((version === 'ipv4' || version === 'any') && ipv4Pattern.test(trimmedIp)) {
    return true;
  }

  if ((version === 'ipv6' || version === 'any') && ipv6Pattern.test(trimmedIp)) {
    return true;
  }

  if (version === 'ipv4') {
    return 'Invalid IPv4 address format';
  } else if (version === 'ipv6') {
    return 'Invalid IPv6 address format';
  } else {
    return 'Invalid IP address format (must be IPv4 or IPv6)';
  }
}

/**
 * JSON validator with parsing and error details
 */
export function validateJson(jsonString: string): boolean | string {
  if (typeof jsonString !== 'string') {
    return 'JSON must be a string';
  }

  const trimmedJson = jsonString.trim();
  if (!trimmedJson) {
    return 'JSON cannot be empty';
  }

  try {
    JSON.parse(trimmedJson);
    return true;
  } catch (error) {
    return `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Regex validator with pattern compilation and full string matching
 */
export function validateRegex(value: string, pattern: RegExp): boolean | string {
  if (typeof value !== 'string') {
    return 'Value must be a string for regex validation';
  }

  if (!pattern.test(value)) {
    return 'Value does not match the required pattern';
  }

  return true;
}

// =============================================================================
// VALIDATORS COLLECTION
// =============================================================================

/**
 * Collection of all built-in validators
 */
export const validators = {
  url: validateUrl,
  port: validatePort,
  email: validateEmail,
  ip: validateIp,
  json: validateJson,
  regex: validateRegex,
  string: (value: string, options?: StringValidatorOptions) => {
    if (typeof value !== 'string') {
      return 'Value must be a string';
    }

    if (options?.minLength !== undefined && value.length < options.minLength) {
      return `String must be at least ${options.minLength} characters long`;
    }

    if (options?.maxLength !== undefined && value.length > options.maxLength) {
      return `String must be no more than ${options.maxLength} characters long`;
    }

    return true;
  },
  number: (value: number, options?: NumberValidatorOptions) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'Value must be a valid number';
    }

    if (options?.min !== undefined && value < options.min) {
      return `Number must be at least ${options.min}`;
    }

    if (options?.max !== undefined && value > options.max) {
      return `Number must be no more than ${options.max}`;
    }

    return true;
  },
  boolean: (value: boolean) => {
    if (typeof value !== 'boolean') {
      return 'Value must be a boolean';
    }
    return true;
  }
};

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Define a schema with comprehensive validation options
 */
export function defineSchema(schema: SchemaWithEnvironments): CompiledSchemaWithEnvironments {
  const compiledSchema: CompiledSchema = {};
  const envOverrides = schema._environments;

  for (const [fieldName, definition] of Object.entries(schema)) {
    if (fieldName === '_environments') {
      continue;
    }

    const fieldDef = definition as SchemaDefinition;

    // Validate schema definition
    if (!fieldDef || typeof fieldDef !== 'object') {
      throw new SchemaError(`Invalid schema definition for field "${fieldName}"`, fieldName);
    }

    if (!fieldDef.type) {
      throw new SchemaError(`Field "${fieldName}" must specify a type`, fieldName);
    }

    // Create compiled field schema
    const compiledField: CompiledFieldSchema = {
      type: fieldDef.type,
      required: fieldDef.required || false,
      default: fieldDef.default,
      enum: fieldDef.enum,
      description: fieldDef.description
    };

    // Set up custom validator if provided
    if (fieldDef.validate) {
      compiledField.validator = (val: any) => {
        const result = (fieldDef.validate as any)(val);
        return result === true ? true : result || 'Custom validation failed';
      };
    }

    // Set up transform function if provided
    if (fieldDef.transform) {
      compiledField.transform = fieldDef.transform;
    }

    // Type-specific validations
    switch (fieldDef.type) {
      case 'string':
        if (fieldDef.minLength !== undefined || fieldDef.maxLength !== undefined) {
          const originalValidator = compiledField.validator;
          compiledField.validator = (value: string) => {
            const stringResult = validators.string(value, {
              minLength: fieldDef.minLength,
              maxLength: fieldDef.maxLength
            });
            if (stringResult !== true) return stringResult;
            if (originalValidator) return originalValidator(value);
            return true;
          };
        }
        break;

      case 'number':
        if (fieldDef.min !== undefined || fieldDef.max !== undefined) {
          const originalValidator = compiledField.validator;
          compiledField.validator = (value: number) => {
            const numberResult = validators.number(value, {
              min: fieldDef.min,
              max: fieldDef.max
            });
            if (numberResult !== true) return numberResult;
            if (originalValidator) return originalValidator(value);
            return true;
          };
        }
        break;

      case 'url':
        if (fieldDef.protocols || fieldDef.requireProtocol !== undefined) {
          const originalValidator = compiledField.validator;
          compiledField.validator = (value: string) => {
            const urlResult = validators.url(value, {
              protocols: fieldDef.protocols,
              requireProtocol: fieldDef.requireProtocol
            });
            if (urlResult !== true) return urlResult;
            if (originalValidator) return originalValidator(value);
            return true;
          };
        }
        break;

      case 'port':
        if (fieldDef.common) {
          const originalValidator = compiledField.validator;
          compiledField.validator = (value: number) => {
            const portResult = validators.port(value);
            if (portResult !== true) return portResult;
            if (originalValidator) return originalValidator(value);
            return true;
          };
        }
        break;

      case 'email':
        if (fieldDef.allowPlus !== undefined) {
          const originalValidator = compiledField.validator;
          compiledField.validator = (value: string) => {
            const emailResult = validators.email(value);
            if (emailResult !== true) return emailResult;
            if (originalValidator) return originalValidator(value);
            return true;
          };
        }
        break;

      case 'ip':
        if (fieldDef.version) {
          const originalValidator = compiledField.validator;
          compiledField.validator = (value: string) => {
            const ipResult = validators.ip(value, { version: fieldDef.version });
            if (ipResult !== true) return ipResult;
            if (originalValidator) return originalValidator(value);
            return true;
          };
        }
        break;

      case 'regex':
        if ('pattern' in fieldDef) {
          compiledField.validator = (value: string) => {
            const regexDef = fieldDef as RegexSchemaDefinition;
            return validators.regex(value, regexDef.pattern);
          };
        }
        break;
    }

    // Add enum validation if specified
    if (fieldDef.enum && fieldDef.enum.length > 0) {
      const originalValidator = compiledField.validator;
      const enumValues = fieldDef.enum;
      compiledField.validator = (value: any) => {
        if (!enumValues.includes(value)) {
          return `Value must be one of: ${enumValues.join(', ')}`;
        }
        if (originalValidator) return originalValidator(value);
        return true;
      };
    }

    compiledSchema[fieldName] = compiledField;
  }

  return {
    schema: compiledSchema,
    _environments: envOverrides
  };
}

/**
 * Validate environment variables against a compiled schema
 */
export function validateEnv(
  compiledSchema: CompiledSchemaWithEnvironments,
  envVars?: any,
  environment?: string
): ValidationResult<ValidatedEnv> {
  const env = envVars || process.env;
  const errors: ValidationErrorResult[] = [];
  const validatedData: ValidatedEnv = {};

  // Get environment-specific overrides
  const envOverrides = environment && compiledSchema._environments?.[environment] || {};

  // Process each field in the schema
  for (const [fieldName, fieldSchema] of Object.entries(compiledSchema.schema)) {
    // Apply environment-specific overrides
    const effectiveSchema = { ...fieldSchema };
    if (envOverrides[fieldName]) {
      Object.assign(effectiveSchema, envOverrides[fieldName]);
    }

    const envVarName = fieldName.toUpperCase();
    let value = env[envVarName];

    // Handle missing values
    if (value === undefined) {
      if (effectiveSchema.required) {
        errors.push({
          field: fieldName,
          message: `Required environment variable "${envVarName}" is missing`,
          value: undefined,
          envVarName,
          type: 'RequiredError'
        });
        continue;
      }

      // Apply default value
      if (effectiveSchema.default !== undefined) {
        value = typeof effectiveSchema.default === 'function' 
          ? effectiveSchema.default() 
          : effectiveSchema.default;
      } else {
        // No value and no default, skip this field
        continue;
      }
    }

    try {
      // Type coercion for basic types
      if (['string', 'number', 'boolean', 'port'].includes(effectiveSchema.type)) {
        const coercedValue = coerceValue(value as string, effectiveSchema.type as 'string' | 'number' | 'boolean' | 'port');
        value = coercedValue;
      }

      // Apply custom transform
      if (effectiveSchema.transform) {
        try {
          value = effectiveSchema.transform(value);
        } catch (error) {
          errors.push({
            field: fieldName,
            message: `Transform failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            value,
            envVarName,
            type: 'TransformError'
          });
          continue;
        }
      }

      // Apply built-in validators
      const builtInValidator = (validators as any)[effectiveSchema.type];
      if (builtInValidator) {
        const validatorResult = builtInValidator(value);
        if (validatorResult !== true) {
          errors.push({
            field: fieldName,
            message: typeof validatorResult === 'string' ? validatorResult : 'Validation failed',
            value,
            envVarName,
            type: 'FormatError'
          });
          continue;
        }
      }

      // Apply custom validator
      if (effectiveSchema.validator) {
        const validatorResult = effectiveSchema.validator(value);
        if (validatorResult !== true) {
          errors.push({
            field: fieldName,
            message: typeof validatorResult === 'string' ? validatorResult : 'Custom validation failed',
            value,
            envVarName,
            type: 'FormatError'
          });
          continue;
        }
      }

      // All validations passed, add to validated data
      validatedData[fieldName] = value;

    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push({
          field: error.field,
          message: error.message,
          value: error.value,
          expected: error.expected,
          received: error.received,
          envVarName: error.envVarName,
          type: error.type
        });
      } else {
        errors.push({
          field: fieldName,
          message: error instanceof Error ? error.message : 'Unknown error during validation',
          value,
          envVarName,
          type: 'TypeError'
        });
      }
    }
  }

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? validatedData : undefined,
    errors,
    hasErrors: errors.length > 0
  };
}
