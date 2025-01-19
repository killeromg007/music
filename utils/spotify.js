const { spawn } = require('child_process');
const path = require('path');

async function downloadSpotifyTrack(url, outputDir) {
    return new Promise((resolve, reject) => {
        // Use yt-dlp to download from Spotify directly
        const process = spawn('yt-dlp', [
            url,
            '--extract-audio',
            '--audio-format', 'mp3',
            '--output', path.join(outputDir, '%(title)s.%(ext)s'),
            '--force-overwrites'
        ]);

        let errorOutput = '';

        process.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        process.stderr.on('data', (data) => {
            errorOutput += data;
            console.error(`stderr: ${data}`);
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true });
            } else {
                reject(new Error(`Failed to download track: ${errorOutput}`));
            }
        });

        process.on('error', (err) => {
            reject(err);
        });
    });
}

module.exports = {
    downloadSpotifyTrack
};
