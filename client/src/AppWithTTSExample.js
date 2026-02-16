/**
 * Example Integration of TTS into MinzoAI App
 * Shows how to add voice features to your existing application
 * 
 * Copy and adapt this to your App.js
 */

import React, { useState, useEffect } from 'react';
import TTSControl from './components/TTSControl';
import ttsService from './services/ttsService';

export default function AppWithTTS() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'नमस्ते! मैं मिंजो हूँ, आपका AI वॉइस असिस्टेंट। मैं आपकी कैसे मदद कर सकता हूँ?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false); // Auto-speak AI responses

  // Auto-speak AI responses if toggled
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (autoSpeak && lastMessage && lastMessage.role === 'assistant') {
      // Small delay for better UX
      const timer = setTimeout(() => {
        ttsService.synthesizeAndPlay(lastMessage.text).catch(err => {
          console.log('Auto-speak failed:', err.message);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages, autoSpeak]);

  // Simulate AI response
  const callAI = async (userInput) => {
    // Replace with your actual AI API call
    const responses = [
      'यह बहुत दिलचस्प है! कृपया मुझे और बताइए।',
      'मैं समझता हूँ। इससे आप कैसा महसूस करते हैं?',
      'बहुत अच्छा सवाल! मुझे इसके बारे में सोचने दीजिए।',
      'यह शानदार लगता है। मैं इसमें आपकी मदद करना पसंद करूँगा।',
      'मैं आपके साथ यह साझा करने की सराहना करता हूँ।'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();

    if (!inputText.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      text: inputText
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Get AI response
      const aiResponse = await callAI(inputText);

      // Add AI message
      const assistantMessage = {
        id: messages.length + 2,
        role: 'assistant',
        text: aiResponse
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Auto-speak if enabled (will be triggered by useEffect)
    } catch (error) {
      console.error('Error calling AI:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #007bff',
        paddingBottom: '10px'
      }}>
        <h1 style={{ margin: '0 0 10px 0' }}>🎤 मिंजो हिंदी वॉइस असिस्टेंट</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>वॉइस क्षमताओं के साथ बात करें</p>
      </div>

      {/* Auto-speak Toggle */}
      <div style={{
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: 'white',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={(e) => setAutoSpeak(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>🔊 प्रतिक्रियाओं को स्वचालित रूप से बोलें</span>
        </label>
        <span style={{ opacity: 0.6, fontSize: '12px', marginLeft: 'auto' }}>
          {autoSpeak ? 'AI प्रतिक्रियाएँ जोर से पढ़ी जाएंगी' : 'वॉइस सक्षम करने के लिए क्लिक करें'}
        </span>
      </div>

      {/* Chat Messages */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '15px',
        minHeight: '300px',
        maxHeight: '400px',
        overflowY: 'auto',
        marginBottom: '15px',
        border: '1px solid #ddd'
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            marginBottom: '15px',
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '70%',
              backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef',
              color: msg.role === 'user' ? 'white' : 'black',
              padding: '10px 15px',
              borderRadius: '8px',
              wordWrap: 'break-word'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>{msg.text}</p>

              {/* Show TTS control only for assistant messages */}
              {msg.role === 'assistant' && (
                <TTSControl
                  text={msg.text}
                  label="Read"
                  onPlay={() => console.log('Playing:', msg.text)}
                />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: 'center', opacity: 0.6 }}>
            <p>🤖 Minzo is thinking...</p>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} style={{
        display: 'flex',
        gap: '10px'
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="यहाँ अपना संदेश टाइप करें..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            opacity: loading ? 0.6 : 1
          }}
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: (loading || !inputText.trim()) ? 0.6 : 1,
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳' : '📤 भेजें'}
        </button>
      </form>

      {/* Info Section */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e7f3ff',
        borderRadius: '4px',
        fontSize: '12px',
        lineHeight: '1.6'
      }}>
        <h4 style={{ marginTop: 0 }}>💡 उपलब्ध TTS सुविधाएँ</h4>
        <ul style={{ marginBottom: 0 }}>
          <li>किसी भी AI प्रतिक्रिया के बगल में "🔊 Read" बटन पर क्लिक करें</li>
          <li>प्रतिक्रिया को ऑडियो फ़ाइल के रूप में सहेजने के लिए "📥 Download" पर क्लिक करें</li>
          <li>सभी प्रतिक्रियाओं को स्वचालित रूप से पढ़ने के लिए "🔊 Auto-speak" को切换 करें</li>
          <li>तेज़ रीप्ले के लिए ऑडियो कैश किया जाता है</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Copy this entire component or adapt it to your existing App.js
 * 
 * 2. Make sure you have:
 *    - import TTSControl from './components/TTSControl';
 *    - import ttsService from './services/ttsService';
 * 
 * 3. Replace the callAI function with your actual AI API call:
 *    const response = await fetch('http://localhost:3001/api/ai', {
 *      method: 'POST',
 *      headers: { 'Content-Type': 'application/json' },
 *      body: JSON.stringify({ prompt: userInput })
 *    });
 *    const { message } = await response.json();
 *    return message;
 * 
 * 4. The TTS features will:
 *    - Show "Read" button below each AI message
 *    - Allow downloading responses as audio files
 *    - Auto-speak responses when toggle is enabled
 *    - Cache audio for fast replay
 * 
 * 5. Customize styling to match your design system
 * 
 * ADVANCED: Use advanced utilities for:
 *  - Multiple message queue
 *  - Voice notifications
 *  - Text-to-speech with pauses
 *  - See advancedTTSUtils.js for more features
 */
