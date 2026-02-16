const axios = require('axios');

(async () => {
  try {
    const prompt = process.argv[2] || 'A futuristic city skyline at sunset, photorealistic';
    const resp = await axios.post('http://localhost:3001/api/generate-image', { prompt, size: '512x512' }, { timeout: 60000 });
    console.log('Status:', resp.status);
    console.log('Data:', Object.keys(resp.data).slice(0, 10));
    if (resp.data && resp.data.imageBase64) {
      console.log('ImageBase64 length:', resp.data.imageBase64.length);
    } else if (resp.data && resp.data.image) {
      console.log('Image length:', resp.data.image.length);
    } else {
      console.log('No image returned:', resp.data);
    }
  } catch (err) {
    console.error('Test error:', err.message);
    if (err.response) console.error(err.response.data);
  }
})();
