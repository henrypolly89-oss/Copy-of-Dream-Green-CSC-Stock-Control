const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Save with backup and cleanup
function saveWithBackup(filename, data) {
  data.savedAt = new Date().toISOString();

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  // Save main file
  fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, 2));

  // Create backup file
  const baseName = path.basename(filename, '.json');
  const backupName = `${baseName}.${Date.now()}.bak.json`;
  const backupPath = path.join(backupDir, backupName);
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  console.log(`✅ Backup saved to ${backupPath}`);

  // Cleanup: keep only last 5 backups
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith(baseName) && f.endsWith('.json'))
    .sort((a, b) => {
      const aTime = parseInt(a.match(/\d+/)[0], 10);
      const bTime = parseInt(b.match(/\d+/)[0], 10);
      return bTime - aTime;
    });

  if (backups.length > 5) {
    const oldBackups = backups.slice(5);
    oldBackups.forEach(f => {
      try {
        fs.unlinkSync(path.join(backupDir, f));
        console.log(`🗑️ Deleted old backup: ${f}`);
      } catch (err) {
        console.error(`❌ Failed to delete ${f}:`, err);
      }
    });
  }
}

// Routes
app.get('/test-backup', (req, res) => {
  const sampleData = { product: 'Dream Green Flower', quantity: 42 };
  saveWithBackup('test.json', sampleData);
  res.send('Test backup created!');
});

app.post('/update-front', (req, res) => {
  const frontData = req.body;
  if (!frontData || Object.keys(frontData).length === 0) {
    return res.status(400).send('Missing front office data');
  }
  saveWithBackup('frontOffice.json', frontData);
  res.send('Front office data updated!');
});

app.post('/update-back', (req, res) => {
  const backData = req.body;
  if (!backData || Object.keys(backData).length === 0) {
    return res.status(400).send('Missing back office data');
  }
  saveWithBackup('backOffice.json', backData);
  res.send('Back office data updated!');
});

app.post('/update-products', (req, res) => {
  const products = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).send('No products provided');
  }
  saveWithBackup('products.json', { products });
  res.send('Products updated and backed up!');
});
app.post('/update', (req, res) => {
  const change = req.body;

  if (!change || Object.keys(change).length === 0) {
    return res.status(400).send('Missing update data');
  }

  try {
    change.savedAt = new Date().toISOString();

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const filename = `update-${Date.now()}.json`;
    fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(change, null, 2));

    res.status(200).send(`Generic update saved as ${filename}`);
  } catch (error) {
    console.error('Error saving update:', error);
    res.status(500).send({ status: 'error', message: error.message });
  }
});app.post('/update', (req, res) => {
    const change = req.body;
    if (!change || Object.keys(change).length === 0) {
        return res.status(400).send('Missing update data');
    }

    change.savedAt = new Date().toISOString();

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const filename = `update-${Date.now()}.json`;
    fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(change, null, 2));

    res.send(`Generic update saved as ${filename}`);
});
// Start server
app.listen(8080, () => {
  console.log('🚀 Server running on port 8080');
});
