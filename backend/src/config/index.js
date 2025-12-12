const config = {
  minzoApiKey: process.env.MINZO_API_KEY,
  minzoBaseUrl: process.env.MINZO_BASE_URL || 'https://api.deepseek.com/v1',
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },
  jwtSecret: process.env.JWT_SECRET || 'minzo_fallback_secret'
};

// Validate required configuration
if (!config.minzoApiKey) {
  console.error('❌ MINZO_API_KEY is required');
  process.exit(1);
}

module.exports = config;