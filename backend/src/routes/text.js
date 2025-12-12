const express = require('express');
const { body, validationResult } = require('express-validator');
const minzoClient = require('../services/minzoClient');

const router = express.Router();

// Validation rules
const textGenerationValidation = [
  body('prompt')
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Prompt must be between 1 and 4000 characters')
    .escape(),
  body('max_tokens')
    .optional()
    .isInt({ min: 1, max: 4000 })
    .withMessage('Max tokens must be between 1 and 4000'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2')
];

router.post('/', textGenerationValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { prompt, max_tokens = 1000, temperature = 0.7 } = req.body;

    console.log(`📝 Text generation request: ${prompt.substring(0, 100)}...`);

    const result = await minzoClient.createChatCompletion({
      prompt,
      max_tokens,
      temperature
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error
      });
    }

    res.json({
      success: true,
      text: result.text,
      usage: result.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Text generation route error:', error);
    res.status(500).json({
      error: 'Internal server error during text generation'
    });
  }
});

module.exports = router;