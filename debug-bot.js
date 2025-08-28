#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

console.log('🔍 Debug Bot Creation and File Operations');
console.log('==========================================');

// Test bot creation
async function testBotCreation() {
  const botsDir = path.join(__dirname, 'bots');
  const botId = uuidv4();
  const botDir = path.join(botsDir, botId);
  
  console.log('📁 Bot Directory:', botDir);
  
  try {
    // Create bot directory
    await fs.ensureDir(botDir);
    console.log('✅ Bot directory created');
    
    // Create config
    const config = {
      id: botId,
      name: 'Test Bot',
      token: 'test-token',
      language: 'javascript',
      code: 'console.log("Hello World");',
      autoStart: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save config
    await fs.writeJson(path.join(botDir, 'config.json'), config, { spaces: 2 });
    console.log('✅ Config saved');
    
    // Create bot file
    const filePath = path.join(botDir, 'bot.js');
    await fs.writeFile(filePath, config.code);
    console.log('✅ Bot file created:', filePath);
    
    // Verify files exist
    const configExists = await fs.pathExists(path.join(botDir, 'config.json'));
    const fileExists = await fs.pathExists(filePath);
    
    console.log('📋 File verification:');
    console.log('  - config.json exists:', configExists);
    console.log('  - bot.js exists:', fileExists);
    
    if (configExists && fileExists) {
      // Read files back
      const savedConfig = await fs.readJson(path.join(botDir, 'config.json'));
      const savedCode = await fs.readFile(filePath, 'utf8');
      
      console.log('📖 File contents:');
      console.log('  - Config:', JSON.stringify(savedConfig, null, 2));
      console.log('  - Code:', savedCode);
      
      console.log('✅ Bot creation test successful!');
    } else {
      console.log('❌ File verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testBotCreation();