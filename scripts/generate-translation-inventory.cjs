#!/usr/bin/env node

/**
 * Translation Inventory Generator
 * 
 * Scans all translation files and generates a comprehensive inventory
 * in docs/05-reference/TRANSLATION_INVENTORY.md
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales', 'sv');
const outputPath = path.join(__dirname, '..', 'docs', '05-reference', 'TRANSLATION_INVENTORY_AUTO.md');

// Translation files to scan
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

function loadTranslationFile(filename) {
  const filePath = path.join(localesDir, filename);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load ${filename}:`, error.message);
    return {};
  }
}

function getPrefix(key) {
  const parts = key.split('.');
  return parts.length > 0 ? parts[0] : key;
}

function categorizeKeys(obj, prefix = '') {
  const categories = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(categories, categorizeKeys(value, fullKey));
    } else {
      const catPrefix = getPrefix(fullKey);
      if (!categories[catPrefix]) {
        categories[catPrefix] = [];
      }
      categories[catPrefix].push({
        key: fullKey,
        value: value,
        type: typeof value
      });
    }
  }
  
  return categories;
}

function generateMarkdown(categories) {
  let markdown = `# Translation Inventory (Auto-Generated)

> **Auto-generated on:** ${new Date().toISOString()}  
> **Source:** \`src/locales/sv/\`  
> **Total Keys:** ${Object.values(categories).flat().length}

---

## Translation Keys by Category

`;

  // Sort categories alphabetically
  const sortedCategories = Object.keys(categories).sort();
  
  for (const category of sortedCategories) {
    const keys = categories[category].sort((a, b) => a.key.localeCompare(b.key));
    
    markdown += `### ${category}\n\n`;
    markdown += `**Total Keys:** ${keys.length}\n\n`;
    
    markdown += `| Key | Type | Swedish Value |\n`;
    markdown += `|-----|------|---------------|\n`;
    
    // Show first 10 entries as sample
    for (const item of keys.slice(0, 10)) {
      const value = typeof item.value === 'string' ? item.value.substring(0, 50) : JSON.stringify(item.value);
      markdown += `| \`${item.key}\` | ${item.type} | ${value.replace(/\|/g, '\\|')} |\n`;
    }
    
    if (keys.length > 10) {
      markdown += `| ... | ... | (${keys.length - 10} more keys) |\n`;
    }
    
    markdown += `\n<details><summary>View all ${category} keys</summary>\n\n`;
    markdown += `| Key | Type | Swedish Value |\n`;
    markdown += `|-----|------|---------------|\n`;
    
    for (const item of keys) {
      const value = typeof item.value === 'string' ? item.value.substring(0, 80) : JSON.stringify(item.value);
      markdown += `| \`${item.key}\` | ${item.type} | ${value.replace(/\|/g, '\\|')} |\n`;
    }
    
    markdown += `\n</details>\n\n`;
  }
  
  return markdown;
}

// Main execution
console.log('🔍 Scanning translation files...');

const allKeys = {};
let totalKeys = 0;

for (const file of translationFiles) {
  const translations = loadTranslationFile(file);
  const prefix = path.basename(file, '.json');
  
  allKeys[prefix] = translations;
  totalKeys += Object.keys(translations).length;
}

console.log(`✅ Loaded ${totalKeys} translation keys from ${translationFiles.length} files`);

// Categorize all keys
const categories = {};
for (const [file, translations] of Object.entries(allKeys)) {
  Object.assign(categories, categorizeKeys(translations));
}

// Generate markdown
const markdown = generateMarkdown(categories);

// Write output
fs.writeFileSync(outputPath, markdown, 'utf-8');

console.log(`✅ Generated inventory: ${outputPath}`);
console.log(`📊 Total categories: ${Object.keys(categories).length}`);
console.log(`🔑 Total keys: ${totalKeys}`);

