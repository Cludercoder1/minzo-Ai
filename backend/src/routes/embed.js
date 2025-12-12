const express = require('express');
const { body, validationResult } = require('express-validator');
const minzoClient = require('../services/minzoClient');

const router = express.Router();

// Validation rules
const embeddingValidation = [
  body('input')
    .notEmpty()
    .withMessage('Input text is required')
    .isLength({ max: 8000 })
    .withMessage('Input text too long')
];

router.post('/', embeddingValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { input } = req.body;

    console.log(`🔍 Embedding request: ${typeof input === 'string' ? input.substring(0, 100) : 'multiple inputs'}...`);

    const result = await minzoClient.createEmbedding({ input });

    if (!result.success) {
      return res.status(500).json({
        error: result.error
      });
    }

    res.json({
      success: true,
      embeddings: result.embeddings,
      usage: result.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Embedding route error:', error);
    res.status(500).json({
      error: 'Internal server error during embedding generation'
    });
  }
});

module.exports = router;