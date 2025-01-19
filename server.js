const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const ytdl = require('ytdl-core');
require('dotenv').config();

const app = express();
const port = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/songs', (req, res) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('Error reading uploads directory:', err);
            return res.status(500).json({ error: 'Failed to read songs' });
        }
        res.json(files.filter(file => file.match(/\.(mp3|wav|ogg)$/i)));
    });
});

app.post('/upload', upload.array('music'), (req, res) => {
    res.json({ message: 'Files uploaded successfully' });
});

// Spotify download endpoint
app.post('/spotify/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, error: 'URL is required' });
        }

        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Use spotifydl-core to download
        const command = `spotifydl "${url}" --output "${uploadDir}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Spotify download error:', error);
                return res.status(500).json({ success: false, error: error.message });
            }
            res.json({ success: true, message: 'Download complete' });
        });
    } catch (error) {
        console.error('Spotify download error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Lyrics endpoints
app.get('/lyrics/:songName', (req, res) => {
    const songName = req.params.songName;
    const lyricsPath = path.join(__dirname, 'public', 'Lyrics', songName + '.txt');
    
    fs.readFile(lyricsPath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.json({ lyrics: '' });
            }
            return res.status(500).json({ error: 'Failed to read lyrics' });
        }
        res.json({ lyrics: data });
    });
});

app.post('/lyrics/:songName', (req, res) => {
    const songName = req.params.songName;
    const lyrics = req.body.lyrics;
    const lyricsDir = path.join(__dirname, 'public', 'Lyrics');
    const lyricsPath = path.join(lyricsDir, songName + '.txt');
    
    if (!fs.existsSync(lyricsDir)) {
        fs.mkdirSync(lyricsDir, { recursive: true });
    }
    
    fs.writeFile(lyricsPath, lyrics, 'utf8', (err) => {
        if (err) {
            console.error('Error saving lyrics:', err);
            return res.status(500).json({ error: 'Failed to save lyrics' });
        }
        res.json({ success: true });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
