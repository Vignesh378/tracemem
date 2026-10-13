const errorHandler = (err, req, res, next) => {
  console.error("AUTH ERROR:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongo duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = "Email already registered";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please login again";
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

export default errorHandler;