const express = require("express");
const path = require("path");
const app = express();

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// Route for frontoffice (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Route for backoffice
app.get("/backoffice", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/backoffice.html"));
});

app.listen(8080, () => {
  console.log("🚀 Server running on port 8080");
});
