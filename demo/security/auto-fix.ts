#!/usr/bin/env bun

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve } from 'path';

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  overrides?: Record<string, string>;
  resolutions?: Record<string, string>;
}

console.log('🤖 Pastoralist Auto-Fix Security Demo\n');
console.log('='.repeat(60));

const packagePath = resolve('./package.json');
const backupPath = `${packagePath}.backup-${Date.now()}`;

console.log('\n1️⃣  Reading package.json...');
const packageJson: PackageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

console.log('2️⃣  Creating backup...');
copyFileSync(packagePath, backupPath);
console.log(`   📁 Backup saved to: ${backupPath.split('/').pop()}`);

console.log('3️⃣  Scanning for vulnerabilities...\n');

// Simulated fixes
const fixes = {
  'lodash': '4.17.21',
  'minimist': '1.2.6',
  'axios': '0.21.2',
  'express': '4.17.3',
  'moment': '2.29.4'
};

setTimeout(() => {
  console.log('⚠️  Found 5 vulnerable packages');
  console.log('   🔴 1 CRITICAL');
  console.log('   🟠 3 HIGH');
  console.log('   🟡 1 MEDIUM\n');
  
  console.log('4️⃣  Applying security fixes...\n');
  
  // Apply overrides
  if (!packageJson.overrides) {
    packageJson.overrides = {};
  }
  
  Object.entries(fixes).forEach(([pkg, version]) => {
    const old = packageJson.dependencies?.[pkg];
    console.log(`   ✅ ${pkg}: ${old} → ${version}`);
    packageJson.overrides[pkg] = version;
  });
  
  console.log('\n5️⃣  Writing updated package.json...');
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 Auto-fix complete!\n');
  console.log('Summary:');
  console.log(`   • Fixed ${Object.keys(fixes).length} vulnerabilities`);
  console.log(`   • Backup created: ${backupPath.split('/').pop()}`);
  console.log('   • Overrides added to package.json');
  
  console.log('\n⚠️  Next steps:');
  console.log('   1. Run "bun install" to apply the fixes');
  console.log('   2. Test your application');
  console.log('   3. Commit the changes');
  
  console.log('\n💡 To rollback if needed:');
  console.log(`   cp ${backupPath.split('/').pop()} package.json`);
}, 2000);