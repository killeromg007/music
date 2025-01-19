const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const musicServices = require('./utils/musicServices');

const app = express();
const port = 3000;

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Keep original filename but remove any potentially harmful characters
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, safeName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create lyrics directory if it doesn't exist
const lyricsDir = path.join(__dirname, 'public', 'lyrics');
if (!fs.existsSync(lyricsDir)) {
    fs.mkdirSync(lyricsDir, { recursive: true });
}

// Get list of songs
app.get('/songs', (req, res) => {
    fs.readdir(path.join(__dirname, 'public', 'uploads'), (err, files) => {
        if (err) {
            res.status(500).json({ error: 'Error reading songs directory' });
            return;
        }
        res.json(files);
    });
});

// Handle file upload
app.post('/upload', upload.array('music'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
    }
    res.json({ 
        message: 'Files uploaded successfully',
        files: req.files.map(f => f.filename)
    });
});

// Get lyrics for a song
app.get('/lyrics/:songName', (req, res) => {
    const lyricsPath = path.join(__dirname, 'public', 'lyrics', `${req.params.songName}.txt`);
    fs.readFile(lyricsPath, 'utf8', (err, data) => {
        if (err) {
            res.json({ lyrics: '' });
            return;
        }
        res.json({ lyrics: data });
    });
});

// Save lyrics for a song
app.post('/lyrics/:songName', (req, res) => {
    const lyricsPath = path.join(__dirname, 'public', 'lyrics', `${req.params.songName}.txt`);
    fs.writeFile(lyricsPath, req.body.lyrics, (err) => {
        if (err) {
            res.status(500).json({ error: 'Error saving lyrics' });
            return;
        }
        res.json({ message: 'Lyrics saved successfully' });
    });
});

// Delete a song
app.delete('/songs/:songName', (req, res) => {
    const songPath = path.join(__dirname, 'public', 'uploads', req.params.songName);
    const lyricsPath = path.join(__dirname, 'public', 'lyrics', `${req.params.songName}.txt`);
    
    // Delete song file
    fs.unlink(songPath, (err) => {
        if (err && err.code !== 'ENOENT') {
            res.status(500).json({ error: 'Error deleting song' });
            return;
        }
        
        // Delete lyrics file if it exists
        fs.unlink(lyricsPath, (err) => {
            // Ignore error if lyrics file doesn't exist
            res.json({ message: 'Song deleted successfully' });
        });
    });
});

// Download from Spotify
app.post('/download-spotify', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        res.status(400).json({ error: 'No Spotify URL provided' });
        return;
    }

    try {
        const result = await musicServices.downloadFromSpotify(url);
        if (result.success) {
            res.json({ message: 'Song downloaded successfully', filename: result.filename });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error downloading from Spotify' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
