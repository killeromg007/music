let currentSongIndex = 0;
let songs = [];
let songFiles = new Map(); // Store File objects
const audio = new Audio();
let isPlaying = false;
let isRepeat = false;
let isShuffle = false;
let playOrder = [];

// Load saved playlist from localStorage
const savedPlaylist = localStorage.getItem('musicPlaylist');
if (savedPlaylist) {
    try {
        const playlistData = JSON.parse(savedPlaylist);
        playOrder = playlistData.playOrder || [];
        isRepeat = playlistData.isRepeat || false;
        isShuffle = playlistData.isShuffle || false;
    } catch (e) {
        console.error('Error loading saved playlist:', e);
    }
}

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
const musicFiles = document.getElementById('musicFiles');
const addMusicBtn = document.getElementById('addMusicBtn');

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
addMusicBtn.addEventListener('click', () => musicFiles.click());
musicFiles.addEventListener('change', handleFileSelect);

// Initialize volume from localStorage
const savedVolume = localStorage.getItem('volume');
if (savedVolume !== null) {
    audio.volume = parseFloat(savedVolume);
    volumeSlider.value = parseFloat(savedVolume) * 100;
}

// Functions
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        if (file.type.startsWith('audio/')) {
            const songName = file.name;
            songs.push(songName);
            songFiles.set(songName, file);
        }
    });

    if (songs.length > 0) {
        playOrder = [...Array(songs.length).keys()];
        if (isShuffle) shufflePlayOrder();
        savePlaylistToStorage();
        displaySongs();
    }

    event.target.value = ''; // Reset file input
}

function displaySongs() {
    songList.innerHTML = '';
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.textContent = song;
        li.setAttribute('data-index', index);
        li.draggable = true;
        
        // Drag and drop events
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragend', handleDragEnd);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('click', () => playSong(index));
        
        if (index === currentSongIndex) {
            li.classList.add('active');
        }
        songList.appendChild(li);
    });
}

function savePlaylistToStorage() {
    const playlistData = {
        playOrder,
        isRepeat,
        isShuffle
    };
    localStorage.setItem('musicPlaylist', JSON.stringify(playlistData));
}

function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.getAttribute('data-index'));
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('#songList li').forEach(item => {
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
        
        // Update playOrder
        const [movedIndex] = playOrder.splice(fromIndex, 1);
        playOrder.splice(toIndex, 0, movedIndex);
        
        // Update currentSongIndex if needed
        if (currentSongIndex === fromIndex) {
            currentSongIndex = toIndex;
        } else if (fromIndex < currentSongIndex && toIndex >= currentSongIndex) {
            currentSongIndex--;
        } else if (fromIndex > currentSongIndex && toIndex <= currentSongIndex) {
            currentSongIndex++;
        }
        
        savePlaylistToStorage();
        displaySongs();
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active');
    if (isShuffle) {
        shufflePlayOrder();
    } else {
        playOrder = [...Array(songs.length).keys()];
    }
    savePlaylistToStorage();
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active');
    savePlaylistToStorage();
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
    } else {
        playNext();
    }
}

function playSong(index) {
    if (index >= 0 && index < songs.length) {
        currentSongIndex = index;
        const songFile = songFiles.get(songs[index]);
        if (songFile) {
            const url = URL.createObjectURL(songFile);
            audio.src = url;
            audio.play().catch(error => console.error('Error playing audio:', error));
            isPlaying = true;
            updatePlayButton();
            currentSongElement.textContent = songs[index];
            loadLyrics(songs[index]);
            displaySongs();
            
            // Clean up old URL when audio is loaded
            audio.onloadeddata = () => {
                URL.revokeObjectURL(url);
            };
        }
    }
}

function togglePlay() {
    if (songs.length === 0) return;
    
    if (audio.src === '') {
        playSong(0);
    } else {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        isPlaying = !isPlaying;
        updatePlayButton();
    }
}

function updatePlayButton() {
    playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

function playPrevious() {
    const currentOrderIndex = playOrder.indexOf(currentSongIndex);
    const prevOrderIndex = (currentOrderIndex - 1 + playOrder.length) % playOrder.length;
    playSong(playOrder[prevOrderIndex]);
}

function playNext() {
    const currentOrderIndex = playOrder.indexOf(currentSongIndex);
    const nextOrderIndex = (currentOrderIndex + 1) % playOrder.length;
    playSong(playOrder[nextOrderIndex]);
}

function updateVolume() {
    const volume = volumeSlider.value / 100;
    audio.volume = volume;
    localStorage.setItem('volume', volume.toString());
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
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function toggleLyricsEditor() {
    const isEditing = !lyricsEditor.classList.contains('hidden');
    if (isEditing) {
        lyricsEditor.classList.add('hidden');
        lyricsDisplay.classList.remove('hidden');
    } else {
        lyricsText.value = lyricsDisplay.textContent;
        lyricsEditor.classList.remove('hidden');
        lyricsDisplay.classList.add('hidden');
        lyricsText.focus();
    }
}

function saveLyrics() {
    const lyrics = lyricsText.value;
    const songName = songs[currentSongIndex];
    localStorage.setItem(`lyrics_${songName}`, lyrics);
    lyricsDisplay.textContent = lyrics;
    toggleLyricsEditor();
}

function cancelLyricsEdit() {
    toggleLyricsEditor();
}

function loadLyrics(songName) {
    const lyrics = localStorage.getItem(`lyrics_${songName}`);
    lyricsDisplay.textContent = lyrics || 'No lyrics available';
    lyricsText.value = lyrics || '';
}

// Initialize UI state
if (isRepeat) repeatBtn.classList.add('active');
if (isShuffle) shuffleBtn.classList.add('active');
