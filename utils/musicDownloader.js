const { spawn } = require('child_process');
const path = require('path');

function isSpotifyUrl(url) {
    return url.includes('spotify.com');
}

function isYoutubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

async function downloadMusic(url, outputDir) {
    if (!isSpotifyUrl(url) && !isYoutubeUrl(url)) {
        throw new Error('Invalid URL. Must be a Spotify or YouTube URL');
    }

    return new Promise((resolve, reject) => {
        const outputTemplate = path.join(outputDir, '%(title)s.%(ext)s');
        
        // Common yt-dlp arguments for both platforms
        const args = [
            url,
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--embed-thumbnail',
            '--add-metadata',
            '--output', outputTemplate,
            '--force-overwrites'
        ];

        // If it's Spotify, add specific arguments
        if (isSpotifyUrl(url)) {
            args.push('--extract-audio');
            args.push('--format', 'bestaudio');
        }

        const process = spawn('yt-dlp', args);

        let errorOutput = '';
        let outputFilename = '';

        process.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`stdout: ${output}`);
            
            // Try to capture the output filename
            if (output.includes('[download] Destination:')) {
                outputFilename = output.split('[download] Destination:')[1].trim();
            }
        });

        process.stderr.on('data', (data) => {
            errorOutput += data;
            console.error(`stderr: ${data}`);
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve({ 
                    success: true, 
                    message: 'Download complete',
                    filename: outputFilename || 'Download completed'
                });
            } else {
                reject(new Error(`Failed to download: ${errorOutput}`));
            }
        });

        process.on('error', (err) => {
            reject(err);
        });
    });
}

module.exports = {
    downloadMusic,
    isSpotifyUrl,
    isYoutubeUrl
};
