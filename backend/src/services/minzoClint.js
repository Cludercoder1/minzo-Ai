const axios = require('axios');
const config = require('../config');

class MinzoAIClient {
  constructor() {
    this.apiKey = config.minzoApiKey;
    this.baseURL = config.minzoBaseUrl;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async createChatCompletion({ prompt, model = 'deepseek-chat', max_tokens = 1000, temperature = 0.7 }) {
    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant created by MinzoFoundation. Provide clear, accurate, and helpful responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens,
        temperature,
        stream: false
      });

      return {
        success: true,
        text: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('Minzo AI API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to generate text'
      };
    }
  }

  async createEmbedding({ input, model = 'text-embedding-3' }) {
    try {
      const response = await this.client.post('/embeddings', {
        model,
        input: typeof input === 'string' ? [input] : input,
        encoding_format: 'float'
      });

      return {
        success: true,
        embeddings: response.data.data,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('Minzo Embedding API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to create embeddings'
      };
    }
  }

  async generateImage({ prompt, model = 'dall-e-3', size = '1024x1024', quality = 'standard' }) {
    try {
      if (!this.apiKey) {
        return { success: false, error: 'MINZO_API_KEY not configured' };
      }
      const response = await this.client.post('/images/generations', {
        model,
        prompt,
        size,
        quality,
        n: 1,
        response_format: 'b64_json'
      });

      return {
        success: true,
        imageBase64: response.data.data[0].b64_json,
        revisedPrompt: response.data.data[0].revised_prompt
      };
    } catch (error) {
      console.error('Minzo Image API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to generate image'
      };
    }
  }
}

module.exports = new MinzoAIClient();