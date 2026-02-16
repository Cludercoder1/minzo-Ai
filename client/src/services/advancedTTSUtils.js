/**
 * Advanced TTS Utilities
 * Batch processing, queuing, and special handlers
 */

import ttsService from './ttsService';

/**
 * TTS Queue - Process multiple texts sequentially
 */
export class TTSQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.onProgress = null;
  }

  /**
   * Add text to queue
   */
  enqueue(text, priority = 0) {
    this.queue.push({ text, priority, timestamp: Date.now() });
    this.queue.sort((a, b) => b.priority - a.priority);
    return this;
  }

  /**
   * Enqueue multiple items
   */
  enqueueBatch(texts) {
    texts.forEach(text => this.enqueue(text));
    return this;
  }

  /**
   * Process queue sequentially
   */
  async process(onProgress = null) {
    if (this.processing) return;
    
    this.processing = true;
    const processed = [];
    
    try {
      while (this.queue.length > 0) {
        const { text } = this.queue.shift();
        
        if (onProgress) {
          onProgress({
            current: processed.length + 1,
            total: processed.length + this.queue.length + 1,
            text
          });
        }

        await ttsService.synthesizeAndPlay(text);
        processed.push(text);
      }
    } finally {
      this.processing = false;
    }

    return processed;
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
    return this;
  }

  /**
   * Get queue size
   */
  size() {
    return this.queue.length;
  }
}

/**
 * Text Splitter - Break text for more natural playback
 */
export class TextSplitter {
  /**
   * Split by sentences
   */
  static bySentences(text) {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Split by max length
   */
  static byLength(text, maxLength = 500) {
    const sentences = this.bySentences(text);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }

  /**
   * Split pause points (for dramatic effect)
   */
  static byPauses(text) {
    return text.split(/[;:—]/);
  }
}

/**
 * Voice Response Builder - Programmatically build voice responses
 */
export class VoiceResponseBuilder {
  constructor() {
    this.parts = [];
    this.delays = [];
  }

  /**
   * Add spoken text
   */
  addText(text, delay = 0) {
    this.parts.push({ type: 'text', content: text });
    this.delays.push(delay);
    return this;
  }

  /**
   * Add silent pause (in milliseconds)
   */
  addPause(duration = 1000) {
    this.parts.push({ type: 'pause', duration });
    return this;
  }

  /**
   * Add multiple texts with pauses between
   */
  addSequence(texts, pauseBetween = 500) {
    texts.forEach((text, index) => {
      this.addText(text);
      if (index < texts.length - 1) {
        this.addPause(pauseBetween);
      }
    });
    return this;
  }

  /**
   * Play entire response
   */
  async play() {
    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i];
      const delay = this.delays[i] || 0;

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (part.type === 'text') {
        await ttsService.synthesizeAndPlay(part.content);
      } else if (part.type === 'pause') {
        await new Promise(resolve => setTimeout(resolve, part.duration));
      }
    }
  }

  /**
   * Get full text (for preview)
   */
  getText() {
    return this.parts
      .filter(p => p.type === 'text')
      .map(p => p.content)
      .join('\n');
  }

  /**
   * Reset builder
   */
  reset() {
    this.parts = [];
    this.delays = [];
    return this;
  }
}

/**
 * Conversation Manager - Handle multi-turn voice conversations
 */
export class ConversationManager {
  constructor() {
    this.turns = [];
    this.currentTurn = 0;
  }

  /**
   * Add conversation turn
   */
  addTurn(who, text) {
    this.turns.push({ who, text });
    return this;
  }

  /**
   * Add multiple turns
   */
  addTurns(turns) {
    turns.forEach(turn => this.addTurn(turn.who, turn.text));
    return this;
  }

  /**
   * Play specific turn
   */
  async playTurn(index) {
    if (index < 0 || index >= this.turns.length) return;
    
    const turn = this.turns[index];
    await ttsService.synthesizeAndPlay(turn.text);
  }

  /**
   * Play from current position
   */
  async playFromCurrent() {
    await this.playTurn(this.currentTurn);
    this.currentTurn++;
  }

  /**
   * Play entire conversation
   */
  async playAll() {
    for (let i = 0; i < this.turns.length; i++) {
      await this.playTurn(i);
      await new Promise(resolve => setTimeout(resolve, 800)); // Pause between turns
    }
  }

  /**
   * Get conversation transcript
   */
  getTranscript() {
    return this.turns
      .map(turn => `${turn.who}: ${turn.text}`)
      .join('\n');
  }

  /**
   * Clear conversation
   */
  clear() {
    this.turns = [];
    this.currentTurn = 0;
    return this;
  }
}

/**
 * Speech Rate Controller - Adjust how continuous playback flows
 */
export class SpeechController {
  static async speakSlow(text) {
    // Split into shorter chunks for slower effect
    const chunks = TextSplitter.byLength(text, 100);
    for (const chunk of chunks) {
      await ttsService.synthesizeAndPlay(chunk);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  static async speakEmphatic(text) {
    // Use text transformation for emphasis
    const emphasized = text
      .split(/([.!?])/g)
      .map(part => (part.match(/[.!?]/) ? part : part.toUpperCase()));
    
    await ttsService.synthesizeAndPlay(emphasized.join(''));
  }

  static async speakNatural(text) {
    // Default playback
    await ttsService.synthesizeAndPlay(text);
  }
}

/**
 * Notification System - Speak notifications to user
 */
export class VoiceNotifier {
  static async notify(type, message) {
    const prefix = {
      'info': 'Note:',
      'warning': 'Warning:',
      'error': 'Error:',
      'success': 'Success:'
    }[type] || 'Information:';

    await ttsService.synthesizeAndPlay(`${prefix} ${message}`);
  }

  static async info(msg) {
    await this.notify('info', msg);
  }

  static async warning(msg) {
    await this.notify('warning', msg);
  }

  static async error(msg) {
    await this.notify('error', msg);
  }

  static async success(msg) {
    await this.notify('success', msg);
  }
}

/**
 * Voice Command Feedback - Acknowledge voice commands
 */
export class VoiceCommandFeedback {
  static async acknowledge() {
    await ttsService.synthesizeAndPlay('Understood. Processing your request.');
  }

  static async processing() {
    await ttsService.synthesizeAndPlay('One moment, please.');
  }

  static async complete() {
    await ttsService.synthesizeAndPlay('Done.');
  }

  static async confirm(action) {
    await ttsService.synthesizeAndPlay(`Confirming ${action}.`);
  }
}

/**
 * Export all utilities
 */
export default {
  TTSQueue,
  TextSplitter,
  VoiceResponseBuilder,
  ConversationManager,
  SpeechController,
  VoiceNotifier,
  VoiceCommandFeedback
};
