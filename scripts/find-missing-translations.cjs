#!/usr/bin/env node

/**
 * Find Missing Translation Keys
 * 
 * Scans code for t('key.name') usage and checks if those keys exist
 * in the translation files.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Translation files to check
const localesDir = path.join(__dirname, '..', 'src', 'locales', 'sv');
const translationFiles = [
  'common.json',
  'navigation.json',
  'dashboard.json',
  'reports.json',
  'reportForm.json',
  'offers.json',
  'customers.json',
  'schedule.json',
  'admin.json',
  'email.json',
  'validation.json',
  'errors.json',
  'address.json',
  'login.json'
];

// Load all translations
const allTranslations = {};
for (const file of translationFiles) {
  const filePath = path.join(localesDir, file);
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    allTranslations[file.replace('.json', '')] = content;
  } catch (error) {
    console.warn(`Failed to load ${file}:`, error.message);
  }
}

// Flatten all translations into a single object
const flatTranslations = {};
function flatten(obj, prefix = '') {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flatten(value, fullKey);
    } else {
      flatTranslations[fullKey] = value;
    }
  }
}

for (const [file, translations] of Object.entries(allTranslations)) {
  flatten(translations, file);
}

// Now scan all TypeScript/TSX files for t('key')
const srcDir = path.join(__dirname, '..', 'src');
const files = glob.sync('**/*.{ts,tsx}', { 
  cwd: srcDir,
  ignore: ['node_modules/**', '**/*.d.ts']
});

const usedKeys = new Set();
const keysWithPatterns = new Set();

files.forEach(file => {
  const fullPath = path.join(srcDir, file);
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Match t('key.name') or t("key.name") but filter out import paths and other non-translation patterns
  const tMatches = content.matchAll(/t\(['"]([^'"]+)['"]\)/g);
  for (const match of tMatches) {
    const key = match[1];
    // Filter out paths, component names, and other non-translation keys
    if (!key.includes('/') && 
        !key.includes('\\') && 
        !key.includes('@') &&
        !key.includes('.ts') &&
        !key.includes('.tsx') &&
        !key.includes('component') &&
        !key.includes('react') &&
        !key.includes('firebase') &&
        !key.includes('html') &&
        key.match(/^[a-zA-Z]+\.[a-zA-Z]/)) { // Must have at least category.subcategory format
      usedKeys.add(key);
    }
  }
  
  // Match t('key.name', { ... }) with parameters
  const tWithParams = content.matchAll(/t\(['"]([^'"]+)['"]\s*,\s*\{/g);
  for (const match of tWithParams) {
    const key = match[1];
    if (!key.includes('/') && 
        !key.includes('\\') && 
        !key.includes('@') &&
        key.match(/^[a-zA-Z]+\.[a-zA-Z]/)) {
      usedKeys.add(key);
      keysWithPatterns.add(key);
    }
  }
});

// Find missing keys
const missingKeys = [];
for (const key of usedKeys) {
  if (!flatTranslations[key]) {
    missingKeys.push(key);
  }
}

// Results
console.log('\n📊 Translation Key Analysis\n');
console.log(`✅ Total keys in translation files: ${Object.keys(flatTranslations).length}`);
console.log(`🔍 Total keys used in code: ${usedKeys.size}`);
console.log(`⚠️  Missing translation keys: ${missingKeys.length}`);
console.log(`📝 Keys with parameters: ${keysWithPatterns.size}`);

if (missingKeys.length > 0) {
  console.log('\n❌ Missing Translation Keys:\n');
  
  // Group by category
  const byCategory = {};
  for (const key of missingKeys) {
    const category = key.split('.')[0];
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(key);
  }
  
  for (const [category, keys] of Object.entries(byCategory).sort()) {
    console.log(`\n📁 ${category} (${keys.length} keys):`);
    for (const key of keys.sort()) {
      console.log(`   - ${key}`);
    }
  }
  
  console.log('\n💡 Recommendation: Add these keys to the appropriate translation files.');
} else {
  console.log('\n✅ All translation keys are present!');
}

// Check for unused keys
const allKeys = new Set(Object.keys(flatTranslations));
const unusedKeys = [];
for (const key of allKeys) {
  if (!usedKeys.has(key) && !key.includes('placeholder') && !key.includes('error')) {
    unusedKeys.push(key);
  }
}

if (unusedKeys.length > 0 && unusedKeys.length < 20) {
  console.log(`\n📋 Potentially unused keys (${unusedKeys.length}):`);
  for (const key of unusedKeys.sort()) {
    console.log(`   - ${key}`);
  }
  console.log('\n💡 These keys might not be used anywhere. Review before removing.');
}

console.log('\n');

