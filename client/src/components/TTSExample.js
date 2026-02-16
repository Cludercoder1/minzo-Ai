import React, { useState } from 'react';
import TTSControl from './TTSControl';
import ttsService from '../services/ttsService';

/**
 * Example component demonstrating TTS integration
 * Shows how to:
 * - Synthesize and play audio
 * - Download audio files
 * - Display cache statistics
 */
const TTSExample = () => {
  const [inputText, setInputText] = useState('नमस्ते, मैं मिंजो आपका AI वॉइस असिस्टेंट हूँ।');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({ size: 0 });

  const updateCacheInfo = () => {
    setCacheInfo({
      size: ttsService.getCacheSize()
    });
  };

  const handleAIRequest = async () => {
    // This would call your AI endpoint
    setAiResponse('यह एक उदाहरण AI प्रतिक्रिया है जो आप टेक्स्ट-टू-स्पीच का उपयोग करके सुन सकते हैं।');
    updateCacheInfo();
  };

  const handleClearCache = () => {
    ttsService.clearCache();
    updateCacheInfo();
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '20px auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>🎤 Minzo TTS Voice Assistant</h2>

      {/* Quick Test Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Quick Test</h3>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            minHeight: '100px',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
        />
        <TTSControl text={inputText} label="Read Test Text" />
      </div>

      {/* AI Response Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3>AI Response Example</h3>
        <button
          onClick={handleAIRequest}
          style={{
            padding: '10px 20px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          Get AI Response
        </button>

        {aiResponse && (
          <div style={{
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '10px',
            borderLeft: '4px solid #9C27B0'
          }}>
            <p>{aiResponse}</p>
            <TTSControl text={aiResponse} label="Listen to Response" />
          </div>
        )}
      </div>

      {/* Cache Statistics */}
      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h4>Cache Statistics</h4>
        <p>Cached audios: {cacheInfo.size}</p>
        <button
          onClick={handleClearCache}
          disabled={cacheInfo.size === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: cacheInfo.size === 0 ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: cacheInfo.size === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Clear Cache
        </button>
      </div>

      {/* Usage Instructions */}
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '15px',
        borderRadius: '4px',
        fontSize: '12px',
        lineHeight: '1.6'
      }}>
        <h4 style={{ marginTop: 0 }}>Usage Instructions</h4>
        <ul style={{ marginBottom: 0 }}>
          <li>Type or paste Hindi text in the textarea (हिंदी)</li>
          <li>Click "Read Aloud" to hear the text</li>
          <li>Click "Download" to save as WAV file</li>
          <li>Audio is cached for faster replay</li>
          <li>Works with Hindi text (hi-vits-css10)</li>
        </ul>
      </div>
    </div>
  );
};

export default TTSExample;
