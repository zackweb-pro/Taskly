#!/usr/bin/env node

/**
 * Build script for Taskly Chrome Extension
 * This script replaces placeholders in config.js with actual environment variables
 * and creates a production-ready build.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BUILD_DIR = 'dist';
const SOURCE_FILES = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'popup.css',
  'config.js',
  'supabase.js',
  'background.js',
  'content.js',
  'content.css',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

function createBuildDirectory() {
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }
  console.log(`✓ Build directory created: ${BUILD_DIR}`);
}

function replaceEnvironmentVariables(content) {
  // Replace placeholders with actual environment variables
  const replacements = {
    '__SUPABASE_URL__': process.env.SUPABASE_URL,
    '__SUPABASE_ANON_KEY__': process.env.SUPABASE_ANON_KEY
  };

  let processedContent = content;
  
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (!value) {
      console.error(`❌ Environment variable for ${placeholder} is not set!`);
      process.exit(1);
    }
    
    // Replace the placeholder with the actual value
    processedContent = processedContent.replace(
      new RegExp(placeholder, 'g'),
      value
    );
  }

  return processedContent;
}

function copyFile(fileName) {
  // Set up source and destination paths
  const sourcePath = path.join(__dirname, fileName);
  const destPath = path.join(__dirname, BUILD_DIR, fileName);

  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  File not found, skipping: ${fileName}`);
    return;
  }

  // Create subdirectories if they don't exist
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`✓ Created directory: ${path.relative(__dirname, destDir)}`);
  }

  try {
    // For binary files (images), copy directly
    if (fileName.includes('.png') || fileName.includes('.jpg') || fileName.includes('.ico')) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ Copied (binary): ${fileName}`);
      return;
    }

    // For text files, read as string and process if needed
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Only process config.js for environment variable replacement
    if (fileName === 'config.js') {
      content = replaceEnvironmentVariables(content);
      console.log(`✓ Processed environment variables in: ${fileName}`);
    }
    
    fs.writeFileSync(destPath, content);
    console.log(`✓ Copied: ${fileName}`);
  } catch (error) {
    // Fallback to binary copy if text reading fails
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ Copied (binary fallback): ${fileName}`);
    } catch (copyError) {
      console.error(`❌ Failed to copy ${fileName}:`, copyError.message);
    }
  }
}

function validateEnvironmentVariables() {
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missingVars = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your .env file or environment.');
    process.exit(1);
  }

  console.log('✓ All required environment variables are present');
}

function updateManifestForProduction() {
  const manifestPath = path.join(__dirname, BUILD_DIR, 'manifest.json');
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Remove the key field for production (if it exists)
    if (manifest.key) {
      delete manifest.key;
      console.log('✓ Removed development key from manifest');
    }
    
    // Update version if needed
    if (process.env.BUILD_VERSION) {
      manifest.version = process.env.BUILD_VERSION;
      console.log(`✓ Updated version to: ${process.env.BUILD_VERSION}`);
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✓ Updated manifest.json for production');
  } catch (error) {
    console.error('❌ Error updating manifest:', error.message);
  }
}

function main() {
  console.log('🚀 Building Taskly Chrome Extension...\n');
  
  // Validate environment variables
  validateEnvironmentVariables();
  
  // Create build directory
  createBuildDirectory();
  
  // Copy and process files
  console.log('\n📁 Copying files...');
  SOURCE_FILES.forEach(copyFile);
  
  // Update manifest for production
  console.log('\n⚙️  Updating manifest...');
  updateManifestForProduction();
  
  console.log('\n✅ Build completed successfully!');
  console.log(`📦 Production build available in: ./${BUILD_DIR}`);
  console.log('\n📋 Next steps:');
  console.log('   1. Test the extension by loading the dist folder in Chrome');
  console.log('   2. Package the dist folder as a .zip for Chrome Web Store');
  console.log('   3. Upload to Chrome Web Store for review');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Taskly Build Script

Usage: node build.js [options]

Options:
  --help, -h     Show this help message
  --clean        Clean the build directory before building

Environment Variables Required:
  SUPABASE_URL        Your Supabase project URL
  SUPABASE_ANON_KEY   Your Supabase anonymous key

Optional Environment Variables:
  BUILD_VERSION       Version to set in manifest.json

Example:
  node build.js
  BUILD_VERSION=1.0.1 node build.js
`);
  process.exit(0);
}

if (process.argv.includes('--clean')) {
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    console.log('🧹 Cleaned build directory');
  }
}

// Run the build
main();
