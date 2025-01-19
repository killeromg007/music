let currentSongIndex = 0;
let songs = [];
const audio = new Audio();
audio.preload = 'auto';
let isPlaying = false;
let isRepeat = false;
let isShuffle = false;
let playOrder = [];

// DOM Elements
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const songList = document.getElementById('songList');
const currentSongElement = document.getElementById('currentSong');
const progressBar = document.querySelector('.progress');
const volumeSlider = document.getElementById('volumeSlider');
const currentTimeElement = document.getElementById('currentTime');
const durationElement = document.getElementById('duration');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const editLyricsBtn = document.getElementById('editLyricsBtn');
const lyricsDisplay = document.getElementById('lyricsDisplay');
const lyricsEditor = document.getElementById('lyricsEditor');
const lyricsText = document.getElementById('lyricsText');
const saveLyricsBtn = document.getElementById('saveLyricsBtn');
const cancelLyricsBtn = document.getElementById('cancelLyricsBtn');
const addMusicBtn = document.getElementById('addMusicBtn');
const musicFiles = document.getElementById('musicFiles');
const downloadStatus = document.getElementById('downloadStatus');

// Event Listeners
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', playPrevious);
nextBtn.addEventListener('click', playNext);
volumeSlider.addEventListener('input', updateVolume);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', handleSongEnd);
document.querySelector('.progress-bar').addEventListener('click', setProgress);
shuffleBtn.addEventListener('click', toggleShuffle);
repeatBtn.addEventListener('click', toggleRepeat);
editLyricsBtn.addEventListener('click', toggleLyricsEditor);
saveLyricsBtn.addEventListener('click', saveLyrics);
cancelLyricsBtn.addEventListener('click', cancelLyricsEdit);
addMusicBtn.addEventListener('click', () => {
    musicFiles.click();
});
document.getElementById('ytDownloadBtn').addEventListener('click', downloadYouTube);

musicFiles.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const formData = new FormData();
    for (let file of files) {
        formData.append('music', file);
    }

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            loadSongs();
        } else {
            console.error('Error uploading files');
        }
    } catch (error) {
        console.error('Upload error:', error);
    }
});

// Initialize volume
audio.volume = volumeSlider.value / 100;

// Load songs on page load
loadSongs();

// Functions
function loadSongs() {
    fetch('/songs')
        .then(response => response.json())
        .then(data => {
            songs = data;
            playOrder = [...Array(songs.length).keys()];
            if (isShuffle) shufflePlayOrder();
            displaySongs();
        })
        .catch(error => console.error('Error loading songs:', error));
}

function displaySongs() {
    songList.innerHTML = '';
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = 'playlist-item' + (index === currentSongIndex ? ' active' : '');
        li.setAttribute('data-index', index);
        li.draggable = true;
        
        li.innerHTML = `
            <span class="song-title">${song}</span>
        `;
        
        // Add drag and drop event listeners
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragend', handleDragEnd);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('click', () => playSong(index));
        
        songList.appendChild(li);
    });
}

function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.getAttribute('data-index'));
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const toIndex = parseInt(this.getAttribute('data-index'));
    
    if (fromIndex !== toIndex) {
        // Update songs array
        const [movedSong] = songs.splice(fromIndex, 1);
        songs.splice(toIndex, 0, movedSong);
        
        // Update currentSongIndex if needed
        if (currentSongIndex === fromIndex) {
            currentSongIndex = toIndex;
        } else if (fromIndex < currentSongIndex && toIndex >= currentSongIndex) {
            currentSongIndex--;
        } else if (fromIndex > currentSongIndex && toIndex <= currentSongIndex) {
            currentSongIndex++;
        }
        
        displaySongs();
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active');
    playOrder = [...Array(songs.length).keys()];
    if (isShuffle) {
        shufflePlayOrder();
    }
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active');
}

function shufflePlayOrder() {
    for (let i = playOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playOrder[i], playOrder[j]] = [playOrder[j], playOrder[i]];
    }
}

function handleSongEnd() {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
        isPlaying = true;
    } else {
        playNext();
    }
}

function playSong(index) {
    currentSongIndex = index;
    const song = songs[index];
    audio.src = `/uploads/${song}`;
    audio.play();
    isPlaying = true;
    updatePlayButton();
    currentSongElement.textContent = song;
    loadLyrics(song);
    displaySongs();
}

