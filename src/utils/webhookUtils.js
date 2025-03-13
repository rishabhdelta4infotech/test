/**
 * Webhook Utilities
 * 
 * Utilities for handling webhooks
 */
const crypto = require('crypto');
const config = require('../config');

/**
 * Verify GitHub webhook signature
 * @param {string} signature - Webhook signature from GitHub
 * @param {string} payload - Webhook payload as string
 * @returns {boolean} - Whether the signature is valid
 */
function verifyGitHubSignature(signature, payload) {
  if (!config.github.webhookSecret) {
    // If no webhook secret is configured, skip verification
    return true;
  }
  
  if (!signature) {
    return false;
  }
  
  // GitHub signature is in the format "sha256=hash"
  const [algorithm, hash] = signature.split('=');
  
  if (algorithm !== 'sha256') {
    return false;
  }
  
  // Calculate expected signature
  const hmac = crypto.createHmac('sha256', config.github.webhookSecret);
  const expectedSignature = hmac.update(payload).digest('hex');
  
  // Compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

module.exports = {
  verifyGitHubSignature,
}; 