const { spawn } = require('child_process');
const path = require('path');

async function downloadYouTube(url, outputDir) {
    return new Promise((resolve, reject) => {
        const process = spawn('yt-dlp', [
            url,
            '--extract-audio',
            '--audio-format', 'mp3',
            '--output', path.join(outputDir, '%(title)s.%(ext)s')
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
                reject(new Error(`Failed to download: ${errorOutput}`));
            }
        });
    });
}

module.exports = {
    downloadYouTube
};