function togglePlay() {
    if (songs.length === 0) return;
    
    if (audio.src === '') {
        playSong(0);
    } else if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        audio.play();
        isPlaying = true;
    }
    updatePlayButton();
}

function updatePlayButton() {
    playBtn.innerHTML = `<i class="fas fa-${isPlaying ? 'pause' : 'play'}"></i>`;
}

function playPrevious() {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(currentSongIndex);
}

function playNext() {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong(currentSongIndex);
}

function updateVolume() {
    audio.volume = volumeSlider.value / 100;
}

function updateProgress() {
    const duration = audio.duration;
    const currentTime = audio.currentTime;
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    
    currentTimeElement.textContent = formatTime(currentTime);
    durationElement.textContent = formatTime(duration);
}

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function toggleLyricsEditor() {
    const isEditing = lyricsEditor.classList.toggle('hidden');
    lyricsDisplay.classList.toggle('hidden');
    if (!isEditing) {
        lyricsText.value = lyricsDisplay.textContent;
    }
}

function loadLyrics(songName) {
    // Remove file extension from song name for lyrics file
    const lyricsName = songName.replace(/\.[^/.]+$/, '');
    fetch(`/Lyrics/${encodeURIComponent(lyricsName)}.txt`)
        .then(response => response.text())
        .then(data => {
            if (data) {
                lyricsDisplay.textContent = data;
                lyricsText.value = data;
            } else {
                lyricsDisplay.textContent = 'No lyrics available';
                lyricsText.value = '';
            }
        })
        .catch(error => {
            console.error('Error loading lyrics:', error);
            lyricsDisplay.textContent = 'No lyrics available';
            lyricsText.value = '';
        });
}

function saveLyrics() {
    const songName = songs[currentSongIndex];
    // Remove file extension from song name for lyrics file
    const lyricsName = songName.replace(/\.[^/.]+$/, '');
    const lyrics = lyricsText.value;

    fetch(`/Lyrics/${encodeURIComponent(lyricsName)}.txt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: lyrics
    })
    .then(response => {
        if (response.ok) {
            lyricsDisplay.textContent = lyrics;
            toggleLyricsEditor();
        } else {
            throw new Error('Failed to save lyrics');
        }
    })
    .catch(error => {
        console.error('Error saving lyrics:', error);
        alert('Failed to save lyrics. Please try again.');
    });
}

function cancelLyricsEdit() {
    toggleLyricsEditor();
}

async function deleteSong(songName) {
    if (!confirm(`Are you sure you want to delete ${songName}?`)) {
        return;
    }

    try {
        const response = await fetch(`/songs/${songName}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            if (songs[currentSongIndex] === songName) {
                audio.pause();
                isPlaying = false;
                updatePlayButton();
            }
            loadSongs();
        } else {
            console.error('Error deleting song');
        }
    } catch (error) {
        console.error('Error deleting song:', error);
    }
}

async function downloadMusic() {
    const downloadUrl = document.getElementById('downloadUrl').value;
    const statusDiv = document.getElementById('downloadStatus');
    
    if (!downloadUrl) {
        statusDiv.textContent = 'Please enter a URL';
        return;
    }

    statusDiv.textContent = 'Downloading...';
    
    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: downloadUrl })
        });

        const data = await response.json();
        
        if (data.success) {
            statusDiv.textContent = data.message;
            // Refresh the song list
            loadSongs();
            // Clear the input
            document.getElementById('downloadUrl').value = '';
        } else {
            statusDiv.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        statusDiv.textContent = 'Error: ' + error.message;
    }
}

async function downloadYouTube() {
    const url = document.getElementById('ytUrl').value;
    if (!url) {
        alert('Please enter a YouTube URL');
        return;
    }

    const status = document.getElementById('downloadStatus');
    status.textContent = 'Downloading...';

    try {
        const response = await fetch('/youtube/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();
        if (data.success) {
            status.textContent = 'Download complete!';
            loadSongs(); // Refresh song list
        } else {
            status.textContent = 'Download failed: ' + data.error;
        }
    } catch (error) {
        status.textContent = 'Download failed: ' + error.message;
    }
}
