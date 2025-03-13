/**
 * Project Configuration Manager
 * 
 * This file loads and manages project configurations from the projects directory.
 */
const fs = require('fs');
const path = require('path');

// Load all project configurations
function loadProjectConfigs() {
  const projectsDir = path.join(__dirname, 'projects');
  const projects = {};

  // Read all files in the projects directory
  const files = fs.readdirSync(projectsDir);

  for (const file of files) {
    // Skip template file and non-js files
    if (file === '_template.js' || !file.endsWith('.js')) {
      continue;
    }

    // Load the project configuration
    try {
      const projectConfig = require(path.join(projectsDir, file));
      const projectId = path.basename(file, '.js');

      // Add the project configuration to the projects object
      projects[projectId] = projectConfig;
    } catch (error) {
      console.error(`Error loading project configuration from ${file}:`, error);
    }
  }

  return projects;
}

// Export the loaded project configurations
module.exports = loadProjectConfigs(); 