/**
 * TTS Service - Text-to-Speech integration with backend
 * Supports base64 audio data and direct file downloads
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

class TTSService {
  constructor() {
    this.audioCache = new Map();
    this.isPlaying = false;
    this.currentAudio = null;
  }

  /**
   * Synthesize text to speech and return base64 audio
   * @param {string} text - Text to synthesize (Hindi or English)
   * @param {string} language - Language code (default: 'hi' for Hindi)
   * @returns {Promise<{audio: string, text: string}>} Base64 encoded audio
   */
  async synthesize(text, language = 'hi') {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Check cache
    const cacheKey = `${text}_${language}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, language })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'TTS synthesis failed');
      }

      const data = await response.json();
      
      // Cache the result
      this.audioCache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('TTS Synthesis Error:', error);
      throw error;
    }
  }

  /**
   * Play audio from base64 data
   * @param {string} audioData - Base64 encoded audio (with data URI prefix)
   * @param {Function} onEnd - Callback when audio finishes
   */
  async play(audioData, onEnd = null) {
    try {
      // Stop current playback
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      this.isPlaying = true;
      const audio = new Audio(audioData);

      if (onEnd) {
        audio.addEventListener('ended', onEnd);
      }

      audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.currentAudio = null;
      });

      audio.addEventListener('error', (error) => {
        console.error('Audio playback error:', error);
        this.isPlaying = false;
        this.currentAudio = null;
      });

      this.currentAudio = audio;
      await audio.play();
    } catch (error) {
      console.error('Audio Play Error:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  /**
   * Stop current audio playback
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
      this.currentAudio = null;
    }
  }

  /**
   * Synthesize and play text
   * @param {string} text - Text to synthesize and play
   * @param {string} language - Language code (default: 'hi' for Hindi)
   */
  async synthesizeAndPlay(text, language = 'hi') {
    try {
      const { audio } = await this.synthesize(text, language);
      await this.play(audio);
    } catch (error) {
      console.error('Synthesize and Play Error:', error);
      throw error;
    }
  }

  /**
   * Download audio file
   * @param {string} text - Text to synthesize
   * @param {string} language - Language code (default: 'hi' for Hindi)
   * @param {string} filename - Output filename
   */
  async downloadAudio(text, language = 'hi', filename = 'speech.wav') {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tts/file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, language })
      });

      if (!response.ok) {
        throw new Error('Audio download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download Error:', error);
      throw error;
    }
  }

  /**
   * Get current playback status
   */
  isCurrentlyPlaying() {
    return this.isPlaying;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.audioCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.audioCache.size;
  }
}

// Export singleton
export default new TTSService();
