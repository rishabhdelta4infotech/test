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
   * @param {Array} files - List of changed files
   * @param {Object} projectConfig - Project configuration
   * @returns {Object} - Team assignments
   */
  assignTeams(files, projectConfig) {
    const teamAssignments = {};
    
    // Validate inputs
    if (!Array.isArray(files) || !projectConfig?.teams) {
      return teamAssignments;
    }

    // Get file paths
    const filePaths = files.filter(Boolean).map(file => 
      typeof file === 'string' ? file : (file.filename || file.path)
    );

    // For each team in the config
    Object.entries(projectConfig.teams || {}).forEach(([team, config]) => {
      // Validate team config
      if (!config || !Array.isArray(config.filePatterns)) {
        return;
      }

      // Check if any files match the team's patterns
      const matchedFiles = filePaths.filter(filePath => 
        config.filePatterns.some(pattern => {
          if (!pattern) return false;
          return this.matchesPattern(filePath, pattern);
        })
      );

      // If files match, add team assignment
      if (matchedFiles.length > 0) {
        teamAssignments[team] = {
          files: matchedFiles,
          reviewers: config.reviewers || []
        };
      }
    });

    return teamAssignments;
  }

  /**
   * Helper function to match file paths against patterns
   * @param {string} path - File path
   * @param {string} pattern - Pattern to match against
   * @returns {boolean} - Whether the path matches the pattern
   */
  matchesPattern(path, pattern) {
    if (!path || !pattern) {
      return false;
    }

    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      return new RegExp(regexPattern).test(path);
    }
    return path === pattern || path.includes(pattern);
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