#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { getDemoFiles, demoConfig } from './demo-config.js';

const args = process.argv.slice(2);
const command = args[0] || 'help';

function generateEmbedCodes() {
  const embedHtml = demoConfig.embedCode;
  const markdownEmbed = `## Try Pastoralist Live

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/pastoralist-demo?file=README.md)

${embedHtml}`;

  const createUrl = 'https://stackblitz.com/fork/node?' + new URLSearchParams({
    title: 'Pastoralist Demo',
    description: 'Interactive demo of pastoralist - smart package override management',
    file: 'README.md',
    dependencies: JSON.stringify({
      'pastoralist': '^1.2.1',
      'lodash': '^4.17.21', 
      'react': '^18.2.0',
      'express': '^4.18.0'
    })
  }).toString();

  return { embedHtml, markdownEmbed, createUrl };
}

function writeEmbedFiles() {
  const demoFiles = getDemoFiles();
  const { embedHtml, markdownEmbed, createUrl } = generateEmbedCodes();

  // Write demo files for manual upload
  writeFileSync('demo-package.json', demoFiles['package.json']);
  writeFileSync('demo-index.js', demoFiles['index.js']);
  writeFileSync('demo-demo.js', demoFiles['demo.js']);
  writeFileSync('demo-README.md', demoFiles['README.md']);
  writeFileSync('demo-embed.html', embedHtml.trim());
  writeFileSync('demo-embed.md', markdownEmbed.trim());

  console.log('💾 Demo files written:');
  console.log('   • demo-package.json');
  console.log('   • demo-index.js');  
  console.log('   • demo-demo.js');
  console.log('   • demo-README.md');
  console.log('   • demo-embed.html');
  console.log('   • demo-embed.md');

  return createUrl;
}

function showHelp() {
  console.log('🐑 Pastoralist Demo Creator');
  console.log('===========================');
  console.log('');
  console.log('Usage: node create-demo.js [command]');
  console.log('');
  console.log('Commands:');
  console.log('  generate    Generate demo files and URLs');
  console.log('  embed       Show embed codes only');
  console.log('  files       Show demo file contents');
  console.log('  help        Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  node create-demo.js generate');
  console.log('  node create-demo.js embed');
}

function showEmbedCodes() {
  const { embedHtml, markdownEmbed, createUrl } = generateEmbedCodes();
  
  console.log('🔗 Quick Create URL:');
  console.log(createUrl);
  console.log('');
  
  console.log('📋 HTML Embed Code:');
  console.log(embedHtml.trim());
  console.log('');
  
  console.log('📝 Markdown Embed Code:');
  console.log(markdownEmbed.trim());
}

function showFileContents() {
  const demoFiles = getDemoFiles();
  
  console.log('📁 Demo Files:');
  Object.entries(demoFiles).forEach(([filename, content]) => {
    console.log(`\n--- ${filename} ---`);
    const preview = content.length > 300 ? content.substring(0, 300) + '...' : content;
    console.log(preview);
  });
}

function generateDemo() {
  console.log('🎯 Pastoralist Demo Generation');
  console.log('==============================');
  console.log('');

  const demoFiles = getDemoFiles();
  const { embedHtml, markdownEmbed, createUrl } = generateEmbedCodes();

  console.log('📁 Project Files:');
  Object.keys(demoFiles).forEach(file => {
    console.log(`   • ${file}`);
  });
  console.log('');

  console.log('🔗 Quick Create URL:');
  console.log(createUrl);
  console.log('');

  console.log('📋 Embed HTML (for websites):');
  console.log(embedHtml.trim());
  console.log('');

  console.log('📝 Markdown Embed (for README):');
  console.log(markdownEmbed.trim());
  console.log('');

  const finalCreateUrl = writeEmbedFiles();

  console.log('');
  console.log('🚀 Next Steps:');
  console.log('1. Visit the Quick Create URL above to create the demo');
  console.log('2. Use the demo-*.js files for manual setup');
  console.log('3. Add the embed code to your documentation');
  console.log('4. Open demo/create-demo.html in a browser for GUI creation');
}

// Main execution
switch (command) {
  case 'generate':
    generateDemo();
    break;
  case 'embed':
    showEmbedCodes();
    break;
  case 'files':
    showFileContents();
    break;
  case 'help':
  default:
    showHelp();
    break;
}
