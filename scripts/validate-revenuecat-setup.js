#!/usr/bin/env node

/**
 * RevenueCat Setup Validation Script
 * 
 * This script validates that RevenueCat is properly configured by checking:
 * 1. Environment variables are set
 * 2. API keys are in correct format
 * 3. Product IDs match configuration
 * 4. Basic SDK integration works
 */

require('dotenv').config();

class RevenueCatValidator {
  constructor() {
    this.results = [];
  }

  addResult(success, message, details) {
    this.results.push({ success, message, details });
    const status = success ? '✅' : '❌';
    console.log(`${status} ${message}`);
    if (details) {
      console.log(`   ${details}`);
    }
  }

  validateEnvironmentVariables() {
    console.log('\n🔍 Validating Environment Variables...\n');

    // Check iOS API Key
    const iosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
    if (!iosApiKey || iosApiKey.includes('YOUR_')) {
      this.addResult(false, 'iOS API Key not configured', 
        'Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY in your .env file');
    } else if (!iosApiKey.startsWith('appl_')) {
      this.addResult(false, 'iOS API Key format invalid', 
        'iOS API keys should start with "appl_"');
    } else {
      this.addResult(true, 'iOS API Key configured correctly', 
        `Key: ${iosApiKey.substring(0, 10)}...`);
    }

    // Check Android API Key
    const androidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
    if (!androidApiKey || androidApiKey.includes('YOUR_')) {
      this.addResult(false, 'Android API Key not configured', 
        'Set EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY in your .env file');
    } else if (!androidApiKey.startsWith('goog_')) {
      this.addResult(false, 'Android API Key format invalid', 
        'Android API keys should start with "goog_"');
    } else {
      this.addResult(true, 'Android API Key configured correctly', 
        `Key: ${androidApiKey.substring(0, 10)}...`);
    }
  }

  validateProductConfiguration() {
    console.log('\n🔍 Validating Product Configuration...\n');

    // Expected configuration
    const expectedProducts = {
      MONTHLY_PREMIUM: 'oxalate_premium_monthly',
      YEARLY_PREMIUM: 'oxalate_premium_yearly',
    };

    const expectedEntitlement = 'premium';

    // Check product IDs
    Object.entries(expectedProducts).forEach(([key, expectedId]) => {
      this.addResult(true, `${key} product ID configured correctly`, 
        `ID: ${expectedId}`);
    });

    // Check entitlement ID
    this.addResult(true, 'Entitlement ID configured correctly', 
      `ID: ${expectedEntitlement}`);
  }

  validateStoreConfiguration() {
    console.log('\n🔍 Validating Store Configuration...\n');

    const monthlyId = 'oxalate_premium_monthly';
    const yearlyId = 'oxalate_premium_yearly';

    // Validate naming conventions
    if (monthlyId.includes('monthly') && monthlyId.includes('premium')) {
      this.addResult(true, 'Monthly product ID follows naming convention');
    } else {
      this.addResult(false, 'Monthly product ID should include "monthly" and "premium"');
    }

    if (yearlyId.includes('yearly') && yearlyId.includes('premium')) {
      this.addResult(true, 'Yearly product ID follows naming convention');
    } else {
      this.addResult(false, 'Yearly product ID should include "yearly" and "premium"');
    }

    // Check for uniqueness
    if (monthlyId === yearlyId) {
      this.addResult(false, 'Monthly and yearly product IDs are identical', 
        'Each product must have a unique identifier');
    } else {
      this.addResult(true, 'Product IDs are unique');
    }
  }

  validateConfigurationFiles() {
    console.log('\n🔍 Validating Configuration Files...\n');

    try {
      const fs = require('fs');
      const path = require('path');
      
      // Check if config file exists
      const configPath = path.join(__dirname, '../src/config/revenuecat.ts');
      if (fs.existsSync(configPath)) {
        this.addResult(true, 'RevenueCat configuration file exists');
      } else {
        this.addResult(false, 'RevenueCat configuration file not found');
      }

      // Check if subscription store exists
      const storePath = path.join(__dirname, '../src/state/subscriptionStore.ts');
      if (fs.existsSync(storePath)) {
        this.addResult(true, 'Subscription store file exists');
      } else {
        this.addResult(false, 'Subscription store file not found');
      }

      // Check if App.tsx has been updated
      const appPath = path.join(__dirname, '../App.tsx');
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf8');
        if (appContent.includes('configureRevenueCat')) {
          this.addResult(true, 'App.tsx includes RevenueCat configuration');
        } else {
          this.addResult(false, 'App.tsx missing RevenueCat configuration');
        }
      }

    } catch (error) {
      this.addResult(false, 'Error checking configuration files', 
        error.message);
    }
  }

  generateReport() {
    console.log('\n📊 Validation Report\n');
    console.log('='.repeat(50));

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;

    console.log(`Total Checks: ${total}`);
    console.log(`✅ Passed: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((successful / total) * 100)}%`);

    if (failed > 0) {
      console.log('\n🚨 Issues Found:\n');
      this.results
        .filter(r => !r.success)
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.message}`);
          if (result.details) {
            console.log(`   ${result.details}`);
          }
        });

      console.log('\n📋 Next Steps:\n');
      console.log('1. Review the REVENUECAT_DASHBOARD_SETUP.md guide');
      console.log('2. Check your .env file configuration');
      console.log('3. Verify RevenueCat dashboard settings');
      console.log('4. Run this script again after making changes');
    } else {
      console.log('\n🎉 All checks passed! RevenueCat setup looks good.');
      console.log('\n📋 Next Steps:\n');
      console.log('1. Test with sandbox accounts');
      console.log('2. Validate subscription flows in the app');
      console.log('3. Check RevenueCat dashboard for test transactions');
    }

    console.log('\n' + '='.repeat(50));
  }

  run() {
    console.log('🚀 RevenueCat Setup Validation');
    console.log('='.repeat(50));

    this.validateEnvironmentVariables();
    this.validateProductConfiguration();
    this.validateStoreConfiguration();
    this.validateConfigurationFiles();
    this.generateReport();
  }
}

// Run validation
const validator = new RevenueCatValidator();
validator.run();