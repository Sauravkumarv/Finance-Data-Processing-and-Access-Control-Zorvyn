// Centralized error handler so controllers can just throw Errors
module.exports = (err, req, res, _next) => {
  console.error(err);

  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  const details = err.details || undefined;

  res.status(status).json({
    message,
    ...(details && { details }),
  });
};