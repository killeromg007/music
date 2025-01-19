require('dotenv').config();
const { Spotify } = require('spotifydl-core');
const path = require('path');
const fs = require('fs');

class MusicServices {
    constructor() {
        this.downloadPath = path.join(__dirname, '..', 'public', 'uploads');
        this.spotify = new Spotify({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });
    }

    async downloadFromSpotify(url) {
        try {
            // Create uploads directory if it doesn't exist
            if (!fs.existsSync(this.downloadPath)) {
                fs.mkdirSync(this.downloadPath, { recursive: true });
            }

            const track = await this.spotify.getTrack(url);
            const fileName = `${track.name} - ${track.artists[0]}.mp3`;
            const filePath = path.join(this.downloadPath, fileName);
            
            await this.spotify.downloadTrack(url, filePath);
            
            return {
                success: true,
                filename: fileName
            };
        } catch (error) {
            console.error('Error downloading from Spotify:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getDownloadedSongs() {
        try {
            const files = fs.readdirSync(this.downloadPath);
            return files.filter(file => file.endsWith('.mp3'));
        } catch (error) {
            console.error('Error getting downloaded songs:', error);
            return [];
        }
    }
}

module.exports = new MusicServices();
