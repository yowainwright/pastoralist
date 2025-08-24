#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';

console.log('🚀 Starting Pastoralist Migration\n');
console.log('='.repeat(60));

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

console.log('\n📋 Step 1: Analyzing existing overrides...\n');

// Simulate analysis
const overrideAnalysis = {
  'lodash': { needed: true, reason: 'Security fix for CVE-2021-23337', dependents: ['express'] },
  'minimist': { needed: true, reason: 'Security fix for CVE-2021-44906', dependents: ['multiple packages'] },
  'glob-parent': { needed: false, reason: 'No longer used by any dependency' },
  'trim-newlines': { needed: false, reason: 'Dependency updated, override not needed' },
  'node-fetch': { needed: true, reason: 'Security fix for SSRF vulnerability', dependents: ['axios'] }
};

Object.entries(overrideAnalysis).forEach(([name, info]) => {
  const status = info.needed ? '✅ Keep' : '🗑️  Remove';
  console.log(`   ${status}: ${name}`);
  console.log(`      Reason: ${info.reason}`);
  if (info.dependents) {
    console.log(`      Required by: ${info.dependents}`);
  }
  console.log();
});

console.log('📋 Step 2: Cleaning up overrides...\n');

// Remove unnecessary overrides
const cleanedOverrides: Record<string, string> = {};
Object.entries(pkg.overrides).forEach(([name, version]) => {
  if (overrideAnalysis[name as keyof typeof overrideAnalysis]?.needed) {
    cleanedOverrides[name] = version as string;
    console.log(`   ✅ Keeping ${name}`);
  } else {
    console.log(`   🗑️  Removing ${name} (not needed)`);
  }
});

console.log('\n📋 Step 3: Adding documentation...\n');

// Add pastoralist appendix
pkg.overrides = cleanedOverrides;
pkg.pastoralist = {
  appendix: {
    'lodash@4.17.21': {
      dependents: { 'express': '4.16.0' },
      reason: 'Security fix: Prototype Pollution (CVE-2021-23337)'
    },
    'minimist@1.2.6': {
      dependents: { 'various': 'multiple' },
      reason: 'Security fix: Prototype Pollution (CVE-2021-44906)'
    },
    'node-fetch@2.6.7': {
      dependents: { 'axios': '0.21.0' },
      reason: 'Security fix: SSRF vulnerability'
    }
  },
  config: {
    autoClean: true,
    security: {
      enabled: true,
      provider: 'osv'
    }
  }
};

// Remove the comment
delete pkg.comment;

console.log('   ✅ Added appendix with documentation');
console.log('   ✅ Configured automatic maintenance');
console.log('   ✅ Enabled security scanning');

console.log('\n📋 Step 4: Saving migrated package.json...\n');

writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');

console.log('='.repeat(60));
console.log('\n✨ Migration Complete!\n');

console.log('Results:');
console.log(`   • Removed ${Object.keys(pkg.overrides).length} unnecessary overrides`);
console.log(`   • Documented ${Object.keys(cleanedOverrides).length} required overrides`);
console.log('   • Added automatic security scanning');
console.log('   • Configured for ongoing maintenance');

console.log('\n📚 Next Steps:');
console.log('   1. Run "bun run after" to see the result');
console.log('   2. Add to scripts: "postinstall": "pastoralist"');
console.log('   3. Commit the cleaned package.json');
console.log('   4. Share with team!');

console.log('\n🎉 Your overrides are now:');
console.log('   ✅ Documented');
console.log('   ✅ Justified');
console.log('   ✅ Maintained automatically');
console.log('   ✅ Security-aware');