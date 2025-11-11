// Test suite for built-in validators
import { 
  validateUrl, 
  validatePort, 
  validateEmail, 
  validateIp, 
  validateJson, 
  validateRegex,
  validators
} from '../src/index';

describe('Built-in Validators', () => {
  describe('URL Validator', () => {
    it('should validate valid HTTP URLs', () => {
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('https://www.example.com')).toBe(true);
      expect(validateUrl('http://localhost:8080')).toBe(true);
    });

    it('should validate valid HTTPS URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('https://api.example.com/v1')).toBe(true);
    });

    it('should validate FTP URLs', () => {
      expect(validateUrl('ftp://ftp.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(typeof validateUrl('not-a-url')).toBe('string');
      expect(typeof validateUrl('')).toBe('string');
      expect(typeof validateUrl('javascript:alert(1)')).toBe('string');
    });

    it('should respect protocol restrictions', () => {
      expect(typeof validateUrl('ftp://example.com', { protocols: ['http:', 'https:'] })).toBe('string');
      expect(validateUrl('https://example.com', { protocols: ['http:', 'https:'] })).toBe(true);
    });

    it('should handle long domain names', () => {
      const longDomain = 'http://' + 'a'.repeat(300) + '.com';
      expect(typeof validateUrl(longDomain)).toBe('string');
    });
  });

  describe('Port Validator', () => {
    it('should validate valid ports', () => {
      expect(validatePort(80)).toBe(true);
      expect(validatePort(443)).toBe(true);
      expect(validatePort(3000)).toBe(true);
      expect(validatePort(65535)).toBe(true);
    });

    it('should validate port strings', () => {
      expect(validatePort('80')).toBe(true);
      expect(validatePort('443')).toBe(true);
    });

    it('should reject invalid ports', () => {
      expect(typeof validatePort(0)).toBe('string');
      expect(typeof validatePort(65536)).toBe('string');
      expect(typeof validatePort('not-a-number')).toBe('string');
      expect(typeof validatePort(80.5)).toBe('string'); // Not an integer
    });
  });

  describe('Email Validator', () => {
    it('should validate valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email@domain.co.uk')).toBe(true);
      expect(validateEmail('user123@test-domain.org')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(typeof validateEmail('invalid-email')).toBe('string');
      expect(typeof validateEmail('user@')).toBe('string');
      expect(typeof validateEmail('@domain.com')).toBe('string');
      expect(typeof validateEmail('user space@domain.com')).toBe('string');
      expect(typeof validateEmail('user@domain@com')).toBe('string');
    });

    it('should handle edge cases', () => {
      expect(typeof validateEmail('')).toBe('string');
      expect(typeof validateEmail('user@')).toBe('string');
      // Domain validation edge cases
      expect(typeof validateEmail('user@' + 'a'.repeat(254) + '.com')).toBe('string'); // Domain too long
      expect(typeof validateEmail('user@.domain.com')).toBe('string'); // Domain starts with dot
      expect(typeof validateEmail('user@domain.com.')).toBe('string'); // Domain ends with dot
      expect(typeof validateEmail('user@domain..com')).toBe('string'); // Consecutive dots
      expect(typeof validateEmail('user space@domain.com')).toBe('string'); // Spaces in email
      expect(typeof validateEmail('user@domain@com')).toBe('string'); // Multiple @ symbols
      // This is actually a valid email according to our regex
      expect(validateEmail('very.long.domain.name.that.exceeds.normal.limits@example.com')).toBe(true);
    });
  });

  describe('IP Validator', () => {
    it('should validate IPv4 addresses', () => {
      expect(validateIp('192.168.1.1')).toBe(true);
      expect(validateIp('127.0.0.1')).toBe(true);
      expect(validateIp('255.255.255.255')).toBe(true);
    });

    it('should validate IPv6 addresses', () => {
      expect(validateIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(validateIp('::1')).toBe(true);
      expect(validateIp('fe80::1')).toBe(true);
    });

    it('should respect IP version restrictions', () => {
      expect(typeof validateIp('192.168.1.1', { version: 'ipv6' })).toBe('string');
      expect(typeof validateIp('2001:db8::1', { version: 'ipv4' })).toBe('string');
      expect(validateIp('192.168.1.1', { version: 'ipv4' })).toBe(true);
      expect(validateIp('2001:db8::1', { version: 'ipv6' })).toBe(true);
    });

    it('should reject invalid IPs', () => {
      expect(typeof validateIp('999.999.999.999')).toBe('string');
      expect(typeof validateIp('not-an-ip')).toBe('string');
      expect(typeof validateIp('')).toBe('string');
      // Test generic error message for 'any' version
      expect(validateIp('invalid.ip', { version: 'any' })).toBe('Invalid IP address format (must be IPv4 or IPv6)');
    });
  });

  describe('JSON Validator', () => {
    it('should validate valid JSON', () => {
      expect(validateJson('{"key": "value"}')).toBe(true);
      expect(validateJson('["item1", "item2"]')).toBe(true);
      expect(validateJson('null')).toBe(true);
      expect(validateJson('{}')).toBe(true);
      expect(validateJson('[]')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(typeof validateJson('{"key": value}')).toBe('string'); // Unquoted value
      expect(typeof validateJson('{"key": "value",}')).toBe('string'); // Trailing comma
      expect(typeof validateJson('not json')).toBe('string');
      expect(typeof validateJson('')).toBe('string');
    });
  });

  describe('Regex Validator', () => {
    it('should validate against regex pattern', () => {
      expect(validateRegex('abc', /^[a-z]+$/)).toBe(true);
      expect(validateRegex('123', /^\d+$/)).toBe(true);
      expect(validateRegex('hello world', /^hello world$/)).toBe(true);
    });

    it('should reject non-matching strings', () => {
      expect(typeof validateRegex('ABC', /^[a-z]+$/)).toBe('string');
      expect(typeof validateRegex('abc123', /^[a-z]+$/)).toBe('string');
      expect(typeof validateRegex('not matching', /^[0-9]+$/)).toBe('string');
    });

    it('should handle non-string inputs gracefully', () => {
      expect(typeof validateRegex(123 as any, /^[0-9]+$/)).toBe('string');
    });
  });

  describe('Validators Collection', () => {
    it('should have all validators defined', () => {
      expect(validators).toHaveProperty('url');
      expect(validators).toHaveProperty('port');
      expect(validators).toHaveProperty('email');
      expect(validators).toHaveProperty('ip');
      expect(validators).toHaveProperty('json');
      expect(validators).toHaveProperty('regex');
      expect(validators).toHaveProperty('string');
      expect(validators).toHaveProperty('number');
      expect(validators).toHaveProperty('boolean');
    });

    describe('String Validator', () => {
      it('should validate string length constraints', () => {
        expect(validators.string('hello', { minLength: 3 })).toBe(true);
        expect(validators.string('hello', { maxLength: 10 })).toBe(true);
        expect(typeof validators.string('hi', { minLength: 5 })).toBe('string');
        expect(typeof validators.string('very long string', { maxLength: 5 })).toBe('string');
      });

      it('should handle non-string values', () => {
        expect(typeof validators.string(123 as any)).toBe('string');
      });
    });

    describe('Number Validator', () => {
      it('should validate number range constraints', () => {
        expect(validators.number(5, { min: 1, max: 10 })).toBe(true);
        expect(typeof validators.number(0, { min: 1 })).toBe('string');
        expect(typeof validators.number(15, { max: 10 })).toBe('string');
      });

      it('should reject invalid numbers', () => {
        expect(typeof validators.number(NaN)).toBe('string');
        expect(typeof validators.number('not a number' as any)).toBe('string');
      });
    });

    describe('Boolean Validator', () => {
      it('should validate boolean values', () => {
        expect(validators.boolean(true)).toBe(true);
        expect(validators.boolean(false)).toBe(true);
      });

      it('should reject non-boolean values', () => {
        expect(typeof validators.boolean('true' as any)).toBe('string');
        expect(typeof validators.boolean(1 as any)).toBe('string');
      });
    });
  });
});