const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { parse, unparse } = require('papaparse');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request headers:', req.headers);
  if (req.body && Object.keys(req.body).length) {
    console.log('Request body:', req.body);
  }
  next();
});

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
console.log('Data directory path:', dataDir);
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  try {
    fs.mkdirSync(dataDir);
    console.log('Data directory created successfully');
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

const csvFilePath = path.join(dataDir, 'kg-metadata-submissions.csv');
console.log('CSV file path:', csvFilePath);

// Initialize CSV file if it doesn't exist
if (!fs.existsSync(csvFilePath)) {
  console.log('Initializing CSV file...');
  const headers = ['name', 'title', 'id', 'timestamp', 'ipAddress', 'browser'];
  const csv = unparse([headers]);
  try {
    fs.writeFileSync(csvFilePath, csv);
    console.log('CSV file initialized successfully');
  } catch (err) {
    console.error('Error initializing CSV file:', err);
  }
}

// Helper function to read CSV file
const readCSV = () => {
  try {
    console.log('Reading CSV file...');
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const results = parse(csvData, { header: true });
    console.log(`CSV read successfully, ${results.data.length} records found`);
    return results.data;
  } catch (error) {
    console.error('Error reading CSV:', error);
    return [];
  }
};

// Helper function to write CSV file
const writeCSV = (data) => {
  try {
    console.log(`Writing ${data.length} records to CSV...`);
    const csv = unparse(data);
    fs.writeFileSync(csvFilePath, csv);
    console.log('CSV written successfully');
    return true;
  } catch (error) {
    console.error('Error writing CSV:', error);
    return false;
  }
};

// Simple test route
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server is running correctly' });
});

// API Routes
app.get('/api/submissions', (req, res) => {
  console.log('GET request received for submissions');
  try {
    const data = readCSV();
    console.log(`Sending ${data.length} submissions`);
    res.json(data);
  } catch (err) {
    console.error('Error handling GET request:', err);
    res.status(500).json({ error: 'Server error retrieving submissions' });
  }
});

app.post('/api/submissions', (req, res) => {
  console.log('POST request received for new submission');
  try {
    const { name, title, id } = req.body;
    
    // Validate required fields
    if (!name || !title || !id) {
      console.error('Missing required fields:', req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get IP address and timestamp
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const timestamp = new Date().toISOString();
    const browser = req.headers['user-agent'];
    
    console.log('Creating submission object with metadata');
    // Create submission object
    const submission = {
      name,
      title,
      id,
      timestamp,
      ipAddress,
      browser
    };
    
    // Read existing data
    const data = readCSV();
    
    // Add new submission
    data.push(submission);
    
    // Write updated data
    if (writeCSV(data)) {
      console.log('Submission saved successfully');
      res.status(201).json({ message: 'Submission saved successfully', submission });
    } else {
      console.error('Failed to save submission');
      res.status(500).json({ error: 'Failed to save submission' });
    }
  } catch (error) {
    console.error('Error processing submission:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Also add routes with the kg-metadata prefix for compatibility
app.get('/api/kg-metadata/submissions', (req, res) => {
  console.log('GET request received for submissions (kg-metadata route)');
  try {
    const data = readCSV();
    console.log(`Sending ${data.length} submissions`);
    res.json(data);
  } catch (err) {
    console.error('Error handling GET request:', err);
    res.status(500).json({ error: 'Server error retrieving submissions' });
  }
});

app.post('/api/kg-metadata/submissions', (req, res) => {
  console.log('POST request received for new submission (kg-metadata route)');
  try {
    const { name, title, id } = req.body;
    
    // Validate required fields
    if (!name || !title || !id) {
      console.error('Missing required fields:', req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get IP address and timestamp
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const timestamp = new Date().toISOString();
    const browser = req.headers['user-agent'];
    
    console.log('Creating submission object with metadata');
    // Create submission object
    const submission = {
      name,
      title,
      id,
      timestamp,
      ipAddress,
      browser
    };
    
    // Read existing data
    const data = readCSV();
    
    // Add new submission
    data.push(submission);
    
    // Write updated data
    if (writeCSV(data)) {
      console.log('Submission saved successfully');
      res.status(201).json({ message: 'Submission saved successfully', submission });
    } else {
      console.error('Failed to save submission');
      res.status(500).json({ error: 'Failed to save submission' });
    }
  } catch (error) {
    console.error('Error processing submission:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`GET  http://localhost:${PORT}/api/submissions`);
  console.log(`POST http://localhost:${PORT}/api/submissions`);
});