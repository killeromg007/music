const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { downloadMusic } = require('./utils/musicDownloader');
const { downloadYouTube } = require('./utils/youtube');
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

// Unified music download endpoint
app.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, error: 'URL is required' });
        }

        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const result = await downloadMusic(url, uploadDir);
        res.json({ success: true, message: result.message, filename: result.filename });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// YouTube download endpoint
app.post('/youtube/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, error: 'URL is required' });
        }

        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        await downloadYouTube(url, uploadDir);
        res.json({ success: true, message: 'Download complete' });
    } catch (error) {
        console.error('YouTube download error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Lyrics endpoints
app.get('/lyrics/:songName', (req, res) => {
    const songName = req.params.songName;
    const lyricsPath = path.join(__dirname, 'public', 'lyrics', songName);
    
    fs.readFile(lyricsPath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.send('');
            }
            return res.status(500).send('Failed to read lyrics');
        }
        res.send(data);
    });
});

app.post('/lyrics/:songName', (req, res) => {
    let lyrics = '';
    req.on('data', chunk => {
        lyrics += chunk;
    });
    
    req.on('end', () => {
        const songName = req.params.songName;
        const lyricsDir = path.join(__dirname, 'public', 'lyrics');
        const lyricsPath = path.join(lyricsDir, songName);
        
        if (!fs.existsSync(lyricsDir)) {
            fs.mkdirSync(lyricsDir, { recursive: true });
        }
        
        fs.writeFile(lyricsPath, lyrics, 'utf8', (err) => {
            if (err) {
                console.error('Error saving lyrics:', err);
                return res.status(500).send('Failed to save lyrics');
            }
            res.sendStatus(200);
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
