/**
 * Checklist Service
 * 
 * Handles checklist generation and team assignments
 */
const githubService = require('./githubService');
const aiService = require('./aiService');
const config = require('../config');

class ChecklistService {
  /**
   * Process a pull request and generate checklists
   * @param {Object} payload - GitHub webhook payload
   * @returns {Promise<Object>} - Processing result
   */
  async processPullRequest(payload) {
    try {
      const { repository, pull_request } = payload;
      
      if (!repository || !pull_request) {
        throw new Error('Invalid webhook payload');
      }
      
      // Extract repository information
      const repoFullName = repository.full_name;
      const [owner, repo] = repoFullName.split('/');
      
      // Find matching project configuration
      const projectConfig = this.findProjectConfig(repoFullName);
      
      if (!projectConfig) {
        console.log(`No project configuration found for repository: ${repoFullName}`);
        return { success: false, message: 'No project configuration found' };
      }
      
      // Check if the target branch is monitored
      const targetBranch = pull_request.base.ref;
      
      if (!projectConfig.monitoredBranches.includes(targetBranch)) {
        console.log(`Branch ${targetBranch} is not monitored for repository: ${repoFullName}`);
        return { success: false, message: 'Branch not monitored' };
      }
      
      // Get pull request details
      const pullNumber = pull_request.number;
      const pullRequest = await githubService.getPullRequest(owner, repo, pullNumber);
      const files = await githubService.getPullRequestFiles(owner, repo, pullNumber);
      const commits = await githubService.getPullRequestCommits(owner, repo, pullNumber);
      
      // Generate checklist
      const checklist = await aiService.generateChecklist({
        projectName: projectConfig.name,
        repository: repoFullName,
        commits,
        files,
        projectConfig,
      });
      
      // Assign teams based on file changes
      const teamAssignments = this.assignTeams(files, projectConfig);
      
      return {
        success: true,
        projectName: projectConfig.name,
        repository: repoFullName,
        branch: targetBranch,
        pullRequest,
        files,
        commits,
        checklist,
        teamAssignments,
      };
    } catch (error) {
      console.error('Error processing pull request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find project configuration for a repository
   * @param {string} repoFullName - Repository full name (owner/repo)
   * @returns {Object|null} - Project configuration or null if not found
   */
  findProjectConfig(repoFullName) {
    for (const [projectId, projectConfig] of Object.entries(config.projects)) {
      if (projectConfig.repository === repoFullName) {
        return { ...projectConfig, id: projectId };
      }
    }
    
    return null;
  }

  /**
   * Assign teams based on file changes
   * @param {Array} files - List of files changed
   * @param {Object} projectConfig - Project configuration
   * @returns {Object} - Team assignments with Discord IDs to mention
   */
  assignTeams(files, projectConfig) {
    const teamAssignments = {};
    const filePaths = files.map(file => file.filename || file.path);
    
    // Check each team's file patterns
    for (const [teamId, team] of Object.entries(projectConfig.teams)) {
      const { filePatterns, discordIds } = team;
      
      // Check if any file matches the team's patterns
      const matches = filePaths.some(filePath => {
        return filePatterns.some(pattern => {
          // Simple glob pattern matching
          if (pattern.includes('*')) {
            const regexPattern = pattern
              .replace(/\./g, '\\.')
              .replace(/\*/g, '.*');
            return new RegExp(regexPattern).test(filePath);
          }
          
          // Exact match
          return filePath === pattern || filePath.includes(pattern);
        });
      });
      
      // If there's a match, assign the team
      if (matches) {
        teamAssignments[teamId] = {
          discordIds,
          files: filePaths.filter(filePath => {
            return filePatterns.some(pattern => {
              // Simple glob pattern matching
              if (pattern.includes('*')) {
                const regexPattern = pattern
                  .replace(/\./g, '\\.')
                  .replace(/\*/g, '.*');
                return new RegExp(regexPattern).test(filePath);
              }
              
              // Exact match
              return filePath === pattern || filePath.includes(pattern);
            });
          }),
        };
      }
    }
    
    return teamAssignments;
  }

  /**
   * Get Discord mentions for team assignments
   * @param {Object} teamAssignments - Team assignments
   * @returns {Array} - Discord IDs to mention
   */
  getDiscordMentions(teamAssignments) {
    const mentions = [];
    
    for (const team of Object.values(teamAssignments)) {
      if (team.discordIds && team.discordIds.length > 0) {
        mentions.push(...team.discordIds);
      }
    }
    
    // Remove duplicates
    return [...new Set(mentions)];
  }
}

module.exports = new ChecklistService(); 