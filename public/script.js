let currentSongIndex = 0;
let songs = [];
const audio = new Audio();
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

// Initialize volume
audio.volume = volumeSlider.value / 100;

// Functions
function loadSongs() {
    fetch('/songs')
        .then(response => response.json())
        .then(data => {
            songs = data;
            playOrder = [...Array(songs.length).keys()];
            displaySongs();
            if (isShuffle) shufflePlayOrder();
        })
        .catch(error => console.error('Error loading songs:', error));
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
    } else {
        playNext();
    }
}

function playSong(index) {
    if (index >= 0 && index < songs.length) {
        currentSongIndex = index;
        audio.src = `/uploads/${songs[index]}`;
        audio.play();
        isPlaying = true;
        updatePlayButton();
        currentSongElement.textContent = songs[index];
        displaySongs();
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
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Initial load of songs
loadSongs();
