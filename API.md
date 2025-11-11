# 📚 env-guard API Reference

Complete reference for all functions, types, and options available in env-guard.

## Table of Contents

- [Core Functions](#core-functions)
- [Built-in Validators](#built-in-validators)
- [Schema Types](#schema-types)
- [Error Classes](#error-classes)
- [Type Definitions](#type-definitions)
- [Options Reference](#options-reference)

## Core Functions

### `defineSchema(schema: Schema): CompiledSchema`

Compiles a schema definition into a validated schema object for efficient runtime validation.

**Parameters:**
- `schema` - Object defining environment variable requirements

**Returns:** Compiled schema object ready for validation

**Example:**
```javascript
const schema = defineSchema({
  PORT: {
    type: 'port',
    required: true,
    default: 3000
  }
});
```

---

### `validateEnv(schema: CompiledSchema, envVars?: ProcessEnv, environment?: string): ValidationResult<ValidatedEnv>`

Validates environment variables against a compiled schema.

**Parameters:**
- `schema` - Compiled schema from `defineSchema()`
- `envVars` - Environment variables object (default: `process.env`)
- `environment` - Environment name for environment-specific rules

**Returns:** `ValidationResult` object with success status, data, and errors

**Example:**
```javascript
const result = validateEnv(schema, process.env, 'production');
if (result.success) {
  console.log('Valid:', result.data.PORT);
} else {
  console.log('Errors:', result.errors);
}
```

---

### `coerceValue(value: string, type: 'string' | 'number' | 'boolean'): any`

Converts string values to their target types with validation.

**Parameters:**
- `value` - String value to coerce
- `type` - Target type

**Returns:** Coerced value or throws ValidationError

**Example:**
```javascript
coerceValue('8080', 'number');     // 8080
coerceValue('true', 'boolean');    // true
coerceValue('hello', 'string');    // 'hello'
```

## Built-in Validators

### URL Validation

#### `validators.url(url: string, options?: URLValidatorOptions): boolean | string`

Validates URL format and protocol.

**Options:**
- `protocols` - Array of allowed protocols (default: `['http:', 'https:', 'ftp:']`)
- `requireProtocol` - Whether protocol is required (default: `true`)

**Example:**
```javascript
validators.url('https://example.com');              // ✅ true
validators.url('http://localhost:3000');            // ✅ true
validators.url('javascript:alert(1)');             // ❌ 'Protocol must be one of: http:, https:, ftp:'
```

---

### Port Validation

#### `validators.port(port: number | string, options?: PortValidatorOptions): boolean | string`

Validates port numbers.

**Options:**
- `common` - Array of common ports for informational purposes

**Example:**
```javascript
validators.port(3000);            // ✅ true
validators.port(65536);          // ❌ 'Port must be between 1 and 65535'
validators.port('not-a-number'); // ❌ 'Port must be a valid number'
```

---

### Email Validation

#### `validators.email(email: string): boolean | string`

Validates email format using RFC 5322 compliance.

**Example:**
```javascript
validators.email('user@example.com');  // ✅ true
validators.email('invalid-email');     // ❌ 'Invalid email format'
```

---

### IP Validation

#### `validators.ip(ip: string, options?: IPValidatorOptions): boolean | string`

Validates IPv4 and IPv6 addresses.

**Options:**
- `version` - IP version: `'ipv4'`, `'ipv6'`, or `'any'` (default: `'any'`)

**Example:**
```javascript
validators.ip('192.168.1.1');     // ✅ true
validators.ip('::1');             // ✅ true (IPv6)
validators.ip('invalid-ip');      // ❌ 'Invalid IP address format'
```

---

### JSON Validation

#### `validators.json(jsonString: string): boolean | string`

Validates JSON format and parses the value.

**Example:**
```javascript
validators.json('{"key": "value"}');  // ✅ true
validators.json('invalid-json');      // ❌ 'Invalid JSON format'
```

---

### Regex Validation

#### `validators.regex(value: string, pattern: RegExp): boolean | string`

Validates string against regex pattern.

**Example:**
```javascript
validators.regex('abc123', /^[a-z0-9]+$/);  // ✅ true
validators.regex('ABC!', /^[a-z0-9]+$/);    // ❌ 'Value does not match the required pattern'
```

---

### String Validation

#### `validators.string(value: string, options?: StringValidatorOptions): boolean | string`

Validates string constraints.

**Options:**
- `minLength` - Minimum string length
- `maxLength` - Maximum string length

**Example:**
```javascript
validators.string('hello', { minLength: 3 });    // ✅ true
validators.string('ab', { minLength: 3 });       // ❌ 'String must be at least 3 characters long'
```

---

### Number Validation

#### `validators.number(value: number, options?: NumberValidatorOptions): boolean | string`

Validates numeric constraints.

**Options:**
- `min` - Minimum numeric value
- `max` - Maximum numeric value

**Example:**
```javascript
validators.number(50, { min: 0, max: 100 });  // ✅ true
validators.number(150, { max: 100 });         // ❌ 'Number must be no more than 100'
```

---

### Boolean Validation

#### `validators.boolean(value: boolean): boolean | string`

Validates boolean type.

**Example:**
```javascript
validators.boolean(true);   // ✅ true
validators.boolean('true'); // ❌ 'Value must be a boolean'
```

## Schema Types

### Base Schema Definition

```typescript
interface BaseSchemaDefinition<T = any> {
  type: EnvType;                                    // Required field type
  required?: boolean;                               // Whether field is required
  default?: T | (() => T);                          // Default value or function
  enum?: T[];                                       // Allowed values
  validate?: (value: T) => boolean | string;        // Custom validation
  transform?: (value: any) => T;                    // Transform function
  description?: string;                             // Field description
}
```

### String Schema

```typescript
interface StringSchemaDefinition extends BaseSchemaDefinition<string> {
  type: 'string';
  minLength?: number;                               // Minimum string length
  maxLength?: number;                               // Maximum string length
}
```

### Number Schema

```typescript
interface NumberSchemaDefinition extends BaseSchemaDefinition<number> {
  type: 'number';
  min?: number;                                     // Minimum numeric value
  max?: number;                                     // Maximum numeric value
}
```

### Boolean Schema

```typescript
interface BooleanSchemaDefinition extends BaseSchemaDefinition<boolean> {
  type: 'boolean';
}
```

### URL Schema

```typescript
interface UrlSchemaDefinition extends BaseSchemaDefinition<string> {
  type: 'url';
  protocols?: string[];                             // Allowed protocols
  requireProtocol?: boolean;                        // Require protocol prefix
}
```

### Port Schema

```typescript
interface PortSchemaDefinition extends BaseSchemaDefinition<number> {
  type: 'port';
  common?: string[];                                // Common ports for reference
}
```

### Email Schema

```typescript
interface EmailSchemaDefinition extends BaseSchemaDefinition<string> {
  type: 'email';
  allowPlus?: boolean;                              // Allow plus addressing
}
```

### IP Schema

```typescript
interface IpSchemaDefinition extends BaseSchemaDefinition<string> {
  type: 'ip';
  version?: 'ipv4' | 'ipv6' | 'any';               // IP version constraint
}
```

### JSON Schema

```typescript
interface JsonSchemaDefinition extends BaseSchemaDefinition<any> {
  type: 'json';
  schema?: any;                                     // JSON schema for validation
}
```

### Regex Schema

```typescript
interface RegexSchemaDefinition extends BaseSchemaDefinition<string> {
  type: 'regex';
  pattern: RegExp;                                  // Required regex pattern
  flags?: string;                                   // Regex flags
}
```

## Error Classes

### ValidationError

Thrown when environment variable validation fails.

**Constructor:**
```typescript
constructor(
  field: string,                                    // Field name
  message: string,                                  // Error message
  value: any,                                       // Invalid value
  expected?: string,                                // Expected format
  received?: string,                                // Received format
  envVarName?: string,                              // Environment variable name
  type?: ErrorType                                  // Error type
)
```

**Properties:**
- `field` - Name of the field that failed validation
- `message` - Human-readable error message
- `value` - The value that failed validation
- `expected` - Description of what was expected
- `received` - Description of what was received
- `envVarName` - Environment variable name
- `type` - Error type: `'TypeError' | 'FormatError' | 'RequiredError' | 'TransformError'`

**Methods:**
- `toString()` - Formatted error message
- `toJSON()` - Serialized error object

**Example:**
```javascript
try {
  coerceValue('invalid', 'number');
} catch (error) {
  console.log(error.field);         // 'value'
  console.log(error.message);       // 'Cannot coerce to number'
  console.log(error.type);          // 'TypeError'
}
```

---

### SchemaError

Thrown when schema definition is invalid.

**Constructor:**
```typescript
constructor(
  message: string,                                  // Error message
  schemaPath: string,                               // Path in schema
  validationDetails?: any                           // Additional details
)
```

**Example:**
```javascript
try {
  defineSchema({
    INVALID_FIELD: {
      // Missing required 'type' field
    }
  });
} catch (error) {
  console.log(error.message);       // 'Field "INVALID_FIELD" must specify a type'
  console.log(error.schemaPath);    // 'INVALID_FIELD'
}
```

## Type Definitions

### EnvType

Union type of all supported environment variable types.

```typescript
type EnvType = 'string' | 'number' | 'boolean' | 'url' | 'port' | 'email' | 'ip' | 'json' | 'regex';
```

### Schema

Complete schema definition object.

```typescript
interface Schema {
  [fieldName: string]: SchemaDefinition;
  _environments?: EnvironmentOverrides;
}
```

### ValidationResult

Return type of `validateEnv()` function.

```typescript
interface ValidationResult<T = any> {
  success: boolean;                                 // Whether validation passed
  data?: T;                                         // Validated data if successful
  errors: ValidationErrorResult[];                  // Array of errors if failed
  hasErrors: boolean;                               // Shortcut for errors.length > 0
}
```

### CompiledSchema

Result of `defineSchema()` function.

```typescript
interface CompiledSchema {
  [fieldName: string]: CompiledFieldSchema;
  _environments?: EnvironmentOverrides;
}
```

### EnvironmentOverrides

Environment-specific rule overrides.

```typescript
interface EnvironmentOverrides {
  [environment: string]: {
    [fieldName: string]: Partial<SchemaDefinition>;
  };
}
```

## Options Reference

### URLValidatorOptions

```typescript
interface URLValidatorOptions {
  protocols?: string[];           // Allowed protocols
  requireProtocol?: boolean;      // Require protocol prefix
}
```

### PortValidatorOptions

```typescript
interface PortValidatorOptions {
  common?: string[];              // Common ports for reference
}
```

### IPValidatorOptions

```typescript
interface IPValidatorOptions {
  version?: 'ipv4' | 'ipv6' | 'any';  // IP version constraint
}
```

### StringValidatorOptions

```typescript
interface StringValidatorOptions {
  minLength?: number;             // Minimum string length
  maxLength?: number;             // Maximum string length
}
```

### NumberValidatorOptions

```typescript
interface NumberValidatorOptions {
  min?: number;                   // Minimum numeric value
  max?: number;                   // Maximum numeric value
}
```

## Environment-Specific Rules

You can define different validation rules for different environments:

```javascript
const schema = defineSchema({
  DATABASE_URL: {
    type: 'url',
    required: false,
    description: 'Database connection string'
  },
  _environments: {
    production: {
      DATABASE_URL: {
        required: true           // Required in production
      }
    }
  }
});

// Validation in production requires DATABASE_URL
const result = validateEnv(schema, process.env, 'production');
```

## Custom Validators

Create custom validation logic:

```javascript
const schema = defineSchema({
  API_KEY: {
    type: 'string',
    required: true,
    validate: (value) => {
      if (!value.startsWith('sk-')) {
        return 'API key must start with "sk-"';
      }
      return true;
    }
  }
});
```

## Transforms

Transform values after validation:

```javascript
const schema = defineSchema({
  DATABASE_URL: {
    type: 'string',
    transform: (url) => {
      return url.replace('localhost', '127.0.0.1');
    }
  }
});
```

## Type Coercion

env-guard automatically coerces string values:

**String → Number:**
- `'8080'` → `8080`
- `'not-a-number'` → ValidationError

**String → Boolean:**
- `'true'`, `'1'`, `'yes'`, `'on'` → `true`
- `'false'`, `'0'`, `'no'`, `'off'` → `false`
- `'maybe'`, `'2'` → ValidationError

**String → String:**
- `'  hello  '` → `'hello'` (trimmed)
- All strings are trimmed of whitespace