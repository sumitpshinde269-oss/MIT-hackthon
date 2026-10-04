// 404 Not Found Middleware
const notFound = (req, res, next) => {
  res.status(404);
  const error = new Error(`Route not found: ${req.originalUrl}`);
  next(error);
};

// Global Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  if (err.statusCode) {
    statusCode = err.statusCode;
  } else if (err.status) {
    statusCode = err.status;
  }

  let message = err.message || 'Internal Server Error';

  // 1. Mongoose Invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for ${err.path || 'resource'}`;
  }

  // 2. Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // 3. Duplicate Key Error (MongoDB code 11000)
  else if (err.code === 11000) {
    statusCode = 400;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const fieldName = field === 'phone' ? 'Phone number' : field.charAt(0).toUpperCase() + field.slice(1);
    message = `${fieldName} already exists`;
  }

  // 4. Unknown Server Errors (500)
  else if (statusCode === 500) {
    message = 'Internal Server Error';
  }

  // Security: Clean any sensitive info (e.g. MongoDB connection strings, credentials)
  if (typeof message === 'string') {
    message = message
      .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[REDACTED_URI]')
      .replace(/password[:=]\s*[^\s,]+/gi, 'password=[REDACTED]');
  }

  res.status(statusCode).json({
    success: false,
    message: message,
  });
};

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
module.exports.notFound = notFound;
