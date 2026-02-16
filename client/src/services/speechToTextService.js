/**
 * Speech-to-Text Service
 * Uses Web Speech API to convert voice to text
 * Supports Hindi and English
 */

class SpeechToTextService {
  constructor() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.isListening = false;
    this.transcript = '';
    this.isFinal = false;
  }

  /**
   * Check if Speech Recognition is supported
   */
  isSupported() {
    return this.recognition !== null;
  }

  /**
   * Start listening for speech
   * @param {string} language - Language code ('hi' for Hindi, 'en' for English)
   * @param {Function} onTranscript - Callback with interim transcript
   * @param {Function} onFinal - Callback with final transcript
   * @param {Function} onError - Callback for errors
   */
  startListening(language = 'hi', onTranscript = null, onFinal = null, onError = null) {
    if (!this.recognition) {
      const error = 'Speech Recognition not supported in this browser';
      if (onError) onError(error);
      console.error(error);
      return;
    }

    if (this.isListening) {
      return; // Already listening
    }

    try {
      // Configure recognition
      this.recognition.language = language === 'hi' ? 'hi-IN' : 'en-US';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      let finalTranscript = '';

      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('🎤 Listening...');
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            this.isFinal = true;
          } else {
            interimTranscript += transcript;
          }
        }

        // Call interim callback
        if (onTranscript && interimTranscript) {
          onTranscript(finalTranscript + interimTranscript, false);
        }

        // Call final callback
        if (this.isFinal && onFinal && finalTranscript) {
          onFinal(finalTranscript.trim(), true);
          this.isFinal = false;
        }
      };

      this.recognition.onerror = (event) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        console.error(errorMessage);
        if (onError) onError(errorMessage);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        console.log('🎤 Listening stopped');
      };

      // Start recognition
      this.recognition.start();
    } catch (error) {
      if (onError) onError(error.message);
      console.error('Error starting speech recognition:', error);
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Abort listening
   */
  abort() {
    if (this.recognition) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  /**
   * Get current listening state
   */
  isCurrentlyListening() {
    return this.isListening;
  }
}

// Export singleton
export default new SpeechToTextService();
