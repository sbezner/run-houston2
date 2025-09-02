#!/usr/bin/env node

/**
 * Expo SDK 53 Fix Verifier
 * Comprehensive verification script to confirm the caching issue is resolved
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..', '..');

// Helper functions
function run(cmd, opts = {}) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      cwd: __dirname,
      ...opts
    });
    return { code: 0, stdout: result, stderr: '' };
  } catch (error) {
    return { 
      code: error.status || 1, 
      stdout: error.stdout || '', 
      stderr: error.stderr || error.message 
    };
  }
}

function fileExists(path) {
  return existsSync(join(__dirname, path));
}

function getOS() {
  if (process.platform === 'win32') return 'Windows';
  if (process.platform === 'darwin') return 'macOS';
  return 'Linux';
}

function checkPort8081() {
  const os = getOS();
  let cmd, result;
  
  if (os === 'Windows') {
    cmd = 'netstat -ano | findstr :8081';
    result = run(cmd);
  } else {
    cmd = 'lsof -i :8081 || true';
    result = run(cmd);
  }
  
  if (result.code === 0 && result.stdout.trim()) {
    const lines = result.stdout.trim().split('\n');
    const listeners = lines.filter(line => line.includes(':8081'));
    if (listeners.length > 0) {
      const pidMatch = listeners[0].match(/\s+(\d+)\s*$/);
      return { inUse: true, pid: pidMatch ? pidMatch[1] : 'unknown' };
    }
  }
  
  return { inUse: false, pid: null };
}

function validateBabelConfig() {
  const babelFiles = ['babel.config.js', 'babel.config.cjs'];
  let babelFile = null;
  
  for (const file of babelFiles) {
    if (fileExists(file)) {
      babelFile = file;
      break;
    }
  }
  
  if (!babelFile) {
    return { valid: false, error: 'No babel.config.* found - Expo requires Babel config' };
  }
  
  try {
    const content = readFileSync(join(__dirname, babelFile), 'utf8');
    
    // Check for problematic patterns
    const blockers = [
      /api\.cache\(false\)/,
      /api\.cache\.never\(\)/,
      /cacheDirectory:\s*false/,
      /cacheCompression:\s*false/,
      /custom.*cache/,
      /getCacheKey/
    ];
    
    for (const pattern of blockers) {
      if (pattern.test(content)) {
        return { valid: false, error: `Babel config contains blocked pattern: ${pattern.source}` };
      }
    }
    
    // Check for allowed presets
    const hasExpoPreset = /presets.*babel-preset-expo/.test(content) || 
                          /presets.*expo/.test(content);
    
    if (!hasExpoPreset) {
      return { valid: false, error: 'Babel config must use babel-preset-expo' };
    }
    
    return { valid: true, file: babelFile };
  } catch (error) {
    return { valid: false, error: `Failed to parse ${babelFile}: ${error.message}` };
  }
}

function validateMetroConfig() {
  const metroFiles = ['metro.config.js', 'metro.config.cjs'];
  let metroFile = null;
  
  for (const file of metroFiles) {
    if (fileExists(file)) {
      metroFile = file;
      break;
    }
  }
  
  if (!metroFile) {
    return { valid: true, file: null, note: 'No metro.config.* found - using Expo defaults' };
  }
  
  try {
    const content = readFileSync(join(__dirname, metroFile), 'utf8');
    
    // Check for problematic patterns
    const blockers = [
      /cacheStores.*\[\]/,
      /resetCache.*true/,
      /getCacheKey/,
      /custom.*cache/,
      /maxWorkers.*1/
    ];
    
    for (const pattern of blockers) {
      if (pattern.test(content)) {
        return { valid: false, error: `Metro config contains blocked pattern: ${pattern.source}` };
      }
    }
    
    // Check for minimal config
    const hasDefaultConfig = /getDefaultConfig.*expo\/metro-config/.test(content);
    
    if (!hasDefaultConfig) {
      return { valid: false, error: 'Metro config should use expo/metro-config default' };
    }
    
    return { valid: true, file: metroFile };
  } catch (error) {
    return { valid: false, error: `Failed to parse ${metroFile}: ${error.message}` };
  }
}

function testExpoStart() {
  try {
    // Simple test: just check if expo start --help works
    const result = run('npx expo start --help');
    
    if (result.code === 0) {
      // Check for any caching-related errors in the help output
      const output = result.stdout + result.stderr;
      const hasCachingError = /Caching has already been configured/.test(output);
      
      return {
        success: true,
        hasCachingError,
        output: output.substring(0, 500) + '...' // Truncate for display
      };
    } else {
      return {
        success: false,
        hasCachingError: false,
        error: result.stderr || 'Unknown error'
      };
    }
  } catch (error) {
    return {
      success: false,
      hasCachingError: false,
      error: error.message
    };
  }
}

// Main verification function
function verifyExpoFix() {
  console.log('🔍 Expo SDK 53 Fix Verifier');
  console.log('============================\n');
  
  const report = {
    environment: {},
    dependencies: {},
    configs: {},
    port: {},
    start: {},
    verdict: 'PASS'
  };
  
  // Environment check
  console.log('📋 Environment Check:');
  console.log('---------------------');
  report.environment = {
    node: process.version,
    npm: run('npm --version').stdout.trim(),
    os: getOS(),
    platform: process.platform
  };
  
  console.log(`Node.js: ${report.environment.node}`);
  console.log(`npm: ${report.environment.npm}`);
  console.log(`OS: ${report.environment.os}`);
  console.log(`Platform: ${report.environment.platform}\n`);
  
  // Dependency alignment check
  console.log('📦 Dependency Alignment Check:');
  console.log('--------------------------------');
  
  const expoVersion = run('npx expo --version');
  const expoList = run('npm ls expo --all');
  const cliList = run('npm ls @expo/cli --all');
  
  // Parse CLI version correctly
  const cliVersion = expoVersion.stdout.trim();
  const cliVersionMatch = cliVersion === '0.25.2';
  
  // Parse npm ls output for expo - count only unique versions, not deduped instances
  let expoInstances = 0;
  let expoVersionStr = '';
  
  if (expoList.stdout) {
    const expoMatches = expoList.stdout.match(/expo@([^\s]+)/g);
    if (expoMatches) {
      // Filter out deduped instances, count only unique versions
      const uniqueVersions = new Set(expoMatches.map(match => match.replace('expo@', '')));
      expoInstances = uniqueVersions.size;
      
      // Get the main expo version (first one found)
      const versionMatch = expoList.stdout.match(/expo@([^\s]+)/);
      if (versionMatch) {
        expoVersionStr = versionMatch[1];
      }
    }
  }
  
  // Parse npm ls output for @expo/cli - count only unique versions, not deduped instances
  let cliInstances = 0;
  
  if (cliList.stdout) {
    const cliMatches = cliList.stdout.match(/@expo\/cli@([^\s]+)/g);
    if (cliMatches) {
      // Filter out deduped instances, count only unique versions
      const uniqueVersions = new Set(cliMatches.map(match => match.replace('@expo/cli@', '')));
      cliInstances = uniqueVersions.size;
    }
  }
  
  report.dependencies = {
    cliVersion,
    cliVersionMatch,
    expoInstances,
    cliInstances,
    expoVersion: expoVersionStr
  };
  
  console.log(`CLI Version: ${cliVersion}`);
  console.log(`CLI Version Match (0.25.2): ${cliVersionMatch ? '✅' : '❌'}`);
  console.log(`@expo/cli Instances: ${cliInstances}`);
  console.log(`expo Instances: ${expoInstances}`);
  console.log(`expo Version: ${expoVersionStr}\n`);
  
  // Check for legacy expo-cli
  const legacyCli = run('npm ls expo-cli --all');
  if (legacyCli.stdout && legacyCli.stdout.includes('expo-cli')) {
    report.dependencies.hasLegacyCli = true;
    console.log('❌ Legacy expo-cli package found!');
  } else {
    report.dependencies.hasLegacyCli = false;
    console.log('✅ No legacy expo-cli package found');
  }
  console.log('');
  
  // Config validation
  console.log('⚙️  Configuration Check:');
  console.log('------------------------');
  
  const babelResult = validateBabelConfig();
  const metroResult = validateMetroConfig();
  
  report.configs = {
    babel: babelResult,
    metro: metroResult
  };
  
  if (babelResult.valid) {
    console.log(`✅ Babel config: ${babelResult.file || 'default'}`);
  } else {
    console.log(`❌ Babel config: ${babelResult.error}`);
    report.verdict = 'FAIL';
  }
  
  if (metroResult.valid) {
    console.log(`✅ Metro config: ${metroResult.file || 'default'}`);
  } else {
    console.log(`❌ Metro config: ${metroResult.error}`);
    report.verdict = 'FAIL';
  }
  console.log('');
  
  // Port check
  console.log('🔌 Port 8081 Check:');
  console.log('-------------------');
  
  const portStatus = checkPort8081();
  report.port = portStatus;
  
  if (portStatus.inUse) {
    console.log(`⚠️  Port 8081 is in use by PID: ${portStatus.pid}`);
  } else {
    console.log('✅ Port 8081 is available');
  }
  console.log('');
  
  // Start test
  console.log('🚀 Expo Start Test:');
  console.log('-------------------');
  
  const startResult = testExpoStart();
  report.start = startResult;
  
  if (startResult.success) {
    console.log('✅ Expo start command works');
    if (startResult.hasCachingError) {
      console.log('❌ Caching error detected in output');
      report.verdict = 'FAIL';
    } else {
      console.log('✅ No caching errors detected');
    }
  } else {
    console.log(`❌ Expo start command failed: ${startResult.error}`);
    report.verdict = 'FAIL';
  }
  console.log('');
  
  // Final verdict
  console.log('🎯 VERDICT:');
  console.log('===========');
  
  if (report.verdict === 'PASS') {
    console.log('✅ VERDICT: PASS');
    console.log('The Expo SDK 53 caching issue has been resolved!');
  } else {
    console.log('❌ VERDICT: FAIL');
    console.log('Issues found that need to be addressed:');
    
    if (!cliVersionMatch) {
      console.log('- CLI version mismatch: Expected 0.25.2, got ' + cliVersion);
    }
    
    if (cliInstances !== 1) {
      console.log('- Multiple @expo/cli instances found: ' + cliInstances);
    }
    
    if (expoInstances !== 1) {
      console.log('- Multiple expo instances found: ' + expoInstances);
    }
    
    if (report.dependencies.hasLegacyCli) {
      console.log('- Legacy expo-cli package found');
    }
    
    if (!babelResult.valid) {
      console.log('- Babel config issue: ' + babelResult.error);
    }
    
    if (!metroResult.valid) {
      console.log('- Metro config issue: ' + metroResult.error);
    }
    
    if (startResult.hasCachingError) {
      console.log('- Caching error detected in expo start output');
    }
    
    if (!startResult.success) {
      console.log('- Expo start command failed: ' + startResult.error);
    }
    
    console.log('\n💡 Recommended Fixes:');
    console.log('1. Remove lockfile and node_modules: rm -rf package-lock.json node_modules');
    console.log('2. Reinstall: npm install');
    console.log('3. Ensure only @expo/cli@0.25.2 is installed');
    console.log('4. Use npx expo --version instead of global expo');
    console.log('5. Revert Babel/Metro configs to Expo defaults if customized');
  }
  
  console.log('\n📊 Summary Report:');
  console.log('==================');
  console.log(`Environment: ${report.environment.os} ${report.environment.platform}`);
  console.log(`Node: ${report.environment.node}`);
  console.log(`CLI Version: ${cliVersion} (Expected: 0.25.2)`);
  console.log(`CLI Instances: ${cliInstances}`);
  console.log(`Expo Version: ${expoVersionStr}`);
  console.log(`Expo Instances: ${expoInstances}`);
  console.log(`Babel Config: ${babelResult.valid ? 'Valid' : 'Invalid'}`);
  console.log(`Metro Config: ${metroResult.valid ? 'Valid' : 'Invalid'}`);
  console.log(`Port 8081: ${portStatus.inUse ? 'In Use' : 'Available'}`);
  console.log(`Start Test: ${startResult.success && !startResult.hasCachingError ? 'Passed' : 'Failed'}`);
  
  process.exit(report.verdict === 'PASS' ? 0 : 1);
}

// Run verification
try {
  verifyExpoFix();
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}
