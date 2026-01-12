#!/usr/bin/env node

/**
 * Analyze Unused Code
 * 
 * Scans codebase for unused components, services, and exports.
 * Identifies files not imported anywhere and orphaned code.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const srcDir = path.join(__dirname, '..', 'src');
const componentsDir = path.join(srcDir, 'components');
const servicesDir = path.join(srcDir, 'services');
const utilsDir = path.join(srcDir, 'utils');

const report = {
  date: new Date().toISOString(),
  orphanedFiles: [],
  unusedComponents: [],
  unusedServices: [],
  duplicateExports: [],
  legacyMarkers: [],
};

// Get all TypeScript/TSX files
function getAllSourceFiles(dir) {
  return glob.sync('**/*.{ts,tsx}', {
    cwd: dir,
    absolute: true,
    ignore: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**', '**/dist/**'],
  });
}

// Find all imports in a file
function findImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];
  
  // Match import statements
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    let importPath = match[1];
    
    // Resolve relative imports
    if (importPath.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filePath), importPath);
      imports.push({
        original: importPath,
        resolved: resolved,
        file: filePath,
      });
    } else if (!importPath.startsWith('@')) {
      // Skip node_modules imports
      imports.push({
        original: importPath,
        resolved: null,
        file: filePath,
      });
    }
  }
  
  return imports;
}

// Check if a file is imported anywhere
function isFileImported(targetFile, allFiles) {
  const targetWithoutExt = targetFile.replace(/\.(ts|tsx)$/, '');
  const targetDir = path.dirname(targetFile);
  const targetBase = path.basename(targetWithoutExt);
  
  for (const file of allFiles) {
    if (file === targetFile) continue;
    
    const imports = findImports(file);
    for (const imp of imports) {
      if (imp.resolved && imp.resolved.startsWith(targetWithoutExt)) {
        return true;
      }
      
      // Check for index imports
      if (imp.original.endsWith(path.dirname(targetFile)) || 
          imp.original === path.relative(path.dirname(file), targetWithoutExt).replace(/\\/g, '/')) {
        return true;
      }
      
      // Check for default exports
      if (imp.resolved && path.dirname(imp.resolved) === targetDir && 
          path.basename(imp.resolved, path.extname(imp.resolved)) === targetBase) {
        return true;
      }
    }
  }
  
  return false;
}

// Find exports in a file
function findExports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const exports = [];
  
  // Match export statements
  const exportRegex = /export\s+(?:default\s+)?(?:const|function|class|interface|type)\s+(\w+)/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  return exports;
}

// Check for legacy markers
function findLegacyMarkers(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const markers = [];
  
  if (content.includes('@legacy') || 
      content.includes('@deprecated') ||
      content.includes('Legacy') ||
      content.includes('DEPRECATED') ||
      content.includes('legacy wrapper') ||
      content.includes('deprecated')) {
    markers.push(filePath);
  }
  
  return markers;
}

// Main analysis
console.log('🔍 Analyzing codebase for unused code...\n');

const allFiles = getAllSourceFiles(srcDir);
const componentFiles = allFiles.filter(f => f.includes('/components/'));
const serviceFiles = allFiles.filter(f => f.includes('/services/'));

// Analyze orphaned files
console.log('📁 Checking for orphaned files...');
for (const file of allFiles) {
  // Skip main entry points
  if (file.includes('main.tsx') || 
      file.includes('App.tsx') || 
      file.includes('index.ts') ||
      file.includes('LazyComponents.tsx') ||
      file.includes('Router.tsx') ||
      file.includes('routing/index.tsx')) {
    continue;
  }
  
  if (!isFileImported(file, allFiles)) {
    const relativePath = path.relative(srcDir, file);
    report.orphanedFiles.push(relativePath);
    console.log(`  ⚠️  ${relativePath}`);
  }
}

// Check for legacy markers
console.log('\n🏷️  Checking for legacy/deprecated markers...');
for (const file of allFiles) {
  const markers = findLegacyMarkers(file);
  if (markers.length > 0) {
    const relativePath = path.relative(srcDir, file);
    report.legacyMarkers.push(relativePath);
    console.log(`  📌 ${relativePath}`);
  }
}

// Specific checks
console.log('\n🔎 Checking specific components...');

// Check OptimizedDashboard
const optimizedDashboard = allFiles.find(f => f.includes('OptimizedDashboard'));
if (optimizedDashboard) {
  const isUsed = isFileImported(optimizedDashboard, allFiles);
  if (!isUsed) {
    report.unusedComponents.push('OptimizedDashboard.tsx');
    console.log('  ❌ OptimizedDashboard.tsx appears unused');
  } else {
    console.log('  ✅ OptimizedDashboard.tsx is used');
  }
}

// Check AddressWithMap (v1)
const addressWithMap = allFiles.find(f => f.includes('AddressWithMap.tsx') && !f.includes('AddressWithMapV2'));
if (addressWithMap) {
  const isUsed = isFileImported(addressWithMap, allFiles);
  if (!isUsed) {
    report.unusedComponents.push('AddressWithMap.tsx');
    console.log('  ❌ AddressWithMap.tsx appears unused (V2 may have replaced it)');
  } else {
    console.log('  ✅ AddressWithMap.tsx is used');
  }
}

// Check Router.tsx
const router = allFiles.find(f => f.includes('Router.tsx') && !f.includes('routing'));
if (router) {
  console.log('  ℹ️  Router.tsx is a re-export wrapper (may be legacy pattern)');
}

// Check emailService.ts
const emailService = allFiles.find(f => f.includes('emailService.ts'));
if (emailService) {
  const content = fs.readFileSync(emailService, 'utf-8');
  if (content.includes('Legacy') || content.includes('legacy wrapper')) {
    report.legacyMarkers.push('services/emailService.ts');
    console.log('  📌 emailService.ts is marked as legacy');
  }
}

// Generate report
const reportPath = path.join(__dirname, '..', 'docs', 'archive', `code-analysis-${new Date().toISOString().split('T')[0]}.md`);
const reportDir = path.dirname(reportPath);

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportContent = `# Code Analysis Report

Generated: ${report.date}

## Summary

- **Orphaned Files**: ${report.orphanedFiles.length}
- **Unused Components**: ${report.unusedComponents.length}
- **Legacy Markers**: ${report.legacyMarkers.length}

## Orphaned Files

Files that don't appear to be imported anywhere:

${report.orphanedFiles.map(f => `- \`${f}\``).join('\n') || 'None found'}

## Unused Components

Components that appear unused:

${report.unusedComponents.map(c => `- \`${c}\``).join('\n') || 'None found'}

## Legacy Markers

Files containing legacy/deprecated markers:

${report.legacyMarkers.map(f => `- \`${f}\``).join('\n') || 'None found'}

## Notes

- This analysis is based on static import analysis
- Manual verification is recommended for all flagged items
- Some files may be imported dynamically or via route definitions
`;

fs.writeFileSync(reportPath, reportContent, 'utf-8');

console.log(`\n✅ Report generated: ${reportPath}`);
console.log(`\n📊 Summary:`);
console.log(`   - Orphaned files: ${report.orphanedFiles.length}`);
console.log(`   - Unused components: ${report.unusedComponents.length}`);
console.log(`   - Legacy markers: ${report.legacyMarkers.length}`);
