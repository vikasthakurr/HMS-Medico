const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  res.status(statusCode).json({
    status: 'error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
