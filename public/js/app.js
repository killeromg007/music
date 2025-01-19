document.addEventListener('DOMContentLoaded', () => {
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
    const addMusicBtn = document.getElementById('addMusicBtn');
    const musicFiles = document.getElementById('musicFiles');
    const downloadForm = document.getElementById('spotify-download-form');
    const spotifyUrlInput = document.getElementById('spotify-url');
    const downloadStatus = document.getElementById('download-status');

    // Initialize volume
    audio.volume = volumeSlider.value / 100;

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
    addMusicBtn.addEventListener('click', () => {
        musicFiles.click();
    });
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
                showStatus('Files uploaded successfully!', 'success');
            } else {
                showStatus('Error uploading files', 'error');
            }
        } catch (error) {
            showStatus('Error uploading files', 'error');
            console.error('Upload error:', error);
        }
    });
    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = spotifyUrlInput.value.trim();
        
        if (!url) {
            showStatus('Please enter a Spotify URL', 'error');
            return;
        }

        showStatus('Downloading...', 'info');
        
        try {
            const response = await fetch('/download-spotify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();
            
            if (response.ok) {
                showStatus('Download completed successfully!', 'success');
                loadSongs();
                spotifyUrlInput.value = '';
            } else {
                showStatus(`Download failed: ${data.error}`, 'error');
            }
        } catch (error) {
            showStatus('Error downloading song', 'error');
            console.error('Download error:', error);
        }
    });

    // Load songs on page load
    loadSongs();

    // Functions
    async function loadSongs() {
        try {
            const response = await fetch('/songs');
            songs = await response.json();
            playOrder = [...Array(songs.length).keys()];
            if (isShuffle) shufflePlayOrder();
            displaySongs();
        } catch (error) {
            console.error('Error loading songs:', error);
        }
    }

    function displaySongs() {
        songList.innerHTML = '';
        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.className = 'playlist-item' + (index === currentSongIndex ? ' active' : '');
            li.innerHTML = `
                <span class="song-title">${song}</span>
                <div class="song-controls">
                    <button onclick="playSong(${index})" class="play-btn">
                        <i class="fas fa-play"></i>
                    </button>
                    <button onclick="deleteSong('${song}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            songList.appendChild(li);
        });
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
                showStatus('Song deleted successfully', 'success');
            } else {
                showStatus('Error deleting song', 'error');
            }
        } catch (error) {
            console.error('Error deleting song:', error);
            showStatus('Error deleting song', 'error');
        }
    }

    function showStatus(message, type) {
        downloadStatus.textContent = message;
        downloadStatus.className = `status ${type}`;
        downloadStatus.style.display = 'block';
        
        setTimeout(() => {
            downloadStatus.style.display = 'none';
        }, 5000);
    }
});
