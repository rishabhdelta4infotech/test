/**
 * Webhook Controller
 * 
 * Handles GitHub webhook events
 */
const checklistService = require('../services/checklistService');
const discordService = require('../services/discordService');
const githubService = require('../services/githubService');
const aiService = require('../services/aiService');
const config = require('../config');

/**
 * Handle GitHub webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleWebhook(req, res) {
  try {
    const event = req.headers['x-github-event'];
    const signature = req.headers['x-hub-signature-256'];
    const payload = req.body;
    
    // print the secret key
    console.log("secret key",config.github.webhookSecret);
    // Verify webhook signature
    if (config.github.webhookSecret) {
      
      const isValid = githubService.verifyWebhookSignature(signature, JSON.stringify(payload));
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    // Handle different event types
    switch (event) {
      case 'pull_request':
        await handlePullRequestEvent(payload);
        break;
        
      case 'push':
        await handlePushEvent(payload);
        break;
        
      default:
        console.log(`Ignoring unsupported event: ${event}`);
    }
    
    // Respond to GitHub
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle pull request events
 * @param {Object} payload - GitHub webhook payload
 */
async function handlePullRequestEvent(payload) {
  console.log('Payload-------------------------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-->>');
  try {
    const { action, pull_request } = payload;
    
    // Only process closed pull requests that were merged
    if (action === 'closed' && pull_request.merged) {
      console.log(`Processing merged pull request: ${pull_request.title}`);
      
      // Process the pull request
      const result = await checklistService.processPullRequest(payload);
      console.log('Result----->>', result);

      
      if (result.success) {
        // Send notification to Discord
        await sendDiscordNotification(result);
      } else {
        console.log(`Skipping notification: ${result.message || 'Unknown error'}`);
      }
    } else {
      console.log(`Ignoring pull request action: ${action}`);
    }
  } catch (error) {
    console.error('Error handling pull request event:', error);
  }
}

/**
 * Handle push events
 * @param {Object} payload - GitHub webhook payload
 */
async function handlePushEvent(payload) {
  console.log('push event-------------------------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-->>');
  try {
    const { ref, repository } = payload;
    
    // Extract branch name from ref (refs/heads/branch-name)
    const branch = ref.replace('refs/heads/', '');
    
    // Find matching project configuration
    const repoFullName = repository.full_name;
    const projectConfig = checklistService.findProjectConfig(repoFullName);
    
    if (!projectConfig) {
      console.log(`No project configuration found for repository: ${repoFullName}`);
      return;
    }
    
    // Check if the branch is monitored
    if (!projectConfig.monitoredBranches.includes(branch)) {
      console.log(`Branch ${branch} is not monitored for repository: ${repoFullName}`);
      return;
    }
    
    console.log(`Processing push to ${branch} in ${repoFullName}`);
    
    // Extract repository information
    const [owner, repo] = repoFullName.split('/');
    
    // Get recent commits
    const commits = await githubService.getRecentCommits(owner, repo, branch, 10);
    
    // TODO: Implement logic to get files changed in the push
    // This is more complex for push events than for pull requests
    // For now, we'll use an empty array
    const files = [];
    
    // Generate checklist
    const checklist = await aiService.generateChecklist({
      projectName: projectConfig.name,
      repository: repoFullName,
      commits,
      files,
      projectConfig,
    });
    console.log('checklist----->>', checklist);
    console.log("files----->>", files);
    
    // Assign teams based on file changes
    const teamAssignments = checklistService.assignTeams(files, projectConfig);
    
    // Send notification to Discord
    await sendDiscordNotification({
      success: true,
      projectName: projectConfig.name,
      repository: repoFullName,
      branch,
      commits,
      files,
      checklist,
      teamAssignments,
    });
  } catch (error) {
    console.error('Error handling push event:', error);
  }
}

/**
 * Send notification to Discord
 * @param {Object} result - Processing result
 */
async function sendDiscordNotification(result) {
  try {
    const {
      projectName,
      repository,
      branch,
      checklist,
      teamAssignments,
      pullRequest,
      files,
      commits
    } = result;
    
    // Get Discord mentions
    const mentions = checklistService.getDiscordMentions(teamAssignments);
    
    // Get commit URL
    const commitUrl = pullRequest 
      ? pullRequest.html_url 
      : `https://github.com/${repository}/tree/${branch}`;
    
    // Send notification
    await discordService.sendChecklistNotification({
      projectName,
      repository,
      branch,
      commitUrl,
      checklist,
      mentions,
      files,
      commits
    });
    
    console.log(`Sent Discord notification for ${repository} (${branch})`);
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

module.exports = {
  handleWebhook,
}; 