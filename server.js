const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Serve static files from public directory
app.use(express.static('public'));

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
