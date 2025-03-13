/**
 * Discord Service
 * 
 * Handles sending notifications to Discord
 */
const axios = require('axios');
const config = require('../config');

// Discord limits
const DISCORD_LIMITS = {
  EMBED_DESCRIPTION: 4096,
  TOTAL_EMBED_LENGTH: 6000,
  MESSAGE_CONTENT: 2000
};

class DiscordService {
  /**
   * Send a message to a Discord webhook
   * @param {string} message - Message to send
   * @param {string} webhookUrl - Discord webhook URL (optional, uses default if not provided)
   * @returns {Promise<Object>} - Discord API response
   */
  async sendMessage(message, webhookUrl = null) {
    try {
      const url = webhookUrl || config.discord.defaultWebhookUrl;
      
      if (!url) {
        throw new Error('No Discord webhook URL provided');
      }

      // Split message if it exceeds Discord's limit
      const messages = this.splitMessage(message);
      const responses = [];

      for (const msg of messages) {
        const response = await axios.post(url, {
          content: msg,
        });
        responses.push(response.data);
      }
      
      return responses;
    } catch (error) {
      console.error('Error sending Discord message:', error);
      throw error;
    }
  }

  /**
   * Split a message into chunks that fit Discord's limits
   * @param {string} message - Message to split
   * @returns {Array<string>} - Array of message chunks
   */
  splitMessage(message) {
    if (message.length <= DISCORD_LIMITS.MESSAGE_CONTENT) {
      return [message];
    }

    const chunks = [];
    let currentChunk = '';

    // Split by newlines first to try to keep logical breaks
    const lines = message.split('\n');

    for (const line of lines) {
      if ((currentChunk + '\n' + line).length > DISCORD_LIMITS.MESSAGE_CONTENT) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = line;
        } else {
          // If a single line is too long, split it by characters
          const chars = line.split('');
          while (chars.length) {
            currentChunk = chars.splice(0, DISCORD_LIMITS.MESSAGE_CONTENT).join('');
            chunks.push(currentChunk);
          }
          currentChunk = '';
        }
      } else {
        currentChunk = currentChunk ? currentChunk + '\n' + line : line;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Send a rich embed message to Discord
   * @param {Object} embed - Discord embed object
   * @param {string} content - Optional content field for mentions
   * @param {string} webhookUrl - Discord webhook URL (optional, uses default if not provided)
   * @returns {Promise<Object>} - Discord API response
   */
  async sendEmbed(embed, content = '', webhookUrl = null) {
    try {
      const url = webhookUrl || config.discord.defaultWebhookUrl;
      
      if (!url) {
        throw new Error('No Discord webhook URL provided');
      }

      // Handle large embed descriptions
      if (embed.description && embed.description.length > DISCORD_LIMITS.EMBED_DESCRIPTION) {
        const chunks = this.splitMessage(embed.description);
        const responses = [];

        // Send first chunk as main embed
        const mainEmbed = { ...embed, description: chunks[0] };
        const mainResponse = await axios.post(url, {
          content: content,
          embeds: [mainEmbed],
        });
        responses.push(mainResponse.data);

        // Send remaining chunks as follow-up messages
        for (let i = 1; i < chunks.length; i++) {
          const followUpEmbed = {
            description: chunks[i],
            color: embed.color,
          };
          const response = await axios.post(url, {
            embeds: [followUpEmbed],
          });
          responses.push(response.data);
        }

        return responses;
      }
      
      const response = await axios.post(url, {
        content: content,
        embeds: [embed],
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending Discord embed:', error);
      throw error;
    }
  }

  /**
   * Create a checklist notification for Discord
   * @param {Object} data - Notification data
   * @param {string} data.projectName - Project name
   * @param {string} data.repository - Repository name
   * @param {string} data.branch - Branch name
   * @param {string} data.commitUrl - Commit URL
   * @param {Object} data.checklist - Structured checklist data
   * @param {Array} data.files - List of changed files
   * @param {Array} data.commits - List of commits
   * @param {Array} data.mentions - Users/roles to mention
   * @param {string} webhookUrl - Discord webhook URL (optional)
   * @returns {Promise<Object>} - Discord API response
   */
  async sendChecklistNotification(data, webhookUrl = null) {
    console.log('Sending checklist notification', data);
    const { projectName, repository, branch, commitUrl, checklist, files, commits, mentions } = data;
    
    // Create mentions string - ensure proper Discord mention format
    const mentionsContent = mentions && mentions.length > 0 
      ? mentions.map(mention => {
          if (mention.startsWith('<@') && mention.endsWith('>')) return mention;
          if (mention.startsWith('@')) return `<@&${mention.substring(1)}>`;
          return `<@${mention}>`;
        }).join(' ') + ` New changes in ${repository}!`
      : '';

    // Format file changes with better validation
    const fileChanges = Array.isArray(files) && files.length > 0
      ? files.filter(file => file && (typeof file === 'string' || file.filename || file.path))
          .map(file => {
            const path = typeof file === 'string' ? file : (file.filename || file.path);
            if (!path) return '- Unknown file';
            const type = path.split('.').pop().toLowerCase();
            return `- ${path} (${type})`;
          }).join('\n')
      : '- No files changed';

    // Format commit messages with better validation
    const commitMessages = Array.isArray(commits) && commits.length > 0
      ? commits.filter(commit => commit?.commit?.message)
          .map(commit => `- ${commit.commit.message}`)
          .join('\n')
      : '- No commit messages available';

    // Format the structured checklist
    let changeSummarySection = '';
    let developerSection = '';
    let testerSection = '';

    // Handle change summary section
    if (checklist.changeSummary && !checklist.changeSummary.includes('⚠️')) {
      changeSummarySection = `**Change Summary:**\n${checklist.changeSummary}\n\n` +
        `**Files Changed:**\n${fileChanges}\n\n` +
        `**Commit Messages:**\n${commitMessages}`;
    } else if (checklist.changeSummary && checklist.changeSummary.includes('⚠️')) {
      // If it's an error message, use it directly as it already contains formatted information
      changeSummarySection = checklist.changeSummary;
    } else {
      changeSummarySection = '**Change Summary:**\n❌ No changes summary available.\n\n' +
        `**Files Changed:**\n${fileChanges}\n\n` +
        `**Commit Messages:**\n${commitMessages}`;
    }

    // Handle developer checklist section
    if (checklist.developerChecklist && checklist.developerChecklist.length > 0) {
      developerSection = '**Developer Review Checklist:**\n' + 
        checklist.developerChecklist.map(item => `- ${item}`).join('\n');
    } else {
      developerSection = '**Developer Review Checklist:**\n❌ No automated checklist available.\n' +
        '- Please review code changes manually\n' +
        '- Check for code quality and potential issues\n' +
        '- Verify implementation meets requirements';
    }

    // Handle tester checklist section - only if not explicitly skipped
    if (checklist.testerChecklist !== null) {
      if (checklist.testerChecklist && checklist.testerChecklist.length > 0) {
        testerSection = '\n\n**Tester Checklist:**\n' + 
          checklist.testerChecklist.map(item => `- ${item}`).join('\n');
      } else {
        testerSection = '\n\n**Tester Checklist:**\n❌ No automated checklist available.\n' +
          '- Test the affected functionality\n' +
          '- Verify user workflows\n' +
          '- Check for regressions';
      }
    } else {
      testerSection = ''; // Skip tester section entirely
    }

    // Split sections if they are too large
    const sections = [];
    
    // Main embed with change summary
    sections.push({
      title: `🔄 New merge to ${branch} in ${repository}`,
      description: changeSummarySection,
      color: checklist.changeSummary?.includes('⚠️') ? 0xFFA500 : 0x0099ff,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'GitHub Merge Checklist Bot',
      },
      url: commitUrl,
    });

    // Developer checklist section
    if (developerSection.length > DISCORD_LIMITS.EMBED_DESCRIPTION) {
      const chunks = this.splitMessage(developerSection);
      chunks.forEach((chunk, index) => {
        sections.push({
          title: index === 0 ? 'Developer Review Checklist (continued)' : undefined,
          description: chunk,
          color: 0x0099ff,
        });
      });
    } else {
      sections.push({
        title: 'Developer Review Checklist',
        description: developerSection,
        color: 0x0099ff,
      });
    }

    // Tester checklist section (if present)
    if (testerSection) {
      if (testerSection.length > DISCORD_LIMITS.EMBED_DESCRIPTION) {
        const chunks = this.splitMessage(testerSection);
        chunks.forEach((chunk, index) => {
          sections.push({
            title: index === 0 ? 'Tester Checklist (continued)' : undefined,
            description: chunk,
            color: 0x0099ff,
          });
        });
      } else {
        sections.push({
          title: 'Tester Checklist',
          description: testerSection,
          color: 0x0099ff,
        });
      }
    }

    // Send all sections
    const responses = [];
    for (let i = 0; i < sections.length; i++) {
      const response = await this.sendEmbed(
        sections[i],
        i === 0 ? mentionsContent : '', // Only include mentions in the first message
        webhookUrl
      );
      responses.push(response);
    }

    return responses;
  }
}

module.exports = new DiscordService(); 