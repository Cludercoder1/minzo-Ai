const config = {
  minzoApiKey: process.env.MINZO_API_KEY,
  minzoBaseUrl: process.env.MINZO_BASE_URL || 'https://api.deepseek.com/v1',
  pythonImageServiceUrl: process.env.PYTHON_IMAGE_SERVICE_URL || process.env.IMAGE_SERVICE_URL || null,
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },
  jwtSecret: process.env.JWT_SECRET || 'minzo_fallback_secret'
};

// MINZO_API_KEY is optional now; the image route can use an external Python service instead.
if (!config.minzoApiKey) {
  console.warn('⚠️ MINZO_API_KEY is not set. Text and image operations that rely on the Minzo API may be disabled.');
}

module.exports = config;