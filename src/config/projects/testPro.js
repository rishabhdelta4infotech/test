/**
 * YourGPT Project Configuration
 */

module.exports = {
    name: 'Test Project',
    repository: 'rishabhdelta4infotech/test',
    // Branches that trigger notifications when merged into
    monitoredBranches: ['master','main', 'development'],
    // Team mappings - who gets notified for which types of changes
    teams: {
      frontend: {
        discordIds: ['@Rishabh', '<@1329315548843999288>'],
        filePatterns: [
          '*.js', '*.jsx', '*.css', '*.scss', 
          'src/components/**', 'src/pages/**', 'public/**', '*.md'
        ]
      },
      backend: {
        discordIds: ['@Rishabh', '<@1329315548843999288>'],
        filePatterns: [
          '*.js', '*.json', 'src/api/**', 'src/models/**', 
          'src/controllers/**', 'src/routes/**', 'src/services/**'
        ]
      },
      devops: {
        discordIds: ['<@1329315548843999288>'],
        filePatterns: [
          'Dockerfile', 'docker-compose.yml', '.github/**', 
          'scripts/**', 'config/**', '.env.example'
        ]
      },
      security: {
        discordIds: ['<@1329315548843999288>'],
        filePatterns: [
          'src/auth/**', 'src/middleware/auth.js', 'src/utils/encryption.js'
        ]
      }
    },
    // Custom checklist items based on file patterns
    checklistRules: [
      {
        pattern: 'package.json',
        items: [
          'Verify all new dependencies are necessary and secure',
          'Check for breaking changes in updated dependencies',
          'Update documentation if new setup steps are required'
        ]
      },
      {
        pattern: 'src/api/**',
        items: [
          'Ensure all endpoints have proper validation',
          'Verify error handling is implemented',
          'Check that authentication is properly applied'
        ]
      },
      {
        pattern: 'src/components/**',
        items: [
          'Verify responsive design on mobile and desktop',
          'Check for accessibility issues',
          'Ensure consistent styling with design system'
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