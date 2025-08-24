#!/usr/bin/env bun

import { readFileSync } from 'fs';

console.log('📸 BEFORE: Current State\n');
console.log('='.repeat(60));

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

console.log('\n❌ Problems with current overrides:\n');

console.log('1. No documentation:');
console.log('   Nobody knows why these overrides exist\n');

console.log('2. Potentially outdated:');
console.log('   Some might not be needed anymore\n');

console.log('3. Missing security fixes:');
console.log('   No automatic security updates\n');

console.log('4. Manual maintenance:');
console.log('   Developers must remember to update\n');

console.log('-'.repeat(60));
console.log('\n📦 Current package.json overrides:\n');

if (pkg.overrides) {
  Object.entries(pkg.overrides).forEach(([name, version]) => {
    console.log(`   ${name}: ${version}`);
    console.log('   ❓ Why? Unknown - no documentation');
    console.log('   ❓ Still needed? Unknown');
    console.log('   ❓ Security fix? Unknown\n');
  });
}

console.log('-'.repeat(60));
console.log('\n⚠️  Risk Assessment:\n');
console.log('   🔴 High risk of outdated overrides');
console.log('   🔴 No audit trail for changes');
console.log('   🔴 Security vulnerabilities might be missed');
console.log('   🔴 Technical debt accumulation');

console.log('\n💡 Solution: Migrate to pastoralist!');
console.log('   Run: bun run migrate');