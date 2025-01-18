const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Configure multer for handling music file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /mp3|wav|ogg/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            return cb(null, true);
        }
        cb('Error: Audio files only!');
    }
});

// Create lyrics directory if it doesn't exist
const lyricsDir = './public/lyrics';
if (!fs.existsSync(lyricsDir)) {
    fs.mkdirSync(lyricsDir, { recursive: true });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('music'), (req, res) => {
    res.json({ message: 'File uploaded successfully' });
});

app.get('/songs', (req, res) => {
    const directoryPath = path.join(__dirname, 'public/uploads');
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).send({ error: 'Unable to scan directory' });
        }
        const songs = files.filter(file => /\.(mp3|wav|ogg)$/.test(file));
        res.json(songs);
    });
});

app.get('/lyrics/:songName', (req, res) => {
    const songName = req.params.songName;
    const lyricsPath = path.join(__dirname, 'public/lyrics', songName + '.txt');
    
    fs.readFile(lyricsPath, 'utf8', (err, data) => {
        if (err) {
            return res.json({ lyrics: '' });
        }
        res.json({ lyrics: data });
    });
});

app.post('/lyrics/:songName', (req, res) => {
    const songName = req.params.songName;
    const lyrics = req.body.lyrics;
    const lyricsPath = path.join(__dirname, 'public/lyrics', songName + '.txt');
    
    fs.writeFile(lyricsPath, lyrics, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save lyrics' });
        }
        res.json({ message: 'Lyrics saved successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
