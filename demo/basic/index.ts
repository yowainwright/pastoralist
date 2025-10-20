#!/usr/bin/env node

import { readFileSync } from 'fs';

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
  pastoralist?: {
    appendix?: Record<string, {
      dependents?: Record<string, string>;
      reason?: string;
    }>;
  };
}

console.log('🐑 Pastoralist Basic Demo\n');
console.log('='.repeat(50));

console.log(`
This demo shows the basic functionality of pastoralist:
- Tracking package overrides
- Creating an appendix with dependency information
- Automatic cleanup of unused overrides
`);

// Show current state
try {
  const pkg: PackageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  
  console.log('📦 Current Overrides:');
  if (pkg.overrides) {
    Object.entries(pkg.overrides).forEach(([name, version]) => {
      console.log(`   ${name}: ${version}`);
    });
  } else {
    console.log('   None');
  }
  
  console.log('\n📋 Pastoralist Appendix:');
  if (pkg.pastoralist?.appendix) {
    Object.entries(pkg.pastoralist.appendix).forEach(([override, info]) => {
      console.log(`   ${override}`);
      if (info.dependents) {
        console.log(`     Required by: ${Object.keys(info.dependents).join(', ')}`);
      }
      if (info.reason) {
        console.log(`     Reason: ${info.reason}`);
      }
    });
  } else {
    console.log('   Not yet created (run "bun run fix" first)');
  }
} catch (error) {
  console.error('Error reading package.json:', error);
}

console.log(`
🚀 Commands to try:
   npm start       - Show this demo
   npm run check   - Check what pastoralist would do
   npm run fix     - Run pastoralist to fix overrides

💡 After running pastoralist, check package.json to see:
   - The appendix that documents each override
   - Which packages depend on each override
   - Any overrides that were removed (if unnecessary)
`);