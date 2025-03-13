/**
 * GitHub Merge Checklist Bot
 * 
 * Main server file
 */
const express = require('express');
const routes = require('./routes');
const config = require('./config');

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Default route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'GitHub Merge Checklist Bot',
    description: 'A bot that generates checklists based on previous commits when merging to master or development branches, and notifies teams on Discord.',
  });
});

// Start server
const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook URL: https://sxsmg1w4-3000.inc1.devtunnels.ms/webhook/github`);
}); 