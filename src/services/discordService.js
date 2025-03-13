/**
 * Discord Service
 * 
 * Handles sending notifications to Discord
 */
const axios = require('axios');
const config = require('../config');

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
      
      const response = await axios.post(url, {
        content: message,
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending Discord message:', error);
      throw error;
    }
  }

  /**
   * Send a rich embed message to Discord
   * @param {Object} embed - Discord embed object
   * @param {string} webhookUrl - Discord webhook URL (optional, uses default if not provided)
   * @returns {Promise<Object>} - Discord API response
   */
  async sendEmbed(embed, webhookUrl = null) {
    try {
      const url = webhookUrl || config.discord.defaultWebhookUrl;
      
      if (!url) {
        throw new Error('No Discord webhook URL provided');
      }
      
      const response = await axios.post(url, {
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
   * @param {Array} data.checklist - Checklist items
   * @param {Array} data.mentions - Users/roles to mention
   * @param {string} webhookUrl - Discord webhook URL (optional)
   * @returns {Promise<Object>} - Discord API response
   */
  async sendChecklistNotification(data, webhookUrl = null) {
    const { projectName, repository, branch, commitUrl, checklist, mentions } = data;
    
    // Create mentions string
    const mentionsStr = mentions && mentions.length > 0 
      ? mentions.join(' ') + '\n\n' 
      : '';
    
    // Create checklist string
    const checklistStr = checklist && checklist.length > 0
      ? checklist.map(item => `- ${item}`).join('\n')
      : 'No checklist items generated';
    
    // Create embed
    const embed = {
      title: `New merge to ${branch} in ${repository}`,
      description: `${mentionsStr}**Project:** ${projectName}\n\n**Checklist:**\n${checklistStr}`,
      color: 0x0099ff, // Blue color
      timestamp: new Date().toISOString(),
      footer: {
        text: 'GitHub Merge Checklist Bot',
      },
      url: commitUrl,
    };
    
    return this.sendEmbed(embed, webhookUrl);
  }
}

module.exports = new DiscordService(); 