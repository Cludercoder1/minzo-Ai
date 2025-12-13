const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const config = require('../config');
const minzoClient = require('../services/minzoClient');

const router = express.Router();

// Validation rules
const imageGenerationValidation = [
  body('prompt')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Prompt must be between 1 and 1000 characters')
    .escape(),
  body('size')
    .optional()
    .isIn(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'])
    .withMessage('Invalid image size'),
  body('quality')
    .optional()
    .isIn(['standard', 'hd'])
    .withMessage('Quality must be standard or hd')
];

router.post('/', imageGenerationValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { prompt, size = '1024x1024', quality = 'standard', provider } = req.body;

    console.log(`🎨 Image generation request: ${prompt.substring(0, 100)}...`);

    // If a python image service is configured, or the request explicitly asks for a python provider,
    // attempt that first and return its result.
    const pythonUrl = config.pythonImageServiceUrl || process.env.IMAGE_SERVICE_URL;
    const wantsPython = pythonUrl && (provider === 'python' || provider === 'stability' || provider === 'stabilityai' || !config.minzoApiKey);
    if (pythonUrl && wantsPython) {
      try {
        // Map size string to width/height
        const [wStr, hStr] = (size || '1024x1024').split('x');
        const width = parseInt(wStr, 10) || 1024;
        const height = parseInt(hStr, 10) || 1024;
        const imgReq = { prompt, width, height, provider: provider || null };
        const resp = await axios.post(pythonUrl, imgReq, { headers: { 'Content-Type': 'application/json' }, timeout: 90000 });
        if (resp && resp.data) {
          // The Python service returns `image` as a data URL (data:image/png;base64,...) or inline base64 in some cases.
          let imageData = resp.data.image || resp.data.imageBase64 || null;
          if (imageData && imageData.startsWith('data:')) {
            // strip the prefix, keep plain base64
            const parts = imageData.split(',');
            if (parts.length === 2) imageData = parts[1];
          }

          if (imageData) {
            return res.json({ success: true, imageBase64: imageData, revisedPrompt: resp.data.revisedPrompt || null, timestamp: new Date().toISOString() });
          }
        }
        // fallthrough to Minzo client if python service didn't produce an image
      } catch (err) {
        console.error('Python image service error:', err && err.message);
        // do not fail hard — continue to try Minzo client for a best-effort attempt
      }
    }

    const result = await minzoClient.generateImage({ prompt, size, quality });

    if (!result.success) {
      return res.status(500).json({
        error: result.error
      });
    }

    res.json({
      success: true,
      imageBase64: result.imageBase64,
      revisedPrompt: result.revisedPrompt,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image generation route error:', error);
    res.status(500).json({
      error: 'Internal server error during image generation'
    });
  }
});

module.exports = router;