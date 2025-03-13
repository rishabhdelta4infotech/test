/**
 * YourGPT Project Configuration
 */

module.exports = {
  name: 'YourGPT Core APIs',
  repository: 'YourGPT/yourgpt-core-apis',

  // Add metadata for better context
  metadata: {
    description: `Serves all Core backend APIs, business logic, and integrations for YourGPT.  

    Tester Responsiblities are to test the related functionality in frontend after deployment is completed.
    Developer Responsiblities are to provide the checklist for the developer to review the code and test the functionality after code deployment.
    `,
    type: 'ai-application',
    complexity: 4,
    // Updated criticalPaths and removed references to "src" 
    // in favor of your actual directories (Chatbot, MongoDB, etc.).
    criticalPaths: [
      'app/Controllers/Api/Users/Product/Chatbot/**',
      'app/Models/MongoDB/**'
    ],
    lowRiskPaths: [
      '*.md',
      'docs/**',
      '.github/**/*.md',
      'examples/**',
      'LICENSE',
      'README.md'
    ],
    skipTesterChecklist: false,
  },
  monitoredBranches: ['master', 'main', 'development','temp-1','deve'],

  // Enhanced team mappings with AI and testing focus
  teams: {

    backend: {
      discordIds: ['<@602039388083322901>','<@1049207604406145105>', '<@1072756349487824927>', '<@1265278197855948812>'],
      filePatterns: [
        '**',
      ]
    },

    // devops: {
    //   discordIds: ['<@602039388083322901>'],
    //   filePatterns: [
    //     'Dockerfile*',
    //     'docker-compose*.yml',
    //     'serverless.yml',
    //     '.github/workflows/**',
    //     'bin/**',
    //     'config/**',
    //     '.env.example',
    //     'tsconfig*.json',
    //     '.sequelizerc',
    //     '.dockerignore'
    //   ]
    // },
  },

  // Enhanced checklist rules with AI and testing focus
  checklistRules: [
    // AI-specific changes (mapped to Chatbot folder)
    {
      pattern: 'app/Controllers/Api/Users/Product/Chatbot/**',
      items: [
        'Verify model performance metrics',
        'Check for memory leaks in inference code',
        'Validate input/output data preprocessing',
        'Review model configuration parameters',
        'Ensure error handling for model failures'
      ]
    },

    // Testing-specific changes
    {
      pattern: 'test/**',
      items: [
        'Verify test coverage meets requirements',
        'Check for proper test isolation',
        'Validate mock data and fixtures',
        'Ensure error cases are tested',
        'Review test performance'
      ]
    },

    // Model changes (mapped to app/Models/** including MongoDB)
    {
      pattern: 'app/Models/**',
      items: [
        'Validate model input/output shapes',
        'Check for backward compatibility',
        'Review model performance impact',
        'Verify error handling for edge cases',
        'Update model documentation'
      ]
    },

    // Package dependencies (covering both Node and PHP)
    {
      pattern: '{package.json,composer.json,package-lock.json}',
      items: [
        'Verify all new dependencies are necessary and secure',
        'Check for breaking changes in updated dependencies',
        'Update documentation if new setup steps are required'
      ]
    },

    // API changes (mapped to app/Controllers/Api)
    {
      pattern: 'app/Controllers/Api/**',
      items: [
        'Ensure all endpoints have proper validation',
        'Verify error handling is implemented',
        'Check that authentication is properly applied',
        'Validate API response formats',
        'Update API documentation'
      ]
    },

    // Frontend changes (mapped to public/ and resources/views/)
    {
      pattern: '{public/**,resources/views/**}',
      items: [
        'Verify responsive design on mobile and desktop',
        'Check for accessibility issues',
        'Ensure consistent styling with design system',
        'Validate AI interaction components (if any)',
        'Test loading and error states'
      ]
    }
  ],

  discord: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL,
    messageTemplate: '## New merge to {branch} in {repository}\n\n{checklist}\n\nCommit: {commitUrl}'
  }
};
