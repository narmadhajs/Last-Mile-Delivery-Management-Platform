const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createDeliverableZip() {
  const rootDir = path.resolve(__dirname, '..');
  const deliverablesDir = path.join(rootDir, 'deliverables');
  const outputPath = path.join(deliverablesDir, 'last-mile-delivery-tracker.zip');

  if (!fs.existsSync(deliverablesDir)) {
    fs.mkdirSync(deliverablesDir, { recursive: true });
  }

  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  output.on('close', function () {
    const sizeInMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
    console.log(`\n======================================================`);
    console.log(`🎉 Deliverable ZIP package successfully generated!`);
    console.log(`📦 File: ${outputPath}`);
    console.log(`📊 Size: ${sizeInMB} MB (${archive.pointer()} bytes)`);
    console.log(`======================================================\n`);
  });

  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      console.warn('Archiver warning:', err);
    } else {
      throw err;
    }
  });

  archive.on('error', function (err) {
    throw err;
  });

  archive.pipe(output);

  // Exclude node_modules, build artifacts, db files, and existing zip files
  const ignorePatterns = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/deliverables/*.zip',
    '**/*.db',
    '**/*.db-journal',
    '**/*.sqlite',
    '**/.DS_Store',
    '**/Thumbs.db'
  ];

  archive.glob('**/*', {
    cwd: rootDir,
    ignore: ignorePatterns,
    dot: true
  });

  await archive.finalize();
}

createDeliverableZip().catch(err => {
  console.error('Failed to create zip package:', err);
  process.exit(1);
});
