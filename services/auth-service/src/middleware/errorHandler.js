const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.error("AUTH ERROR:", statusCode >= 500 ? "Internal server error" : err.message);
  } else {
    console.error("AUTH ERROR:", err);
  }

  let message =
    statusCode >= 500 && isProduction
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

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