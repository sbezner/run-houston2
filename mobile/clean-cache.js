#!/usr/bin/env node

/**
 * Bulletproof Cache Cleaner
 * Cleans all caches to ensure fresh builds
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning All Caches...');
console.log('==========================');

const dirsToClean = [
  '.expo',
  'node_modules/.cache',
  'dist',
  'build',
  '.metro-cache',
  '.babel-cache'
];

const filesToClean = [
  'metro.config.js.cache',
  'babel.config.js.cache'
];

try {
  // Clean directories
  dirsToClean.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Removing ${dir}...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });

  // Clean files
  filesToClean.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Removing ${file}...`);
      fs.unlinkSync(fullPath);
    }
  });

  // Clean npm cache
  console.log('🧹 Cleaning npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });

  // Clean Expo cache
  console.log('🧹 Cleaning Expo cache...');
  execSync('npx expo install --fix', { stdio: 'inherit' });

  console.log('✅ All caches cleaned successfully!');
  console.log('🚀 Ready for fresh build!');

} catch (error) {
  console.error('❌ Error cleaning caches:', error.message);
  process.exit(1);
}
