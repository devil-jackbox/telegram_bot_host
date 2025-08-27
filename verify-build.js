#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build configuration...');

const requiredFiles = [
  'package.json',
  'client/package.json',
  'server.js',
  '.nixpacks.toml',
  'railway.json',
  'railway.toml',
  'src/botManager.js',
  'client/src/App.js',
  'client/src/index.js',
  'client/src/index.css'
];

const requiredDirs = [
  'src/routes',
  'src/utils',
  'client/src/components',
  'client/src/contexts',
  'client/src/pages'
];

let allGood = true;

// Check required files
console.log('\n📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allGood = false;
  }
});

// Check required directories
console.log('\n📂 Checking required directories:');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}`);
  } else {
    console.log(`❌ ${dir} - MISSING`);
    allGood = false;
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['start', 'build', 'install:all'];
  
  requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`✅ ${script} script found`);
    } else {
      console.log(`❌ ${script} script missing`);
      allGood = false;
    }
  });
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`);
  allGood = false;
}

// Check client package.json
console.log('\n📦 Checking client package.json:');
try {
  const clientPkg = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
  const requiredClientScripts = ['start', 'build'];
  
  requiredClientScripts.forEach(script => {
    if (clientPkg.scripts && clientPkg.scripts[script]) {
      console.log(`✅ client ${script} script found`);
    } else {
      console.log(`❌ client ${script} script missing`);
      allGood = false;
    }
  });
} catch (error) {
  console.log(`❌ Error reading client/package.json: ${error.message}`);
  allGood = false;
}

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 All checks passed! Build should work.');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}