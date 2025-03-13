/**
 * GitHub Service
 * 
 * Handles interactions with the GitHub API
 */
const { Octokit } = require('octokit');
const config = require('../config');
const { verifyGitHubSignature } = require('../utils/webhookUtils');

class GitHubService {
  constructor() {
    this.octokit = new Octokit({ auth: config.github.token });
  }

  /**
   * Get repository information
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} - Repository information
   */
  async getRepository(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });
      return data;
    } catch (error) {
      console.error('Error getting repository:', error);
      throw error;
    }
  }

  /**
   * Get pull request information
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} pullNumber - Pull request number
   * @returns {Promise<Object>} - Pull request information
   */
  async getPullRequest(owner, repo, pullNumber) {
    try {
      const { data } = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });
      return data;
    } catch (error) {
      console.error('Error getting pull request:', error);
      throw error;
    }
  }

  /**
   * Get files changed in a pull request
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} pullNumber - Pull request number
   * @returns {Promise<Array>} - List of files changed
   */
  async getPullRequestFiles(owner, repo, pullNumber) {
    try {
      const { data } = await this.octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });
      return data;
    } catch (error) {
      console.error('Error getting pull request files:', error);
      throw error;
    }
  }

  /**
   * Get commits in a pull request
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} pullNumber - Pull request number
   * @returns {Promise<Array>} - List of commits
   */
  async getPullRequestCommits(owner, repo, pullNumber) {
    try {
      const { data } = await this.octokit.rest.pulls.listCommits({
        owner,
        repo,
        pull_number: pullNumber,
      });
      return data;
    } catch (error) {
      console.error('Error getting pull request commits:', error);
      throw error;
    }
  }

  /**
   * Get recent commits to a branch
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} branch - Branch name
   * @param {number} count - Number of commits to retrieve
   * @returns {Promise<Array>} - List of commits
   */
  async getRecentCommits(owner, repo, branch, count = 10) {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        sha: branch,
        per_page: count,
      });
      return data;
    } catch (error) {
      console.error('Error getting recent commits:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Webhook signature
   * @param {string} payload - Webhook payload
   * @returns {boolean} - Whether the signature is valid
   */
  verifyWebhookSignature(signature, payload) {
    return verifyGitHubSignature(signature, payload);
  }
}

module.exports = new GitHubService(); 