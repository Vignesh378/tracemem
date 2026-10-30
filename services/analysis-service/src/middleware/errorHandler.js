const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "MulterError") {
    statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file exceeds the configured size limit"
        : "Invalid file upload";
  } else if (err instanceof SyntaxError && statusCode === 400) {
    message = "Invalid request body";
  } else if (err.message === "Invalid upload field" || err.message === "Invalid field") {
    statusCode = 400;
    message = "Invalid file upload";
  }

  if (isProduction) {
    console.error("ANALYSIS ERROR:", statusCode >= 500 ? "Internal server error" : message);
  } else {
    console.error("ANALYSIS ERROR:", err);
  }

  if (isProduction && statusCode >= 500) {
    message = "Internal Server Error";
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

export default errorHandler;