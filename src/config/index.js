/**
 * Main configuration file
 */
require('dotenv').config();
const projects = require('./projectConfig');

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
  },
  
  // GitHub configuration
  github: {
    token: process.env.GITHUB_TOKEN,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  },
  
  // Discord configuration
  discord: {
    defaultWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  },
  
  // AI service configuration (if needed)
  ai: {
    apiKey: process.env.AI_API_KEY,
    apiUrl: process.env.AI_API_URL,
    model: process.env.AI_MODEL,
  },
  
  // Projects configuration
  projects,
};

module.exports = config; 