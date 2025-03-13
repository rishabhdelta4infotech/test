/**
 * AI Service
 * 
 * Handles interactions with AI services to generate checklists
 */
const axios = require('axios');
const config = require('../config');

class AIService {
  /**
   * Generate a checklist based on commit history and file changes
   * @param {Object} data - Data for checklist generation
   * @param {string} data.projectName - Project name
   * @param {string} data.repository - Repository name
   * @param {Array} data.commits - List of commits
   * @param {Array} data.files - List of files changed
   * @param {Object} data.projectConfig - Project configuration
   * @returns {Promise<Array>} - Generated checklist items
   */
  async generateChecklist(data) {
    const { projectName, repository, commits, files, projectConfig } = data;
    
    try {
      // First, generate checklist items based on project rules
      const ruleBasedItems = this.generateRuleBasedChecklist(files, projectConfig);
      
      // If AI API is configured, enhance the checklist with AI-generated items
      if (config.ai.apiKey && config.ai.apiUrl) {
        const aiItems = await this.generateAIChecklist(data);
        
        // Combine rule-based and AI-generated items, removing duplicates
        const combinedItems = [...ruleBasedItems];
        
        for (const item of aiItems) {
          if (!combinedItems.includes(item)) {
            combinedItems.push(item);
          }
        }
        
        return combinedItems;
      }
      
      return ruleBasedItems;
    } catch (error) {
      console.error('Error generating checklist:', error);
      // Fall back to rule-based checklist if AI fails
      return this.generateRuleBasedChecklist(files, projectConfig);
    }
  }

  /**
   * Generate checklist items based on project rules
   * @param {Array} files - List of files changed
   * @param {Object} projectConfig - Project configuration
   * @returns {Array} - Generated checklist items
   */
  generateRuleBasedChecklist(files, projectConfig) {
    const checklist = [];
    
    if (!projectConfig || !projectConfig.checklistRules || !files) {
      return checklist;
    }
    
    // Get file paths
    const filePaths = files.map(file => file.filename || file.path);
    
    // Check each rule against the files
    for (const rule of projectConfig.checklistRules) {
      const { pattern, items } = rule;
      
      // Check if any file matches the pattern
      const matches = filePaths.some(filePath => {
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
      
      // If there's a match, add the checklist items
      if (matches) {
        for (const item of items) {
          if (!checklist.includes(item)) {
            checklist.push(item);
          }
        }
      }
    }
    
    return checklist;
  }

  /**
   * Generate checklist items using AI
   * @param {Object} data - Data for checklist generation
   * @returns {Promise<Array>} - AI-generated checklist items
   */
  async generateAIChecklist(data) {
    const { projectName, repository, commits, files, projectConfig } = data;
    
    try {
      // Prepare data for AI API
      const commitMessages = commits.map(commit => commit.commit.message).join('\n');
      const fileNames = files.map(file => file.filename || file.path).join('\n');
      
      // Create prompt for AI
      const prompt = `
        Generate a checklist for a code merge in the project "${projectName}" (${repository}).
        
        The following files were changed:
        ${fileNames}
        
        The commit messages were:
        ${commitMessages}
        
        Based on these changes, generate a checklist of important items to verify before deploying.
        Focus on potential issues, testing requirements, and documentation needs.
        Return the checklist as a JSON array of strings.
      `;
      
      // Call AI API
      const response = await axios.post(config.ai.apiUrl, {
        model: config.ai.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Parse response
      let checklist = [];
      
      if (response.data && response.data.choices && response.data.choices[0]) {
        try {
          // Try to parse as JSON
          checklist = JSON.parse(response.data.choices[0].text.trim());
        } catch (e) {
          console.warn('Failed to parse AI response as JSON, falling back to text parsing:', e.message);
          // If not valid JSON, split by newlines and clean up
          checklist = response.data.choices[0].text
            .split('\n')
            .map(line => line.trim().replace(/^-\s*/, ''))
            .filter(line => line.length > 0);
        }
      }

      // If AI returned empty checklist, fall back to default items
      if (!checklist || checklist.length === 0) {
        console.warn('AI returned empty checklist, using fallback items');
        checklist = this.getFallbackChecklist(files);
      }
      
      return checklist;
    } catch (error) {
      console.error('Error generating AI checklist:', error.message);
      if (error.response) {
        console.error('AI API response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      // Return fallback checklist items
      return this.getFallbackChecklist(files);
    }
  }

  /**
   * Generate fallback checklist items when AI fails
   * @param {Array} files - List of files changed
   * @returns {Array} - Default checklist items
   */
  getFallbackChecklist(files) {
    const fileTypes = new Set(files.map(file => {
      const ext = (file.filename || file.path || '').split('.').pop().toLowerCase();
      return ext;
    }));

    const checklist = [
      "Review all changed files for potential bugs and code quality issues",
      "Ensure commit messages follow project conventions",
      "Verify changes meet project requirements"
    ];

    // Add file-type specific checks
    if (fileTypes.has('sql')) {
      checklist.push("Review database changes for performance impact");
      checklist.push("Verify SQL query optimizations");
    }

    if (fileTypes.has('js') || fileTypes.has('ts')) {
      checklist.push("Run JavaScript/TypeScript linter");
      checklist.push("Check for console.log statements");
    }

    if (fileTypes.has('css') || fileTypes.has('scss')) {
      checklist.push("Verify CSS changes in different screen sizes");
      checklist.push("Check for CSS specificity conflicts");
    }

    if (files.some(f => (f.filename || f.path || '').includes('test'))) {
      checklist.push("Run all affected test suites");
      checklist.push("Verify test coverage");
    }

    return checklist;
  }
}

module.exports = new AIService(); 