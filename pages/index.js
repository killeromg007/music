import Head from 'next/head'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Load the player script after the component mounts
    const script = document.createElement('script')
    script.src = '/script.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <>
      <Head>
        <title>Custom Music Player</title>
        <meta name="description" content="A custom music player web application" />
        <link rel="icon" href="/favicon.ico" />
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
        />
      </Head>

      <div className="container">
        <div className="music-player">
          <div className="player-layout">
            <div className="playlist">
              <h2>Playlist</h2>
              <div className="playlist-controls">
                <input type="file" id="musicFiles" accept="audio/*" multiple className="hidden" />
                <button id="addMusicBtn" title="Add Music"><i className="fas fa-plus"></i></button>
                <button id="shuffleBtn" title="Shuffle"><i className="fas fa-random"></i></button>
                <button id="repeatBtn" title="Repeat"><i className="fas fa-redo"></i></button>
              </div>
              <ul id="songList" className="sortable-list"></ul>
            </div>
            
            <div className="player-main">
              <h1>My Music Player</h1>
              
              <div className="player-container">
                <div className="song-info">
                  <div id="currentSong">No song selected</div>
                </div>
                
                <div className="progress-bar">
                  <div className="progress"></div>
                </div>
                
                <div className="time-info">
                  <span id="currentTime">0:00</span>
                  <span id="duration">0:00</span>
                </div>

                <div className="controls">
                  <button id="prevBtn"><i className="fas fa-backward"></i></button>
                  <button id="playBtn"><i className="fas fa-play"></i></button>
                  <button id="nextBtn"><i className="fas fa-forward"></i></button>
                  <div className="volume-control">
                    <i className="fas fa-volume-up"></i>
                    <input type="range" id="volumeSlider" min="0" max="100" value="100" />
                  </div>
                </div>
              </div>

              <div className="lyrics-container">
                <div className="lyrics-header">
                  <h2>Lyrics</h2>
                  <button id="editLyricsBtn"><i className="fas fa-edit"></i></button>
                </div>
                <div id="lyricsDisplay" className="lyrics-display">No lyrics available</div>
                <div id="lyricsEditor" className="lyrics-editor hidden">
                  <textarea id="lyricsText"></textarea>
                  <div className="editor-buttons">
                    <button id="saveLyricsBtn">Save</button>
                    <button id="cancelLyricsBtn">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
