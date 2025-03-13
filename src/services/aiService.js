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
   * @returns {Promise<Object>} - Generated checklist items and summary
   */
  async generateChecklist(data) {
    const { projectName, repository, commits, files, projectConfig } = data;
    const metadata = projectConfig.metadata || {};
    
    try {
      // First, analyze the changes to determine their scope and impact
      const changeAnalysis = this.analyzeChanges(files, projectConfig);
      
      // Generate base checklist items based on project rules
      let checklist = this.generateRuleBasedChecklist(files, projectConfig);
      
      // Filter checklist based on change analysis
      checklist = this.filterChecklistByScope(checklist, changeAnalysis);
      
      // If AI API is configured, enhance the checklist with AI-generated items
      if (config.ai.apiKey && config.ai.apiUrl) {
        const aiResult = await this.generateAIChecklist(data, changeAnalysis);
        
        // Return the structured checklist format
        return {
          changeSummary: aiResult.changeSummary,
          developerChecklist: [
            ...checklist,
            ...aiResult.developerChecklist
          ],
          testerChecklist: metadata.skipTesterChecklist ? null : aiResult.testerChecklist
        };
      }
      
      // If no AI, return a basic structure with rule-based checklist
      return {
        changeSummary: `Changes to ${files.length} files in ${repository}`,
        developerChecklist: checklist,
        testerChecklist: metadata.skipTesterChecklist ? null : [
          'Test the affected functionality',
          'Verify changes work as expected',
          'Check for regressions'
        ]
      };
    } catch (error) {
      console.error('Error generating checklist:', error);
      // Fall back to rule-based checklist if AI fails
      const basicChecklist = this.generateRuleBasedChecklist(files, projectConfig);
      return {
        changeSummary: `⚠️ Error generating AI checklist: ${error.message}`,
        developerChecklist: basicChecklist,
        testerChecklist: metadata.skipTesterChecklist ? null : [
          'Test the affected functionality',
          'Verify changes work as expected',
          'Check for regressions'
        ]
      };
    }
  }

  /**
   * Analyze changes to determine their scope and impact
   * @param {Array} files - List of files changed
   * @param {Object} projectConfig - Project configuration
   * @returns {Object} - Analysis results
   */
  analyzeChanges(files, projectConfig) {
    const metadata = projectConfig.metadata || {};
    const analysis = {
      isLowRisk: true,
      isCritical: false,
      scope: 'minimal', // minimal, moderate, significant
      impactedSystems: new Set(),
      matchedRules: new Set(), // Track which checklist rules were matched
      criticalPathsModified: [], // Track which critical paths were modified
      lowRiskPathsModified: [], // Track which low-risk paths were modified
      ruleBasedRiskLevel: 'low' // Additional risk assessment based on matched rules
    };

    // Get file paths
    const filePaths = files.map(file => file.filename || file.path);
    
    // Check if changes are in critical paths
    if (metadata.criticalPaths) {
      for (const path of filePaths) {
        for (const criticalPath of metadata.criticalPaths) {
          if (this.matchesPattern(path, criticalPath)) {
            analysis.isCritical = true;
            analysis.isLowRisk = false;
            analysis.criticalPathsModified.push(criticalPath);
            break;
          }
        }
      }
    }
    
    // Check if changes are only in low-risk paths
    if (metadata.lowRiskPaths) {
      analysis.isLowRisk = filePaths.every(path => {
        const matchedLowRisk = metadata.lowRiskPaths.some(pattern => {
          const isMatch = this.matchesPattern(path, pattern);
          if (isMatch) {
            analysis.lowRiskPathsModified.push(pattern);
          }
          return isMatch;
        });
        return matchedLowRisk;
      });
    }
    
    // Check which checklist rules match
    if (projectConfig.checklistRules) {
      for (const rule of projectConfig.checklistRules) {
        const { pattern, items } = rule;
        // Check if any file matches the pattern
        if (filePaths.some(filePath => this.matchesPattern(filePath, pattern))) {
          analysis.matchedRules.add(pattern);
          
          // Adjust risk level based on number and type of checks required
          const criticalKeywords = ['security', 'critical', 'auth', 'database', 'migration'];
          const hasHighRiskChecks = items.some(item => 
            criticalKeywords.some(keyword => item.toLowerCase().includes(keyword))
          );
          
          if (hasHighRiskChecks) {
            analysis.ruleBasedRiskLevel = 'high';
            analysis.isLowRisk = false;
          } else if (items.length > 3 && analysis.ruleBasedRiskLevel === 'low') {
            analysis.ruleBasedRiskLevel = 'moderate';
          }
        }
      }
    }
    
    // Determine scope based on various factors
    if (files.length > 10 || analysis.isCritical || analysis.ruleBasedRiskLevel === 'high') {
      analysis.scope = 'significant';
    } else if (files.length > 3 || !analysis.isLowRisk || analysis.ruleBasedRiskLevel === 'moderate') {
      analysis.scope = 'moderate';
    }
    
    // Identify impacted systems
    for (const [team, config] of Object.entries(projectConfig.teams || {})) {
      if (filePaths.some(path => 
        config.filePatterns.some(pattern => this.matchesPattern(path, pattern))
      )) {
        analysis.impactedSystems.add(team);
      }
    }
    
    return analysis;
  }

  /**
   * Filter checklist items based on change analysis
   * @param {Array} checklist - Original checklist items
   * @param {Object} analysis - Change analysis results
   * @returns {Array} - Filtered checklist items
   */
  filterChecklistByScope(checklist, analysis) {
    // For low-risk changes, keep only essential items
    if (analysis.isLowRisk && analysis.scope === 'minimal') {
      return checklist.filter(item => 
        item.toLowerCase().includes('verify') || 
        item.toLowerCase().includes('check')
      ).slice(0, 2); // Keep only up to 2 items for minimal changes
    }
    
    // For moderate changes, keep a reasonable number of items
    if (analysis.scope === 'moderate') {
      return checklist.slice(0, 5); // Keep up to 5 items
    }
    
    // For significant or critical changes, keep all items
    return checklist;
  }

  /**
   * Simple pattern matching helper
   * @param {string} path - File path
   * @param {string} pattern - Glob pattern
   * @returns {boolean} - Whether path matches pattern
   */
  matchesPattern(path, pattern) {
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      return new RegExp(regexPattern).test(path);
    }
    return path === pattern || path.includes(pattern);
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
   * @param {Object} changeAnalysis - Change analysis results
   * @returns {Promise<Object>} - Generated checklists and summaries
   */
  async generateAIChecklist(data, changeAnalysis) {
    const { projectName, repository, commits, files, projectConfig } = data;
    
    try {
      // Prepare data for AI API
      const commitMessages = commits.map(commit => commit.commit.message).join('\n');
      const fileNames = files.map(file => file.filename || file.path).join('\n');
      const metadata = projectConfig.metadata || {};
      
      // Create context section from metadata
      const contextSection = `
Project Context:
- Name: ${projectName}
- Repository: ${repository}
- Description: ${metadata.description || 'Not specified'}
- Type: ${metadata.type || 'Not specified'}
- Complexity Level: ${metadata.complexity || 'Not specified'}
- Change Risk Level: ${changeAnalysis.isLowRisk ? 'Low' : changeAnalysis.isCritical ? 'Critical' : 'Moderate'}
- Change Scope: ${changeAnalysis.scope}
- Impacted Systems: ${Array.from(changeAnalysis.impactedSystems).join(', ')}

Critical Paths:
${metadata.criticalPaths ? metadata.criticalPaths.map(path => `- ${path}`).join('\n') : 'None specified'}

Low Risk Paths:
${metadata.lowRiskPaths ? metadata.lowRiskPaths.map(path => `- ${path}`).join('\n') : 'None specified'}`;

      // Create prompt for AI with enhanced context and role-specific requirements
      const prompt = `
You are a code review assistant for the following project:

${contextSection}

Project Rules and Guidelines:
${projectConfig.checklistRules ? projectConfig.checklistRules.map(rule => `
Pattern: ${rule.pattern}
Required Checks:
${rule.items.map(item => `- ${item}`).join('\n')}`).join('\n\n') : 'No specific rules defined'}

The following files were changed:
${fileNames}

The commit messages were:
${commitMessages}

Based on the project rules, context, and changes, generate sections as follows:

1. CHANGE SUMMARY:
- Provide a clear, concise summary of the changes based on commit messages
- Highlight key modifications and their purpose
- Note any breaking changes or important updates
- Format as a brief paragraph
- Indicate if any critical paths (${metadata.criticalPaths ? metadata.criticalPaths.join(', ') : 'none specified'}) were modified

2. DEVELOPER CHECKLIST:
- Start with the specific rule-based checks that match the changed files
- Add code quality and technical implementation checks
- Include specific files or components that need careful review
- Consider architecture and performance implications
- Add security considerations if relevant
- Include specific paths or functions that need attention
- Format as an array of checklist items
- Prioritize checks for critical paths if modified

${!metadata.skipTesterChecklist ? `3. TESTER CHECKLIST:
- Focus on functional testing and user scenarios
- Include test cases that don't require code access
- Cover user workflows and edge cases
- Include UI/UX verification points if relevant
- Add performance testing points if needed
- Format as an array of checklist items` : ''}

Return the response as a JSON object with this structure:
{
  "changeSummary": "Your summary here",
  "developerChecklist": [
    "First developer item",
    "Second developer item"
  ]${!metadata.skipTesterChecklist ? `,
  "testerChecklist": [
    "First tester item",
    "Second tester item"
  ]` : ''}
}

Important Guidelines:
1. For critical paths (${metadata.criticalPaths ? metadata.criticalPaths.join(', ') : 'none specified'}), include extra validation steps
2. For low-risk paths (${metadata.lowRiskPaths ? metadata.lowRiskPaths.join(', ') : 'none specified'}), keep checks minimal
3. Adjust detail level based on:
   - Risk Level: ${changeAnalysis.isLowRisk ? 'Low' : changeAnalysis.isCritical ? 'Critical' : 'Moderate'}
   - Change Scope: ${changeAnalysis.scope}
   - Impacted Systems: ${Array.from(changeAnalysis.impactedSystems).join(', ')}
4. Always include relevant project-specific rules from the checklist rules section`;

      console.log('Enhanced AI Prompt:', prompt);
      
      // Call AI API
      const response = await axios.post(config.ai.apiUrl, {
        model: config.ai.model,
        messages: [{ 
          role: 'system',
          content: 'You are a specialized code review assistant that generates contextual summaries and role-specific checklists based on code changes and project metadata.'
        }, {
          role: 'user',
          content: prompt
        }]
      }, {
        headers: {
          'Authorization': `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Parse response
      let result = {
        changeSummary: '',
        developerChecklist: [],
        testerChecklist: metadata.skipTesterChecklist ? null : []
      };
      
      if (response.data && response.data.choices && response.data.choices[0]) {
        try {
          console.log("AI Response:",response.data.choices[0]?.message?.content);
          // Clean up the response content
          const content = (response.data.choices[0].message?.content || response.data.choices[0].text || '')
            .trim()
            // Remove any markdown code block indicators
            .replace(/^```json\s*/g, '')
            .replace(/^```\s*/g, '')
            .replace(/```$/g, '')
            .trim();

          // Try to parse as JSON
          result = JSON.parse(content);

          // Validate the structure
          if (!result.changeSummary) result.changeSummary = '';
          if (!Array.isArray(result.developerChecklist)) result.developerChecklist = [];
          if (!metadata.skipTesterChecklist && !Array.isArray(result.testerChecklist)) {
            result.testerChecklist = [];
          }
        } catch (e) {
          console.warn('Failed to parse AI response as JSON:', e.message);
          console.log('Raw AI response:', response.data.choices[0].message?.content || response.data.choices[0].text);
          
          // Try to parse sections manually
          const content = response.data.choices[0].message?.content || response.data.choices[0].text;
          const sections = content.split(/\d\.\s+/g).filter(Boolean);
          
          result = {
            changeSummary: sections[0]?.trim() || '',
            developerChecklist: sections[1]
              ? sections[1]
                .split('\n')
                .map(line => line.trim().replace(/^[-*]\s*/, ''))
                .filter(line => line.length > 0)
              : [],
            testerChecklist: metadata.skipTesterChecklist ? null : (
              sections[2]
                ? sections[2]
                  .split('\n')
                  .map(line => line.trim().replace(/^[-*]\s*/, ''))
                  .filter(line => line.length > 0)
                : []
            )
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error generating AI checklist:', error.message);
      if (error.response) {
        console.error('AI API response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }

      // Return error information with direct change details
      const fileChanges = files.map(file => {
        const path = file.filename || file.path;
        const type = path.split('.').pop().toLowerCase();
        return `- ${path} (${type})`;
      }).join('\n');

      const formattedCommits = commits.map(commit => 
        `- ${commit.commit.message}`
      ).join('\n');

      return {
        changeSummary: `⚠️ Error: ${error.message}\n\nFiles Changed:\n${fileChanges}\n\nCommit Messages:\n${formattedCommits}`,
        developerChecklist: [`Please review the changes manually and ensure code quality`],
        testerChecklist: [`Please test the affected functionality manually`]
      };
    }
  }
}

module.exports = new AIService(); 