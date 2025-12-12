const express = require('express');
const { body, validationResult } = require('express-validator');
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

    const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

    console.log(`🎨 Image generation request: ${prompt.substring(0, 100)}...`);

    const result = await minzoClient.generateImage({
      prompt,
      size,
      quality
    });

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