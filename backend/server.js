const path = require('path');

function saveWithBackup(filename, data) {
  // Add timestamp
  data.savedAt = new Date().toISOString();

  // Save main file
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));

  // Ensure backups folder exists
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  // Create backup file inside backups folder
  const baseName = path.basename(filename, '.json');
  const backupName = `${baseName}.${Date.now()}.bak.json`;
  const backupPath = path.join(backupDir, backupName);
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

  // Cleanup: keep only the last 5 backups
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith(baseName) && f.endsWith('.bak.json'))
    .sort((a, b) => {
      const aTime = parseInt(a.split('.')[1], 10);
      const bTime = parseInt(b.split('.')[1], 10);
      return bTime - aTime; // newest first
    });

  if (backups.length > 5) {
    const oldBackups = backups.slice(5);
    oldBackups.forEach(f => {
      try {
        fs.unlinkSync(path.join(backupDir, f));
      } catch (err) {
        console.error('Error deleting old backup:', f, err);
      }
    });
  }
}const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

let frontOfficeData = {};
let backOfficeData = {};

// Helper function: saves data with timestamp and backup
function saveWithBackup(filename, data) {
  // Add timestamp
  data.savedAt = new Date().toISOString();

  // Save main file
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));

  // Create backup with timestamp in filename
  const backupName = `${filename}.${Date.now()}.bak.json`;
  fs.writeFileSync(backupName, JSON.stringify(data, null, 2));

  // Cleanup: keep only the last 5 backups
  const files = fs.readdirSync('.');
  const backups = files
    .filter(f => f.startsWith(filename) && f.endsWith('.bak.json'))
    .sort((a, b) => {
      const aTime = parseInt(a.split('.')[2], 10);
      const bTime = parseInt(b.split('.')[2], 10);
      return bTime - aTime; // newest first
    });

  if (backups.length > 5) {
    const oldBackups = backups.slice(5);
    oldBackups.forEach(f => {
      try {
        fs.unlinkSync(f);
      } catch (err) {
        console.error('Error deleting old backup:', f, err);
      }
    });
  }
}const fs = require('fs');
const path = require('path');

function saveWithBackup(filename, data) {
  // Add timestamp
  data.savedAt = new Date().toISOString();

  // Save main file locally
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));

  // Point backups to Google Drive synced folder
  const backupDir = "G:/My Drive/DreamGreenBackupStockControl";
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Create backup file inside Google Drive folder
  const baseName = path.basename(filename, '.json');
  const backupName = `${baseName}.${Date.now()}.bak.json`;
  const backupPath = path.join(backupDir, backupName);
  console.log("Backup saved to:", backupPath);
  
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

  // Cleanup: keep only the last 5 backups
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith(baseName) && f.endsWith('.bak.json'))
    .sort((a, b) => {
      const aTime = parseInt(a.split('.')[1], 10);
      const bTime = parseInt(b.split('.')[1], 10);
      return bTime - aTime; // newest first
    });

  if (backups.length > 5) {
    const oldBackups = backups.slice(5);
    oldBackups.forEach(f => {
      try {
        fs.unlinkSync(path.join(backupDir, f));
      } catch (err) {
        console.error('Error deleting old backup:', f, err);
      }
    });
  }
}function saveWithBackup(filename, data) {
  // Add timestamp
  data.savedAt = new Date().toISOString();

  // Save main file
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));

  // Create backup with timestamp in filename
  const backupName = `${filename}.${Date.now()}.bak.json`;
  fs.writeFileSync(backupName, JSON.stringify(data, null, 2));
}

// Front office save
app.post('/api/save-frontoffice', (req, res) => {
  frontOfficeData = req.body;
  try {
    saveWithBackup('frontOffice.json', frontOfficeData);
    res.status(200).send('Front office data saved with timestamp and backup');
  } catch (err) {
    console.error('Error saving front office data:', err);
    res.status(500).send('Failed to save front office data');
  }
});

// Front office load
app.get('/api/load-frontoffice', (req, res) => {
  try {
    const data = fs.readFileSync('frontOffice.json', 'utf8');
    res.status(200).json(JSON.parse(data));
  } catch (err) {
    res.status(500).send('Failed to load front office data');
  }
});

// Back office save
app.post('/api/save-backoffice', (req, res) => {
  backOfficeData = req.body;
  try {
    saveWithBackup('backOffice.json', backOfficeData);
    res.status(200).send('Back office data saved with timestamp and backup');
  } catch (err) {
    console.error('Error saving back office data:', err);
    res.status(500).send('Failed to save back office data');
  }
});

app.listen(8080, () => {
  console.log('Server running on port 8080');
});