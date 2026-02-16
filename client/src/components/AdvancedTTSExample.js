/**
 * Advanced TTS Examples
 * Demonstrates queue, text splitting, conversation, and voice notifications
 */

import React, { useState } from 'react';
import {
  TTSQueue,
  TextSplitter,
  VoiceResponseBuilder,
  ConversationManager,
  SpeechController,
  VoiceNotifier,
  VoiceCommandFeedback
} from '../services/advancedTTSUtils';
import TTSControl from './TTSControl';

const AdvancedTTSExample = () => {
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const log = (msg) => {
    setOutput(prev => prev + '\n' + msg);
    console.log(msg);
  };

  // Example 1: Queue Processing
  const handleQueueExample = async () => {
    setIsProcessing(true);
    setOutput('');
    log('📋 Queue Example: Processing multiple texts sequentially...\n');

    const queue = new TTSQueue();
    queue
      .enqueue('पहली आइटम कतार में।')
      .enqueue('दूसरी आइटम कतार में।')
      .enqueue('तीसरी आइटम कतार में।');

    log(`Queue size: ${queue.size()}`);
    log('Starting playback...\n');

    const processed = await queue.process((progress) => {
      log(`Progress: ${progress.current}/${progress.total} - "${progress.text}"`);
    });

    log(`\n✅ Processed ${processed.length} items`);
    setIsProcessing(false);
  };

  // Example 2: Text Splitting
  const handleTextSplitting = async () => {
    setIsProcessing(true);
    setOutput('');

    const longText =
      'नमस्ते! यह एक लंबा पाठ है। इसमें कई वाक्य हैं। प्रत्येक को विभाजित किया जाएगा। देखिए कि वे कैसे अलग होते हैं? बिल्कुल प्राकृतिक भाषण के लिए।';

    log('📝 Text Splitting Examples\n');

    const sentences = TextSplitter.bySentences(longText);
    log(`By Sentences (${sentences.length}):`);
    sentences.forEach((s, i) => log(`  ${i + 1}. "${s}"`));

    log('\nBy Length (max 50 chars):');
    const chunks = TextSplitter.byLength(longText, 50);
    chunks.forEach((c, i) => log(`  ${i + 1}. "${c}"`));

    log('\nPlaying chunked version...');
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
  };

  // Example 3: Voice Response Builder
  const handleVoiceBuilder = async () => {
    setIsProcessing(true);
    setOutput('');
    log('🎤 Voice Response Builder Example\n');
    log('Building a complex response with pauses...\n');

    const builder = new VoiceResponseBuilder();
    builder
      .addText('मिंजो में आपका स्वागत है।')
      .addPause(800)
      .addText('मैं आपका व्यक्तिगत AI असिस्टेंट हूँ।')
      .addPause(1000)
      .addText('मैं आपकी कैसे मदद कर सकता हूँ?');

    log('Final text preview:');
    log(builder.getText());
    log('\nPlaying response...');

    await builder.play();

    log('\n✅ Response played');
    setIsProcessing(false);
  };

  // Example 4: Conversation Manager
  const handleConversation = async () => {
    setIsProcessing(true);
    setOutput('');
    log('💬 Conversation Manager Example\n');

    const conv = new ConversationManager();
    conv.addTurns([
      { who: 'उपयोगकर्ता', text: 'नमस्ते, मिंजो!' },
      { who: 'मिंजो', text: 'नमस्ते! आप आज कैसे हैं?' },
      { who: 'उपयोगकर्ता', text: 'मैं बहुत अच्छा हूँ। क्या आप मेरी मदद कर सकते हैं?' },
      { who: 'मिंजो', text: 'बिल्कुल! यही मेरा काम है।' }
    ]);

    log('Conversation transcript:');
    log(conv.getTranscript());
    log('\nPlaying conversation...');

    await conv.playAll();

    log('\n✅ Conversation complete');
    setIsProcessing(false);
  };

  // Example 5: Speech Styles
  const handleSpeechStyles = async () => {
    setIsProcessing(true);
    setOutput('');
    log('🗣️ Speech Styles Example\n');

    const text = 'यह एक परीक्षण है। ध्यान से सुनें।';

    log('Playing in natural voice...');
    await SpeechController.speakNatural(text);

    log('\n✅ Natural speech complete');
    setIsProcessing(false);
  };

  // Example 6: Notifications
  const handleNotifications = async () => {
    setIsProcessing(true);
    setOutput('');
    log('🔔 Voice Notifications Example\n');

    log('Playing information notification...');
    await VoiceNotifier.info('आपकी फ़ाइल अपलोड की जा चुकी है');

    log('\nPlaying success notification...');
    await VoiceNotifier.success('ऑपरेशन सफलतापूर्वक पूरा हुआ');

    log('\nPlaying warning notification...');
    await VoiceNotifier.warning('कम बैटरी का पता चला');

    log('\n✅ All notifications played');
    setIsProcessing(false);
  };

  // Example 7: Command Feedback
  const handleCommandFeedback = async () => {
    setIsProcessing(true);
    setOutput('');
    log('🎯 Voice Command Feedback Example\n');

    log('Playing acknowledgment...');
    await VoiceCommandFeedback.acknowledge();

    log('\nSimulating processing delay...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    log('Playing processing message...');
    await VoiceCommandFeedback.processing();

    log('\nSimulating completion...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    log('Playing completion message...');
    await VoiceCommandFeedback.complete();

    log('\n✅ Command feedback sequence complete');
    setIsProcessing(false);
  };

  return (
    <div
      style={{
        maxWidth: '700px',
        margin: '20px auto',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        fontFamily: 'monospace'
      }}
    >
      <h2>🚀 Advanced TTS Examples</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '20px'
        }}
      >
        <button
          onClick={handleQueueExample}
          disabled={isProcessing}
          style={{
            padding: '10px',
            backgroundColor: '#FF6B6B',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          📋 Queue
        </button>

        <button
          onClick={handleTextSplitting}
          disabled={isProcessing}
          style={{
            padding: '10px',
            backgroundColor: '#4ECDC4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          📝 Text Split
        </button>

        <button
          onClick={handleVoiceBuilder}
          disabled={isProcessing}
          style={{
            padding: '10px',
            backgroundColor: '#95E1D3',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          🎤 Builder
        </button>

        <button
          onClick={handleConversation}
          disabled={isProcessing}
          style={{
            padding: '10px',
            backgroundColor: '#F38181',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          💬 Conversation
        </button>

        <button
          onClick={handleSpeechStyles}
          disabled={isProcessing}
          style={{
            padding: '10px',
            backgroundColor: '#AA96DA',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          🗣️ Styles
        </button>

        <button
          onClick={handleNotifications}
          disabled={isProcessing}
          style={{
            padding: '10px',
            backgroundColor: '#FCBAD3',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          🔔 Notify
        </button>

        <button
          onClick={handleCommandFeedback}
          disabled={isProcessing}
          style={{
            padding: '10px',
            backgroundColor: '#A8DADC',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1,
            gridColumn: '1 / -1'
          }}
        >
          🎯 Command Feedback
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '4px',
          maxHeight: '400px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          border: '1px solid #ddd'
        }}
      >
        {output || '(Output will appear here)'}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '12px'
        }}
      >
        <h4 style={{ marginTop: 0 }}>About These Examples</h4>
        <ul style={{ marginBottom: 0 }}>
          <li><strong>Queue</strong> - कई हिंदी पाठ को क्रमिक रूप से संसाधित करें</li>
          <li><strong>Text Split</strong> - लंबे पाठ को वाक्यों या लंबाई से विभाजित करें</li>
          <li><strong>Builder</strong> - विरति के साथ जटिल प्रतिक्रियाएँ बनाएँ</li>
          <li><strong>Conversation</strong> - बहु-मोड़ वाली बातचीत प्रबंधित करें</li>
          <li><strong>Styles</strong> - विभिन्न भाषण वितरण शैलियाँ</li>
          <li><strong>Notifications</strong> - सिस्टम इवेंट के लिए वॉइस प्रतिक्रिया</li>
          <li><strong>Command Feedback</strong> - उपयोगकर्ता कमांड स्वीकार करें</li>
        </ul>
      </div>
    </div>
  );
};

export default AdvancedTTSExample;
