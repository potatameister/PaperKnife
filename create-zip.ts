import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

const zip = new JSZip();
const rootDir = process.cwd();
const outputZip = path.join(rootDir, 'public', 'project.zip');

function addFilesToZip(currentDir: string, zipFolder: JSZip) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    // Skip node_modules, .git, and the output zip itself
    if (entry.name === 'node_modules' || entry.name === '.git' || fullPath === outputZip) continue;

    if (entry.isDirectory()) {
      const folder = zipFolder.folder(entry.name);
      if (folder) addFilesToZip(fullPath, folder);
    } else {
      const content = fs.readFileSync(fullPath);
      zipFolder.file(entry.name, content);
    }
  }
}

console.log('Creating project ZIP...');
addFilesToZip(rootDir, zip);

zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
  .pipe(fs.createWriteStream(outputZip))
  .on('finish', () => {
    console.log(`Project ZIP created successfully at ${outputZip}`);
  });
