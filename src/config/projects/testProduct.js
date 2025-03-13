/**
 * Project Configuration Template
 * 
 * Use this template to create new project configurations.
 * Copy this file and rename it to your project name (e.g., myproject.js).
 */

module.exports = {
    // Project name (displayed in notifications)
    name: 'My Test Product with 32442423new changes new',
    
    // Repository full name (owner/repo)
    repository: 'rishabhdelta4infotech/testProduct',
  
    // Project metadata - helps contextualize changes
    metadata: {
      // Project description and purpose
      description: 'This is a test product for the merge checklist bot',
      // Project type (e.g., frontend, backend, full-stack, library, etc.)
      type: 'full-stack',
      // Project complexity level (1-5, where 1 is least complex)
      complexity: 3,
      // Critical paths that require more thorough review
      criticalPaths: [
        'src/auth/**',
        'src/core/**',
        'src/database/migrations/**'
      ],
      // Paths that typically need minimal review
      lowRiskPaths: [
        '*.md',
        'docs/**',
        'examples/**',
        '.github/**/*.md'
      ],
      skipTesterChecklist: true,
    },
    
    // Branches that trigger notifications when merged into
    monitoredBranches: ['main', 'master', 'development'],
    
    // Team mappings - who gets notified for which types of changes
    teams: {
      // Frontend team example
    //   frontend: {
    //     // Discord user/role IDs to mention
    //     discordIds: ['@Rishabh', '<@1329315548843999288>'],
    //     // File patterns that trigger notifications for this team
    //     filePatterns: [
    //       '*.js', '*.jsx', '*.ts', '*.tsx', '*.css', '*.scss',
    //       'src/components/**',
    //       'src/pages/**',
    //       'public/**'
    //     ]
    //   },
      
      // Backend team example
      backend: {
        discordIds: ['@Rishabh', '<@1329315548843999288>'],
        filePatterns: [
          'src/api/**',
          'src/models/**',
          'src/controllers/**',
          'src/routes/**',
          'src/services/**',
          'src/db/**'
        ]
      },
      
      // DevOps team example
    //   devops: {
    //     discordIds: ['@Rishabh', '<@1329315548843999288>'],
    //     filePatterns: [
    //       'Dockerfile*',
    //       'docker-compose*.yml',
    //       '.github/**',
    //       'scripts/**',
    //       'config/**',
    //       '.env.example',
    //       'kubernetes/**',
    //       'terraform/**'
    //     ]
    //   },
      
      // Security team example
    //   security: {
    //     discordIds: ['@security-team', '<@user-id>'],
    //     filePatterns: [
    //       'src/auth/**',
    //       'src/middleware/auth.js',
    //       'src/utils/encryption.js',
    //       'security/**'
    //     ]
    //   }
    },
    
    // Custom checklist rules based on file patterns
    checklistRules: [
      // Documentation changes
      {
        pattern: '*.md',
        items: [
          'Verify formatting and links are correct',
          'Check for spelling and grammar'
        ]
      },
      
      // Dependencies changes
      {
        pattern: 'package.json',
        items: [
          'Verify all new dependencies are necessary and secure',
          'Check for breaking changes in updated dependencies',
          'Update documentation if new setup steps are required'
        ]
      },
      
      // API changes
      {
        pattern: 'src/api/**',
        items: [
          'Ensure all endpoints have proper validation',
          'Verify error handling is implemented',
          'Check that authentication is properly applied'
        ]
      },
      
      // Frontend changes
      {
        pattern: 'src/components/**',
        items: [
          'Verify responsive design on mobile and desktop',
          'Check for accessibility issues',
          'Ensure consistent styling with design system',
          'Add/update component documentation',
          'Add/update component tests'
        ]
      },
      
      // Database changes
      {
        pattern: 'src/models/**',
        items: [
          'Review database schema changes',
          'Check for backward compatibility',
          'Ensure indexes are properly defined',
          'Add database migration scripts if needed'
        ]
      },
      
      // Configuration changes
      {
        pattern: 'config/**',
        items: [
          'Update environment variable documentation',
          'Check for sensitive information',
          'Update deployment documentation if needed'
        ]
      }
    ],
    
    // Discord notification settings
    discord: {
      // Default webhook URL (can be overridden in .env)
      webhookUrl: process.env.DISCORD_WEBHOOK_URL,
      // Message template
      messageTemplate: '## New merge to {branch} in {repository}\n\n{checklist}\n\nCommit: {commitUrl}'
    }
  }; 
