# Setting Up GitHub Merge Checklist Bot

This guide will help you set up the GitHub Merge Checklist Bot for your repositories.

## Prerequisites

1. Node.js (v14 or higher)
2. npm (v6 or higher)
3. A GitHub account with access to the repositories you want to monitor
4. A Discord server with webhook permissions

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/github-merge-checklist-bot.git
   cd github-merge-checklist-bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration values.

## GitHub Configuration

1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Click "Generate new token"
   - Give it a name and select the following scopes:
     - `repo` (Full control of private repositories)
   - Copy the token and add it to your `.env` file as `GITHUB_TOKEN`

2. Set up a webhook for your repository:
   - Go to your repository settings > Webhooks
   - Click "Add webhook"
   - Set the Payload URL to your server URL + `/api/webhook/github` (e.g., `https://your-server.com/api/webhook/github`)
   - Set the Content type to `application/json`
   - Generate a webhook secret and add it to your `.env` file as `GITHUB_WEBHOOK_SECRET`
   - Select "Let me select individual events" and choose:
     - Pull requests
     - Pushes
   - Click "Add webhook"

## Discord Configuration

1. Create a Discord webhook:
   - Go to your Discord server
   - Select a channel
   - Click the gear icon to edit the channel
   - Go to "Integrations" > "Webhooks"
   - Click "Create Webhook"
   - Give it a name and avatar
   - Copy the webhook URL and add it to your `.env` file as `DISCORD_WEBHOOK_URL`

## Project Configuration

Each project has its own configuration file in the `src/config/projects` directory. To add a new project:

1. Copy the template configuration:
   ```
   cp src/config/projects/_template.js src/config/projects/your-project.js
   ```

2. Edit the new configuration file with your project's settings:
   ```javascript
   module.exports = {
     name: 'Test Project',
     repository: 'owner/repo-name',
     monitoredBranches: ['master', 'development'],
     teams: {
       // Define your teams and file patterns
       frontend: {
         discordIds: ['@frontend-team', '<@user-id>'],
         filePatterns: ['src/components/**', '*.js', '*.css']
       },
       // Add more teams...
     },
     checklistRules: [
       // Define your checklist rules
       {
         pattern: 'src/api/**',
         items: [
           'Verify API documentation is updated',
           'Check error handling'
         ]
       }
       // Add more rules...
     ],
     discord: {
       webhookUrl: process.env.DISCORD_WEBHOOK_URL,
       messageTemplate: '## New merge to {branch}\n\n{checklist}'
     }
   };
   ```

3. The bot will automatically load your project configuration when it starts.

### Project Configuration Structure

- `name`: Display name for your project
- `repository`: Full repository name (owner/repo)
- `monitoredBranches`: List of branches to monitor for merges
- `teams`: Team configurations with Discord IDs and file patterns
- `checklistRules`: Rules for generating checklist items based on file patterns
- `discord`: Discord notification settings

See `src/config/projects/_template.js` for a detailed example with comments.

## AI Configuration (Optional)

If you want to use AI to enhance checklist generation:

1. Get an API key from your preferred AI service provider
2. Add the API key to your `.env` file as `AI_API_KEY`
3. Add the API URL to your `.env` file as `AI_API_URL`

## Running the Bot

1. Start the bot:
   ```
   npm start
   ```

2. For development with auto-restart:
   ```
   npm run dev
   ```

## Deployment

For production deployment, consider using a process manager like PM2:

1. Install PM2:
   ```
   npm install -g pm2
   ```

2. Start the bot with PM2:
   ```
   pm2 start src/index.js --name github-merge-checklist-bot
   ```

3. Make sure your server is accessible from the internet so GitHub can send webhook events.

## Troubleshooting

- Check the logs for any errors
- Verify that your GitHub token has the correct permissions
- Make sure your webhook URL is accessible from the internet
- Confirm that the webhook secret matches between GitHub and your `.env` file
- Verify that your project configuration file is properly formatted
- Check that the repository name in your project configuration matches exactly with GitHub 