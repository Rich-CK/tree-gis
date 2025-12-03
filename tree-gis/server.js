const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure data directories exist
const dataDir = path.join(__dirname, 'data');
const photosDir = path.join(dataDir, 'photos');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir);

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, photosDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// API: Save Tree Data
app.post('/api/save', (req, res) => {
    const { id, species, gpsX, gpsY, height, diameter, photoPath } = req.body;

    // Format: ID;Species;GPS_X;GPS_Y;Height;Diameter;PhotoPath
    // Using semicolon as delimiter, UTF-8 encoding
    const line = `${id};${species};${gpsX};${gpsY};${height};${diameter};${photoPath}\n`;
    const filePath = path.join(dataDir, 'trees.txt');

    fs.appendFile(filePath, line, 'utf8', (err) => {
        if (err) {
            console.error('Error saving data:', err);
            return res.status(500).json({ error: 'Failed to save data' });
        }
        res.json({ message: 'Data saved successfully' });
    });
});

// API: Upload Photo
app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the relative path or filename to be stored in the CSV
    res.json({ filename: req.file.filename });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
