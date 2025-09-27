#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const readline = require('readline');
const util = require('util');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = util.promisify(rl.question).bind(rl);

// Configuration
const API_URL = 'http://localhost:5000/api';
let token = null;
let userId = null;

// Helper functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ️ ' + msg)),
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️ ' + msg)),
  json: (obj) => console.log(util.inspect(obj, { colors: true, depth: 4 }))
};

// API client
const api = {
  get: async (endpoint) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}${endpoint}`, { headers });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },
  post: async (endpoint, data) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${API_URL}${endpoint}`, data, { headers });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  }
};

// Test functions
async function testRegister() {
  log.info('Testing user registration...');
  
  const email = `test_${Date.now()}@test.com`;
  const password = 'test123';
  
  const response = await api.post('/auth/register', {
    name: 'Test User',
    email,
    password,
    avatar: '🚌',
    isPremium: false
  });
  
  if (response.success) {
    log.success('Registration successful!');
    token = response.data.token;
    userId = response.data.user.id;
    log.json(response.data);
    return { email, password };
  } else {
    log.error('Registration failed!');
    log.json(response);
    return null;
  }
}

async function testLogin(credentials) {
  log.info('Testing user login...');
  
  const response = await api.post('/auth/login', {
    email: credentials.email,
    password: credentials.password
  });
  
  if (response.success) {
    log.success('Login successful!');
    token = response.data.token;
    userId = response.data.user.id;
    log.json(response.data);
    return true;
  } else {
    log.error('Login failed!');
    log.json(response);
    return false;
  }
}

async function testGetProfile() {
  log.info('Testing get user profile...');
  
  const response = await api.get('/auth/profile');
  
  if (response.success) {
    log.success('Got profile successfully!');
    log.json(response.data);
    return true;
  } else {
    log.error('Failed to get profile!');
    log.json(response);
    return false;
  }
}

async function testLogout() {
  log.info('Testing logout...');
  
  const response = await api.post('/auth/logout');
  
  if (response.success) {
    log.success('Logout successful!');
    token = null;
    log.json(response);
    return true;
  } else {
    log.error('Logout failed!');
    log.json(response);
    return false;
  }
}

async function testUnauthorizedAccess() {
  log.info('Testing unauthorized access...');
  token = null;
  
  const response = await api.get('/auth/profile');
  
  if (!response.success && response.message === 'Access token required') {
    log.success('Unauthorized access correctly rejected!');
    return true;
  } else {
    log.error('Unauthorized access test failed!');
    log.json(response);
    return false;
  }
}

async function testHealthCheck() {
  log.info('Testing API health check...');
  
  try {
    const response = await axios.get(`${API_URL.replace('/api', '')}/health`);
    if (response.data.success) {
      log.success('API is healthy!');
      log.json(response.data);
      return true;
    } else {
      log.error('Health check failed!');
      log.json(response.data);
      return false;
    }
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  try {
    log.info('Starting authentication flow tests...');
    
    // Test health check first
    const apiAvailable = await testHealthCheck();
    if (!apiAvailable) {
      log.error('Cannot continue tests - API is not available!');
      return false;
    }
    
    // Test registration
    const credentials = await testRegister();
    if (!credentials) {
      log.error('Cannot continue tests - Registration failed!');
      return false;
    }
    
    // Test get profile after registration
    const profileAfterRegister = await testGetProfile();
    
    // Test logout
    const logoutSuccess = await testLogout();
    
    // Test unauthorized access
    const unauthorizedSuccess = await testUnauthorizedAccess();
    
    // Test login
    const loginSuccess = await testLogin(credentials);
    if (!loginSuccess) {
      log.error('Cannot continue tests - Login failed!');
      return false;
    }
    
    // Test get profile after login
    const profileAfterLogin = await testGetProfile();
    
    // Calculate test results
    const passedTests = [
      apiAvailable, 
      !!credentials, 
      profileAfterRegister, 
      logoutSuccess, 
      unauthorizedSuccess,
      loginSuccess,
      profileAfterLogin
    ].filter(Boolean).length;
    
    const totalTests = 7;
    
    log.info(`\nTest results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      log.success('All authentication tests passed! 🎉');
    } else {
      log.warning(`${totalTests - passedTests} tests failed.`);
    }
    
    return passedTests === totalTests;
  } catch (error) {
    log.error(`Test error: ${error.message}`);
    return false;
  } finally {
    rl.close();
  }
}

// Start tests
runTests();
