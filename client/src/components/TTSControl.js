import React, { useState } from 'react';
import ttsService from '../services/ttsService';

const TTSControl = ({ text, label = 'Read Aloud', onPlay = null, onStop = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    if (!text || text.trim().length === 0) {
      setError('No text to synthesize');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsPlaying(true);

      await ttsService.synthesizeAndPlay(text, 'hi');

      if (onPlay) onPlay();
    } catch (err) {
      setError(err.message || 'Failed to play audio');
      setIsPlaying(false);
      console.error('TTS Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    ttsService.stop();
    setIsPlaying(false);
    if (onStop) onStop();
  };

  const handleDownload = async () => {
    if (!text || text.trim().length === 0) {
      setError('No text to download');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await ttsService.downloadAudio(text, 'hi', 'minzo-audio.wav');
    } catch (err) {
      setError(err.message || 'Failed to download audio');
      console.error('Download Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
      <button
        onClick={isPlaying ? handleStop : handlePlay}
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: isPlaying ? '#ff6b6b' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {loading ? '⏳ Processing...' : isPlaying ? '⏹️ Stop' : '🔊 ' + label}
      </button>

      <button
        onClick={handleDownload}
        disabled={loading || isPlaying}
        style={{
          padding: '8px 16px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading || isPlaying ? 'not-allowed' : 'pointer',
          opacity: loading || isPlaying ? 0.6 : 1,
          fontSize: '14px'
        }}
      >
        📥 Download
      </button>

      {error && (
        <span style={{ color: '#ff6b6b', fontSize: '12px', marginLeft: '8px' }}>
          ⚠️ {error}
        </span>
      )}
    </div>
  );
};

export default TTSControl;
