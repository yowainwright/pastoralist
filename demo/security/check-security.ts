#!/usr/bin/env bun

import { readFileSync } from 'fs';

interface Vulnerability {
  name: string;
  current: string;
  fixed: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cve: string;
  description: string;
}

// Simulated vulnerability data (in production, this comes from OSV/GitHub/etc.)
const vulnerabilities: Vulnerability[] = [
  {
    name: 'lodash',
    current: '4.17.20',
    fixed: '4.17.21',
    severity: 'HIGH',
    cve: 'CVE-2021-23337',
    description: 'Prototype Pollution'
  },
  {
    name: 'minimist',
    current: '1.2.5',
    fixed: '1.2.6',
    severity: 'CRITICAL',
    cve: 'CVE-2021-44906',
    description: 'Prototype Pollution allowing RCE'
  },
  {
    name: 'axios',
    current: '0.21.0',
    fixed: '0.21.2',
    severity: 'HIGH',
    cve: 'CVE-2021-3749',
    description: 'Server-Side Request Forgery'
  },
  {
    name: 'express',
    current: '4.17.1',
    fixed: '4.17.3',
    severity: 'MEDIUM',
    cve: 'CVE-2022-24999',
    description: 'qs vulnerability in dependency'
  },
  {
    name: 'moment',
    current: '2.29.1',
    fixed: '2.29.4',
    severity: 'HIGH',
    cve: 'CVE-2022-31129',
    description: 'Path traversal vulnerability'
  }
];

console.log('🔍 Pastoralist Security Check\n');
console.log('='.repeat(60));

console.log('\nScanning dependencies for vulnerabilities...\n');

// Show loading animation
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let i = 0;

const loader = setInterval(() => {
  process.stdout.write(`\r${frames[i]} Checking vulnerability databases...`);
  i = (i + 1) % frames.length;
}, 100);

setTimeout(() => {
  clearInterval(loader);
  process.stdout.write('\r' + ' '.repeat(40) + '\r'); // Clear the line
  
  console.log(`⚠️  Found ${vulnerabilities.length} vulnerable packages:\n`);
  
  const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
  
  console.log(`Summary: ${criticalCount} critical, ${highCount} high, ${mediumCount} medium\n`);
  console.log('-'.repeat(60));
  
  vulnerabilities.forEach((vuln, index) => {
    const emoji = {
      'CRITICAL': '🔴',
      'HIGH': '🟠',
      'MEDIUM': '🟡',
      'LOW': '🟢'
    }[vuln.severity];
    
    console.log(`\n${index + 1}. ${emoji} ${vuln.name}@${vuln.current}`);
    console.log(`   Severity: ${vuln.severity}`);
    console.log(`   Issue: ${vuln.description}`);
    console.log(`   CVE: ${vuln.cve}`);
    console.log(`   Fix available: ${vuln.fixed}`);
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log('\n📝 Recommended actions:');
  console.log('   1. Run "bun run fix" to auto-fix all vulnerabilities');
  console.log('   2. Run "bun run interactive" to choose which to fix');
  console.log('   3. Add to package.json for automatic checks:');
  console.log('      "postinstall": "pastoralist --security"');
  
  console.log('\n✨ Use pastoralist to automatically generate overrides!');
}, 1500);