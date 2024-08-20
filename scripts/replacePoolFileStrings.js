const fs = require('fs').promises;
const path = require('path');

const filePath = path.join('dist', 'index.js');
const searchString = 'src/processPackageJSON.ts';
const replacementString = 'dist/processPackageJSON.js';

async function replaceStringInFile({ filePath, searchString, replacementString }) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const replacedData = data.replace(new RegExp(searchString, 'g'), replacementString);
    await fs.writeFile(filePath, replacedData, 'utf8');
    console.log('String replaced successfully!');
  } catch (err) {
    console.error('Error replacing string:', err);
  }
}

replaceStringInFile();
