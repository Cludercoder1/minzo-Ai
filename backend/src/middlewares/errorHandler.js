function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let error = {
    message: 'Internal server error',
    statusCode: 500
  };

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation failed',
      details: err.details,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401
    };
  }

  // Rate limit errors
  if (err.statusCode === 429) {
    error = {
      message: 'Too many requests',
      statusCode: 429
    };
  }

  res.status(error.statusCode).json({
    error: error.message,
    details: error.details,
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;