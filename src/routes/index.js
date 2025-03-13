/**
 * API Routes
 */
const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// GitHub webhook endpoint
router.post('/webhook/github', express.json(), webhookController.handleWebhook);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router; 