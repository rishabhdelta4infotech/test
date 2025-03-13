# GitHub Merge Checklist Bot

A GitHub bot that generates checklists based on previous commits when merging to master or development branches, and notifies teams on Discord.

## Features

- Listens for GitHub webhook events (pull requests, merges)
- Analyzes commit history to generate contextual checklists
- Supports multiple projects with different rules and configurations
- Notifies stakeholders on Discord based on project-specific rules
- Assigns tasks to different stakeholders based on file changes
- Integrates with AI services to enhance checklist generation

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your configuration (see `.env.example`)
4. Set up GitHub webhooks for your repositories
5. Configure project-specific rules in the `config` directory
6. Start the server:
   ```
   npm start
   ```

## Configuration

Each project can have its own configuration file in the `config` directory. The configuration defines:

- Project name and repository details
- Branch rules (which branches trigger notifications)
- Team mappings (who gets notified for which types of changes)
- Custom checklist rules
- Discord notification settings

## Usage

1. Set up the webhook in your GitHub repository settings
2. When a pull request is created or merged to a monitored branch, the bot will:
   - Analyze the changes
   - Generate a checklist based on the changes and project rules
   - Notify the appropriate stakeholders on Discord
   - Assign tasks to team members

## License

ISC 