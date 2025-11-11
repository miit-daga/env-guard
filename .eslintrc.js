module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended'
    ],
    plugins: ['@typescript-eslint'],
    env: {
        node: true,
        es2020: true,
        jest: true
    },
    overrides: [
        {
            files: ['tests/**/*.ts', 'tests/**/*.js'],
            env: {
                jest: true
            },
            rules: {
                // Relaxed rules for test files
                'no-unused-vars': 'off',
                '@typescript-eslint/no-unused-vars': 'off'
            }
        }
    ],
    rules: {
        // Allow unused parameters with underscore prefix
        // This helps with TypeScript interface function signatures
        'no-unused-vars': ['error', {
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_'
        }],
        
        // Custom rules can be added here as needed
    },
    ignorePatterns: [
        'tests/**/*',
        'lib/**/*',
        'node_modules/**/*'
    ]
};